"""
Helpdesk Service — tickets Odoo helpdesk.ticket para el Command Center.
Endpoints:
  GET /api/helpdesk/equipos        — lista de equipos con conteo
  GET /api/helpdesk/tickets        — tickets con filtros + filtro fecha
  GET /api/helpdesk/resumen        — KPIs generales
  GET /api/helpdesk/etapas         — etapas por equipo
  GET /api/helpdesk/analytics      — tendencias + patrones por periodo
"""
import os, xmlrpc.client
from collections import defaultdict
from datetime import datetime, timedelta, date
from typing import Optional
from fastapi import APIRouter, Query
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

router = APIRouter(prefix="/api/helpdesk", tags=["helpdesk"])

ODOO_URL  = os.getenv("ODOO_URL", "")
ODOO_DB   = os.getenv("ODOO_DB", "")
ODOO_USER = os.getenv("ODOO_USER", "")
ODOO_PASS = os.getenv("ODOO_PASSWORD", "")

_uid_cache: dict = {}

def _get_conn():
    common = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/common")
    if "uid" not in _uid_cache:
        _uid_cache["uid"] = common.authenticate(ODOO_DB, ODOO_USER, ODOO_PASS, {})
    models = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/object")
    return models, _uid_cache["uid"]

PRIORITY_LABEL = {"0": "Normal", "1": "Urgente", "2": "Muy urgente", "3": "Bloqueante"}
KANBAN_LABEL   = {"normal": "En tiempo", "blocked": "Bloqueado", "done": "Listo"}


@router.get("/equipos")
def get_equipos():
    models, uid = _get_conn()
    teams = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.team", "search_read",
        [[]],
        {"fields": ["name", "id"], "order": "name asc", "limit": 100})
    result = []
    for t in teams:
        count = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.ticket", "search_count",
            [[["team_id", "=", t["id"]], ["active", "=", True]]])
        if count > 0:
            result.append({"id": t["id"], "name": t["name"], "total": count})
    result.sort(key=lambda x: x["total"], reverse=True)
    return result


@router.get("/etapas")
def get_etapas(team_id: Optional[int] = None):
    models, uid = _get_conn()
    domain = []
    if team_id:
        domain = [["team_ids", "in", [team_id]]]
    stages = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.stage", "search_read",
        [domain],
        {"fields": ["name", "sequence", "fold"], "order": "sequence asc", "limit": 200})
    return stages


@router.get("/resumen")
def get_resumen(team_id: Optional[int] = None):
    models, uid = _get_conn()

    base_domain = [["active", "=", True]]
    if team_id:
        base_domain.append(["team_id", "=", team_id])

    total = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.ticket",
        "search_count", [base_domain])

    # Urgentes (priority >= 1)
    urgentes = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.ticket",
        "search_count", [base_domain + [["priority", "in", ["1","2","3"]]]])

    # SLA vencidos
    sla_vencidos = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.ticket",
        "search_count", [base_domain + [["sla_reached_late", "=", True]]])

    # Creados hoy
    hoy = datetime.utcnow().strftime("%Y-%m-%d")
    creados_hoy = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.ticket",
        "search_count", [base_domain + [["create_date", ">=", f"{hoy} 00:00:00"]]])

    # Resueltos (etapas fold=True)
    stages_fold = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.stage", "search",
        [[["fold", "=", True]]])
    resueltos = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.ticket",
        "search_count", [[["active", "=", True], ["stage_id", "in", stages_fold]]
                         + ([["team_id", "=", team_id]] if team_id else [])])

    return {
        "total":        total,
        "urgentes":     urgentes,
        "sla_vencidos": sla_vencidos,
        "creados_hoy":  creados_hoy,
        "resueltos":    resueltos,
        "abiertos":     total - resueltos,
    }


@router.get("/tickets")
def get_tickets(
    team_id:      Optional[int] = None,
    stage_id:     Optional[int] = None,
    priority:     Optional[str] = None,
    fecha_desde:  Optional[str] = None,
    fecha_hasta:  Optional[str] = None,
    periodo:      Optional[str] = None,   # "hoy" | "semana" | "mes" | "30d" | "90d"
    limit:        int = Query(50, ge=1, le=200),
    offset:       int = Query(0, ge=0),
):
    models, uid = _get_conn()
    domain = [["active", "=", True]]
    if team_id:  domain.append(["team_id",  "=", team_id])
    if stage_id: domain.append(["stage_id", "=", stage_id])
    if priority: domain.append(["priority", "=", priority])

    # Periodo predefinido
    if periodo:
        hoy = datetime.utcnow().date()
        if   periodo == "hoy":    fecha_desde = str(hoy)
        elif periodo == "semana": fecha_desde = str(hoy - timedelta(days=hoy.weekday()))
        elif periodo == "mes":    fecha_desde = hoy.strftime("%Y-%m-01")
        elif periodo == "30d":    fecha_desde = str(hoy - timedelta(days=30))
        elif periodo == "90d":    fecha_desde = str(hoy - timedelta(days=90))
    if fecha_desde:
        domain.append(["create_date", ">=", f"{fecha_desde} 00:00:00"])
    if fecha_hasta:
        domain.append(["create_date", "<=", f"{fecha_hasta} 23:59:59"])

    tickets = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.ticket", "search_read",
        [domain],
        {"fields": ["id", "name", "team_id", "stage_id", "priority",
                    "kanban_state", "partner_id", "user_id",
                    "create_date", "sla_deadline", "sla_reached_late",
                    "ticket_type_id", "close_hours"],
         "order": "priority desc, create_date desc",
         "limit": limit, "offset": offset})

    total = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.ticket",
        "search_count", [domain])

    result = []
    for t in tickets:
        result.append({
            "id":           t["id"],
            "name":         t["name"],
            "equipo":       t["team_id"][1]    if t["team_id"]    else "—",
            "equipo_id":    t["team_id"][0]    if t["team_id"]    else None,
            "etapa":        t["stage_id"][1]   if t["stage_id"]   else "—",
            "etapa_id":     t["stage_id"][0]   if t["stage_id"]   else None,
            "cliente":      t["partner_id"][1] if t["partner_id"] else "—",
            "agente":       t["user_id"][1]    if t["user_id"]    else "Sin asignar",
            "tipo":         t["ticket_type_id"][1] if t["ticket_type_id"] else "—",
            "prioridad":    PRIORITY_LABEL.get(str(t["priority"]), "Normal"),
            "prioridad_n":  int(t["priority"]) if t["priority"] else 0,
            "kanban":       KANBAN_LABEL.get(t.get("kanban_state","normal"), "En tiempo"),
            "sla_vencido":  bool(t.get("sla_reached_late")),
            "sla_deadline": (t.get("sla_deadline") or "")[:16].replace("T"," "),
            "creado":       (t.get("create_date") or "")[:16].replace("T"," "),
            "horas_cierre": t.get("close_hours"),
        })

    return {"total": total, "tickets": result}


@router.get("/analytics")
def get_analytics(
    team_id: Optional[int] = None,
    dias:    int = Query(30, ge=1, le=365),
    agrup:   str = Query("dia", regex="^(dia|semana|mes)$"),
):
    """Tendencias y patrones de tickets para el periodo solicitado."""
    models, uid = _get_conn()

    desde = (datetime.utcnow() - timedelta(days=dias)).strftime("%Y-%m-%d 00:00:00")
    base  = [["active", "=", True], ["create_date", ">=", desde]]
    if team_id:
        base.append(["team_id", "=", team_id])

    tickets = models.execute_kw(ODOO_DB, uid, ODOO_PASS, "helpdesk.ticket", "search_read",
        [base],
        {"fields": ["id", "name", "team_id", "stage_id", "priority", "user_id",
                    "ticket_type_id", "create_date", "sla_reached_late",
                    "close_hours", "kanban_state"],
         "order": "create_date asc", "limit": 2000})

    # Etapas fold para saber cuáles son "resueltas"
    fold_ids = set(models.execute_kw(ODOO_DB, uid, ODOO_PASS,
        "helpdesk.stage", "search", [[["fold", "=", True]]]))

    def bucket(fecha_str: str) -> str:
        try:
            d = datetime.strptime(fecha_str[:10], "%Y-%m-%d").date()
        except Exception:
            return "?"
        if agrup == "dia":    return str(d)
        if agrup == "semana":
            lun = d - timedelta(days=d.weekday())
            return f"Sem {lun.strftime('%d/%m')}"
        return d.strftime("%b %Y")

    # ── Tendencias por bucket ─────────────────────────────────────
    creados: dict  = defaultdict(int)
    resueltos: dict = defaultdict(int)
    sla_venc: dict  = defaultdict(int)

    por_tipo:   dict = defaultdict(int)
    por_equipo: dict = defaultdict(int)
    por_agente: dict = defaultdict(int)
    por_prio:   dict = defaultdict(int)
    tiempos_cierre: list = []

    for t in tickets:
        bkt = bucket(t.get("create_date", ""))
        creados[bkt] += 1
        if t.get("stage_id") and t["stage_id"][0] in fold_ids:
            resueltos[bkt] += 1
        if t.get("sla_reached_late"):
            sla_venc[bkt] += 1

        por_tipo[t["ticket_type_id"][1] if t.get("ticket_type_id") else "Sin tipo"] += 1
        por_equipo[t["team_id"][1]   if t.get("team_id")   else "Sin equipo"] += 1
        por_agente[t["user_id"][1]   if t.get("user_id")   else "Sin asignar"] += 1
        por_prio[PRIORITY_LABEL.get(str(t.get("priority","0")), "Normal")] += 1
        if t.get("close_hours") and t["close_hours"] > 0:
            tiempos_cierre.append(t["close_hours"])

    # Ordenar buckets cronológicamente
    all_bkts = sorted(set(list(creados.keys()) + list(resueltos.keys())))

    tendencia = [
        {
            "periodo": b,
            "creados":   creados.get(b, 0),
            "resueltos": resueltos.get(b, 0),
            "sla_venc":  sla_venc.get(b, 0),
        }
        for b in all_bkts
    ]

    avg_cierre = round(sum(tiempos_cierre) / len(tiempos_cierre), 1) if tiempos_cierre else None

    def top(d: dict, n: int = 10):
        return [{"nombre": k, "total": v}
                for k, v in sorted(d.items(), key=lambda x: -x[1])[:n]]

    return {
        "periodo_dias": dias,
        "total_tickets": len(tickets),
        "resueltos_total": sum(resueltos.values()),
        "sla_vencidos_total": sum(sla_venc.values()),
        "avg_cierre_horas": avg_cierre,
        "tendencia": tendencia,
        "por_tipo":   top(por_tipo),
        "por_equipo": top(por_equipo),
        "por_agente": top(por_agente, 15),
        "por_prioridad": top(por_prio),
    }
