import os
import sys
import re
import json
import anthropic
import xmlrpc.client
from datetime import date
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Asegurar que el directorio del servidor sea el CWD y esté en el path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, "agents"))

load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)

from agents.director_general_v2 import DirectorGeneralV2
from agents import token_service

# Instanciar el Director General
dg_agent = DirectorGeneralV2()

# ─── Cliente Claude ───────────────────────────────────────────────────────────
_claude = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def ask_claude(prompt: str) -> str:
    msg = _claude.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

# ─── Constantes ──────────────────────────────────────────────────────────────
DOCS_DIR = os.path.join(BASE_DIR, "..", "docs", "estandares")
QUIZ_CACHE_DIR = os.path.join(BASE_DIR, "..", "src", "data", "quizzes_cache")
SKILLS_DB = os.path.join(BASE_DIR, "db", "skills_2026.json")
BANCO_PREGUNTAS = os.path.join(BASE_DIR, "banco_preguntas.json")
WFM_DB = os.path.join(BASE_DIR, "db", "wfm_data.json")

# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(title="Portal Academia Xcien API")

from fastapi.responses import RedirectResponse
@app.api_route("/academia", methods=["GET", "HEAD"])
@app.api_route("/academia/", methods=["GET", "HEAD"])
def redirect_academia():
    return RedirectResponse(url="/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Modelos Pydantic ─────────────────────────────────────────────────────────
class QuizRequest(BaseModel):
    filename: str

class SkillResult(BaseModel):
    nombre_tecnico: str
    resultados: dict  # {pilar: score}

class ChatRequest(BaseModel):
    message: str

class TokenRequest(BaseModel):
    empresa: str
    oportunidad_id: str
    cliente: str
    vendedor: str
    monto: float = 0.0
    extra: dict = {}

class OdooWebhookPayload(BaseModel):
    id: int
    name: str
    partner_name: str = ""
    user_id: list = []        # [id, nombre] — formato Odoo
    expected_revenue: float = 0.0
    company_id: list = []     # [id, nombre]
    tag_ids: list = []

# ─── Cliente Odoo ─────────────────────────────────────────────────────────────
ODOO_URL = os.environ.get("ODOO_URL")
ODOO_DB = os.environ.get("ODOO_DB")
ODOO_USER = os.environ.get("ODOO_USER")
ODOO_PASSWORD = os.environ.get("ODOO_PASSWORD")

def _get_odoo_employees():
    try:
        if not all([ODOO_URL, ODOO_DB, ODOO_USER, ODOO_PASSWORD]):
            return []
        common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(ODOO_URL))
        uid = common.authenticate(ODOO_DB, ODOO_USER, ODOO_PASSWORD, {})
        if not uid:
            return []
        models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(ODOO_URL))
        employees = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD,
            'hr.employee', 'search_read',
            [[('job_title', '!=', False)]],
            {'fields': ['name', 'job_title'], 'limit': 50})
        return employees
    except Exception as e:
        print(f"Error conectando a Odoo: {e}")
        return []

@app.get("/api/odoo/tecnicos")
def api_odoo_tecnicos():
    return _get_odoo_employees()

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/docs")
def list_docs():
    if not os.path.exists(DOCS_DIR):
        return []
    files = [f for f in os.listdir(DOCS_DIR) if f.endswith(".md")]
    return sorted(files)

@app.get("/api/docs/{filename}")
def get_doc(filename: str):
    path = os.path.join(DOCS_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    with open(path, "r", encoding="utf-8") as f:
        return {"content": f.read()}

@app.get("/api/diagnostic_exam")
def get_diagnostic_exam():
    if not os.path.exists(BANCO_PREGUNTAS):
        raise HTTPException(status_code=404, detail="Banco de preguntas no encontrado")
    with open(BANCO_PREGUNTAS, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/save_skill_result")
def save_skill_result(result: SkillResult):
    os.makedirs("db", exist_ok=True)
    data = {}
    if os.path.exists(SKILLS_DB):
        with open(SKILLS_DB, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except Exception:
                data = {}

    data[result.nombre_tecnico] = {
        "last_update": str(date.today()),
        "skills": result.resultados
    }

    with open(SKILLS_DB, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return {"status": "success", "message": f"Matriz actualizada para {result.nombre_tecnico}"}

@app.post("/api/generate_quiz")
def generate_quiz(request: QuizRequest):
    # 1. Verificar caché
    os.makedirs(QUIZ_CACHE_DIR, exist_ok=True)
    cache_path = os.path.join(QUIZ_CACHE_DIR, request.filename.replace(".md", ".json"))
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            print(f"✅ Sirviendo examen desde caché: {cache_path}")
            return json.load(f)

    # 2. Leer documento
    path = os.path.join(DOCS_DIR, request.filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    with open(path, "r", encoding="utf-8") as f:
        context = f.read()

    prompt = f"""Eres un Diseñador Instruccional de Academia Xcien.
Lee el siguiente estándar técnico y genera exactamente 10 preguntas de examen.
Devuelve SOLO un objeto JSON válido, sin texto adicional, sin bloques de código.

Formato JSON requerido:
{{
  "titulo": "Certificación: <nombre del tema>",
  "preguntas": [
    {{
      "id": 1,
      "pregunta": "¿Pregunta técnica?",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuesta_correcta": 0,
      "explicacion": "Explicación breve"
    }}
  ]
}}

Estándar a evaluar:
{context[:6000]}
"""

    try:
        print(f"🤖 Generando examen con Claude para: {request.filename}")
        text = ask_claude(prompt)

        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            quiz_result = json.loads(match.group())
        else:
            quiz_result = json.loads(text.replace("```json", "").replace("```", "").strip())

        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(quiz_result, f, indent=2, ensure_ascii=False)

        print(f"✅ Examen generado y guardado en: {cache_path}")
        return quiz_result

    except Exception as e:
        print(f"❌ Error generando examen: {e}")
        raise HTTPException(status_code=500, detail=f"Error al generar el examen: {str(e)}")

# ─── WFM: Workforce Management ────────────────────────────────────────────────

def _load_wfm():
    try:
        with open(WFM_DB, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"tecnicos": [], "tickets": []}

def _save_wfm(data):
    with open(WFM_DB, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

@app.get("/api/wfm/tecnicos")
def get_tecnicos():
    return _load_wfm()["tecnicos"]

@app.get("/api/wfm/tickets")
def get_tickets():
    return _load_wfm()["tickets"]

@app.post("/api/wfm/asignar/{ticket_id}")
def autoasignar_ticket(ticket_id: str):
    data = _load_wfm()
    ticket = next((t for t in data["tickets"] if t["id"] == ticket_id), None)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    tipo_skill = ticket.get("tipo", "Instalación")
    zona = ticket.get("zona", "")

    candidatos = [t for t in data["tecnicos"] if t.get("status") == "Disponible" and t.get("zona") == zona]
    if not candidatos:
        candidatos = [t for t in data["tecnicos"] if t.get("status") == "Disponible"]
    if not candidatos:
        raise HTTPException(status_code=409, detail="No hay técnicos disponibles")

    candidatos.sort(key=lambda t: t["skills"].get(tipo_skill, 0), reverse=True)
    elegido = candidatos[0]

    ticket["asignado"] = elegido["id"]
    ticket["status"] = "Agendado"
    for tec in data["tecnicos"]:
        if tec["id"] == elegido["id"]:
            tec["status"] = "En Sitio"

    _save_wfm(data)
    return {"status": "success", "ticket": ticket_id, "tecnico_asignado": elegido["nombre"], "skill_match": elegido["skills"].get(tipo_skill, 0)}

@app.put("/api/wfm/tecnico/{tecnico_id}/status")
def update_tecnico_status(tecnico_id: str, nuevo_status: str):
    data = _load_wfm()
    for tec in data["tecnicos"]:
        if tec["id"] == tecnico_id:
            tec["status"] = nuevo_status
            _save_wfm(data)
            return {"status": "updated", "tecnico": tec["nombre"], "nuevo_status": nuevo_status}
    raise HTTPException(status_code=404, detail="Técnico no encontrado")

# ─── NOC: Datos reales desde NOCBoard ────────────────────────────────────────

NOCBOARD_DIR = os.path.expanduser("~/Library/Application Support/NOCBoard")
NOCBOARD_HOSTS   = os.path.join(NOCBOARD_DIR, "hosts.json")
NOCBOARD_ALERTS  = os.path.join(NOCBOARD_DIR, "alerts.json")

def _load_nocboard_file(path: str):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ NOCBoard file error: {e}")
        return []

def _host_status(host: dict) -> str:
    score = host.get("healthScore", 0)
    ping  = host.get("lastPingResult", {})
    if ping.get("reachable", False):
        return "online"
    if score > 30:
        return "degraded"
    return "offline"

@app.get("/api/noc/hosts")
def get_noc_hosts():
    hosts = _load_nocboard_file(NOCBOARD_HOSTS)
    return [
        {
            "id":       h.get("id"),
            "ip":       h.get("ip"),
            "name":     h.get("rawName") or f"{h.get('endpointA','')} → {h.get('endpointB','')}",
            "score":    round(h.get("healthScore", 0), 1),
            "status":   _host_status(h),
            "city":     h.get("city"),
            "site":     h.get("site"),
            "lastSeen": h.get("lastPingResult", {}).get("timestamp", ""),
            "metrics":  h.get("latestMetrics", {}),
            "model":    h.get("model", ""),
            "vendor":   h.get("vendor", ""),
        }
        for h in hosts
    ]

@app.get("/api/noc/cities")
def get_noc_cities():
    hosts   = _load_nocboard_file(NOCBOARD_HOSTS)
    alerts  = _load_nocboard_file(NOCBOARD_ALERTS)

    active_alerts = [a for a in alerts if a.get("state") == "active"]

    # Coordenadas por ciudad
    COORDS = {
        "Monterrey":      {"lat": 25.6866, "lng": -100.3161},
        "Saltillo":       {"lat": 25.4232, "lng": -100.9928},
        "Piedras Negras": {"lat": 28.7000, "lng": -100.5231},
        "San Luis Potosi":{"lat": 22.1565, "lng": -100.9855},
        "Coco":           {"lat": 25.5000, "lng": -103.5000},
    }

    # Agrupar hosts por ciudad → sitio
    from collections import defaultdict
    city_sites: dict = defaultdict(lambda: defaultdict(list))
    for h in hosts:
        city = h.get("city", "Sin Ciudad")
        site = h.get("site", "Site Principal")
        city_sites[city][site].append(h)

    cities = []
    for city_name, sites_dict in city_sites.items():
        city_hosts_all = [h for hs in sites_dict.values() for h in hs]
        total   = len(city_hosts_all)
        online  = sum(1 for h in city_hosts_all if _host_status(h) == "online")
        offline = sum(1 for h in city_hosts_all if _host_status(h) == "offline")
        scores  = [h.get("healthScore", 0) for h in city_hosts_all]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0
        city_alerts = sum(1 for a in active_alerts if a.get("city") == city_name and a.get("severity") == "critical")
        coord = COORDS.get(city_name, {"lat": 23.0, "lng": -102.0})

        sites_list = []
        for site_name, site_hosts in sites_dict.items():
            site_online  = sum(1 for h in site_hosts if _host_status(h) == "online")
            site_offline = sum(1 for h in site_hosts if _host_status(h) == "offline")
            sites_list.append({
                "id":           f"{city_name}-{site_name}".lower().replace(" ", "-"),
                "name":         site_name,
                "hostsOnline":  site_online,
                "hostsOffline": site_offline,
                "hosts": [
                    {
                        "id":       h.get("id"),
                        "ip":       h.get("ip"),
                        "name":     h.get("rawName") or f"{h.get('endpointA','')}→{h.get('endpointB','')}",
                        "score":    round(h.get("healthScore", 0), 1),
                        "status":   _host_status(h),
                        "lastSeen": h.get("lastPingResult", {}).get("timestamp", ""),
                    }
                    for h in site_hosts
                ],
            })

        cities.append({
            "id":          city_name.lower().replace(" ", "-"),
            "name":        city_name,
            "score":       avg_score,
            "totalHosts":  total,
            "online":      online,
            "offline":     offline,
            "alerts":      city_alerts,
            "lat":         coord["lat"],
            "lng":         coord["lng"],
            "sites":       sites_list,
        })

    return sorted(cities, key=lambda c: c["offline"], reverse=True)

@app.get("/api/noc/alerts")
def get_noc_alerts(active_only: bool = True, limit: int = 200):
    alerts = _load_nocboard_file(NOCBOARD_ALERTS)
    if active_only:
        alerts = [a for a in alerts if a.get("state") == "active"]
    alerts = sorted(alerts, key=lambda a: a.get("triggeredAt", ""), reverse=True)[:limit]
    sev_map = {"degraded": "warning", "info": "warning"}
    return [
        {
            "id":           a.get("id"),
            "cityId":       a.get("city", "").lower().replace(" ", "-"),
            "cityName":     a.get("city", ""),
            "siteName":     a.get("site", ""),
            "hostIp":       a.get("hostIP", ""),
            "hostName":     a.get("hostName", ""),
            "type":         a.get("cause", ""),
            "message":      a.get("message", ""),
            "severity":     sev_map.get(a.get("severity"), a.get("severity", "warning")),
            "timestamp":    a.get("triggeredAt", ""),
            "ticketCreated": a.get("resolvedAt") is not None,
            "state":        a.get("state"),
        }
        for a in alerts
    ]

@app.get("/api/noc/summary")
def get_noc_summary():
    hosts  = _load_nocboard_file(NOCBOARD_HOSTS)
    alerts = _load_nocboard_file(NOCBOARD_ALERTS)
    active = [a for a in alerts if a.get("state") == "active"]
    total   = len(hosts)
    online  = sum(1 for h in hosts if _host_status(h) == "online")
    scores  = [h.get("healthScore", 0) for h in hosts]
    return {
        "totalHosts":     total,
        "online":         online,
        "offline":        total - online,
        "avgHealthScore": round(sum(scores) / len(scores), 1) if scores else 0,
        "activeAlerts":   len(active),
        "criticalAlerts": sum(1 for a in active if a.get("severity") == "critical"),
        "warningAlerts":  sum(1 for a in active if a.get("severity") == "warning"),
    }

# ─── Tokens de Oportunidad Ganada ────────────────────────────────────────────

@app.post("/api/tokens/emitir")
def emitir_token(req: TokenRequest):
    """Emite un token firmado para una oportunidad ganada."""
    try:
        token = token_service.emitir(
            empresa=req.empresa,
            oportunidad_id=req.oportunidad_id,
            cliente=req.cliente,
            vendedor=req.vendedor,
            monto=req.monto,
            extra=req.extra,
        )
        return token
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/tokens/verificar/{token_id}")
def verificar_token(token_id: str):
    """Verifica la autenticidad e integridad de un token."""
    return token_service.verificar(token_id)

@app.get("/api/tokens")
def listar_tokens(empresa: str = None):
    """Lista todos los tokens emitidos, opcionalmente filtrados por empresa."""
    return token_service.listar(empresa=empresa)

@app.post("/api/webhook/odoo/oportunidad-ganada")
def webhook_odoo(payload: OdooWebhookPayload):
    """
    Webhook que Odoo llama al marcar una oportunidad como ganada.
    Configurar en Odoo: Ajustes → Técnico → Automatizaciones → Acción webhook.
    URL: http://<tu-servidor>:8000/api/webhook/odoo/oportunidad-ganada
    """
    empresa = "xcien"
    if payload.company_id:
        nombre_empresa = payload.company_id[1].lower() if len(payload.company_id) > 1 else ""
        for e in token_service.EMPRESAS_VALIDAS:
            if e in nombre_empresa:
                empresa = e
                break

    vendedor = payload.user_id[1] if len(payload.user_id) > 1 else "Sin asignar"

    try:
        token = token_service.emitir(
            empresa=empresa,
            oportunidad_id=str(payload.id),
            cliente=payload.partner_name or payload.name,
            vendedor=vendedor,
            monto=payload.expected_revenue,
            extra={"nombre_oportunidad": payload.name},
        )
        return {"status": "token_emitido", "token_id": token["token_id"]}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ─── Inteligencia: Director General ──────────────────────────────────────────
@app.post("/api/director/chat")
def director_chat(request: ChatRequest):
    try:
        respuesta = dg_agent.ejecutar_orden(request.message)
        return {"status": "success", "response": respuesta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    print("🚀 XCIEN 2.0 Backend iniciando en puerto 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
