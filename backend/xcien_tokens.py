"""
xcien_tokens.py
===============
Sistema Unificado de Tokens XCIEN — todos los dominios en una sola capa.

Dominios:
  inventory     → Transferencias de inventario entre almacenes
  rrhh          → Altas, bajas, promociones, movimientos de personal
  finanzas      → Transacciones inter-empresa y oportunidades
  noc           → Incidentes de red, escaladas, resoluciones
  academia      → Certificaciones y aprobaciones de cursos
  field_service → Órdenes de trabajo técnico en campo

Schema por token:
  token_id    SHA-256 truncado (16 chars upper)
  token_name  {DOMAIN}/{ENTITY}/{YYYYMMDD}/{SEQ:05d}
  domain      uno de los 6 dominios
  entity      xcien | luminet | wispi | huus
  state       máquina de estados por dominio
  payload     JSON libre — campos específicos del dominio
  created_by  email o nombre
  created_at  ISO 8601 UTC
  closed_at   ISO 8601 UTC — cuando llega a estado terminal
  ext_ref     referencia en sistema externo (odoo picking, jira ticket, etc.)
  ext_system  sistema externo (odoo, google_sheets, jira, ...)
  signature   SHA-256 de contenido para verificación

Cuando se conecte Odoo:
  domain=inventory → stock.picking
  domain=rrhh      → hr.employee / hr.contract
  domain=finanzas  → account.move / crm.lead
"""

import sqlite3
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any
from pathlib import Path
from pydantic import BaseModel, Field

DB_PATH = Path(__file__).parent / "db" / "xcien_tokens.db"

# ─── Dominios y máquinas de estado ───────────────────────────────────────────

DOMAINS = {
    "inventory": {
        "label": "Inventario",
        "icon": "🏷️",
        "color": "#1976D2",
        "initial": "draft",
        "transitions": {
            "draft":      ["confirmed", "cancelled"],
            "confirmed":  ["in_transit", "cancelled"],
            "in_transit": ["received", "cancelled"],
            "received":   [],
            "cancelled":  [],
        },
        "state_labels": {
            "draft": "Borrador", "confirmed": "Confirmado",
            "in_transit": "En Tránsito", "received": "Recibido", "cancelled": "Cancelado",
        },
    },
    "rrhh": {
        "label": "RRHH",
        "icon": "👤",
        "color": "#2E7D32",
        "initial": "draft",
        "transitions": {
            "draft":    ["approved", "cancelled"],
            "approved": ["executed", "cancelled"],
            "executed": [],
            "cancelled": [],
        },
        "state_labels": {
            "draft": "Borrador", "approved": "Aprobado",
            "executed": "Ejecutado", "cancelled": "Cancelado",
        },
    },
    "finanzas": {
        "label": "Finanzas",
        "icon": "💰",
        "color": "#7B1FA2",
        "initial": "draft",
        "transitions": {
            "draft":    ["approved", "cancelled"],
            "approved": ["settled", "cancelled"],
            "settled":  [],
            "cancelled": [],
        },
        "state_labels": {
            "draft": "Borrador", "approved": "Aprobado",
            "settled": "Liquidado", "cancelled": "Cancelado",
        },
    },
    "noc": {
        "label": "NOC",
        "icon": "📡",
        "color": "#E65100",
        "initial": "open",
        "transitions": {
            "open":         ["acknowledged", "resolved"],
            "acknowledged": ["escalated", "resolved"],
            "escalated":    ["resolved"],
            "resolved":     ["closed"],
            "closed":       [],
        },
        "state_labels": {
            "open": "Abierto", "acknowledged": "Atendido",
            "escalated": "Escalado", "resolved": "Resuelto", "closed": "Cerrado",
        },
    },
    "academia": {
        "label": "Academia",
        "icon": "🎓",
        "color": "#00796B",
        "initial": "issued",
        "transitions": {
            "issued":   ["verified", "revoked"],
            "verified": ["revoked"],
            "revoked":  [],
        },
        "state_labels": {
            "issued": "Emitido", "verified": "Verificado", "revoked": "Revocado",
        },
    },
    "field_service": {
        "label": "Campo",
        "icon": "🔧",
        "color": "#455A64",
        "initial": "created",
        "transitions": {
            "created":     ["assigned", "cancelled"],
            "assigned":    ["in_progress", "cancelled"],
            "in_progress": ["completed", "cancelled"],
            "completed":   [],
            "cancelled":   [],
        },
        "state_labels": {
            "created": "Creado", "assigned": "Asignado",
            "in_progress": "En Progreso", "completed": "Completado", "cancelled": "Cancelado",
        },
    },
}

ENTITIES = ["xcien", "luminet", "wispi", "huus"]

TERMINAL_STATES = {"received", "cancelled", "executed", "settled", "closed", "revoked", "completed"}


# ─── Modelos Pydantic ─────────────────────────────────────────────────────────

class TokenCreate(BaseModel):
    domain: str
    entity: str = "xcien"
    payload: dict = Field(default_factory=dict)
    created_by: str
    notes: str = ""
    ext_ref: Optional[str] = None
    ext_system: Optional[str] = None


class Token(BaseModel):
    token_id: str
    token_name: str
    domain: str
    entity: str
    state: str
    payload: dict
    created_by: str
    notes: str = ""
    created_at: str
    updated_at: str
    closed_at: Optional[str] = None
    ext_ref: Optional[str] = None
    ext_system: Optional[str] = None
    signature: str

    # Computed helpers (not stored)
    @property
    def domain_cfg(self):
        return DOMAINS.get(self.domain, {})

    @property
    def state_label(self):
        return DOMAINS.get(self.domain, {}).get("state_labels", {}).get(self.state, self.state)

    @property
    def is_terminal(self):
        return self.state in TERMINAL_STATES


class TransitionRequest(BaseModel):
    new_state: str
    transitioned_by: str
    notes: str = ""


# ─── DB ───────────────────────────────────────────────────────────────────────

def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS xcien_tokens (
            token_id    TEXT PRIMARY KEY,
            token_name  TEXT UNIQUE NOT NULL,
            domain      TEXT NOT NULL,
            entity      TEXT NOT NULL DEFAULT 'xcien',
            state       TEXT NOT NULL,
            payload     TEXT NOT NULL DEFAULT '{}',
            created_by  TEXT NOT NULL,
            notes       TEXT DEFAULT '',
            created_at  TEXT NOT NULL,
            updated_at  TEXT NOT NULL,
            closed_at   TEXT,
            ext_ref     TEXT,
            ext_system  TEXT,
            signature   TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_domain   ON xcien_tokens(domain);
        CREATE INDEX IF NOT EXISTS idx_entity   ON xcien_tokens(entity);
        CREATE INDEX IF NOT EXISTS idx_state    ON xcien_tokens(state);
        CREATE INDEX IF NOT EXISTS idx_created  ON xcien_tokens(created_at DESC);

        CREATE TABLE IF NOT EXISTS token_events (
            event_id    TEXT PRIMARY KEY,
            token_id    TEXT NOT NULL,
            from_state  TEXT,
            to_state    TEXT NOT NULL,
            by_user     TEXT,
            notes       TEXT,
            occurred_at TEXT NOT NULL,
            FOREIGN KEY (token_id) REFERENCES xcien_tokens(token_id)
        );

        CREATE TABLE IF NOT EXISTS token_seq (
            key   TEXT PRIMARY KEY,
            seq   INTEGER DEFAULT 0
        );
    """)
    conn.commit()
    conn.close()


def _sign(token_id: str, domain: str, entity: str, state: str, payload: dict, created_at: str) -> str:
    raw = f"{token_id}:{domain}:{entity}:{state}:{json.dumps(payload, sort_keys=True)}:{created_at}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _next_seq(conn: sqlite3.Connection, domain: str, entity: str) -> int:
    key = f"{domain}:{entity}"
    conn.execute("INSERT OR IGNORE INTO token_seq (key, seq) VALUES (?, 0)", (key,))
    conn.execute("UPDATE token_seq SET seq = seq + 1 WHERE key = ?", (key,))
    return conn.execute("SELECT seq FROM token_seq WHERE key = ?", (key,)).fetchone()["seq"]


def _gen_id(domain: str, entity: str, seq: int, ts: str) -> str:
    raw = f"{domain}{entity}{seq}{ts}{uuid.uuid4().hex[:8]}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16].upper()


# ─── CRUD ─────────────────────────────────────────────────────────────────────

def create_token(data: TokenCreate) -> Token:
    if data.domain not in DOMAINS:
        raise ValueError(f"Dominio inválido: {data.domain}. Opciones: {list(DOMAINS)}")
    if data.entity not in ENTITIES:
        raise ValueError(f"Entidad inválida: {data.entity}. Opciones: {ENTITIES}")

    now = datetime.now(timezone.utc).isoformat()
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")

    conn = get_conn()
    try:
        seq = _next_seq(conn, data.domain, data.entity)
        domain_code = data.domain.upper().replace("_", "")[:6]
        entity_code = data.entity.upper()
        token_id = _gen_id(data.domain, data.entity, seq, now)
        token_name = f"{domain_code}/{entity_code}/{date_str}/{seq:05d}"
        initial_state = DOMAINS[data.domain]["initial"]
        sig = _sign(token_id, data.domain, data.entity, initial_state, data.payload, now)

        conn.execute("""
            INSERT INTO xcien_tokens
            (token_id, token_name, domain, entity, state, payload,
             created_by, notes, created_at, updated_at, ext_ref, ext_system, signature)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            token_id, token_name, data.domain, data.entity, initial_state,
            json.dumps(data.payload, ensure_ascii=False),
            data.created_by, data.notes, now, now,
            data.ext_ref, data.ext_system, sig,
        ))

        # Log event
        conn.execute("""
            INSERT INTO token_events (event_id, token_id, from_state, to_state, by_user, notes, occurred_at)
            VALUES (?,?,?,?,?,?,?)
        """, (str(uuid.uuid4()), token_id, None, initial_state, data.created_by, "Token creado", now))

        conn.commit()
        return get_token(token_id, conn=conn)
    finally:
        conn.close()


def get_token(token_id: str, conn: sqlite3.Connection = None) -> Optional[Token]:
    _conn = conn or get_conn()
    try:
        row = _conn.execute("SELECT * FROM xcien_tokens WHERE token_id = ?", (token_id,)).fetchone()
        return _row_to_token(row) if row else None
    finally:
        if not conn:
            _conn.close()


def list_tokens(
    domain: str = None,
    entity: str = None,
    state: str = None,
    limit: int = 100,
    offset: int = 0,
    search: str = None,
) -> List[Token]:
    conn = get_conn()
    try:
        q = "SELECT * FROM xcien_tokens WHERE 1=1"
        params = []
        if domain:
            q += " AND domain = ?"
            params.append(domain)
        if entity:
            q += " AND entity = ?"
            params.append(entity)
        if state:
            q += " AND state = ?"
            params.append(state)
        if search:
            q += " AND (token_name LIKE ? OR payload LIKE ? OR created_by LIKE ?)"
            like = f"%{search}%"
            params.extend([like, like, like])
        q += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        return [_row_to_token(r) for r in conn.execute(q, params).fetchall()]
    finally:
        conn.close()


def transition_token(token_id: str, req: TransitionRequest) -> Token:
    conn = get_conn()
    try:
        row = conn.execute("SELECT * FROM xcien_tokens WHERE token_id = ?", (token_id,)).fetchone()
        if not row:
            raise ValueError(f"Token no encontrado: {token_id}")

        token = _row_to_token(row)
        allowed = DOMAINS[token.domain]["transitions"].get(token.state, [])
        if req.new_state not in allowed:
            raise ValueError(
                f"Transición inválida {token.state}→{req.new_state}. "
                f"Permitidas: {allowed or ['ninguna (estado terminal)']}"
            )

        now = datetime.now(timezone.utc).isoformat()
        closed = now if req.new_state in TERMINAL_STATES else None
        new_sig = _sign(token_id, token.domain, token.entity, req.new_state, token.payload, token.created_at)

        conn.execute("""
            UPDATE xcien_tokens SET state=?, updated_at=?, closed_at=?, signature=?
            WHERE token_id=?
        """, (req.new_state, now, closed, new_sig, token_id))

        conn.execute("""
            INSERT INTO token_events (event_id, token_id, from_state, to_state, by_user, notes, occurred_at)
            VALUES (?,?,?,?,?,?,?)
        """, (str(uuid.uuid4()), token_id, token.state, req.new_state, req.transitioned_by, req.notes, now))

        conn.commit()
        return get_token(token_id, conn=conn)
    finally:
        conn.close()


def get_token_events(token_id: str) -> list:
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM token_events WHERE token_id = ? ORDER BY occurred_at",
            (token_id,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_stats() -> dict:
    conn = get_conn()
    try:
        total = conn.execute("SELECT COUNT(*) FROM xcien_tokens").fetchone()[0]

        by_domain = {}
        for row in conn.execute("SELECT domain, COUNT(*) as n FROM xcien_tokens GROUP BY domain").fetchall():
            by_domain[row["domain"]] = row["n"]

        by_entity = {}
        for row in conn.execute("SELECT entity, COUNT(*) as n FROM xcien_tokens GROUP BY entity").fetchall():
            by_entity[row["entity"]] = row["n"]

        by_state = {}
        for row in conn.execute("SELECT state, COUNT(*) as n FROM xcien_tokens GROUP BY state").fetchall():
            by_state[row["state"]] = row["n"]

        active = conn.execute(
            "SELECT COUNT(*) FROM xcien_tokens WHERE state NOT IN ('cancelled','received','executed','settled','closed','revoked','completed')"
        ).fetchone()[0]

        recent = conn.execute(
            "SELECT * FROM xcien_tokens ORDER BY created_at DESC LIMIT 5"
        ).fetchall()

        return {
            "total": total,
            "active": active,
            "by_domain": by_domain,
            "by_entity": by_entity,
            "by_state": by_state,
            "recent": [_row_to_token(r).model_dump() for r in recent],
        }
    finally:
        conn.close()


def _row_to_token(row: sqlite3.Row) -> Token:
    d = dict(row)
    d["payload"] = json.loads(d["payload"])
    return Token(**d)


# ─── Migración de datos legacy ────────────────────────────────────────────────

def migrate_legacy_tokens(tokens_json_path: Path) -> int:
    """Importa tokens.json existente al sistema unificado."""
    if not tokens_json_path.exists():
        return 0

    legacy = json.loads(tokens_json_path.read_text())

    TIPO_TO_DOMAIN = {
        "certificacion": "academia",
        "oportunidad_ganada": "finanzas",
        "bono": "finanzas",
        "promocion": "rrhh",
        "alta": "rrhh",
        "baja": "rrhh",
        "movimiento": "rrhh",
        "cambio_area": "rrhh",
        "agente_ia": "rrhh",
    }

    TIPO_TO_STATE = {
        "certificacion": "verified",
        "oportunidad_ganada": "settled",
        "bono": "settled",
        "promocion": "executed",
        "alta": "executed",
        "baja": "executed",
        "movimiento": "executed",
        "cambio_area": "executed",
        "agente_ia": "executed",
    }

    conn = get_conn()
    count = 0
    try:
        for t in legacy:
            existing = conn.execute(
                "SELECT token_id FROM xcien_tokens WHERE ext_ref = ?", (t["token_id"],)
            ).fetchone()
            if existing:
                continue

            tipo = t.get("tipo", "rrhh")
            domain = TIPO_TO_DOMAIN.get(tipo, "rrhh")
            state = TIPO_TO_STATE.get(tipo, "executed")
            entity = t.get("empresa", "xcien")
            if entity not in ENTITIES:
                entity = "xcien"

            created_at = t.get("emitido_en", datetime.now(timezone.utc).isoformat())
            payload = {k: v for k, v in t.items()
                       if k not in ("token_id", "tipo", "empresa", "emitido_en", "firma")}
            payload["tipo_original"] = tipo

            raw = f"legacy:{t['token_id']}"
            new_id = hashlib.sha256(raw.encode()).hexdigest()[:16].upper()

            date_str = created_at[:10].replace("-", "")
            key = f"{domain}:{entity}"
            conn.execute("INSERT OR IGNORE INTO token_seq (key, seq) VALUES (?, 0)", (key,))
            conn.execute("UPDATE token_seq SET seq = seq + 1 WHERE key = ?", (key,))
            seq = conn.execute("SELECT seq FROM token_seq WHERE key = ?", (key,)).fetchone()["seq"]
            domain_code = domain.upper().replace("_", "")[:6]
            token_name = f"{domain_code}/{entity.upper()}/{date_str}/{seq:05d}"

            # Avoid duplicate names
            existing_name = conn.execute(
                "SELECT token_id FROM xcien_tokens WHERE token_name = ?", (token_name,)
            ).fetchone()
            if existing_name:
                token_name = f"{token_name}-{new_id[:4]}"

            sig = _sign(new_id, domain, entity, state, payload, created_at)
            closed_at = created_at if state in TERMINAL_STATES else None

            conn.execute("""
                INSERT OR IGNORE INTO xcien_tokens
                (token_id, token_name, domain, entity, state, payload,
                 created_by, notes, created_at, updated_at, closed_at, ext_ref, ext_system, signature)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                new_id, token_name, domain, entity, state,
                json.dumps(payload, ensure_ascii=False),
                payload.get("tecnico") or payload.get("vendedor") or "legacy",
                f"Migrado desde tokens.json — tipo: {tipo}",
                created_at, created_at, closed_at,
                t["token_id"], "tokens_json",
                sig,
            ))
            count += 1

        conn.commit()
    finally:
        conn.close()
    return count


def migrate_legacy_transacciones(tx_json_path: Path) -> int:
    """Importa transacciones.json al dominio finanzas."""
    if not tx_json_path.exists():
        return 0

    legacy = json.loads(tx_json_path.read_text())
    conn = get_conn()
    count = 0
    try:
        for t in legacy:
            tx_id = t.get("tx_id", str(uuid.uuid4()))
            existing = conn.execute(
                "SELECT token_id FROM xcien_tokens WHERE ext_ref = ?", (tx_id,)
            ).fetchone()
            if existing:
                continue

            created_at = t.get("fecha", datetime.now(timezone.utc).isoformat())
            entity = t.get("empresa_origen", "xcien")
            if entity not in ENTITIES:
                entity = "xcien"

            payload = {k: v for k, v in t.items() if k not in ("tx_id", "fecha", "firma")}

            raw = f"legacy_tx:{tx_id}"
            new_id = hashlib.sha256(raw.encode()).hexdigest()[:16].upper()
            date_str = created_at[:10].replace("-", "")

            key = f"finanzas:{entity}"
            conn.execute("INSERT OR IGNORE INTO token_seq (key, seq) VALUES (?, 0)", (key,))
            conn.execute("UPDATE token_seq SET seq = seq + 1 WHERE key = ?", (key,))
            seq = conn.execute("SELECT seq FROM token_seq WHERE key = ?", (key,)).fetchone()["seq"]
            token_name = f"FINANZ/{entity.upper()}/{date_str}/{seq:05d}"

            sig = _sign(new_id, "finanzas", entity, "settled", payload, created_at)

            conn.execute("""
                INSERT OR IGNORE INTO xcien_tokens
                (token_id, token_name, domain, entity, state, payload,
                 created_by, notes, created_at, updated_at, closed_at, ext_ref, ext_system, signature)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                new_id, token_name, "finanzas", entity, "settled",
                json.dumps(payload, ensure_ascii=False),
                t.get("responsable", "legacy"),
                f"Migrado desde transacciones.json",
                created_at, created_at, created_at,
                tx_id, "transacciones_json",
                sig,
            ))
            count += 1

        conn.commit()
    finally:
        conn.close()
    return count


def migrate_legacy_inventory() -> int:
    """Importa inventario_tokens.db al sistema unificado."""
    inv_db = Path(__file__).parent / "db" / "inventario_tokens.db"
    if not inv_db.exists():
        return 0

    src = sqlite3.connect(str(inv_db))
    src.row_factory = sqlite3.Row
    conn = get_conn()
    count = 0
    try:
        rows = src.execute("SELECT * FROM inventory_tokens").fetchall()
        for r in rows:
            existing = conn.execute(
                "SELECT token_id FROM xcien_tokens WHERE ext_ref = ?", (r["token_id"],)
            ).fetchone()
            if existing:
                continue

            created_at = r["created_at"]
            entity = "xcien"
            payload = {
                "origin_warehouse": r["origin_warehouse"],
                "dest_warehouse": r["dest_warehouse"],
                "lines": json.loads(r["lines_json"]),
                "priority": r["priority"],
                "confirmed_at": r["confirmed_at"],
                "shipped_at": r["shipped_at"],
                "received_at": r["received_at"],
                "odoo_picking_id": r["odoo_picking_id"],
                "odoo_picking_name": r["odoo_picking_name"],
            }

            # Map old states
            state_map = {
                "draft": "draft", "confirmed": "confirmed",
                "in_transit": "in_transit", "received": "received", "cancelled": "cancelled",
            }
            state = state_map.get(r["state"], r["state"])
            date_str = created_at[:10].replace("-", "")

            key = "inventory:xcien"
            conn.execute("INSERT OR IGNORE INTO token_seq (key, seq) VALUES (?, 0)", (key,))
            conn.execute("UPDATE token_seq SET seq = seq + 1 WHERE key = ?", (key,))
            seq = conn.execute("SELECT seq FROM token_seq WHERE key = ?", (key,)).fetchone()["seq"]

            new_id = hashlib.sha256(f"legacy_inv:{r['token_id']}".encode()).hexdigest()[:16].upper()
            token_name = f"INVENT/XCIEN/{date_str}/{seq:05d}"
            sig = _sign(new_id, "inventory", entity, state, payload, created_at)
            closed_at = r["received_at"] or r["cancelled_at"] if state in TERMINAL_STATES else None

            conn.execute("""
                INSERT OR IGNORE INTO xcien_tokens
                (token_id, token_name, domain, entity, state, payload,
                 created_by, notes, created_at, updated_at, closed_at, ext_ref, ext_system, signature)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                new_id, token_name, "inventory", entity, state,
                json.dumps(payload, ensure_ascii=False),
                r["created_by"], r["notes"] or "",
                created_at, created_at, closed_at,
                r["token_id"], "inventario_tokens_db",
                sig,
            ))
            count += 1

        conn.commit()
    finally:
        src.close()
        conn.close()
    return count


# ─── Init ─────────────────────────────────────────────────────────────────────

def initialize():
    """Inicializa la DB y migra datos legacy."""
    init_db()
    base = Path(__file__).parent / "db"
    n1 = migrate_legacy_tokens(base / "tokens.json")
    n2 = migrate_legacy_transacciones(base / "transacciones.json")
    n3 = migrate_legacy_inventory()
    if n1 or n2 or n3:
        print(f"[xcien_tokens] Migración: {n1} tokens RRHH/finanzas, {n2} transacciones, {n3} inventario")


initialize()


if __name__ == "__main__":
    stats = get_stats()
    print("\n=== XCIEN Tokens Unificados ===")
    print(f"Total: {stats['total']}  |  Activos: {stats['active']}")
    print("\nPor dominio:")
    for domain, count in stats["by_domain"].items():
        cfg = DOMAINS.get(domain, {})
        print(f"  {cfg.get('icon','?')} {cfg.get('label', domain):<14}: {count}")
    print("\nPor entidad:")
    for entity, count in stats["by_entity"].items():
        print(f"  {entity:<10}: {count}")
    print(f"\nDB: {DB_PATH}")
