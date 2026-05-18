from __future__ import annotations
import os
import json
import hmac
import hashlib
import uuid
from datetime import datetime, timezone
from agents import token_service

_SECRET   = os.environ.get("TOKEN_SECRET", "xcien-secret-2026")
_DB_PATH  = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "transacciones.json")

EMPRESAS = ["xcien", "luminet", "wispi", "huus"]
AREAS    = ["noc", "campo", "admin", "finanzas", "comercial", "infraestructura", "academia", "almacen"]


def _firmar(payload: dict) -> str:
    contenido = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hmac.new(_SECRET.encode(), contenido.encode(), hashlib.sha256).hexdigest()

def _cargar() -> list:
    try:
        with open(_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _guardar(data: list):
    with open(_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def registrar(
    empresa_origen: str,
    empresa_destino: str,
    area_origen: str,
    area_destino: str,
    concepto: str,
    precio_mercado: float,
    precio_preferencial: float,
    responsable: str = "",
    referencia: str = "",
    notas: str = "",
) -> dict:
    if empresa_origen not in EMPRESAS:
        raise ValueError(f"Empresa origen inválida: {empresa_origen}")
    if empresa_destino not in EMPRESAS:
        raise ValueError(f"Empresa destino inválida: {empresa_destino}")

    descuento_pct = round((1 - precio_preferencial / precio_mercado) * 100, 1) if precio_mercado > 0 else 0
    ahorro        = round(precio_mercado - precio_preferencial, 2)

    payload = {
        "tx_id":               f"TX-{str(uuid.uuid4())[:8].upper()}",
        "tipo":                "transaccion_intragrupo",
        "empresa_origen":      empresa_origen.lower(),
        "empresa_destino":     empresa_destino.lower(),
        "area_origen":         area_origen.lower(),
        "area_destino":        area_destino.lower(),
        "concepto":            concepto,
        "precio_mercado":      precio_mercado,
        "precio_preferencial": precio_preferencial,
        "descuento_pct":       descuento_pct,
        "ahorro":              ahorro,
        "moneda":              "MXN",
        "responsable":         responsable,
        "referencia":          referencia,
        "notas":               notas,
        "fecha":               datetime.now(timezone.utc).isoformat(),
    }
    payload["firma"] = _firmar({k: v for k, v in payload.items() if k != "firma"})

    data = _cargar()
    data.append(payload)
    _guardar(data)

    # Emitir token de área automáticamente
    try:
        token_service.emitir_tx_area(
            tx_id=payload["tx_id"],
            area_origen=area_origen,
            area_destino=area_destino,
            empresa_origen=empresa_origen,
            empresa_destino=empresa_destino,
            concepto=concepto,
            valor_pesos=precio_preferencial,
        )
    except Exception as e:
        print(f"⚠️ Token área no emitido: {e}")

    print(f"✅ TX registrada: {payload['tx_id']} | {empresa_origen.upper()} → {empresa_destino.upper()} | ${precio_preferencial:,.0f}")
    return payload


def listar(empresa_origen: str = None, empresa_destino: str = None, area: str = None) -> list:
    data = _cargar()
    if empresa_origen:
        data = [t for t in data if t.get("empresa_origen") == empresa_origen.lower()]
    if empresa_destino:
        data = [t for t in data if t.get("empresa_destino") == empresa_destino.lower()]
    if area:
        data = [t for t in data if t.get("area_origen") == area.lower() or t.get("area_destino") == area.lower()]
    return data


def resumen() -> dict:
    data = _cargar()
    if not data:
        return {"total_tx": 0, "valor_total": 0, "ahorro_total": 0, "matriz": {}, "por_area": {}}

    valor_total  = sum(t.get("precio_preferencial", 0) for t in data)
    ahorro_total = sum(t.get("ahorro", 0) for t in data)

    # Matriz empresa × empresa
    matriz: dict = {}
    for e_o in EMPRESAS:
        for e_d in EMPRESAS:
            if e_o == e_d:
                continue
            txs = [t for t in data if t.get("empresa_origen") == e_o and t.get("empresa_destino") == e_d]
            if txs:
                clave = f"{e_o}→{e_d}"
                matriz[clave] = {
                    "count": len(txs),
                    "valor": round(sum(t.get("precio_preferencial", 0) for t in txs), 2),
                }

    # Por área
    por_area: dict = {}
    for area in AREAS:
        txs = [t for t in data if t.get("area_origen") == area or t.get("area_destino") == area]
        if txs:
            por_area[area] = {
                "count": len(txs),
                "como_origen":  len([t for t in txs if t.get("area_origen") == area]),
                "como_destino": len([t for t in txs if t.get("area_destino") == area]),
                "valor": round(sum(t.get("precio_preferencial", 0) for t in txs), 2),
            }

    return {
        "total_tx":    len(data),
        "valor_total": round(valor_total, 2),
        "ahorro_total": round(ahorro_total, 2),
        "matriz":      matriz,
        "por_area":    por_area,
        "recientes":   list(reversed(data))[:10],
    }
