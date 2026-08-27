#!/usr/bin/env python3
"""
auth_service.py — Sistema de Usuarios y Permisos XCIEN
JWT + bcrypt + roles por área
Fuente de datos: PostgreSQL (DATABASE_URL) con fallback a JSON.
"""
from __future__ import annotations
import os
import json
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger("xcien.auth")

# ── Configuración ──────────────────────────────────────────────────────────────
SECRET_KEY   = os.environ.get("TOKEN_SECRET")
if not SECRET_KEY:
    import sys
    print("CRITICAL: TOKEN_SECRET env var is not set. Refusing to start.", file=sys.stderr)
    sys.exit(1)
ALGORITHM    = "HS256"
TOKEN_EXPIRE = int(os.environ.get("TOKEN_EXPIRE_HOURS", "8"))

_DATA_DIR = os.environ.get("DATA_DIR")
USERS_DB = (
    os.path.join(_DATA_DIR, "agents_db", "users.json")
    if _DATA_DIR
    else os.path.join(os.path.dirname(os.path.abspath(__file__)), "db", "users.json")
)

DATABASE_URL = os.environ.get("DATABASE_URL", "")

pwd_ctx = CryptContext(schemes=["sha256_crypt", "bcrypt"], default="sha256_crypt", deprecated="auto")
bearer  = HTTPBearer(auto_error=False)

# ── Roles del sistema ──────────────────────────────────────────────────────────
ROLES = {
    "admin":     "Administrador — acceso total al sistema",
    "director":  "Director General — operaciones, finanzas y estrategia",
    "finanzas":  "Finanzas — datos financieros, auditoría y KPIs (información confidencial)",
    "noc":       "Analista NOC — red, alertas, monitoreo",
    "wfm":       "Coordinador WFM — tickets, técnicos, órdenes de campo",
    "comercial": "Comercial — gestión de clientes y pipeline (sin datos financieros internos)",
    "preventa":  "Preventa — propuestas y proyectos (sin cifras de negocio)",
    "almacen":   "Almacén — inventario, transferencias, materiales",
    "rrhh":      "Capital Humano — directorio de personal",
    "academico": "Academia — cursos y certificaciones",
    "tecnico":   "Técnico de campo — academia y documentos técnicos",
    "readonly":  "Solo lectura — hub principal únicamente",
}

# Permisos granulares por rol (para endpoints del backend)
# ventas/finanzas → solo admin, director, finanzas
PERMISOS = {
    "admin":     ["*"],
    "director":  ["dashboard", "chat_ia", "wfm_read", "noc_read", "reportes",
                  "ventas", "integridad", "auditoria", "kpi", "rrhh_read", "proyectos"],
    "finanzas":  ["ventas", "integridad", "auditoria", "kpi", "rrhh_read",
                  "documentos", "reportes", "analytics"],
    "noc":       ["noc_read", "noc_write", "alertas", "wfm_read", "infra_energia"],
    "wfm":       ["wfm_read", "wfm_write", "tecnicos", "tickets", "inventario_read"],
    "comercial": ["proyectos", "documentos", "sala_juntas"],
    "preventa":  ["proyectos", "plan", "documentos", "sala_juntas", "factibilidad"],
    "almacen":   ["inventario_read", "inventario_write", "transferencias", "documentos"],
    "rrhh":      ["rrhh_read", "rrhh_write", "documentos"],
    "academico": ["academia", "manuales", "examenes", "documentos"],
    "tecnico":   ["academia", "documentos"],
    "readonly":  ["dashboard"],
}

_COLS = "id, nombre, email, password, rol, plaza, activo, permisos, titular_de, creado_en, ultimo_login"

# ── Backend Postgres ───────────────────────────────────────────────────────────
def _pg():
    import psycopg2
    return psycopg2.connect(DATABASE_URL)

def _row_to_user(row) -> dict:
    return {
        "id":           row[0],
        "nombre":       row[1],
        "email":        row[2],
        "password":     row[3],
        "rol":          row[4],
        "plaza":        row[5] or "",
        "activo":       row[6],
        "permisos":     row[7] if isinstance(row[7], list) else (row[7] or []),
        "titular_de":   row[8] if isinstance(row[8], list) else (row[8] or []),
        "creado_en":    row[9].isoformat() if row[9] else None,
        "ultimo_login": row[10].isoformat() if row[10] else None,
    }

# ── Backend JSON (fallback) ────────────────────────────────────────────────────
def _load_json() -> list:
    try:
        with open(USERS_DB, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _save_json(users: list):
    os.makedirs(os.path.dirname(USERS_DB), exist_ok=True)
    with open(USERS_DB, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

# ── Operaciones de usuario ─────────────────────────────────────────────────────
def crear_usuario(nombre: str, email: str, password: str, rol: str, plaza: str = "",
                  titular_de: list = None) -> dict:
    if rol not in ROLES:
        raise ValueError(f"Rol inválido: '{rol}'. Opciones: {list(ROLES.keys())}")

    email = email.lower().strip()
    hashed = pwd_ctx.hash(password)
    uid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    permisos = PERMISOS.get(rol, [])
    titular = titular_de or []

    if DATABASE_URL:
        try:
            conn = _pg(); cur = conn.cursor()
            cur.execute("SELECT id FROM usuarios WHERE email=%s", (email,))
            if cur.fetchone():
                raise ValueError(f"El email '{email}' ya está registrado")
            cur.execute("""
                INSERT INTO usuarios (id,nombre,email,password,rol,plaza,activo,permisos,titular_de,creado_en)
                VALUES (%s,%s,%s,%s,%s,%s,TRUE,%s,%s,%s)
            """, (uid, nombre, email, hashed, rol, plaza,
                  json.dumps(permisos), json.dumps(titular), now))
            conn.commit(); cur.close(); conn.close()
            return {"id": uid, "nombre": nombre, "email": email, "rol": rol,
                    "plaza": plaza, "activo": True, "permisos": permisos,
                    "titular_de": titular, "creado_en": now, "ultimo_login": None}
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"[Auth-PG] crear_usuario: {e}")

    users = _load_json()
    if any(u["email"] == email for u in users):
        raise ValueError(f"El email '{email}' ya está registrado")
    user = {"id": uid, "nombre": nombre, "email": email, "password": hashed,
            "rol": rol, "plaza": plaza, "activo": True, "permisos": permisos,
            "titular_de": titular, "creado_en": now, "ultimo_login": None}
    users.append(user)
    _save_json(users)
    return _safe(user)


def autenticar(email: str, password: str, ip: str = None, user_agent: str = None) -> Optional[dict]:
    email = email.lower().strip()

    if DATABASE_URL:
        try:
            conn = _pg(); cur = conn.cursor()
            cur.execute(f"SELECT {_COLS} FROM usuarios WHERE email=%s", (email,))
            row = cur.fetchone()
            if not row:
                cur.close(); conn.close(); return None
            user = _row_to_user(row)
            if not user["activo"] or not pwd_ctx.verify(password, user["password"]):
                cur.close(); conn.close(); return None
            now = datetime.now(timezone.utc)
            cur.execute("UPDATE usuarios SET ultimo_login=%s WHERE id=%s", (now, user["id"]))
            cur.execute("INSERT INTO sesiones (usuario_id,email,ip,user_agent) VALUES (%s,%s,%s,%s)",
                        (user["id"], email, ip, user_agent))
            conn.commit(); cur.close(); conn.close()
            user["ultimo_login"] = now.isoformat()
            return _safe(user)
        except Exception as e:
            logger.error(f"[Auth-PG] autenticar: {e}")

    users = _load_json()
    user = next((u for u in users if u["email"] == email), None)
    if not user or not user.get("activo"):
        return None
    if not pwd_ctx.verify(password, user["password"]):
        return None
    for u in users:
        if u["id"] == user["id"]:
            u["ultimo_login"] = datetime.now(timezone.utc).isoformat()
    _save_json(users)
    return _safe(user)


def verificar_password(user_id: str, password: str) -> bool:
    if DATABASE_URL:
        try:
            conn = _pg(); cur = conn.cursor()
            cur.execute("SELECT password FROM usuarios WHERE id=%s", (user_id,))
            row = cur.fetchone(); cur.close(); conn.close()
            return bool(row and pwd_ctx.verify(password, row[0]))
        except Exception as e:
            logger.error(f"[Auth-PG] verificar_password: {e}")
    users = _load_json()
    user = next((u for u in users if u["id"] == user_id), None)
    return bool(user and pwd_ctx.verify(password, user["password"]))


def listar_usuarios() -> list:
    if DATABASE_URL:
        try:
            conn = _pg(); cur = conn.cursor()
            cur.execute(f"SELECT {_COLS} FROM usuarios ORDER BY nombre")
            rows = cur.fetchall(); cur.close(); conn.close()
            return [_safe(_row_to_user(r)) for r in rows]
        except Exception as e:
            logger.error(f"[Auth-PG] listar_usuarios: {e}")
    return [_safe(u) for u in _load_json()]


def obtener_usuario(user_id: str) -> Optional[dict]:
    if DATABASE_URL:
        try:
            conn = _pg(); cur = conn.cursor()
            cur.execute(f"SELECT {_COLS} FROM usuarios WHERE id=%s", (user_id,))
            row = cur.fetchone(); cur.close(); conn.close()
            return _safe(_row_to_user(row)) if row else None
        except Exception as e:
            logger.error(f"[Auth-PG] obtener_usuario: {e}")
    users = _load_json()
    user = next((u for u in users if u["id"] == user_id), None)
    return _safe(user) if user else None


def obtener_por_email(email: str) -> Optional[dict]:
    email = email.lower().strip()
    if DATABASE_URL:
        try:
            conn = _pg(); cur = conn.cursor()
            cur.execute(f"SELECT {_COLS} FROM usuarios WHERE email=%s", (email,))
            row = cur.fetchone(); cur.close(); conn.close()
            return _safe(_row_to_user(row)) if row else None
        except Exception as e:
            logger.error(f"[Auth-PG] obtener_por_email: {e}")
    users = _load_json()
    user = next((u for u in users if u["email"] == email), None)
    return _safe(user) if user else None


def actualizar_usuario(user_id: str, datos: dict) -> dict:
    if "rol" in datos and datos["rol"] not in ROLES:
        raise ValueError(f"Rol inválido: {datos['rol']}")

    if DATABASE_URL:
        try:
            conn = _pg(); cur = conn.cursor()
            cur.execute(f"SELECT {_COLS} FROM usuarios WHERE id=%s", (user_id,))
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Usuario {user_id} no encontrado")
            sets, vals = [], []
            if "nombre"     in datos: sets.append("nombre=%s");     vals.append(datos["nombre"])
            if "plaza"      in datos: sets.append("plaza=%s");      vals.append(datos["plaza"])
            if "activo"     in datos: sets.append("activo=%s");     vals.append(datos["activo"])
            if "titular_de" in datos: sets.append("titular_de=%s"); vals.append(json.dumps(datos["titular_de"]))
            if "rol" in datos:
                new_rol = datos["rol"]
                sets.append("rol=%s");      vals.append(new_rol)
                sets.append("permisos=%s"); vals.append(json.dumps(PERMISOS.get(new_rol, [])))
            if datos.get("password"):
                sets.append("password=%s"); vals.append(pwd_ctx.hash(datos["password"]))
            if sets:
                vals.append(user_id)
                cur.execute(f"UPDATE usuarios SET {','.join(sets)} WHERE id=%s", vals)
                conn.commit()
            cur.execute(f"SELECT {_COLS} FROM usuarios WHERE id=%s", (user_id,))
            updated = _row_to_user(cur.fetchone())
            cur.close(); conn.close()
            return _safe(updated)
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"[Auth-PG] actualizar_usuario: {e}")

    users = _load_json()
    for u in users:
        if u["id"] == user_id:
            if "rol"        in datos:
                if datos["rol"] not in ROLES: raise ValueError(f"Rol inválido: {datos['rol']}")
                u["rol"] = datos["rol"]; u["permisos"] = PERMISOS.get(datos["rol"], [])
            if "nombre"     in datos: u["nombre"]     = datos["nombre"]
            if "plaza"      in datos: u["plaza"]      = datos["plaza"]
            if "activo"     in datos: u["activo"]     = datos["activo"]
            if "titular_de" in datos: u["titular_de"] = datos["titular_de"]
            if datos.get("password"):  u["password"]  = pwd_ctx.hash(datos["password"])
            _save_json(users)
            return _safe(u)
    raise ValueError(f"Usuario {user_id} no encontrado")


def eliminar_usuario(user_id: str):
    if DATABASE_URL:
        try:
            conn = _pg(); cur = conn.cursor()
            cur.execute("DELETE FROM usuarios WHERE id=%s", (user_id,))
            conn.commit(); cur.close(); conn.close()
            return
        except Exception as e:
            logger.error(f"[Auth-PG] eliminar_usuario: {e}")
    users = [u for u in _load_json() if u["id"] != user_id]
    _save_json(users)


def _safe(user: dict) -> dict:
    return {k: v for k, v in user.items() if k != "password"}


# ── JWT ────────────────────────────────────────────────────────────────────────
def crear_token(user: dict) -> dict:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE)
    payload = {
        "sub":      user["id"],
        "email":    user["email"],
        "nombre":   user["nombre"],
        "rol":      user["rol"],
        "permisos": user.get("permisos", []),
        "plaza":    user.get("plaza", ""),
        "exp":      expire,
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "access_token": token,
        "token_type":   "bearer",
        "expires_in":   TOKEN_EXPIRE * 3600,
        "user":         user,
    }


def decodificar_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido o expirado: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Dependencias FastAPI ───────────────────────────────────────────────────────
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decodificar_token(credentials.credentials)
    if "sub" in payload and "id" not in payload:
        payload["id"] = payload["sub"]
    return payload


def require_rol(*roles: str):
    def _check(user: dict = Depends(get_current_user)) -> dict:
        if user["rol"] == "admin":
            return user
        if user["rol"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rol '{user['rol']}' no tiene acceso. Requerido: {list(roles)}"
            )
        return user
    return _check


def require_permiso(permiso: str):
    def _check(user: dict = Depends(get_current_user)) -> dict:
        permisos = user.get("permisos", [])
        if "*" in permisos or permiso in permisos:
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Sin permiso: '{permiso}'"
        )
    return _check


# ── Admin inicial ──────────────────────────────────────────────────────────────
def init_admin():
    """Crea el admin por defecto si no hay ningún usuario."""
    has_users = False
    if DATABASE_URL:
        try:
            conn = _pg(); cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM usuarios")
            has_users = cur.fetchone()[0] > 0
            cur.close(); conn.close()
        except Exception:
            has_users = bool(_load_json())
    else:
        has_users = bool(_load_json())

    if not has_users:
        admin_email    = os.environ.get("ADMIN_EMAIL",    "admin@xcien.com")
        admin_password = os.environ.get("ADMIN_PASSWORD", "Xcien2026!")
        crear_usuario("Administrador XCIEN", admin_email, admin_password, "admin", "Monterrey")
        print(f"✅ [Auth] Admin creado: {admin_email}")
