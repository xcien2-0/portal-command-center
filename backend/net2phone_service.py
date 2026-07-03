"""
Net2Phone Service — integración VoIP para el Command Center XCIEN.

Credenciales requeridas en .env:
  NET2PHONE_CLIENT_ID      — App Client ID del developer portal
  NET2PHONE_CLIENT_SECRET  — App Client Secret
  NET2PHONE_ACCOUNT_ID     — ID de cuenta/dominio Net2Phone
  NET2PHONE_BASE_URL       — Base URL de la API (default: https://api.net2phone.com/v2)

Endpoints expuestos:
  GET /api/net2phone/status       — estado de conexión + config
  GET /api/net2phone/agents       — extensiones/agentes y su estado
  GET /api/net2phone/active-calls — llamadas activas en este momento
  GET /api/net2phone/cdr          — historial de llamadas (CDR)
  GET /api/net2phone/summary      — KPIs del día
  POST /api/net2phone/webhook     — recibe eventos en tiempo real de Net2Phone
"""

import os, time, logging
from datetime import datetime, timedelta
from typing import Optional, Union
from fastapi import APIRouter, Query, Request, HTTPException
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)

logger = logging.getLogger("net2phone")
router = APIRouter(prefix="/api/net2phone", tags=["net2phone"])

# ── Config ─────────────────────────────────────────────────────────────────────
CLIENT_ID     = os.getenv("NET2PHONE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("NET2PHONE_CLIENT_SECRET", "")
ACCOUNT_ID    = os.getenv("NET2PHONE_ACCOUNT_ID", "")
BASE_URL      = os.getenv("NET2PHONE_BASE_URL", "https://api.net2phone.com/v2").rstrip("/")

_token_cache: dict = {"token": None, "expires_at": 0}


def _configured() -> bool:
    return bool(CLIENT_ID and CLIENT_SECRET and ACCOUNT_ID)


def _get_token() -> Optional[str]:
    """OAuth2 client_credentials — cachea token 55 min (expira en 60)."""
    if not _configured():
        return None

    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"]:
        return _token_cache["token"]

    try:
        import httpx
        r = httpx.post(
            f"{BASE_URL}/oauth/token",
            data={
                "grant_type":    "client_credentials",
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        _token_cache["token"]      = data["access_token"]
        _token_cache["expires_at"] = now + data.get("expires_in", 3600) - 60
        return _token_cache["token"]
    except Exception as e:
        logger.error(f"Net2Phone token error: {e}")
        return None


def _api(path: str, params: dict = {}) -> Union[dict, list]:
    """Hace un GET autenticado a la API de Net2Phone."""
    token = _get_token()
    if not token:
        raise HTTPException(503, "Net2Phone no configurado o sin token")
    import httpx
    r = httpx.get(
        f"{BASE_URL}/{path.lstrip('/')}",
        headers={"Authorization": f"Bearer {token}"},
        params=params,
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/status")
def get_status():
    """Estado de conexión — funciona aunque no haya credenciales."""
    configured = _configured()
    connected  = False
    account_info = {}

    if configured:
        try:
            token = _get_token()
            connected = token is not None
            if connected:
                try:
                    info = _api(f"accounts/{ACCOUNT_ID}")
                    account_info = {
                        "name":   info.get("name", ""),
                        "domain": info.get("domain", ""),
                        "plan":   info.get("plan", ""),
                    }
                except Exception:
                    pass
        except Exception:
            pass

    return {
        "configured": configured,
        "connected":  connected,
        "base_url":   BASE_URL,
        "account_id": ACCOUNT_ID if configured else "",
        "account":    account_info,
        "missing_vars": [v for v in
            ["NET2PHONE_CLIENT_ID","NET2PHONE_CLIENT_SECRET","NET2PHONE_ACCOUNT_ID"]
            if not os.getenv(v)],
    }


@router.get("/agents")
def get_agents():
    """Lista de extensiones/usuarios y su estado de presencia."""
    try:
        data = _api(f"accounts/{ACCOUNT_ID}/users")
        users = data if isinstance(data, list) else data.get("users", data.get("data", []))
        result = []
        for u in users:
            result.append({
                "id":         u.get("id") or u.get("userId"),
                "name":       u.get("name") or u.get("displayName", ""),
                "extension":  u.get("extension") or u.get("ext", ""),
                "email":      u.get("email", ""),
                "status":     u.get("presenceStatus") or u.get("status", "unknown"),
                "department": u.get("department", ""),
                "on_call":    u.get("onCall", False),
            })
        result.sort(key=lambda x: x["name"])
        return {"total": len(result), "agents": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Error consultando agentes: {e}")


@router.get("/active-calls")
def get_active_calls():
    """Llamadas activas en tiempo real."""
    try:
        data = _api(f"accounts/{ACCOUNT_ID}/activecalls")
        calls = data if isinstance(data, list) else data.get("calls", data.get("data", []))
        result = []
        for c in calls:
            result.append({
                "id":        c.get("id") or c.get("callId"),
                "caller":    c.get("callerName") or c.get("from", ""),
                "caller_num":c.get("callerNumber") or c.get("fromNumber", ""),
                "callee":    c.get("calleeName") or c.get("to", ""),
                "callee_num":c.get("calleeNumber") or c.get("toNumber", ""),
                "duration_s":c.get("duration") or c.get("durationSeconds", 0),
                "direction": c.get("direction", "inbound"),
                "status":    c.get("status", "active"),
                "started":   c.get("startTime") or c.get("startedAt", ""),
            })
        return {"total": len(result), "calls": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Error consultando llamadas activas: {e}")


@router.get("/cdr")
def get_cdr(
    days:      int = Query(7,  ge=1, le=90),
    limit:     int = Query(100, ge=1, le=500),
    offset:    int = Query(0,  ge=0),
    direction: Optional[str] = None,   # inbound | outbound
    agent_id:  Optional[str] = None,
):
    """Call Detail Records — historial de llamadas."""
    try:
        date_from = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        params = {"dateFrom": date_from, "limit": limit, "offset": offset}
        if direction: params["direction"] = direction
        if agent_id:  params["userId"]    = agent_id

        data = _api(f"accounts/{ACCOUNT_ID}/cdrs", params)
        records = data if isinstance(data, list) else data.get("cdrs", data.get("data", []))
        total   = data.get("total", len(records)) if isinstance(data, dict) else len(records)

        result = []
        for r in records:
            dur = r.get("duration") or r.get("durationSeconds", 0)
            result.append({
                "id":         r.get("id") or r.get("callId"),
                "fecha":      (r.get("startTime") or r.get("startedAt", ""))[:16].replace("T"," "),
                "caller":     r.get("callerName") or r.get("fromName", ""),
                "caller_num": r.get("callerNumber") or r.get("from", ""),
                "callee":     r.get("calleeName") or r.get("toName", ""),
                "callee_num": r.get("calleeNumber") or r.get("to", ""),
                "duracion_s": int(dur) if dur else 0,
                "duracion":   f"{int(dur)//60}m {int(dur)%60}s" if dur else "—",
                "direction":  r.get("direction", ""),
                "resultado":  r.get("disposition") or r.get("status", ""),
                "agente":     r.get("agentName") or r.get("userName", ""),
                "extension":  r.get("extension") or r.get("ext", ""),
            })

        # KPIs rápidos
        total_dur   = sum(r["duracion_s"] for r in result)
        contestadas = sum(1 for r in result if r["resultado"] in ("answered","ANSWERED","completed"))
        perdidas    = sum(1 for r in result if r["resultado"] in ("no-answer","NO ANSWER","missed","busy","BUSY"))

        return {
            "total":        total,
            "dias":         days,
            "records":      result,
            "kpis": {
                "contestadas":    contestadas,
                "perdidas":       perdidas,
                "duracion_total": total_dur,
                "duracion_prom":  round(total_dur / contestadas) if contestadas else 0,
                "tasa_atencion":  round(contestadas / len(result) * 100) if result else 0,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Error consultando CDR: {e}")


@router.get("/summary")
def get_summary():
    """KPIs del día actual."""
    try:
        hoy = datetime.utcnow().strftime("%Y-%m-%d")
        params = {"dateFrom": hoy, "limit": 500}
        data    = _api(f"accounts/{ACCOUNT_ID}/cdrs", params)
        records = data if isinstance(data, list) else data.get("cdrs", data.get("data", []))

        contestadas = sum(1 for r in records
            if (r.get("disposition") or r.get("status","")) in
               ("answered","ANSWERED","completed"))
        perdidas    = sum(1 for r in records
            if (r.get("disposition") or r.get("status","")) in
               ("no-answer","NO ANSWER","missed","busy","BUSY"))
        entrantes   = sum(1 for r in records if r.get("direction") in ("inbound","INBOUND"))
        salientes   = sum(1 for r in records if r.get("direction") in ("outbound","OUTBOUND"))
        durs        = [r.get("duration") or r.get("durationSeconds",0) for r in records
                       if (r.get("disposition") or r.get("status","")) in
                          ("answered","ANSWERED","completed")]
        dur_prom    = round(sum(durs)/len(durs)) if durs else 0

        active = get_active_calls()

        return {
            "fecha":           hoy,
            "total_hoy":       len(records),
            "contestadas":     contestadas,
            "perdidas":        perdidas,
            "entrantes":       entrantes,
            "salientes":       salientes,
            "duracion_prom_s": dur_prom,
            "tasa_atencion":   round(contestadas/len(records)*100) if records else 0,
            "en_llamada_ahora":active["total"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Error calculando summary: {e}")


@router.post("/webhook")
async def receive_webhook(request: Request):
    """
    Recibe eventos en tiempo real de Net2Phone.
    Configurar en developer.net2phone.com → My Apps → Webhooks
    URL: https://<tu-servidor>/api/net2phone/webhook

    Eventos soportados: call.ringing | call.answered | call.completed
    """
    try:
        payload = await request.json()
        event   = payload.get("event") or payload.get("type", "unknown")
        logger.info(f"Net2Phone webhook: {event} — {payload}")

        # Aquí puedes:
        # - Guardar en DB para analytics
        # - Emitir SSE al frontend
        # - Actualizar estado de agente en tiempo real
        # - Disparar alerta si hay llamadas perdidas en fila

        return {"ok": True, "event": event}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(400, str(e))
