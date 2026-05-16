#!/usr/bin/env python3
"""
auth_service.py — Sistema de Usuarios y Permisos XCIEN
JWT + bcrypt + roles por área
"""
from __future__ import annotations
import os
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ── Configuración ──────────────────────────────────────────────────────────────
SECRET_KEY   = os.environ.get("TOKEN_SECRET", "change-me-in-production")
ALGORITHM    = "HS256"
TOKEN_EXPIRE = int(os.environ.get("TOKEN_EXPIRE_HOURS", "8"))  # horas

USERS_DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db", "users.json")

pwd_ctx   = CryptContext(schemes=["sha256_crypt", "bcrypt"], default="sha256_crypt", deprecated="auto")
bearer    = HTTPBearer(auto_error=False)

# ── Roles del sistema ──────────────────────────────────────────────────────────
ROLES = {
    "admin":      "Administrador — acceso total",
    "director":   "Director General — dashboards ejecutivos + chat IA",
    "noc":        "Analista NOC — red, alertas, monitoreo",
    "wfm":        "Coordinador WFM — tickets, técnicos, órdenes",
    "comercial":  "Comercial — ventas, CRM, factibilidad",
    "academico":  "Academia — capacitación, exámenes, manuales",
    "tecnico":    "Técnico de campo — solo lectura de sus tickets",
    "readonly":   "Solo lectura — consulta sin modificar",
}

# Permisos por rol (qué endpoints/módulos puede usar)
PERMISOS = {
    "admin":     ["*"],   # todo
    "director":  ["dashboard", "chat_ia", "wfm_read", "noc_read", "reportes", "tokens_read"],
    "noc":       ["noc_read", "noc_write", "alertas", "wfm_read"],
    "wfm":       ["wfm_read", "wfm_write", "tecnicos", "tickets"],
    "comercial": ["comercial", "factibilidad", "tokens_emitir", "wfm_read"],
    "academico": ["academia", "manuales", "examenes", "tecnicos_read"],
    "tecnico":   ["mis_tickets", "checklist", "evidencias"],
    "readonly":  ["dashboard", "wfm_read", "noc_read"],
}

# ── Helpers de base de datos (JSON file) ───────────────────────────────────────
def _load() -> list:
    try:
        with open(USERS_DB, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _save(users: list):
    os.makedirs(os.path.dirname(USERS_DB), exist_ok=True)
    with open(USERS_DB, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

# ── Operaciones de usuario ─────────────────────────────────────────────────────
def crear_usuario(nombre: str, email: str, password: str, rol: str, plaza: str = "") -> dict:
    if rol not in ROLES:
        raise ValueError(f"Rol inválido: '{rol}'. Opciones: {list(ROLES.keys())}")

    users = _load()
    if any(u["email"] == email.lower() for u in users):
        raise ValueError(f"El email '{email}' ya está registrado")

    user = {
        "id":         str(uuid.uuid4()),
        "nombre":     nombre,
        "email":      email.lower().strip(),
        "password":   pwd_ctx.hash(password),
        "rol":        rol,
        "plaza":      plaza,
        "activo":     True,
        "permisos":   PERMISOS.get(rol, []),
        "creado_en":  datetime.now(timezone.utc).isoformat(),
        "ultimo_login": None,
    }
    users.append(user)
    _save(users)
    return _safe(user)

def autenticar(email: str, password: str) -> Optional[dict]:
    users = _load()
    user = next((u for u in users if u["email"] == email.lower()), None)
    if not user or not user.get("activo"):
        return None
    if not pwd_ctx.verify(password, user["password"]):
        return None
    # Actualizar último login
    for u in users:
        if u["id"] == user["id"]:
            u["ultimo_login"] = datetime.now(timezone.utc).isoformat()
    _save(users)
    return _safe(user)

def listar_usuarios() -> list:
    return [_safe(u) for u in _load()]

def obtener_usuario(user_id: str) -> Optional[dict]:
    users = _load()
    user = next((u for u in users if u["id"] == user_id), None)
    return _safe(user) if user else None

def actualizar_usuario(user_id: str, datos: dict) -> dict:
    users = _load()
    for u in users:
        if u["id"] == user_id:
            if "rol" in datos:
                if datos["rol"] not in ROLES:
                    raise ValueError(f"Rol inválido: {datos['rol']}")
                u["rol"] = datos["rol"]
                u["permisos"] = PERMISOS.get(datos["rol"], [])
            if "nombre"  in datos: u["nombre"]  = datos["nombre"]
            if "plaza"   in datos: u["plaza"]   = datos["plaza"]
            if "activo"  in datos: u["activo"]  = datos["activo"]
            if "password" in datos and datos["password"]:
                u["password"] = pwd_ctx.hash(datos["password"])
            _save(users)
            return _safe(u)
    raise ValueError(f"Usuario {user_id} no encontrado")

def eliminar_usuario(user_id: str):
    users = _load()
    users = [u for u in users if u["id"] != user_id]
    _save(users)

def _safe(user: dict) -> dict:
    """Devuelve usuario sin el campo password."""
    return {k: v for k, v in user.items() if k != "password"}

# ── JWT ────────────────────────────────────────────────────────────────────────
def crear_token(user: dict) -> dict:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE)
    payload = {
        "sub":      user["id"],
        "email":    user["email"],
        "nombre":   user["nombre"],
        "rol":      user["rol"],
        "permisos": user["permisos"],
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
        raise HTTPException(status_code=401, detail="Token requerido")
    return decodificar_token(credentials.credentials)

def require_rol(*roles: str):
    """Dependencia: exige que el usuario tenga uno de los roles indicados."""
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
    """Dependencia: exige que el usuario tenga un permiso específico."""
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
    if not _load():
        admin_email    = os.environ.get("ADMIN_EMAIL",    "admin@xcien.com")
        admin_password = os.environ.get("ADMIN_PASSWORD", "Xcien2026!")
        crear_usuario("Administrador XCIEN", admin_email, admin_password, "admin", "Monterrey")
        print(f"✅ [Auth] Admin creado: {admin_email}")
