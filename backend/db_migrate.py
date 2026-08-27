"""
db_migrate.py — Esquema completo XCIEN Portal PostgreSQL
Corre al arrancar el servidor. Idempotente (CREATE IF NOT EXISTS).
"""
import os, json, logging
from datetime import datetime, timezone

logger = logging.getLogger("xcien.db")
DATABASE_URL = os.environ.get("DATABASE_URL", "")


# ── Schema DDL ──────────────────────────────────────────────────────────────
SCHEMA_SQL = """

/* ─── AUTH ──────────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS usuarios (
    id           TEXT PRIMARY KEY,
    nombre       TEXT NOT NULL,
    email        TEXT UNIQUE NOT NULL,
    password     TEXT NOT NULL,
    rol          TEXT NOT NULL DEFAULT 'readonly',
    plaza        TEXT DEFAULT '',
    activo       BOOLEAN DEFAULT TRUE,
    permisos     JSONB DEFAULT '[]',
    titular_de   JSONB DEFAULT '[]',
    creado_en    TIMESTAMPTZ DEFAULT NOW(),
    ultimo_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sesiones (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  TEXT REFERENCES usuarios(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    ip          TEXT,
    user_agent  TEXT,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

/* ─── CONTROL DE ACCESO ──────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS permisos_secciones (
    id          BIGSERIAL PRIMARY KEY,
    rol         TEXT NOT NULL,
    seccion_id  TEXT NOT NULL,
    puede_ver   BOOLEAN DEFAULT TRUE,
    puede_editar BOOLEAN DEFAULT FALSE,
    UNIQUE(rol, seccion_id)
);

CREATE TABLE IF NOT EXISTS invitaciones (
    id          TEXT PRIMARY KEY,
    email       TEXT NOT NULL,
    rol         TEXT NOT NULL DEFAULT 'readonly',
    plaza       TEXT DEFAULT '',
    token       TEXT UNIQUE NOT NULL,
    creado_por  TEXT REFERENCES usuarios(id),
    usado_en    TIMESTAMPTZ,
    expira_en   TIMESTAMPTZ NOT NULL,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

/* ─── ANALYTICS & AUDIT ──────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  TEXT,
    email       TEXT,
    accion      TEXT NOT NULL,
    modulo      TEXT,
    detalle     JSONB DEFAULT '{}',
    ip          TEXT,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eventos_portal (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  TEXT,
    seccion     TEXT NOT NULL,
    accion      TEXT DEFAULT 'vista',
    duracion_s  INTEGER,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

/* ─── CONFIGURACIÓN ──────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS configuracion (
    clave       TEXT PRIMARY KEY,
    valor       JSONB NOT NULL,
    descripcion TEXT,
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por TEXT
);

/* ─── NOC ────────────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS incidentes (
    id          BIGSERIAL PRIMARY KEY,
    titulo      TEXT NOT NULL,
    descripcion TEXT,
    severidad   TEXT DEFAULT 'media',   -- baja | media | alta | critica
    estado      TEXT DEFAULT 'abierto', -- abierto | en_proceso | resuelto
    site        TEXT,
    ciudad      TEXT,
    asignado_a  TEXT,
    creado_por  TEXT REFERENCES usuarios(id),
    resuelto_en TIMESTAMPTZ,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notas_incidente (
    id          BIGSERIAL PRIMARY KEY,
    incidente_id BIGINT REFERENCES incidentes(id) ON DELETE CASCADE,
    autor_id    TEXT REFERENCES usuarios(id),
    autor_nombre TEXT,
    nota        TEXT NOT NULL,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alertas_historico (
    id          BIGSERIAL PRIMARY KEY,
    site        TEXT NOT NULL,
    ciudad      TEXT,
    tipo        TEXT,
    mensaje     TEXT,
    severidad   TEXT,
    fuente      TEXT DEFAULT 'observium',
    resuelto    BOOLEAN DEFAULT FALSE,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

/* ─── MINUTAS ────────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS minutas (
    id          BIGSERIAL PRIMARY KEY,
    titulo      TEXT NOT NULL,
    ciudad      TEXT,                  -- PDN | MTY | SLT | AGS | QRO
    fecha       DATE NOT NULL,
    tipo        TEXT DEFAULT 'operativa',
    participantes JSONB DEFAULT '[]',
    creado_por  TEXT REFERENCES usuarios(id),
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compromisos (
    id          BIGSERIAL PRIMARY KEY,
    minuta_id   BIGINT REFERENCES minutas(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    responsable TEXT,
    fecha_limite DATE,
    estado      TEXT DEFAULT 'pendiente', -- pendiente | en_proceso | completado | cancelado
    evidencia   TEXT,
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

/* ─── DOCUMENTOS ─────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS documentos (
    id          BIGSERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL,
    ruta        TEXT,
    tipo        TEXT,
    categoria   TEXT,
    tags        JSONB DEFAULT '[]',
    subido_por  TEXT REFERENCES usuarios(id),
    tamano_kb   INTEGER,
    version     TEXT DEFAULT '1.0',
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

/* ─── ACADEMIA (cache / certificaciones portal) ──────────────────── */
CREATE TABLE IF NOT EXISTS certificaciones (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  TEXT REFERENCES usuarios(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    nombre_usuario TEXT,
    curso_id    INTEGER NOT NULL,
    curso_nombre TEXT,
    area        TEXT,
    score       INTEGER,
    pdf_path    TEXT,
    emitida_en  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rutas_aprendizaje (
    area        TEXT PRIMARY KEY,
    nombre      TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    color       TEXT DEFAULT '#00C896',
    icono       TEXT DEFAULT '🎓',
    cursos      JSONB DEFAULT '[]',
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

/* ─── FLOTILLA ───────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS flotilla_infracciones (
    id          BIGSERIAL PRIMARY KEY,
    unidad_id   TEXT,
    unidad_nombre TEXT,
    conductor   TEXT,
    tipo        TEXT NOT NULL,         -- velocidad | fuera_horario | zona_prohibida
    velocidad   INTEGER,
    latitud     NUMERIC(10,7),
    longitud    NUMERIC(10,7),
    descripcion TEXT,
    fecha       DATE,
    hora        TIME,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flotilla_reportes (
    id          BIGSERIAL PRIMARY KEY,
    semana      DATE NOT NULL,
    total_unidades INTEGER,
    infracciones_velocidad INTEGER DEFAULT 0,
    infracciones_horario INTEGER DEFAULT 0,
    pdf_path    TEXT,
    enviado_telegram BOOLEAN DEFAULT FALSE,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

/* ─── NOTIFICACIONES ─────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS notificaciones (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  TEXT REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo        TEXT NOT NULL,
    titulo      TEXT NOT NULL,
    cuerpo      TEXT,
    leida       BOOLEAN DEFAULT FALSE,
    accion_url  TEXT,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

/* ─── ÍNDICES ────────────────────────────────────────────────────── */
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario    ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha      ON sesiones(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_audit_email         ON audit_log(email);
CREATE INDEX IF NOT EXISTS idx_audit_modulo        ON audit_log(modulo);
CREATE INDEX IF NOT EXISTS idx_audit_fecha         ON audit_log(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_usuario     ON eventos_portal(usuario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_seccion     ON eventos_portal(seccion);
CREATE INDEX IF NOT EXISTS idx_incidentes_estado   ON incidentes(estado);
CREATE INDEX IF NOT EXISTS idx_incidentes_ciudad   ON incidentes(ciudad);
CREATE INDEX IF NOT EXISTS idx_compromisos_estado  ON compromisos(estado);
CREATE INDEX IF NOT EXISTS idx_compromisos_minuta  ON compromisos(minuta_id);
CREATE INDEX IF NOT EXISTS idx_certificaciones_usr ON certificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notif_usuario       ON notificaciones(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_flotilla_fecha      ON flotilla_infracciones(fecha DESC);
"""


def get_conn():
    import psycopg2
    return psycopg2.connect(DATABASE_URL)


def run_migration():
    if not DATABASE_URL:
        logger.info("[DB] DATABASE_URL no configurado — usando JSON local")
        return False
    try:
        conn = get_conn()
        cur  = conn.cursor()
        cur.execute(SCHEMA_SQL)
        conn.commit()
        logger.info("[DB] Esquema verificado/creado")

        cur.execute("SELECT COUNT(*) FROM usuarios")
        if cur.fetchone()[0] == 0:
            _migrate_users(cur, conn)
            _seed_rutas(cur, conn)

        cur.close(); conn.close()
        return True
    except Exception as e:
        logger.error(f"[DB] Error en migración: {e}")
        return False


def _migrate_users(cur, conn):
    from agents.auth_service import USERS_DB
    if not os.path.exists(USERS_DB):
        return
    with open(USERS_DB, "r", encoding="utf-8") as f:
        users = json.load(f)
    migrated = 0
    for u in users:
        try:
            cur.execute("""
                INSERT INTO usuarios (id,nombre,email,password,rol,plaza,activo,
                                      permisos,titular_de,creado_en,ultimo_login)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (email) DO NOTHING
            """, (u["id"], u["nombre"], u["email"], u["password"], u["rol"],
                  u.get("plaza",""), u.get("activo",True),
                  json.dumps(u.get("permisos",[])),
                  json.dumps(u.get("titular_de",[])),
                  u.get("creado_en", datetime.now(timezone.utc).isoformat()),
                  u.get("ultimo_login")))
            migrated += 1
        except Exception as e:
            logger.warning(f"[DB] Usuario {u.get('email')}: {e}")
    conn.commit()
    logger.info(f"[DB] {migrated} usuarios migrados a Postgres")


def _seed_rutas(cur, conn):
    """Siembra las 10 áreas de certificación XCIEN."""
    rutas = [
        ("TI", "Técnico de Infraestructura", "Instalación, mantenimiento y operación de infraestructura de red.", "#00C896", "🔧",
         [{"curso_id":84,"curso_name":"Inducción XCIEN","orden":1,"obligatorio":True},
          {"curso_id":18,"curso_name":"Reemplazo de Servicios","orden":2,"obligatorio":True},
          {"curso_id":35,"curso_name":"Verificación de Voltaje","orden":3,"obligatorio":True},
          {"curso_id":42,"curso_name":"Seguridad y Baterías","orden":4,"obligatorio":True},
          {"curso_id":39,"curso_name":"Topología de Red","orden":5,"obligatorio":True},
          {"curso_id":87,"curso_name":"Capacitación Raisecom","orden":6,"obligatorio":False},
          {"curso_id":88,"curso_name":"CAST Certificación","orden":7,"obligatorio":False}]),
        ("N1","NOC Nivel 1","Monitoreo de red, atención de alertas y escalamiento.","#3B82F6","📡",
         [{"curso_id":84,"curso_name":"Inducción XCIEN","orden":1,"obligatorio":True},
          {"curso_id":38,"curso_name":"Monitoreo SNMP y NOCBoards","orden":2,"obligatorio":True},
          {"curso_id":39,"curso_name":"Topología de Red","orden":3,"obligatorio":True},
          {"curso_id":86,"curso_name":"Programa NOC XCIEN","orden":4,"obligatorio":True},
          {"curso_id":43,"curso_name":"Protocolos de Emergencia","orden":5,"obligatorio":True}]),
        ("N2","NOC Nivel 2","Diagnóstico avanzado y configuración de equipos.","#6366F1","🖥️",
         [{"curso_id":38,"curso_name":"Monitoreo SNMP y NOCBoards","orden":1,"obligatorio":True},
          {"curso_id":86,"curso_name":"Programa NOC XCIEN","orden":2,"obligatorio":True},
          {"curso_id":46,"curso_name":"Laboratorio QC Radios Mimosa","orden":3,"obligatorio":True},
          {"curso_id":88,"curso_name":"CAST Certificación","orden":4,"obligatorio":True}]),
        ("TC","Técnico Ops / Almacén","Field service, inventario y transferencias en Odoo.","#F59E0B","📦",
         [{"curso_id":84,"curso_name":"Inducción XCIEN","orden":1,"obligatorio":True},
          {"curso_id":40,"curso_name":"Field Service en Odoo","orden":2,"obligatorio":True},
          {"curso_id":41,"curso_name":"Inventario y Transferencias","orden":3,"obligatorio":True},
          {"curso_id":42,"curso_name":"Seguridad y Baterías","orden":4,"obligatorio":True},
          {"curso_id":35,"curso_name":"Verificación de Voltaje","orden":5,"obligatorio":True}]),
        ("PM","Project Managers","Gestión de proyectos, bidrillas y coordinación de equipos.","#EC4899","📋",
         [{"curso_id":84,"curso_name":"Inducción XCIEN","orden":1,"obligatorio":True},
          {"curso_id":37,"curso_name":"Gestión de Proyectos","orden":2,"obligatorio":True},
          {"curso_id":45,"curso_name":"Capacitación Operaciones","orden":3,"obligatorio":True}]),
        ("CO","Comercial","Ventas B2B, prospección y cierre de cuentas corporativas.","#10B981","💼",
         [{"curso_id":84,"curso_name":"Inducción XCIEN","orden":1,"obligatorio":True},
          {"curso_id":44,"curso_name":"Capacitación Comercial","orden":2,"obligatorio":True},
          {"curso_id":15,"curso_name":"CFDi 4.0","orden":3,"obligatorio":True}]),
        ("SP","Servicios y Preventa","Factibilidad técnica, cotizaciones y acompañamiento.","#8B5CF6","🔍",
         [{"curso_id":84,"curso_name":"Inducción XCIEN","orden":1,"obligatorio":True},
          {"curso_id":44,"curso_name":"Capacitación Comercial","orden":2,"obligatorio":True},
          {"curso_id":39,"curso_name":"Topología de Red","orden":3,"obligatorio":True}]),
        ("RH","Recursos Humanos","Administración de personal, nómina y bienestar.","#F472B6","👥",
         [{"curso_id":84,"curso_name":"Inducción XCIEN","orden":1,"obligatorio":True},
          {"curso_id":15,"curso_name":"CFDi 4.0","orden":2,"obligatorio":True}]),
        ("LC","Líderes de Campo","Supervisión de técnicos, calidad en campo y reporteo.","#EF4444","🏗️",
         [{"curso_id":84,"curso_name":"Inducción XCIEN","orden":1,"obligatorio":True},
          {"curso_id":37,"curso_name":"Gestión de Proyectos","orden":2,"obligatorio":True},
          {"curso_id":42,"curso_name":"Seguridad y Baterías","orden":3,"obligatorio":True},
          {"curso_id":43,"curso_name":"Protocolos de Emergencia","orden":4,"obligatorio":True},
          {"curso_id":45,"curso_name":"Capacitación Operaciones","orden":5,"obligatorio":True}]),
        ("ID","Ingeniería de Datos","Análisis, visualización y automatización de datos operativos.","#06B6D4","📊",
         [{"curso_id":84,"curso_name":"Inducción XCIEN","orden":1,"obligatorio":True},
          {"curso_id":38,"curso_name":"Monitoreo SNMP y NOCBoards","orden":2,"obligatorio":False}]),
    ]
    for (area, nombre, desc, color, icono, cursos) in rutas:
        cur.execute("""
            INSERT INTO rutas_aprendizaje (area, nombre, descripcion, color, icono, cursos)
            VALUES (%s,%s,%s,%s,%s,%s)
            ON CONFLICT (area) DO NOTHING
        """, (area, nombre, desc, color, icono, json.dumps(cursos)))
    conn.commit()
    logger.info("[DB] 10 rutas de aprendizaje sembradas")


# ── Helpers de acceso (usados en endpoints) ─────────────────────────────────

def log_login(usuario_id: str, email: str, ip: str = None, user_agent: str = None):
    if not DATABASE_URL: return
    try:
        conn = get_conn(); cur = conn.cursor()
        cur.execute("INSERT INTO sesiones (usuario_id,email,ip,user_agent) VALUES (%s,%s,%s,%s)",
                    (usuario_id, email, ip, user_agent))
        conn.commit(); cur.close(); conn.close()
    except Exception: pass


def log_evento(usuario_id: str, seccion: str, accion: str = "vista", duracion_s: int = None):
    if not DATABASE_URL: return
    try:
        conn = get_conn(); cur = conn.cursor()
        cur.execute("INSERT INTO eventos_portal (usuario_id,seccion,accion,duracion_s) VALUES (%s,%s,%s,%s)",
                    (usuario_id, seccion, accion, duracion_s))
        conn.commit(); cur.close(); conn.close()
    except Exception: pass


def log_audit(usuario_id: str, email: str, accion: str, modulo: str = None,
              detalle: dict = None, ip: str = None):
    if not DATABASE_URL: return
    try:
        conn = get_conn(); cur = conn.cursor()
        cur.execute("INSERT INTO audit_log (usuario_id,email,accion,modulo,detalle,ip) VALUES (%s,%s,%s,%s,%s,%s)",
                    (usuario_id, email, accion, modulo, json.dumps(detalle or {}), ip))
        conn.commit(); cur.close(); conn.close()
    except Exception: pass


def get_config(clave: str, default=None):
    if not DATABASE_URL: return default
    try:
        conn = get_conn(); cur = conn.cursor()
        cur.execute("SELECT valor FROM configuracion WHERE clave=%s", (clave,))
        row = cur.fetchone(); cur.close(); conn.close()
        return row[0] if row else default
    except Exception: return default


def set_config(clave: str, valor, descripcion: str = None, usuario_id: str = None):
    if not DATABASE_URL: return
    try:
        conn = get_conn(); cur = conn.cursor()
        cur.execute("""
            INSERT INTO configuracion (clave,valor,descripcion,actualizado_por)
            VALUES (%s,%s,%s,%s)
            ON CONFLICT (clave) DO UPDATE
            SET valor=%s, actualizado_en=NOW(), actualizado_por=%s
        """, (clave, json.dumps(valor), descripcion, usuario_id,
              json.dumps(valor), usuario_id))
        conn.commit(); cur.close(); conn.close()
    except Exception: pass


def get_analytics_resumen(dias: int = 7) -> dict:
    """Resumen de uso del portal para dashboard de admin."""
    if not DATABASE_URL: return {}
    try:
        conn = get_conn(); cur = conn.cursor()
        cur.execute("""
            SELECT COUNT(DISTINCT usuario_id), COUNT(*)
            FROM sesiones WHERE creado_en > NOW() - INTERVAL '%s days'
        """, (dias,))
        usuarios_activos, total_logins = cur.fetchone()

        cur.execute("""
            SELECT seccion, COUNT(*) as vistas
            FROM eventos_portal
            WHERE creado_en > NOW() - INTERVAL '%s days'
            GROUP BY seccion ORDER BY vistas DESC LIMIT 5
        """, (dias,))
        top_secciones = [{"seccion": r[0], "vistas": r[1]} for r in cur.fetchall()]

        cur.execute("""
            SELECT DATE(creado_en), COUNT(DISTINCT usuario_id)
            FROM sesiones WHERE creado_en > NOW() - INTERVAL '%s days'
            GROUP BY DATE(creado_en) ORDER BY 1
        """, (dias,))
        logins_por_dia = [{"fecha": str(r[0]), "usuarios": r[1]} for r in cur.fetchall()]

        cur.close(); conn.close()
        return {
            "usuarios_activos": usuarios_activos,
            "total_logins": total_logins,
            "top_secciones": top_secciones,
            "logins_por_dia": logins_por_dia,
        }
    except Exception as e:
        logger.error(f"[DB] analytics: {e}")
        return {}
