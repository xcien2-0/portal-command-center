"""
Armonizador de Radiobases — Fase 1
Fuentes: Odoo (ubicación + clientes) · NOCBoard/Observium (estado red)
         Helpdesk CAST (soporte) · WFM CAST (campo)
"""
from __future__ import annotations
import asyncio, logging, re, time, unicodedata, urllib.request, urllib.error, xmlrpc.client
from datetime import date
from typing import Any

logger = logging.getLogger("radiobase_harmonizer")

# ── Caché ─────────────────────────────────────────────────────────────────────
_cache: dict = {"data": None, "ts": 0.0}
_cache_lock = asyncio.Lock()
CACHE_TTL = 60  # segundos

# ── Etapas abiertas helpdesk (0-3 = no resuelto) ────────────────────────────
CAST_TEAM_IDS      = [6, 39, 60, 41, 44, 48, 67]
CAST_PROJECT_IDS   = [6, 39, 41, 44, 48, 60, 67]
RESOLVED_STAGES    = {54, 100, 101, 120, 121, 69, 35, 51, 155, 164, 168}
PRIORITY_MAP       = {"0": "normal", "1": "alta", "2": "urgente", "3": "crítica"}
OP_STAGE_NAMES     = ["NOC", "Dispatch", "Almacén", "Operaciones", "NOC Cierra"]
STAGE_TO_OP        = {
    97:0, 24:0, 129:0, 119:0, 27:0,
    25:1, 116:1, 60:1, 68:1,
    57:3, 130:3, 132:3,
    155:4, 164:4, 168:4, 54:4, 101:4, 100:4, 121:4, 120:4, 69:4, 35:4, 51:4,
}


# ── Normalización de nombres ──────────────────────────────────────────────────
def _norm(name: str) -> str:
    """Elimina prefijos, acentos, caracteres especiales → lowercase para matching."""
    if not name:
        return ""
    s = unicodedata.normalize("NFD", name)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower()
    s = re.sub(r"^\[.*?\]\s*", "", s)          # [SOP-XXXXX]
    s = re.sub(r"\b(rb|rep|radiobase|rbs|rad)\b", "", s)
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _name_tokens(name: str) -> list[str]:
    return [t for t in _norm(name).split() if len(t) >= 3]


def _matches(rb_name: str, text: str) -> bool:
    """True si algún token significativo del nombre del radiobase aparece en el texto."""
    tokens = _name_tokens(rb_name)
    if not tokens:
        return False
    norm_text = _norm(text)
    return any(tok in norm_text for tok in tokens)


# ── Status armonizado ─────────────────────────────────────────────────────────
def _harmonize_status(rb: dict, noc_map: dict) -> tuple[str, dict]:
    """
    Calcula status = 'up' | 'degraded' | 'down' | 'unknown'
    y devuelve sources dict con datos de cada fuente.
    """
    norm = _norm(rb["nombre"])

    # Buscar host en NOCBoard por nombre
    noc_hit = None
    for hostname, host in noc_map.items():
        if _matches(rb["nombre"], hostname):
            noc_hit = host
            break

    noc_src = None
    if noc_hit:
        noc_src = {
            "score":   noc_hit.get("avail", 0),
            "online":  noc_hit.get("status") == "up",
            "alerts":  noc_hit.get("alerts", 0),
            "hostname": noc_hit.get("hostname", ""),
        }

    odoo_src = {
        "estado":     rb.get("estado", ""),
        "clientes":   rb.get("clientes", 0),
        "en_infra":   rb.get("en_infra", False),
        "infra_estatus": rb.get("infra_estatus"),
    }

    # Calcular status
    if noc_src:
        if not noc_src["online"]:
            status = "down"
        elif noc_src["score"] < 65 or noc_src["alerts"] > 0:
            status = "degraded"
        else:
            status = "up"
    elif rb.get("estado", "").lower() in ("active", "activo", "running", "open"):
        status = "unknown"   # Odoo dice activo pero no hay monitoreo
    else:
        status = "unknown"

    return status, {"odoo": odoo_src, "nocboard": noc_src, "uisp": None, "cambium": None, "mimosa": None}


# ── Fetch paralelo ────────────────────────────────────────────────────────────
async def _fetch_all(cfg: dict) -> tuple[list, list, list, dict]:
    """Lanza todas las queries en paralelo y devuelve (radiobases, tickets, tareas, hosts)."""
    loop = asyncio.get_running_loop()
    rbs_f      = loop.run_in_executor(None, _fetch_radiobases, cfg)
    tickets_f  = loop.run_in_executor(None, _fetch_tickets, cfg)
    tareas_f   = loop.run_in_executor(None, _fetch_tareas_campo, cfg)
    hosts_f    = loop.run_in_executor(None, _fetch_noc_hosts, cfg)
    rbs, tickets, tareas, hosts = await asyncio.gather(
        rbs_f, tickets_f, tareas_f, hosts_f, return_exceptions=True
    )
    return (
        rbs      if isinstance(rbs,      list) else [],
        tickets  if isinstance(tickets,  list) else [],
        tareas   if isinstance(tareas,   list) else [],
        hosts    if isinstance(hosts,    dict) else {},
    )


def _odoo_conn(cfg: dict):
    url  = cfg.get("odoo_url",  "https://odoo.wispi.mx")
    db   = cfg.get("odoo_db",   "wispi19")
    user = cfg.get("odoo_user", "")
    pwd  = cfg.get("odoo_pass", "")
    common = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/common", allow_none=True)
    uid = common.authenticate(db, user, pwd, {})
    models = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/object", allow_none=True)
    return db, uid, pwd, models


def _fetch_radiobases(cfg: dict) -> list[dict]:
    try:
        import re as _re, json as _json
        db, uid, pwd, models = _odoo_conn(cfg)

        groups = models.execute_kw(db, uid, pwd,
            "running.services", "read_group",
            [[["radio_base_id", "!=", False]]],
            {"fields": ["radio_base_id"], "groupby": ["radio_base_id"], "limit": 500})

        rb_ids   = [g["radio_base_id"][0] for g in groups]
        rb_names = {g["radio_base_id"][0]: g["radio_base_id"][1] for g in groups}
        rb_count = {g["radio_base_id"][0]: g["radio_base_id_count"] for g in groups}

        rbs = models.execute_kw(db, uid, pwd, "running.services", "read",
            [rb_ids],
            {"fields": ["id","name","partner_shipping_latitude",
                        "partner_shipping_longitude","state","partner_id"]})

        result = []
        for r in rbs:
            lat = r.get("partner_shipping_latitude")  or 0
            lng = r.get("partner_shipping_longitude") or 0
            if not lat or not lng:
                continue
            if not (14.5 < lat < 32.8 and -118.5 < lng < -86.5):
                continue
            label = rb_names.get(r["id"], r.get("name") or "")
            display = _re.sub(r"^\[.*?\]\s*", "", label).strip() or label
            result.append({
                "id":       r["id"],
                "nombre":   display,
                "sop":      r.get("name") or "",
                "lat":      lat,
                "lng":      lng,
                "estado":   r.get("state", ""),
                "clientes": rb_count.get(r["id"], 0),
                "partner":  r["partner_id"][1] if r.get("partner_id") else "",
                "en_infra": False,
                "infra_estatus": None,
            })
        result.sort(key=lambda x: x["clientes"], reverse=True)
        return result
    except Exception as e:
        logger.warning(f"_fetch_radiobases: {e}")
        return []


def _fetch_tickets(cfg: dict) -> list[dict]:
    """Tickets helpdesk CAST abiertos (sin fecha de cierre, etapa no resuelta)."""
    try:
        db, uid, pwd, models = _odoo_conn(cfg)
        domain = [
            ["team_id", "in", CAST_TEAM_IDS],
            ["close_date", "=", False],
        ]
        fields = ["id", "name", "stage_id", "priority", "partner_id",
                  "user_id", "create_date", "ticket_type_id", "description"]
        raw = models.execute_kw(db, uid, pwd, "helpdesk.ticket", "search_read",
                                [domain], {"fields": fields, "limit": 300, "order": "id desc"})
        tickets = []
        for r in raw:
            stage_id = r["stage_id"][0] if r["stage_id"] else 0
            if stage_id in RESOLVED_STAGES:
                continue
            op_idx = STAGE_TO_OP.get(stage_id, 0)
            tickets.append({
                "id":       r["id"],
                "nombre":   r["name"],
                "cliente":  r["partner_id"][1] if r.get("partner_id") else "",
                "tecnico":  r["user_id"][1]    if r.get("user_id")    else None,
                "prioridad": PRIORITY_MAP.get(str(r.get("priority","0")), "normal"),
                "etapa":    OP_STAGE_NAMES[op_idx],
                "etapa_idx": op_idx,
                "fecha":    (r.get("create_date") or "")[:10],
                "tipo":     r["ticket_type_id"][1] if r.get("ticket_type_id") else "",
                "descripcion": (r.get("description") or "")[:200],
            })
        return tickets
    except Exception as e:
        logger.warning(f"_fetch_tickets: {e}")
        return []


def _fetch_tareas_campo(cfg: dict) -> list[dict]:
    """Tareas CAST de campo activas (project.task, no cerradas)."""
    try:
        db, uid, pwd, models = _odoo_conn(cfg)
        year_start = date(date.today().year, 1, 1).isoformat()
        domain = [
            ["project_id", "in", CAST_PROJECT_IDS],
            ["date_deadline", ">=", year_start],
            ["stage_id.name", "not in", ["Resuelto", "Cancelado", "Done", "Solved"]],
        ]
        fields = ["id", "name", "stage_id", "user_ids", "partner_id",
                  "date_deadline", "priority", "description"]
        raw = models.execute_kw(db, uid, pwd, "project.task", "search_read",
                                [domain], {"fields": fields, "limit": 200, "order": "id desc"})
        tareas = []
        for r in raw:
            tareas.append({
                "id":      r["id"],
                "nombre":  r["name"],
                "etapa":   r["stage_id"][1] if r.get("stage_id") else "",
                "tecnicos": [u[1] for u in (r.get("user_ids") or []) if isinstance(u, (list, tuple))],
                "cliente":  r["partner_id"][1] if r.get("partner_id") else "",
                "fecha":    (r.get("date_deadline") or "")[:10],
                "prioridad": PRIORITY_MAP.get(str(r.get("priority","0")), "normal"),
            })
        return tareas
    except Exception as e:
        logger.warning(f"_fetch_tareas_campo: {e}")
        return []


def _fetch_noc_hosts(cfg: dict) -> dict[str, Any]:
    """Hosts del proxy NOCBoard (hostname → status dict). Falla silenciosamente."""
    import json as _json
    try:
        proxy = cfg.get("nocboard_proxy", "http://localhost:9400")
        key   = cfg.get("nocboard_key",   "87a08190b801416392e944ab79c7e3c9")
        req   = urllib.request.Request(f"{proxy}/api/hosts",
                                       headers={"X-API-Key": key})
        with urllib.request.urlopen(req, timeout=5) as resp:
            hosts = _json.loads(resp.read())
            return {h.get("hostname","").lower(): h for h in hosts if h.get("hostname")}
    except Exception as e:
        logger.warning(f"_fetch_noc_hosts: {e}")
        return {}


# ── Armonizar ─────────────────────────────────────────────────────────────────
async def harmonize(cfg: dict) -> list[dict]:
    global _cache

    # Fast path: caché válido sin lock
    if _cache["data"] and time.time() - _cache["ts"] < CACHE_TTL:
        return _cache["data"]

    async with _cache_lock:
        # Recheck dentro del lock para evitar stampede
        if _cache["data"] and time.time() - _cache["ts"] < CACHE_TTL:
            return _cache["data"]

        rbs, tickets, tareas, noc_map = await _fetch_all(cfg)

        # Pre-normalizar textos de tickets y tareas para evitar O(R×T) de _norm()
        norm_tickets = [(t, _norm(t["nombre"]), _norm(t.get("descripcion", ""))) for t in tickets]
        norm_tareas  = [(t, _norm(t["nombre"])) for t in tareas]

        result = []
        for rb in rbs:
            status, sources = _harmonize_status(rb, noc_map)
            tokens = _name_tokens(rb["nombre"])
            if not tokens:
                rb_tickets, rb_tareas = [], []
            else:
                rb_tickets = [
                    t for t, nt, nd in norm_tickets
                    if any(tok in nt or tok in nd for tok in tokens)
                ]
                rb_tareas = [
                    t for t, nt in norm_tareas
                    if any(tok in nt for tok in tokens)
                ]

            result.append({
                "id":           rb["id"],
                "nombre":       rb["nombre"],
                "lat":          rb["lat"],
                "lng":          rb["lng"],
                "clientes":     rb["clientes"],
                "estado_odoo":  rb["estado"],
                "status":       status,
                "alerts_count": len(rb_tickets),
                "sources":      sources,
                "soporte": {
                    "total":   len(rb_tickets),
                    "tickets": rb_tickets[:5],
                },
                "campo": {
                    "total":  len(rb_tareas),
                    "tareas": rb_tareas[:5],
                },
            })

        order = {"down": 0, "degraded": 1, "unknown": 2, "up": 3}
        result.sort(key=lambda x: (order.get(x["status"], 9), -x["clientes"]))

        _cache["data"] = result
        _cache["ts"]   = time.time()
        return result


def invalidate():
    _cache["data"] = None
    _cache["ts"]   = 0.0
