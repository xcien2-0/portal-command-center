"""
db_migrate.py — Migración inicial XCIEN Portal → PostgreSQL
Crea tablas si no existen y migra usuarios del JSON al Postgres.
Se ejecuta al arrancar el servidor si DATABASE_URL está configurado.
"""
import os
import json
import hashlib
import logging
from datetime import datetime, timezone

logger = logging.getLogger("xcien.db")

DATABASE_URL = os.environ.get("DATABASE_URL", "")

# ── Schema DDL ──────────────────────────────────────────────────────────────
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS usuarios (
    id          TEXT PRIMARY KEY,
    nombre      TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    rol         TEXT NOT NULL DEFAULT 'readonly',
    plaza       TEXT DEFAULT '',
    activo      BOOLEAN DEFAULT TRUE,
    permisos    JSONB DEFAULT '[]',
    titular_de  JSONB DEFAULT '[]',
    creado_en   TIMESTAMPTZ DEFAULT NOW(),
    ultimo_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sesiones (
    id          SERIAL PRIMARY KEY,
    usuario_id  TEXT REFERENCES usuarios(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    ip          TEXT,
    user_agent  TEXT,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id          SERIAL PRIMARY KEY,
    usuario_id  TEXT,
    email       TEXT,
    accion      TEXT NOT NULL,
    modulo      TEXT,
    detalle     JSONB DEFAULT '{}',
    ip          TEXT,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_email ON audit_log(email);
CREATE INDEX IF NOT EXISTS idx_audit_modulo ON audit_log(modulo);
CREATE INDEX IF NOT EXISTS idx_audit_creado ON audit_log(creado_en DESC);
"""


def get_conn():
    import psycopg2
    return psycopg2.connect(DATABASE_URL)


def run_migration():
    """Crea tablas y migra usuarios del JSON si la tabla está vacía."""
    if not DATABASE_URL:
        logger.info("[DB] DATABASE_URL no configurado — usando JSON local")
        return False

    try:
        conn = get_conn()
        cur = conn.cursor()

        # Crear tablas
        cur.execute(SCHEMA_SQL)
        conn.commit()
        logger.info("[DB] Tablas verificadas/creadas")

        # Migrar usuarios del JSON si la tabla está vacía
        cur.execute("SELECT COUNT(*) FROM usuarios")
        count = cur.fetchone()[0]

        if count == 0:
            _migrate_users_from_json(cur, conn)
        else:
            logger.info(f"[DB] {count} usuarios ya en Postgres — sin migración")

        cur.close()
        conn.close()
        return True

    except Exception as e:
        logger.error(f"[DB] Error en migración: {e}")
        return False


def _migrate_users_from_json(cur, conn):
    """Importa usuarios del JSON al Postgres."""
    from agents.auth_service import USERS_DB

    if not os.path.exists(USERS_DB):
        logger.info("[DB] No hay JSON de usuarios que migrar")
        return

    with open(USERS_DB, "r", encoding="utf-8") as f:
        users = json.load(f)

    migrated = 0
    for u in users:
        try:
            cur.execute("""
                INSERT INTO usuarios (id, nombre, email, password, rol, plaza,
                                      activo, permisos, titular_de, creado_en, ultimo_login)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (email) DO NOTHING
            """, (
                u["id"], u["nombre"], u["email"], u["password"],
                u["rol"], u.get("plaza", ""),
                u.get("activo", True),
                json.dumps(u.get("permisos", [])),
                json.dumps(u.get("titular_de", [])),
                u.get("creado_en", datetime.now(timezone.utc).isoformat()),
                u.get("ultimo_login"),
            ))
            migrated += 1
        except Exception as e:
            logger.warning(f"[DB] Error migrando usuario {u.get('email')}: {e}")

    conn.commit()
    logger.info(f"[DB] {migrated} usuarios migrados de JSON a Postgres")


def log_access(usuario_id: str, email: str, modulo: str, ip: str = None):
    """Registra un acceso al portal en audit_log."""
    if not DATABASE_URL:
        return
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO audit_log (usuario_id, email, accion, modulo, ip)
            VALUES (%s, %s, 'acceso', %s, %s)
        """, (usuario_id, email, modulo, ip))
        conn.commit()
        cur.close()
        conn.close()
    except Exception:
        pass


def log_login(usuario_id: str, email: str, ip: str = None, user_agent: str = None):
    """Registra un login exitoso."""
    if not DATABASE_URL:
        return
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO sesiones (usuario_id, email, ip, user_agent)
            VALUES (%s, %s, %s, %s)
        """, (usuario_id, email, ip, user_agent))
        conn.commit()
        cur.close()
        conn.close()
    except Exception:
        pass
