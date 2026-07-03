"""
Helpdesk Service — tickets Odoo helpdesk.ticket para el Command Center.
Endpoints:
  GET /api/helpdesk/equipos      — lista de equipos con conteo
  GET /api/helpdesk/tickets      — tickets con filtros
  GET /api/helpdesk/resumen      — KPIs generales
  GET /api/helpdesk/etapas       — etapas por equipo
"""
import os, xmlrpc.client
from datetime import datetime, timedelta
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
    team_id:  Optional[int] = None,
    stage_id: Optional[int] = None,
    priority: Optional[str] = None,
    limit:    int = Query(50, ge=1, le=200),
    offset:   int = Query(0, ge=0),
):
    models, uid = _get_conn()
    domain = [["active", "=", True]]
    if team_id:  domain.append(["team_id",  "=", team_id])
    if stage_id: domain.append(["stage_id", "=", stage_id])
    if priority: domain.append(["priority", "=", priority])

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
