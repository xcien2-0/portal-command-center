"""
odoo_adapter.py
===============
Adaptador Odoo para el sistema de tokens de inventario.

ESTADO: DESCONECTADO — todas las funciones están implementadas pero
no hacen llamadas reales hasta que se configuren las credenciales
y se llame a enable_odoo_sync().

Cuando se conecte:
  1. Llenar ODOO_LOCATION_MAP con los IDs reales de stock.location
  2. Llamar sync_token_to_odoo(token_id) para crear el stock.picking
  3. Odoo actualizará stock.quant automáticamente al validar el picking

Flujo de sincronización:
  InventoryToken → stock.picking (crear)
  TokenLine      → stock.move   (por producto)
  ship_token()   → action_assign() + validate()
  receive_token() → button_validate() → stock.quant se actualiza solo
"""

import sqlite3
import json
import xmlrpc.client
from datetime import datetime, timezone
from typing import Optional
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# ─── Config Odoo ────────────────────────────────────────────────────────────────

ODOO_URL      = os.getenv("ODOO_URL", "https://odoo.wispi.mx")
ODOO_DB       = os.getenv("ODOO_DB", "wispi17")
ODOO_USER     = os.getenv("ODOO_USER", "")
ODOO_PASSWORD = os.getenv("ODOO_PASSWORD", "")

# Flag global — False hasta que se active explícitamente
_ODOO_SYNC_ENABLED = False

def enable_odoo_sync():
    """Activa la sincronización real con Odoo. Llamar solo cuando esté listo."""
    global _ODOO_SYNC_ENABLED
    _ODOO_SYNC_ENABLED = True
    print("⚠️  Odoo sync ACTIVADO — los tokens se crearán en Odoo al sincronizar")


# ─── Mapa de ubicaciones ─────────────────────────────────────────────────────────
# Llenar con IDs reales de stock.location una vez conectado.
# Para obtener los IDs: buscar en Odoo → Inventario → Configuración → Ubicaciones
# o via XML-RPC: models.execute_kw('stock.location', 'search_read',
#                  [[['usage','=','internal']]], {'fields':['id','complete_name']})

ODOO_LOCATION_MAP = {
    "CDMX": {
        "location_id": None,       # stock.location.id (origen / Stock CDMX)
        "location_dest_id": None,  # (si tiene transit propio)
    },
    "QRO": {
        "location_id": None,
        "location_dest_id": None,
    },
    "GDL": {
        "location_id": None,
        "location_dest_id": None,
    },
    "MTY": {
        "location_id": None,
        "location_dest_id": None,
    },
    # Ubicación de tránsito virtual (entre almacenes)
    "TRANSIT": {
        "location_id": None,       # stock.location con usage='transit'
    }
}

# Tipo de operación para transferencias internas
# Odoo → Inventario → Configuración → Tipos de Operación → "Transferencia Interna"
ODOO_PICKING_TYPE_INTERNAL = None  # stock.picking.type.id


# ─── XML-RPC helpers ────────────────────────────────────────────────────────────

def _get_odoo_uid() -> int:
    common = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/common")
    uid = common.authenticate(ODOO_DB, ODOO_USER, ODOO_PASSWORD, {})
    if not uid:
        raise ConnectionError("No se pudo autenticar en Odoo")
    return uid


def _get_odoo_models():
    return xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/object")


def _resolve_product_id(models, uid: int, product_ref: str) -> Optional[int]:
    """Busca product.product.id por referencia interna (default_code)."""
    result = models.execute_kw(
        ODOO_DB, uid, ODOO_PASSWORD,
        'product.product', 'search_read',
        [[['default_code', '=', product_ref]]],
        {'fields': ['id', 'name', 'default_code'], 'limit': 1}
    )
    return result[0]['id'] if result else None


def _resolve_lot_id(models, uid: int, product_id: int, lot_serial: str) -> Optional[int]:
    """Busca stock.lot.id por nombre y producto."""
    result = models.execute_kw(
        ODOO_DB, uid, ODOO_PASSWORD,
        'stock.lot', 'search_read',
        [[['name', '=', lot_serial], ['product_id', '=', product_id]]],
        {'fields': ['id', 'name'], 'limit': 1}
    )
    return result[0]['id'] if result else None


# ─── Sincronización principal ────────────────────────────────────────────────────

def sync_token_to_odoo(token_id: str) -> dict:
    """
    Crea un stock.picking en Odoo a partir de un token confirmado.

    Flujo Odoo:
      1. Crear stock.picking (estado: draft)
      2. Crear stock.move por cada línea (vinculado al picking)
      3. action_confirm() → estado: confirmed
      4. action_assign() → estado: assigned (ready)

    Retorna: {'picking_id': int, 'picking_name': str, 'status': 'synced'|'error', ...}
    """
    if not _ODOO_SYNC_ENABLED:
        return {
            "status": "skipped",
            "reason": "Odoo sync desactivado. Llamar enable_odoo_sync() para activar.",
            "token_id": token_id,
        }

    from inventario_tokens import get_token, DB_PATH

    token = get_token(token_id)
    if not token:
        return {"status": "error", "reason": f"Token no encontrado: {token_id}"}

    if token.state not in ("confirmed", "in_transit"):
        return {"status": "error", "reason": f"Estado inválido para sincronizar: {token.state}"}

    if token.odoo_picking_id:
        return {"status": "already_synced", "picking_id": token.odoo_picking_id}

    origin_map = ODOO_LOCATION_MAP.get(token.origin_warehouse, {})
    dest_map = ODOO_LOCATION_MAP.get(token.dest_warehouse, {})

    if not origin_map.get("location_id") or not dest_map.get("location_id"):
        return {
            "status": "error",
            "reason": "Faltan location_ids en ODOO_LOCATION_MAP. Configurar primero.",
        }

    try:
        uid = _get_odoo_uid()
        models = _get_odoo_models()

        # 1. Crear stock.picking
        picking_id = models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'stock.picking', 'create',
            [{
                'picking_type_id': ODOO_PICKING_TYPE_INTERNAL,
                'location_id': origin_map["location_id"],
                'location_dest_id': dest_map["location_id"],
                'origin': token.token_name,
                'note': token.notes,
                'priority': '1' if token.priority == 'urgent' else '0',
            }]
        )

        # 2. Crear stock.move por cada línea
        for line in token.lines:
            product_id = line.odoo_product_id or _resolve_product_id(models, uid, line.product_ref)
            if not product_id:
                raise ValueError(f"Producto no encontrado en Odoo: {line.product_ref}")

            move_id = models.execute_kw(
                ODOO_DB, uid, ODOO_PASSWORD,
                'stock.move', 'create',
                [{
                    'name': line.product_name,
                    'picking_id': picking_id,
                    'product_id': product_id,
                    'product_uom_qty': line.quantity,
                    'product_uom': 1,   # unidad base — ajustar si se usan UoMs distintas
                    'location_id': origin_map["location_id"],
                    'location_dest_id': dest_map["location_id"],
                }]
            )

        # 3. Confirmar picking (draft → confirmed → assigned)
        models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD,
                          'stock.picking', 'action_confirm', [[picking_id]])
        models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD,
                          'stock.picking', 'action_assign', [[picking_id]])

        # 4. Obtener nombre del picking (WH/INT/XXXXX)
        picking_data = models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'stock.picking', 'read',
            [[picking_id]], {'fields': ['name', 'state']}
        )
        picking_name = picking_data[0]['name'] if picking_data else str(picking_id)

        # 5. Guardar referencia en el token local
        conn = sqlite3.connect(str(DB_PATH))
        conn.execute("""
            UPDATE inventory_tokens
            SET odoo_picking_id = ?, odoo_picking_name = ?, odoo_synced_at = ?
            WHERE token_id = ?
        """, (picking_id, picking_name, datetime.now(timezone.utc).isoformat(), token_id))
        conn.commit()
        conn.close()

        return {
            "status": "synced",
            "picking_id": picking_id,
            "picking_name": picking_name,
            "token_id": token_id,
        }

    except Exception as e:
        # Guardar error en el token
        conn = sqlite3.connect(str(DB_PATH))
        conn.execute(
            "UPDATE inventory_tokens SET odoo_sync_error = ? WHERE token_id = ?",
            (str(e), token_id)
        )
        conn.commit()
        conn.close()
        return {"status": "error", "reason": str(e), "token_id": token_id}


def validate_picking_in_odoo(token_id: str) -> dict:
    """
    Valida el picking en Odoo (button_validate).
    Esto actualiza stock.quant automáticamente.
    Solo llamar cuando el token esté en state='received'.

    Equivale a: Odoo → Inventario → Transferencia → Validar
    """
    if not _ODOO_SYNC_ENABLED:
        return {"status": "skipped", "reason": "Odoo sync desactivado"}

    from inventario_tokens import get_token
    token = get_token(token_id)
    if not token or not token.odoo_picking_id:
        return {"status": "error", "reason": "Token sin picking_id de Odoo. Sincronizar primero."}

    try:
        uid = _get_odoo_uid()
        models = _get_odoo_models()
        models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'stock.picking', 'button_validate',
            [[token.odoo_picking_id]]
        )
        return {
            "status": "validated",
            "picking_id": token.odoo_picking_id,
            "note": "stock.quant actualizado automáticamente por Odoo",
        }
    except Exception as e:
        return {"status": "error", "reason": str(e)}


def get_odoo_stock_quant(warehouse_code: str) -> list:
    """
    Consulta stock.quant directamente en Odoo para un almacén.
    Reemplaza a get_virtual_stock() cuando Odoo esté conectado.

    Retorna lista de {product_ref, product_name, quantity, value}
    """
    if not _ODOO_SYNC_ENABLED:
        return []

    location_id = ODOO_LOCATION_MAP.get(warehouse_code, {}).get("location_id")
    if not location_id:
        return []

    uid = _get_odoo_uid()
    models = _get_odoo_models()

    quants = models.execute_kw(
        ODOO_DB, uid, ODOO_PASSWORD,
        'stock.quant', 'search_read',
        [[
            ['location_id', 'child_of', location_id],
            ['location_id.usage', '=', 'internal'],
            ['quantity', '>', 0],
        ]],
        {'fields': ['product_id', 'quantity', 'reserved_quantity', 'lot_id']}
    )

    # Obtener precios (standard_price)
    product_ids = list({q['product_id'][0] for q in quants})
    prices = {}
    if product_ids:
        prods = models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'product.product', 'read',
            [product_ids],
            {'fields': ['id', 'default_code', 'name', 'standard_price']}
        )
        prices = {p['id']: p for p in prods}

    result = []
    for q in quants:
        pid = q['product_id'][0]
        prod = prices.get(pid, {})
        qty = q['quantity']
        price = prod.get('standard_price', 0)
        result.append({
            'product_ref': prod.get('default_code', ''),
            'product_name': q['product_id'][1],
            'quantity': qty,
            'reserved_quantity': q.get('reserved_quantity', 0),
            'standard_price': price,
            'value': qty * price,
            'lot': q['lot_id'][1] if q.get('lot_id') else None,
        })

    return sorted(result, key=lambda x: x['value'], reverse=True)


if __name__ == "__main__":
    print("=== Odoo Adapter — Estado ===")
    print(f"  URL:          {ODOO_URL}")
    print(f"  DB:           {ODOO_DB}")
    print(f"  Sync activo:  {_ODOO_SYNC_ENABLED}")
    print()
    print("  Mapa de ubicaciones:")
    for wh, cfg in ODOO_LOCATION_MAP.items():
        status = "✅" if cfg.get("location_id") else "⏳ pendiente"
        print(f"    {wh}: location_id={cfg.get('location_id')} {status}")
    print()
    print("Para conectar Odoo:")
    print("  1. Llenar ODOO_LOCATION_MAP con IDs reales de stock.location")
    print("  2. Llamar enable_odoo_sync()")
    print("  3. sync_token_to_odoo(token_id)")
