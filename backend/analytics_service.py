#!/usr/bin/env python3
"""
Analytics Service — captura de uso, flujos y sesiones del Command Center.
Endpoints:
  POST /api/analytics/event      — ingestar un evento o batch
  GET  /api/analytics/summary    — resumen ejecutivo
  GET  /api/analytics/sections   — métricas por sección
  GET  /api/analytics/users      — actividad por usuario
  GET  /api/analytics/flows      — flujos de navegación A→B
  GET  /api/analytics/sessions   — listado de sesiones
"""

import os, json, time
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional, List
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

DB_DIR  = os.path.join(os.path.dirname(__file__), "db")
LOG_FILE = os.path.join(DB_DIR, "analytics.jsonl")

os.makedirs(DB_DIR, exist_ok=True)


# ── Modelos ───────────────────────────────────────────────────────────────────
class AnalyticsEvent(BaseModel):
    ts:          Optional[str] = None      # ISO timestamp (cliente puede enviarlo)
    session_id:  str
    user_id:     Optional[str] = None
    user_email:  Optional[str] = None
    user_nombre: Optional[str] = None
    rol:         Optional[str] = None
    event:       str                       # section_view | click | search | error | session_start | session_end
    section:     Optional[str] = None      # sección activa al momento del evento
    properties:  dict = {}


class EventBatch(BaseModel):
    events: List[AnalyticsEvent]

class FeedbackItem(BaseModel):
    session_id:  str
    user_id:     Optional[str] = None
    user_email:  Optional[str] = None
    user_nombre: Optional[str] = None
    rol:         Optional[str] = None
    section:     str
    categoria:   str           # proceso | ux | datos | automatizacion | otro
    texto:       str
    ts:          Optional[str] = None

FEEDBACK_FILE = os.path.join(DB_DIR, "feedback.jsonl")


# ── I/O ───────────────────────────────────────────────────────────────────────
def _append(event: dict):
    event.setdefault("server_ts", datetime.utcnow().isoformat())
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")


def _read(days: int = 30) -> list[dict]:
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    events = []
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    e = json.loads(line)
                    ts = e.get("ts") or e.get("server_ts", "")
                    if ts >= cutoff:
                        events.append(e)
                except Exception:
                    pass
    except FileNotFoundError:
        pass
    return events


# ── Endpoints de ingesta ──────────────────────────────────────────────────────
@router.post("/event", status_code=204)
def post_event(ev: AnalyticsEvent):
    data = ev.model_dump()
    data["ts"] = data.get("ts") or datetime.utcnow().isoformat()
    _append(data)


@router.post("/events", status_code=204)
def post_events(batch: EventBatch):
    now = datetime.utcnow().isoformat()
    for ev in batch.events:
        data = ev.model_dump()
        data["ts"] = data.get("ts") or now
        _append(data)


# ── Endpoints de consulta ─────────────────────────────────────────────────────
@router.get("/summary")
def get_summary(days: int = Query(7, ge=1, le=90)):
    events = _read(days)
    if not events:
        return {"dias": days, "total_eventos": 0, "usuarios_unicos": 0,
                "sesiones": 0, "seccion_top": None, "rol_top": None}

    usuarios   = {e.get("user_email") for e in events if e.get("user_email")}
    sesiones   = {e.get("session_id") for e in events if e.get("session_id")}
    secciones  = defaultdict(int)
    roles      = defaultdict(int)
    por_dia    = defaultdict(int)
    por_hora   = defaultdict(int)
    errores    = 0

    for e in events:
        if e.get("section"):
            secciones[e["section"]] += 1
        if e.get("rol"):
            roles[e["rol"]] += 1
        if e.get("event") == "error":
            errores += 1
        ts = e.get("ts") or e.get("server_ts", "")
        if ts:
            try:
                dt = datetime.fromisoformat(ts[:19])
                por_dia[dt.strftime("%Y-%m-%d")] += 1
                por_hora[str(dt.hour)] += 1
            except Exception:
                pass

    top_sec  = max(secciones, key=secciones.get) if secciones else None
    top_rol  = max(roles,     key=roles.get)     if roles     else None
    hora_pico = max(por_hora, key=por_hora.get)  if por_hora  else None

    return {
        "dias":            days,
        "total_eventos":   len(events),
        "usuarios_unicos": len(usuarios),
        "sesiones":        len(sesiones),
        "errores":         errores,
        "seccion_top":     top_sec,
        "rol_top":         top_rol,
        "hora_pico":       hora_pico,
        "actividad_diaria": dict(sorted(por_dia.items())),
        "actividad_por_hora": {str(h): por_hora.get(str(h), 0) for h in range(24)},
    }


@router.get("/sections")
def get_sections(days: int = Query(30, ge=1, le=90)):
    events = _read(days)
    data   = defaultdict(lambda: {"visitas": 0, "usuarios": set(), "roles": defaultdict(int),
                                   "duracion_total_ms": 0, "duracion_count": 0})

    for e in events:
        sec = e.get("section")
        if not sec or e.get("event") not in ("section_view", "section_leave", "click", "search"):
            continue
        d = data[sec]
        d["visitas"] += 1
        if e.get("user_email"):
            d["usuarios"].add(e["user_email"])
        if e.get("rol"):
            d["roles"][e["rol"]] += 1
        dur = (e.get("properties") or {}).get("duration_ms")
        if dur:
            d["duracion_total_ms"] += dur
            d["duracion_count"]    += 1

    result = []
    for sec, d in data.items():
        avg_dur = int(d["duracion_total_ms"] / d["duracion_count"]) if d["duracion_count"] else 0
        result.append({
            "seccion":        sec,
            "visitas":        d["visitas"],
            "usuarios_unicos": len(d["usuarios"]),
            "roles":          dict(d["roles"]),
            "duracion_prom_s": round(avg_dur / 1000, 1),
        })

    result.sort(key=lambda x: x["visitas"], reverse=True)
    return result


@router.get("/users")
def get_users(days: int = Query(30, ge=1, le=90)):
    events  = _read(days)
    data    = defaultdict(lambda: {"nombre": "", "rol": "", "eventos": 0,
                                    "sesiones": set(), "secciones": set(),
                                    "ultimo_acceso": ""})

    for e in events:
        email = e.get("user_email")
        if not email:
            continue
        d = data[email]
        d["nombre"]  = e.get("user_nombre") or d["nombre"]
        d["rol"]     = e.get("rol")         or d["rol"]
        d["eventos"] += 1
        if e.get("session_id"):
            d["sesiones"].add(e["session_id"])
        if e.get("section"):
            d["secciones"].add(e["section"])
        ts = e.get("ts") or e.get("server_ts", "")
        if ts > d["ultimo_acceso"]:
            d["ultimo_acceso"] = ts

    result = []
    for email, d in data.items():
        result.append({
            "email":          email,
            "nombre":         d["nombre"],
            "rol":            d["rol"],
            "eventos":        d["eventos"],
            "sesiones":       len(d["sesiones"]),
            "secciones_usadas": sorted(d["secciones"]),
            "ultimo_acceso":  d["ultimo_acceso"][:16].replace("T", " "),
        })

    result.sort(key=lambda x: x["eventos"], reverse=True)
    return result


@router.get("/flows")
def get_flows(days: int = Query(30, ge=1, le=90), min_count: int = 2):
    """Flujos de navegación A → B más frecuentes."""
    events = _read(days)
    # Agrupar por sesión y ordenar por ts
    by_session: dict[str, list] = defaultdict(list)
    for e in events:
        if e.get("event") == "section_view" and e.get("section") and e.get("session_id"):
            by_session[e["session_id"]].append((e.get("ts",""), e["section"]))

    flows: dict[str, int] = defaultdict(int)
    for sess_events in by_session.values():
        sess_events.sort(key=lambda x: x[0])
        for i in range(len(sess_events) - 1):
            a = sess_events[i][1]
            b = sess_events[i+1][1]
            if a != b:
                flows[f"{a} → {b}"] += 1

    result = [{"flujo": k, "count": v} for k, v in flows.items() if v >= min_count]
    result.sort(key=lambda x: x["count"], reverse=True)
    return result[:30]


@router.post("/feedback", status_code=204)
def post_feedback(item: FeedbackItem):
    data = item.model_dump()
    data["ts"] = data.get("ts") or datetime.utcnow().isoformat()
    with open(FEEDBACK_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False) + "\n")
    # También lo registramos como evento de analytics
    _append({**data, "event": "feedback", "server_ts": data["ts"]})


@router.get("/feedback")
def get_feedback(days: int = Query(30, ge=1, le=180), section: Optional[str] = None):
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    items  = []
    try:
        with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    item = json.loads(line)
                    if item.get("ts", "") >= cutoff:
                        if not section or item.get("section") == section:
                            items.append(item)
                except Exception:
                    pass
    except FileNotFoundError:
        pass
    items.sort(key=lambda x: x.get("ts", ""), reverse=True)
    return items


@router.get("/tabs")
def get_tabs(days: int = Query(30, ge=1, le=90), section: Optional[str] = None):
    """Uso de pestañas por sección — eventos click con action=tab_change."""
    events = _read(days)

    # section → tab → {count, usuarios, ultimo}
    data: dict[str, dict[str, dict]] = defaultdict(lambda: defaultdict(lambda: {
        "count": 0, "usuarios": set(), "ultimo": ""
    }))

    for e in events:
        props = e.get("properties") or {}
        if props.get("action") != "tab_change":
            continue
        sec = props.get("section") or e.get("section") or ""
        tab = props.get("tab") or ""
        if not sec or not tab:
            continue
        if section and sec != section:
            continue
        d = data[sec][tab]
        d["count"] += 1
        email = e.get("user_email")
        if email:
            d["usuarios"].add(email)
        ts = e.get("ts", "")
        if ts > d["ultimo"]:
            d["ultimo"] = ts

    result = []
    for sec, tabs in data.items():
        tab_list = sorted(
            [{"tab": t, "count": v["count"], "usuarios_unicos": len(v["usuarios"]),
              "ultimo": v["ultimo"][:16].replace("T", " ")} for t, v in tabs.items()],
            key=lambda x: x["count"], reverse=True
        )
        total = sum(t["count"] for t in tab_list)
        result.append({"section": sec, "total_tab_clicks": total, "tabs": tab_list})

    result.sort(key=lambda x: x["total_tab_clicks"], reverse=True)
    return result


@router.get("/actions")
def get_actions(days: int = Query(30, ge=1, le=90)):
    """Todas las acciones registradas (búsquedas, exportaciones, clicks clave) por sección."""
    events = _read(days)
    data: dict[str, dict[str, dict]] = defaultdict(lambda: defaultdict(lambda: {
        "count": 0, "usuarios": set(), "ultimo": ""
    }))

    for e in events:
        props = e.get("properties") or {}
        action = props.get("action") or ""
        if not action or action == "tab_change":
            continue
        sec = props.get("section") or e.get("section") or "—"
        d = data[sec][action]
        d["count"] += 1
        email = e.get("user_email")
        if email:
            d["usuarios"].add(email)
        ts = e.get("ts", "")
        if ts > d["ultimo"]:
            d["ultimo"] = ts

    result = []
    for sec, actions in data.items():
        action_list = sorted(
            [{"action": a, "count": v["count"], "usuarios_unicos": len(v["usuarios"]),
              "ultimo": v["ultimo"][:16].replace("T", " ")} for a, v in actions.items()],
            key=lambda x: x["count"], reverse=True
        )
        result.append({"section": sec, "actions": action_list})

    result.sort(key=lambda x: sum(a["count"] for a in x["actions"]), reverse=True)
    return result


@router.get("/sessions")
def get_sessions(days: int = Query(7, ge=1, le=30)):
    events = _read(days)
    by_session: dict[str, dict] = {}

    for e in events:
        sid = e.get("session_id")
        if not sid:
            continue
        if sid not in by_session:
            by_session[sid] = {
                "session_id":  sid,
                "user_email":  e.get("user_email", ""),
                "user_nombre": e.get("user_nombre", ""),
                "rol":         e.get("rol", ""),
                "inicio":      e.get("ts",""),
                "fin":         e.get("ts",""),
                "eventos":     0,
                "secciones":   set(),
            }
        s = by_session[sid]
        ts = e.get("ts","")
        if ts < s["inicio"]: s["inicio"] = ts
        if ts > s["fin"]:    s["fin"]    = ts
        s["eventos"] += 1
        if e.get("section"):
            s["secciones"].add(e["section"])

    result = []
    for s in by_session.values():
        try:
            dur = (datetime.fromisoformat(s["fin"][:19]) -
                   datetime.fromisoformat(s["inicio"][:19])).seconds
        except Exception:
            dur = 0
        result.append({
            **s,
            "secciones":   sorted(s["secciones"]),
            "duracion_min": round(dur / 60, 1),
            "inicio":      s["inicio"][:16].replace("T", " "),
            "fin":         s["fin"][:16].replace("T", " "),
        })

    result.sort(key=lambda x: x["inicio"], reverse=True)
    return result[:100]
