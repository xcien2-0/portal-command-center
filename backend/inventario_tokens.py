"""
inventario_tokens.py
====================
Sistema de tokenización de transferencias de inventario entre almacenes.

Schema diseñado para mapear directamente a Odoo cuando se conecte:
  InventoryToken  →  stock.picking
  TokenLine       →  stock.move + stock.move.line
  Warehouse       →  stock.warehouse + stock.location

Para conectar a Odoo: llamar sync_to_odoo(token_id) del módulo odoo_adapter.py
"""

import sqlite3
import hashlib
import json
from datetime import datetime, timezone
from typing import Optional, List
from pathlib import Path
from pydantic import BaseModel, Field
import uuid

# ─── Config ────────────────────────────────────────────────────────────────────

DB_PATH = Path(__file__).parent / "db" / "inventario_tokens.db"

# Almacenes conocidos con sus códigos Odoo preparados
# Cuando se conecte Odoo, llenar odoo_location_id con el id real de stock.location
WAREHOUSES = {
    "CDMX": {
        "name": "CDMX",
        "code": "CDMX",
        "city": "Ciudad de México",
        "odoo_warehouse_id": None,   # stock.warehouse.id
        "odoo_location_id": None,    # stock.location.id (usage='internal')
        "odoo_location_code": "CDMX/Stock",
    },
    "QRO": {
        "name": "Querétaro",
        "code": "QRO",
        "city": "Querétaro",
        "odoo_warehouse_id": None,
        "odoo_location_id": None,
        "odoo_location_code": "QRO/Stock",
    },
    "GDL": {
        "name": "Guadalajara",
        "code": "GDL",
        "city": "Guadalajara",
        "odoo_warehouse_id": None,
        "odoo_location_id": None,
        "odoo_location_code": "GDL/Stock",
    },
    "MTY": {
        "name": "Monterrey",
        "code": "MTY",
        "city": "Monterrey",
        "odoo_warehouse_id": None,
        "odoo_location_id": None,
        "odoo_location_code": "MTY/Stock",
    },
}

# Estados — espejo de stock.picking.state en Odoo
# draft → confirmed → in_transit (assigned) → received (done) | cancelled
STATES = ["draft", "confirmed", "in_transit", "received", "cancelled"]


# ─── Modelos Pydantic ───────────────────────────────────────────────────────────

class TokenLine(BaseModel):
    """
    Línea de producto en la transferencia.
    Mapea a: stock.move + stock.move.line en Odoo
    """
    line_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    product_ref: str           # product.default_code (referencia interna)
    product_name: str          # product.name
    quantity: float            # qty a transferir
    uom: str = "pza"           # unidad de medida
    lot_serial: Optional[str] = None  # stock.lot.name si aplica

    # Campos listos para Odoo (se llenan al sincronizar)
    odoo_product_id: Optional[int] = None    # product.product.id
    odoo_move_id: Optional[int] = None       # stock.move.id
    odoo_lot_id: Optional[int] = None        # stock.lot.id


class InventoryTokenCreate(BaseModel):
    """Input para crear un nuevo token de transferencia"""
    origin_warehouse: str    # "CDMX" | "QRO" | "GDL" | "MTY"
    dest_warehouse: str
    lines: List[TokenLine]
    created_by: str          # nombre o email del usuario
    notes: Optional[str] = ""
    priority: str = "normal"  # normal | urgent


class InventoryToken(BaseModel):
    """
    Token completo de transferencia de inventario.
    Mapea a: stock.picking en Odoo

    stock.picking fields:
      name          → token_name  (e.g. "INV/CDMX→MTY/2026-05-19/001")
      origin        → origin_ref
      location_id   → origin_warehouse (resuelto a odoo_location_id)
      location_dest_id → dest_warehouse
      state         → state
      move_ids      → lines
      scheduled_date → created_at
      date_done     → received_at
    """
    token_id: str
    token_name: str            # nombre legible, único
    origin_warehouse: str
    dest_warehouse: str
    state: str = "draft"
    lines: List[TokenLine]
    created_by: str
    notes: str = ""
    priority: str = "normal"

    # Timestamps — formato ISO para compatibilidad
    created_at: str
    confirmed_at: Optional[str] = None
    shipped_at: Optional[str] = None   # in_transit
    received_at: Optional[str] = None  # done (stock.picking.date_done)
    cancelled_at: Optional[str] = None

    # Campos Odoo — vacíos hasta sincronizar
    odoo_picking_id: Optional[int] = None      # stock.picking.id
    odoo_picking_name: Optional[str] = None    # stock.picking.name (e.g. WH/INT/001)
    odoo_synced_at: Optional[str] = None
    odoo_sync_error: Optional[str] = None


# ─── Base de datos ──────────────────────────────────────────────────────────────

def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Crea las tablas si no existen."""
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS inventory_tokens (
            token_id        TEXT PRIMARY KEY,
            token_name      TEXT UNIQUE NOT NULL,
            origin_warehouse TEXT NOT NULL,
            dest_warehouse   TEXT NOT NULL,
            state           TEXT NOT NULL DEFAULT 'draft',
            lines_json      TEXT NOT NULL,
            created_by      TEXT NOT NULL,
            notes           TEXT DEFAULT '',
            priority        TEXT DEFAULT 'normal',
            created_at      TEXT NOT NULL,
            confirmed_at    TEXT,
            shipped_at      TEXT,
            received_at     TEXT,
            cancelled_at    TEXT,
            odoo_picking_id   INTEGER,
            odoo_picking_name TEXT,
            odoo_synced_at    TEXT,
            odoo_sync_error   TEXT
        );

        CREATE TABLE IF NOT EXISTS token_sequence (
            warehouse_pair TEXT PRIMARY KEY,
            last_seq       INTEGER DEFAULT 0
        );
    """)
    conn.commit()
    conn.close()


def _next_seq(conn: sqlite3.Connection, origin: str, dest: str) -> int:
    pair = f"{origin}-{dest}"
    conn.execute(
        "INSERT OR IGNORE INTO token_sequence (warehouse_pair, last_seq) VALUES (?, 0)",
        (pair,)
    )
    conn.execute(
        "UPDATE token_sequence SET last_seq = last_seq + 1 WHERE warehouse_pair = ?",
        (pair,)
    )
    row = conn.execute(
        "SELECT last_seq FROM token_sequence WHERE warehouse_pair = ?", (pair,)
    ).fetchone()
    return row["last_seq"]


def _generate_token_id(origin: str, dest: str, seq: int, ts: str) -> str:
    raw = f"{origin}{dest}{seq}{ts}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16].upper()


# ─── CRUD ───────────────────────────────────────────────────────────────────────

def create_token(data: InventoryTokenCreate) -> InventoryToken:
    if data.origin_warehouse not in WAREHOUSES:
        raise ValueError(f"Almacén origen desconocido: {data.origin_warehouse}")
    if data.dest_warehouse not in WAREHOUSES:
        raise ValueError(f"Almacén destino desconocido: {data.dest_warehouse}")
    if data.origin_warehouse == data.dest_warehouse:
        raise ValueError("Origen y destino no pueden ser el mismo almacén")
    if not data.lines:
        raise ValueError("El token debe tener al menos una línea de producto")

    now = datetime.now(timezone.utc).isoformat()
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")

    conn = get_conn()
    try:
        seq = _next_seq(conn, data.origin_warehouse, data.dest_warehouse)
        token_id = _generate_token_id(data.origin_warehouse, data.dest_warehouse, seq, now)
        token_name = f"INV/{data.origin_warehouse}→{data.dest_warehouse}/{date_str}/{seq:04d}"

        token = InventoryToken(
            token_id=token_id,
            token_name=token_name,
            origin_warehouse=data.origin_warehouse,
            dest_warehouse=data.dest_warehouse,
            state="draft",
            lines=data.lines,
            created_by=data.created_by,
            notes=data.notes or "",
            priority=data.priority,
            created_at=now,
        )

        conn.execute("""
            INSERT INTO inventory_tokens
            (token_id, token_name, origin_warehouse, dest_warehouse, state,
             lines_json, created_by, notes, priority, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            token.token_id, token.token_name,
            token.origin_warehouse, token.dest_warehouse,
            token.state, json.dumps([l.model_dump() for l in token.lines]),
            token.created_by, token.notes, token.priority, token.created_at,
        ))
        conn.commit()
        return token
    finally:
        conn.close()


def get_token(token_id: str) -> Optional[InventoryToken]:
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM inventory_tokens WHERE token_id = ?", (token_id,)
        ).fetchone()
        return _row_to_token(row) if row else None
    finally:
        conn.close()


def get_token_by_name(token_name: str) -> Optional[InventoryToken]:
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM inventory_tokens WHERE token_name = ?", (token_name,)
        ).fetchone()
        return _row_to_token(row) if row else None
    finally:
        conn.close()


def list_tokens(
    state: Optional[str] = None,
    warehouse: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[InventoryToken]:
    conn = get_conn()
    try:
        q = "SELECT * FROM inventory_tokens WHERE 1=1"
        params = []
        if state:
            q += " AND state = ?"
            params.append(state)
        if warehouse:
            q += " AND (origin_warehouse = ? OR dest_warehouse = ?)"
            params.extend([warehouse, warehouse])
        q += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = conn.execute(q, params).fetchall()
        return [_row_to_token(r) for r in rows]
    finally:
        conn.close()


def _transition(token_id: str, new_state: str, ts_field: str) -> InventoryToken:
    now = datetime.now(timezone.utc).isoformat()
    conn = get_conn()
    try:
        conn.execute(
            f"UPDATE inventory_tokens SET state = ?, {ts_field} = ? WHERE token_id = ?",
            (new_state, now, token_id)
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM inventory_tokens WHERE token_id = ?", (token_id,)
        ).fetchone()
        return _row_to_token(row)
    finally:
        conn.close()


def confirm_token(token_id: str) -> InventoryToken:
    """draft → confirmed  (en Odoo: action_confirm)"""
    token = get_token(token_id)
    if not token:
        raise ValueError(f"Token no encontrado: {token_id}")
    if token.state != "draft":
        raise ValueError(f"Solo se puede confirmar desde draft. Estado actual: {token.state}")
    return _transition(token_id, "confirmed", "confirmed_at")


def ship_token(token_id: str) -> InventoryToken:
    """confirmed → in_transit  (en Odoo: action_assign + validate parcial)"""
    token = get_token(token_id)
    if not token:
        raise ValueError(f"Token no encontrado: {token_id}")
    if token.state != "confirmed":
        raise ValueError(f"Solo se puede enviar desde confirmed. Estado actual: {token.state}")
    return _transition(token_id, "in_transit", "shipped_at")


def receive_token(token_id: str) -> InventoryToken:
    """in_transit → received  (en Odoo: button_validate → actualiza stock.quant)"""
    token = get_token(token_id)
    if not token:
        raise ValueError(f"Token no encontrado: {token_id}")
    if token.state != "in_transit":
        raise ValueError(f"Solo se puede recibir desde in_transit. Estado actual: {token.state}")
    return _transition(token_id, "received", "received_at")


def cancel_token(token_id: str) -> InventoryToken:
    """draft|confirmed → cancelled  (en Odoo: action_cancel)"""
    token = get_token(token_id)
    if not token:
        raise ValueError(f"Token no encontrado: {token_id}")
    if token.state in ("received",):
        raise ValueError("No se puede cancelar un token ya recibido")
    return _transition(token_id, "cancelled", "cancelled_at")


def _row_to_token(row: sqlite3.Row) -> InventoryToken:
    d = dict(row)
    lines = [TokenLine(**l) for l in json.loads(d.pop("lines_json"))]
    return InventoryToken(**d, lines=lines)


# ─── Stock Virtual ──────────────────────────────────────────────────────────────
# Calcula stock por almacén sumando tokens recibidos.
# Cuando se conecte Odoo, este cálculo se reemplaza por stock.quant.

def get_virtual_stock(warehouse: str) -> dict:
    """
    Retorna stock virtual de un almacén calculado desde tokens.
    Entrada de stock: tokens recibidos con dest_warehouse = warehouse
    Salida de stock: tokens recibidos con origin_warehouse = warehouse
    Nota: "recibidos" = state='received' (equivalente a done en Odoo)
    """
    conn = get_conn()
    try:
        # Entradas al almacén
        in_rows = conn.execute("""
            SELECT lines_json FROM inventory_tokens
            WHERE dest_warehouse = ? AND state = 'received'
        """, (warehouse,)).fetchall()

        # Salidas del almacén
        out_rows = conn.execute("""
            SELECT lines_json FROM inventory_tokens
            WHERE origin_warehouse = ? AND state = 'received'
        """, (warehouse,)).fetchall()

        stock: dict[str, dict] = {}

        for row in in_rows:
            for line in json.loads(row["lines_json"]):
                ref = line["product_ref"]
                if ref not in stock:
                    stock[ref] = {"product_ref": ref, "product_name": line["product_name"], "quantity": 0.0}
                stock[ref]["quantity"] += line["quantity"]

        for row in out_rows:
            for line in json.loads(row["lines_json"]):
                ref = line["product_ref"]
                if ref not in stock:
                    stock[ref] = {"product_ref": ref, "product_name": line["product_name"], "quantity": 0.0}
                stock[ref]["quantity"] -= line["quantity"]

        return {
            "warehouse": warehouse,
            "warehouse_name": WAREHOUSES.get(warehouse, {}).get("name", warehouse),
            "products": [v for v in stock.values() if v["quantity"] != 0],
            "odoo_location_code": WAREHOUSES.get(warehouse, {}).get("odoo_location_code"),
            # Cuando se conecte Odoo, reemplazar con:
            # xmlrpc.execute_kw('stock.quant', 'search_read',
            #   [[['location_id.usage','=','internal'],
            #     ['location_id.complete_name','ilike', warehouse],
            #     ['quantity','>',0]]],
            #   {'fields': ['product_id','quantity','value']})
        }
    finally:
        conn.close()


# ─── Init ───────────────────────────────────────────────────────────────────────

init_db()

if __name__ == "__main__":
    # Demo rápido
    print("=== Inventario Tokens — Demo ===\n")

    t = create_token(InventoryTokenCreate(
        origin_warehouse="CDMX",
        dest_warehouse="MTY",
        created_by="demo@xcien.com",
        notes="Reposición mensual Mayo 2026",
        lines=[
            TokenLine(product_ref="C5X-500", product_name="Cable C5x 500m", quantity=10),
            TokenLine(product_ref="C5C-500", product_name="Cable C5C 500m", quantity=5),
            TokenLine(product_ref="TRN-RN", product_name="Tarana RN", quantity=2),
        ]
    ))
    print(f"Token creado: {t.token_name}")
    print(f"  ID:     {t.token_id}")
    print(f"  Estado: {t.state}")
    print(f"  Líneas: {len(t.lines)}")

    t = confirm_token(t.token_id)
    print(f"\nConfirmado → {t.state} ({t.confirmed_at})")

    t = ship_token(t.token_id)
    print(f"En tránsito → {t.state} ({t.shipped_at})")

    t = receive_token(t.token_id)
    print(f"Recibido   → {t.state} ({t.received_at})")

    stock = get_virtual_stock("MTY")
    print(f"\nStock virtual MTY (después de recibir):")
    for p in stock["products"]:
        print(f"  {p['product_ref']}: {p['quantity']} {p.get('uom','pza')}")

    print("\n✅  Demo completado")
    print(f"   DB: {DB_PATH}")
    print("   Para conectar Odoo: ver odoo_adapter.py")
