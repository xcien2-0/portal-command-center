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
