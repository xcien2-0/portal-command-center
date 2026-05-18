from __future__ import annotations
import os
import json
import hmac
import hashlib
import uuid
from datetime import datetime, timezone

_SECRET = os.environ.get("TOKEN_SECRET")
if not _SECRET:
    raise RuntimeError("TOKEN_SECRET env var is required and must not be empty")
_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "tokens.json")

EMPRESAS_VALIDAS = {"xcien", "luminet", "wispi", "huus"}
_TX_TOKENS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "tokens_area.json")
TOKEN_POR_PESO = 1.0  # 1 token = $1 MXN


def _firmar(payload: dict) -> str:
    contenido = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hmac.new(_SECRET.encode(), contenido.encode(), hashlib.sha256).hexdigest()


def _cargar() -> list:
    try:
        with open(_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _guardar(tokens: list):
    with open(_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(tokens, f, indent=2, ensure_ascii=False)


def emitir(empresa: str, oportunidad_id: str, cliente: str, vendedor: str, monto: float = 0.0, extra: dict = None) -> dict:
    empresa = empresa.lower().strip()
    if empresa not in EMPRESAS_VALIDAS:
        raise ValueError(f"Empresa inválida: '{empresa}'. Debe ser una de: {EMPRESAS_VALIDAS}")

    payload = {
        "token_id": str(uuid.uuid4()),
        "tipo": "oportunidad_ganada",
        "empresa": empresa,
        "oportunidad_id": str(oportunidad_id),
        "cliente": cliente,
        "vendedor": vendedor,
        "monto": monto,
        "extra": extra or {},
        "emitido_en": datetime.now(timezone.utc).isoformat(),
    }
    payload["firma"] = _firmar({k: v for k, v in payload.items() if k != "firma"})

    tokens = _cargar()
    tokens.append(payload)
    _guardar(tokens)

    print(f"✅ Token emitido: {payload['token_id']} | {empresa.upper()} | {cliente}")
    return payload


def emitir_operativo(tipo: str, nombre: str, detalle: str, empresa: str = "xcien", extra: dict = None) -> dict:
    """Emite tokens para procesos de RH: alta, baja, movimiento, promocion, cambio_area"""
    tipos_validos = {"alta", "baja", "movimiento", "promocion", "cambio_area"}
    if tipo not in tipos_validos:
        raise ValueError(f"Tipo operativo inválido. Debe ser uno de: {tipos_validos}")

    payload = {
        "token_id": str(uuid.uuid4()),
        "tipo": tipo,
        "empresa": empresa.lower(),
        "nombre": nombre,
        "detalle": detalle,
        "extra": extra or {},
        "emitido_en": datetime.now(timezone.utc).isoformat(),
    }
    payload["firma"] = _firmar({k: v for k, v in payload.items() if k != "firma"})

    tokens = _cargar()
    tokens.append(payload)
    _guardar(tokens)
    return payload


def verificar(token_id: str) -> dict:
    tokens = _cargar()
    token = next((t for t in tokens if t["token_id"] == token_id), None)
    if not token:
        return {"valido": False, "motivo": "Token no encontrado"}

    firma_guardada = token.get("firma", "")
    firma_calculada = _firmar({k: v for k, v in token.items() if k != "firma"})

    if not hmac.compare_digest(firma_guardada, firma_calculada):
        return {"valido": False, "motivo": "Firma inválida — token comprometido"}

    return {"valido": True, "token": token}


def listar(empresa: str = None) -> list:
    tokens = _cargar()
    if empresa:
        tokens = [t for t in tokens if t.get("empresa") == empresa.lower()]
    return tokens


# ── Tokens por área (transacciones intragrupo) ────────────────────────────────

def _cargar_tx_tokens() -> list:
    try:
        with open(_TX_TOKENS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _guardar_tx_tokens(data: list):
    os.makedirs(os.path.dirname(_TX_TOKENS_PATH), exist_ok=True)
    with open(_TX_TOKENS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def emitir_tx_area(
    tx_id: str,
    area_origen: str,
    area_destino: str,
    empresa_origen: str,
    empresa_destino: str,
    concepto: str,
    valor_pesos: float,
) -> dict:
    """Emite tokens al registrar una transacción intragrupo.
    El área origen GANA tokens (prestó servicio).
    El área destino GASTA tokens (recibió servicio).
    """
    cantidad = max(1, round(valor_pesos * TOKEN_POR_PESO))

    payload = {
        "token_id":        str(uuid.uuid4()),
        "tipo":            "tx_area",
        "tx_id":           tx_id,
        "area_origen":     area_origen.lower(),
        "area_destino":    area_destino.lower(),
        "empresa_origen":  empresa_origen.lower(),
        "empresa_destino": empresa_destino.lower(),
        "concepto":        concepto,
        "valor_pesos":     valor_pesos,
        "tokens":          cantidad,
        "emitido_en":      datetime.now(timezone.utc).isoformat(),
    }
    payload["firma"] = _firmar({k: v for k, v in payload.items() if k != "firma"})

    data = _cargar_tx_tokens()
    data.append(payload)
    _guardar_tx_tokens(data)
    return payload

def saldos_areas() -> dict:
    """Calcula saldo neto de tokens por área.
    Positivo = área proveedora neta. Negativo = área consumidora neta.
    """
    data = _cargar_tx_tokens()
    saldos: dict[str, dict] = {}

    for t in data:
        ao = t.get("area_origen", "")
        ad = t.get("area_destino", "")
        tk = t.get("tokens", 0)
        v  = t.get("valor_pesos", 0)

        for area in [ao, ad]:
            if area not in saldos:
                saldos[area] = {"area": area, "ganados": 0, "gastados": 0, "saldo": 0, "valor_generado": 0, "valor_consumido": 0, "txs": 0}

        saldos[ao]["ganados"]        += tk
        saldos[ao]["saldo"]          += tk
        saldos[ao]["valor_generado"] += v
        saldos[ao]["txs"]            += 1

        saldos[ad]["gastados"]        += tk
        saldos[ad]["saldo"]           -= tk
        saldos[ad]["valor_consumido"] += v

    return {
        "areas":   sorted(saldos.values(), key=lambda x: x["saldo"], reverse=True),
        "total_tokens_emitidos": sum(t.get("tokens", 0) for t in data),
        "total_txs": len(data),
        "historial": list(reversed(data))[:20],
    }

def verificar_tx_token(token_id: str) -> dict:
    data = _cargar_tx_tokens()
    token = next((t for t in data if t["token_id"] == token_id), None)
    if not token:
        return {"valido": False, "motivo": "Token no encontrado"}
    firma_guardada   = token.get("firma", "")
    firma_calculada  = _firmar({k: v for k, v in token.items() if k != "firma"})
    if not hmac.compare_digest(firma_guardada, firma_calculada):
        return {"valido": False, "motivo": "Firma inválida — token comprometido"}
    return {"valido": True, "token": token}
