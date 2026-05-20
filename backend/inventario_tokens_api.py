"""
inventario_tokens_api.py
========================
API REST para el sistema de tokens de inventario.
Corre en puerto 8003 (independiente del servidor principal en 8002).

Endpoints:
  POST   /tokens/                         Crear nuevo token
  GET    /tokens/                         Listar tokens
  GET    /tokens/{token_id}               Obtener token
  PATCH  /tokens/{token_id}/confirm       Confirmar (draft → confirmed)
  PATCH  /tokens/{token_id}/ship          Enviar (confirmed → in_transit)
  PATCH  /tokens/{token_id}/receive       Recibir (in_transit → received)
  PATCH  /tokens/{token_id}/cancel        Cancelar
  GET    /stock/{warehouse}               Stock virtual del almacén
  GET    /warehouses/                     Lista de almacenes
  POST   /tokens/{token_id}/sync-odoo     Sincronizar a Odoo (cuando esté listo)

Correr:
  uvicorn inventario_tokens_api:app --port 8003 --reload
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import inventario_tokens as tk
from inventario_tokens import (
    InventoryTokenCreate, InventoryToken,
    WAREHOUSES, STATES,
    create_token, get_token, list_tokens,
    confirm_token, ship_token, receive_token, cancel_token,
    get_virtual_stock,
)

app = FastAPI(
    title="Inventario Tokens API",
    description="Tokenización de transferencias de inventario entre almacenes XCIEN",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Tokens ─────────────────────────────────────────────────────────────────────

@app.post("/tokens/", response_model=InventoryToken, status_code=201)
def api_create_token(data: InventoryTokenCreate):
    """
    Crea un nuevo token de transferencia de inventario.
    El token inicia en estado 'draft'.
    """
    try:
        return create_token(data)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.get("/tokens/", response_model=List[InventoryToken])
def api_list_tokens(
    state: Optional[str] = Query(None, description="Filtrar por estado"),
    warehouse: Optional[str] = Query(None, description="Filtrar por almacén (origen o destino)"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
):
    if state and state not in STATES:
        raise HTTPException(400, f"Estado inválido. Opciones: {STATES}")
    if warehouse and warehouse not in WAREHOUSES:
        raise HTTPException(400, f"Almacén inválido. Opciones: {list(WAREHOUSES)}")
    return list_tokens(state=state, warehouse=warehouse, limit=limit, offset=offset)


@app.get("/tokens/{token_id}", response_model=InventoryToken)
def api_get_token(token_id: str):
    token = get_token(token_id)
    if not token:
        raise HTTPException(404, f"Token no encontrado: {token_id}")
    return token


@app.patch("/tokens/{token_id}/confirm", response_model=InventoryToken)
def api_confirm(token_id: str):
    """Confirma la transferencia (draft → confirmed)."""
    try:
        return confirm_token(token_id)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.patch("/tokens/{token_id}/ship", response_model=InventoryToken)
def api_ship(token_id: str):
    """Marca como en tránsito (confirmed → in_transit)."""
    try:
        return ship_token(token_id)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.patch("/tokens/{token_id}/receive", response_model=InventoryToken)
def api_receive(token_id: str):
    """Marca como recibido (in_transit → received). Actualiza stock virtual."""
    try:
        return receive_token(token_id)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.patch("/tokens/{token_id}/cancel", response_model=InventoryToken)
def api_cancel(token_id: str):
    """Cancela el token."""
    try:
        return cancel_token(token_id)
    except ValueError as e:
        raise HTTPException(400, str(e))


# ─── Stock ──────────────────────────────────────────────────────────────────────

@app.get("/stock/{warehouse}")
def api_stock(warehouse: str):
    """
    Stock virtual del almacén calculado desde tokens.
    Cuando Odoo esté conectado, este endpoint consultará stock.quant directamente.
    """
    if warehouse not in WAREHOUSES:
        raise HTTPException(400, f"Almacén inválido. Opciones: {list(WAREHOUSES)}")
    return get_virtual_stock(warehouse)


@app.get("/stock/")
def api_all_stock():
    """Stock virtual de todos los almacenes."""
    return {wh: get_virtual_stock(wh) for wh in WAREHOUSES}


# ─── Warehouses ─────────────────────────────────────────────────────────────────

@app.get("/warehouses/")
def api_warehouses():
    """Lista de almacenes configurados con su estado de conexión Odoo."""
    result = []
    for code, cfg in WAREHOUSES.items():
        result.append({
            "code": code,
            "name": cfg["name"],
            "city": cfg["city"],
            "odoo_location_code": cfg["odoo_location_code"],
            "odoo_connected": cfg["odoo_location_id"] is not None,
        })
    return result


# ─── Odoo sync ──────────────────────────────────────────────────────────────────

@app.post("/tokens/{token_id}/sync-odoo")
def api_sync_odoo(token_id: str):
    """
    Sincroniza el token a Odoo creando un stock.picking.
    Requiere que odoo_adapter.enable_odoo_sync() esté activado.
    """
    from odoo_adapter import sync_token_to_odoo
    result = sync_token_to_odoo(token_id)
    if result.get("status") == "error":
        raise HTTPException(500, result.get("reason", "Error desconocido"))
    return result


# ─── Health ─────────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {
        "service": "inventario-tokens",
        "version": "1.0.0",
        "warehouses": list(WAREHOUSES.keys()),
        "states": STATES,
        "odoo_ready": False,  # cambiar a True cuando se conecte
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("inventario_tokens_api:app", host="0.0.0.0", port=8003, reload=True)
