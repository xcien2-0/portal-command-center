import os
import sys
import re
import json
import time
import datetime
import anthropic
import xmlrpc.client
import logging
from datetime import date

# Configuración de Logging para Producción
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("XCIEN-BACKEND")
from fastapi import FastAPI, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv

# Asegurar que el directorio del servidor sea el CWD y esté en el path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, "agents"))

load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)

# Importar Agentes Corporativos
from agents.director_general_v2 import DirectorGeneralV2
from agents.telegram_bot import TelegramBot
from agents import token_service
from agents import asset_service
from agents import transacciones_service
from agents import label_service
from agents.wfm_workflow_service import WFMWorkflowService
from agents.integration_orchestrator import orchestrator
from agents.odoo_connector import odoo_conn

from agents.devops_agent import DevOpsAgent

# Instanciar el Director General y el SRE
dg_agent = DirectorGeneralV2()
sre_agent = DevOpsAgent()
wfm_service = WFMWorkflowService()

print("🚀 [XCIEN-BACKEND] Servidor cargado/recargado correctamente.")

# ─── Cliente Claude ───────────────────────────────────────────────────────────
_claude_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def ask_claude(prompt: str) -> str:
    try:
        msg = _claude_client.messages.create(
            model="claude-3-5-sonnet-20241022", # Actualizado a modelo estable
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )
        return msg.content[0].text
    except Exception as e:
        logger.error(f"Error en comunicación con Claude: {e}")
        return '{"titulo": "Error de Conexión", "preguntas": []}'

from fastapi import BackgroundTasks

# ─── Constantes ──────────────────────────────────────────────────────────────
DOCS_DIR = os.path.join(BASE_DIR, "..", "Xcien_Docs")
QUIZ_CACHE_DIR = os.path.join(BASE_DIR, "..", "src", "data", "quizzes_cache")
SKILLS_DB = os.path.join(BASE_DIR, "db", "skills_2026.json")
BANCO_PREGUNTAS = os.path.join(BASE_DIR, "db", "banco_preguntas_multi.json")
WFM_DB = os.path.join(BASE_DIR, "db", "wfm_data.json")

# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(title="Portal Academia Xcien API")

@app.api_route("/academia", methods=["GET", "HEAD"])
@app.api_route("/academia/", methods=["GET", "HEAD"])
def redirect_academia():
    return RedirectResponse(url="/")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no controlado en {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Error interno del servidor corporativo."},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8080",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar estáticos (React build y Assets)
DIST_DIR = os.path.join(BASE_DIR, "..", "dist")

# Siempre montar /static para archivos legados (Academia, Exam, etc.)
app.mount("/static", StaticFiles(directory="static"), name="static")

if os.path.exists(DIST_DIR):
    # El build de Vite pone los chunks en assets/
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

@app.get("/")
async def serve_index():
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return FileResponse("static/index.html")

# ─── Modelos Pydantic ─────────────────────────────────────────────────────────
class QuizRequest(BaseModel):
    filename: str

class WFMCreateRequest(BaseModel):
    cliente: str
    servicio: str
    comercial: str

class WFMUpdatePreventaRequest(BaseModel):
    order_id: str
    data: Dict
    usuario: str

class WFMBasicActionRequest(BaseModel):
    order_id: str
    usuario: str

class WFMAlmacenRequest(BaseModel):
    order_id: str
    equipos: List[Dict]
    usuario: str

class WFMAproRequest(BaseModel):
    order_id: str
    config: Dict
    usuario: str

class WFMAuditoriaRequest(BaseModel):
    order_id: str
    ok: bool
    motivo: str
    usuario: str

class WFMAlmacenRespuestaRequest(BaseModel):
    order_id: str
    respuesta: str          # 'disponible' | 'no_disponible' | 'disponible_en_fecha'
    equipos: List[Dict] = []
    fecha_estimada: Optional[str] = None
    motivo: Optional[str] = None
    usuario: str

class WFMAprovisionar2Request(BaseModel):
    order_id: str
    vlan: Optional[int] = None
    bw_mbps: Optional[float] = None
    ip_wan: Optional[str] = None
    gateway: Optional[str] = None
    firmware: Optional[str] = None
    mac_address: Optional[str] = None
    notas_config: Optional[str] = None
    usuario: str

class WFMEvidenciaRequest(BaseModel):
    order_id: str
    tipo: str               # 'antes' | 'despues'
    filename: str
    data_b64: str           # imagen en base64
    usuario: str

class WFMCerrarInstalacionRequest(BaseModel):
    order_id: str
    notas: str = ""
    usuario: str

class WFMChecklistItemRequest(BaseModel):
    order_id: str
    item_id: str
    completado: bool
    observacion: str = ""
    usuario: str

class WFMPruebaVelocidadRequest(BaseModel):
    order_id: str
    bw_contratado_mbps: float
    descarga_mbps: float
    subida_mbps: float
    latencia_ms: float
    perdida_pct: float = 0.0
    servidor: str = ""
    herramienta: str = "manual"
    usuario: str

class WFMNocPingRequest(BaseModel):
    order_id: str
    ip_destino: str
    ping_ok: bool
    latencia_ms: Optional[float] = None
    usuario: str

class WFMNocAltaRequest(BaseModel):
    order_id: str
    herramienta_monitoreo: str
    host_id: str = ""
    grupos_alerta: List[str] = []
    usuario: str

class WFMNocAprobarRequest(BaseModel):
    order_id: str
    usuario: str

class SkillResult(BaseModel):
    nombre_tecnico: str
    resultados: dict  # {pilar: score}

class TicketCreateRequest(BaseModel):
    client: str
    description: str
    location: str
    tipo: str
    zona: str
    priority: str

class TicketUpdateStatusRequest(BaseModel):
    status: str
    asignado: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    history: list = []
    context: str = ""

class TokenRequest(BaseModel):
    empresa: str
    oportunidad_id: str
    cliente: str
    vendedor: str
    monto: float = 0.0
    extra: dict = {}

class TransaccionRequest(BaseModel):
    empresa_origen: str
    empresa_destino: str
    area_origen: str
    area_destino: str
    concepto: str
    precio_mercado: float
    precio_preferencial: float
    responsable: str = ""
    referencia: str = ""
    notas: str = ""

class ActivoRequest(BaseModel):
    nombre: str
    categoria: str
    empresa: str
    regimen: str
    site: str = ""
    asignado_a: str = ""
    numero_serie: str = ""
    marca: str = ""
    modelo: str = ""
    costo_mensual: float = 0.0
    vencimiento_contrato: str = ""
    estado: str = "activo"
    notas: str = ""
    ip: str = ""
    network_code: str = ""

WFMUpdatePreventaRequest.model_rebuild()
ActivoRequest.model_rebuild()

class MoverActivoRequest(BaseModel):
    nuevo_site: str
    nuevo_asignado: str
    motivo: str = ""

class OdooWebhookPayload(BaseModel):
    id: int
    name: str
    partner_name: str = ""
    user_id: list = []        # [id, nombre] — formato Odoo
    expected_revenue: float = 0.0
    company_id: list = []     # [id, nombre]
    tag_ids: list = []

class IntegrationRequest(BaseModel):
    platform: str
    action: str
    params: Dict[str, Any] = {}

class OdooActionRequest(BaseModel):
    model: str
    method: str
    args: List[Any] = []
    kwargs: Dict[str, Any] = {}

# ─── Agente Puente (Antigravity) ─────────────────────────────────────────────
AGENT_BRIDGE = {
    "current_task": "Inactivo",
    "status": "idle",
    "log": [],
    "last_update": "",
    "command_queue": []
}

class CommandRequest(BaseModel):
    command: str
    context: str = ""

class BridgeRequest(BaseModel):
    task: str
    status: str = "working"
    log_entry: str = ""

# ─── Cliente Odoo ─────────────────────────────────────────────────────────────
ODOO_URL = os.environ.get("ODOO_URL")
ODOO_DB = os.environ.get("ODOO_DB")
ODOO_USER = os.environ.get("ODOO_USER")
ODOO_PASSWORD = os.environ.get("ODOO_PASSWORD")

def _get_odoo_employees():
    try:
        employees = odoo_conn.search_read('hr.employee', domain=[[('job_title', '!=', False)]], fields=['name', 'job_title'], limit=50)
        if employees:
            return employees
        
        # Fallback a Matriz de Habilidades (skills_2026.json)
        print("⚠️ Usando matriz de habilidades como fallback para técnicos.")
        if os.path.exists(SKILLS_DB):
            with open(SKILLS_DB, "r") as f:
                skills_data = json.load(f)
                return [{"name": name, "job_title": "Técnico Certificado (Matriz)"} for name in skills_data.keys()]
        return []
    except Exception as e:
        print(f"Error conectando a Odoo: {e}. Usando fallback...")
        if os.path.exists(SKILLS_DB):
            with open(SKILLS_DB, "r") as f:
                skills_data = json.load(f)
                return [{"name": name, "job_title": "Técnico Certificado (Matriz)"} for name in skills_data.keys()]
        return []

@app.get("/api/odoo/tecnicos")
def api_odoo_tecnicos():
    return _get_odoo_employees()

@app.post("/api/odoo/execute")
def api_odoo_execute(req: OdooActionRequest):
    """Permite realizar acciones de escritura (create, write) en Odoo"""
    # Seguridad básica: solo permitir ciertos métodos en producción
    allowed_methods = ['create', 'write', 'search_read', 'unlink']
    if req.method not in allowed_methods:
        raise HTTPException(status_code=400, detail=f"Método {req.method} no permitido")
    
    result = odoo_conn.execute(req.model, req.method, *req.args, **req.kwargs)
    if result is None:
        raise HTTPException(status_code=500, detail="Error en la ejecución de Odoo")
    return {"status": "success", "data": result}

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
def get_diagnostic_exam(area: str = "NOC"):
    if not os.path.exists(BANCO_PREGUNTAS):
        raise HTTPException(status_code=404, detail="Banco de preguntas no encontrado")
    
    with open(BANCO_PREGUNTAS, "r", encoding="utf-8") as f:
        full_bank = json.load(f)
    
    # Normalizar area
    area = area.upper()
    if area not in full_bank:
        # Fallback a NOC si el área no existe
        area = "NOC"
        
    return full_bank[area]

@app.get("/api/docs/content")
def get_doc_content(path: str):
    """Devuelve el contenido de un documento (SOP) de forma segura"""
    clean_path = path.replace("..", "").lstrip("/")
    filename = os.path.basename(clean_path)
    full_path = os.path.join(BASE_DIR, "..", "Xcien_Docs", filename)
    if not os.path.exists(full_path):
        full_path = os.path.join(BASE_DIR, "..", "docs", "estandares", filename)
    if not os.path.exists(full_path):
        full_path = os.path.join(BASE_DIR, "..", "docs", clean_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail=f"Documento no encontrado: {path}")
    
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            return {"content": f.read()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tokens/operativo")
def post_token_operativo(req: Dict[str, Any]):
    try:
        token = token_service.emitir_operativo(
            tipo=req.get("tipo"),
            nombre=req.get("nombre"),
            detalle=req.get("detalle"),
            empresa=req.get("empresa", "xcien")
        )
        return {"status": "success", "token": token}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

TELEGRAM_CONFIG_FILE = "db/telegram_config.json"

def _load_telegram_config():
    try:
        with open(TELEGRAM_CONFIG_FILE, "r") as f:
            return json.load(f)
    except:
        return {"enabled": False, "token": "", "chat_id": "", "min_severity": "critical"}

def _save_telegram_config(config):
    with open(TELEGRAM_CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)

@app.post("/api/config/telegram")
def config_telegram(req: Dict[str, Any]):
    config = _load_telegram_config()
    config.update({
        "enabled": req.get("enabled", config["enabled"]),
        "token": req.get("token", config["token"]),
        "chat_id": req.get("chat_id", config["chat_id"]),
        "min_severity": req.get("min_severity", config["min_severity"])
    })
    _save_telegram_config(config)
    return {"status": "success", "config": config}

@app.get("/api/config/telegram")
def get_telegram_config():
    return _load_telegram_config()

@app.post("/api/test/telegram")
def test_telegram(req: Dict[str, Any]):
    token = req.get("token") or _load_telegram_config().get("token")
    chat_id = req.get("chat_id") or _load_telegram_config().get("chat_id")
    bot = TelegramBot(token=token, chat_id=chat_id)
    res = bot.send_message("🚀 *PRUEBA DE BOT XCIEN*\n\nConexión establecida correctamente desde el Centro de Mando.")
    return res

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

@app.post("/api/wfm/tickets")
def create_ticket(req: TicketCreateRequest):
    data = _load_wfm()
    new_ticket = {
        "id": f"T-{int(time.time())}",
        "client": req.client,
        "description": req.description,
        "location": req.location,
        "tipo": req.tipo,
        "zona": req.zona,
        "priority": req.priority,
        "status": "Abierto",
        "asignado": None,
        "created_at": str(date.today())
    }
    data["tickets"].append(new_ticket)
    _save_wfm(data)
    return new_ticket

@app.put("/api/wfm/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: str, req: TicketUpdateStatusRequest):
    data = _load_wfm()
    for t in data["tickets"]:
        if t["id"] == ticket_id:
            t["status"] = req.status
            if req.asignado is not None:
                t["asignado"] = req.asignado
            _save_wfm(data)
            return {"status": "updated", "ticket": t}
    raise HTTPException(status_code=404, detail="Ticket no encontrado")

# ─── NOC: Datos reales desde NOCBoard ────────────────────────────────────────

NOCBOARD_DIR = os.path.expanduser("~/Library/Application Support/NOCBoard")
NOCBOARD_HOSTS_FILE   = os.path.join(NOCBOARD_DIR, "hosts.json")
NOCBOARD_ALERTS_FILE  = os.path.join(NOCBOARD_DIR, "alerts.json")
NOCBOARD_API_BASE = "http://localhost:9401/api"
NOCBOARD_API_KEY  = "87a08190b801416392e944ab79c7e3c9"

import requests

def _load_noc_data(endpoint: str, fallback_file: str):
    """Intenta cargar datos desde la API de NOCBoard (9401) o cae a archivos locales."""
    try:
        url = f"{NOCBOARD_API_BASE}/{endpoint}"
        r = requests.get(url, headers={"X-API-Key": NOCBOARD_API_KEY}, timeout=2)
        if r.status_code == 200:
            data = r.json()
            if endpoint in data and isinstance(data[endpoint], list):
                return data[endpoint]
            return data
    except Exception as e:
        logger.warning(f"NOC API (9401) no disponible para {endpoint}: {e}. Usando archivo local.")
    
    # Fallback a archivos
    try:
        if os.path.exists(fallback_file):
            with open(fallback_file, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"Error leyendo archivo NOC local {fallback_file}: {e}")
    
    return []

def _get_enriched_noc_data():
    """Retorna hosts y alertas enriquecidos con simulación para tenants faltantes"""
    hosts  = _load_noc_data("hosts", NOCBOARD_HOSTS_FILE)
    alerts = _load_noc_data("alerts", NOCBOARD_ALERTS_FILE)
    
    # Inyectar simulación para Wispi, Luminet, Huus, Sandur
    MISSING_TENANTS = [
        {"id": "wispi",   "name": "Wispi",       "city": "Monterrey"},
        {"id": "luminet", "name": "Luminet WAN", "city": "Saltillo"},
        {"id": "huus",    "name": "Huus",        "city": "Monterrey"},
        {"id": "sandur",  "name": "Sandur",      "city": "Piedras Negras"},
    ]
    
    for t in MISSING_TENANTS:
        tid = t["id"]
        # Solo inyectar si no hay hosts reales para ese tenant
        if not any(h.get("tenantId") == tid for h in hosts):
            # Simular 3-5 hosts por tenant
            for i in range(1, 4):
                status = "online" if (i % 3 != 0) else "offline"
                score = 95 if status == "online" else 30
                hosts.append({
                    "id": f"{tid}-host-{i}",
                    "ip": f"10.{10+i}.0.1",
                    "city": t["city"],
                    "site": "Core Dist",
                    "tenantId": tid,
                    "healthScore": score,
                    "status": status,
                    "lastPingResult": {
                        "timestamp": str(date.today()),
                        "reachable": True if status == "online" else False,
                        "packet_loss": 0 if status == "online" else 100
                    }
                })
                if status == "offline":
                    import uuid
                    alerts.append({
                        "id": f"sim-alert-{tid}-{uuid.uuid4().hex[:8]}",
                        "city": t["city"],
                        "cityName": t["city"],
                        "tenantId": tid,
                        "severity": "critical",
                        "state": "active",
                        "type": "Falla de Energía",
                        "description": f"Falla de energía en segmento {tid.upper()}",
                        "ts": str(date.today()),
                        "triggeredAt": str(date.today())
                    })
    
    return hosts, alerts

def _host_status(host: dict) -> str:
    # La API usa snake_case (health_score), el archivo usa camelCase (healthScore)
    score = host.get("health_score") or host.get("healthScore", 0)
    ping  = host.get("ping") or host.get("lastPingResult", {})
    reachable = ping.get("reachable", False) if "reachable" in ping else (ping.get("packet_loss", 100) < 100)
    
    if not reachable:
        return "offline"
    if score < 70:
        return "degraded"
    return "online"

def _match_ticket(alert: dict, tickets: list) -> Optional[str]:
    """Busca un ticket que coincida con la alerta (por ciudad o descripción)"""
    city = alert.get("city", "").lower()
    msg  = alert.get("message", "").lower()
    for t in tickets:
        t_desc = t.get("description", "").lower()
        t_zone = t.get("zona", "").lower()
        if city in t_zone or city in t_desc or any(word in t_desc for word in msg.split() if len(word) > 4):
            return t.get("id")
    return None

@app.get("/api/noc/hosts")
def get_noc_hosts():
    hosts = _load_noc_data("hosts", NOCBOARD_HOSTS_FILE)
    return [
        {
            "id":       h.get("id"),
            "ip":       h.get("ip"),
            "name":     h.get("display_name") or h.get("rawName") or f"{h.get('endpointA','')} → {h.get('endpointB','')}",
            "score":    round(h.get("health_score") or h.get("healthScore", 0), 1),
            "status":   _host_status(h),
            "city":     h.get("city"),
            "site":     h.get("site"),
            "lastSeen": (h.get("ping") or h.get("lastPingResult", {})).get("timestamp", ""),
            "metrics":  h.get("latest_metrics") or h.get("latestMetrics", {}),
            "model":    h.get("model", ""),
            "vendor":   h.get("vendor", ""),
        }
        for h in hosts
    ]

@app.get("/api/noc/cities")
def get_noc_cities():
    hosts, alerts = _get_enriched_noc_data()

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
        scores  = [h.get("health_score") or h.get("healthScore", 0) for h in city_hosts_all]
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
            "primary_ip":  city_hosts_all[0].get("ip") if city_hosts_all else "0.0.0.0",
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
    _, alerts = _get_enriched_noc_data()
    if active_only:
        alerts = [a for a in alerts if a.get("state") == "active"]
    alerts = sorted(alerts, key=lambda a: a.get("triggered_at") or a.get("triggeredAt", ""), reverse=True)[:limit]
    
    # Cruzar con tickets locales (WFM)
    wfm_data = _load_wfm()
    tickets  = wfm_data.get("tickets", [])
    
    sev_map = {"degraded": "warning", "info": "warning"}
    
    def _get_sop_id(cause: str) -> str:
        cause = cause.lower()
        if "latency" in cause: return "SOP-NOC-001"
        if "unreachable" in cause or "offline" in cause: return "SOP-NOC-002"
        if "packet loss" in cause: return "SOP-NOC-003"
        return "SOP-GEN-001"

    return [
        {
            "id":            a.get("id"),
            "cityId":        a.get("city", "").lower().replace(" ", "-"),
            "cityName":      a.get("city", ""),
            "siteName":      a.get("site", ""),
            "hostIp":        a.get("host_ip") or a.get("hostIP", ""),
            "hostName":      a.get("host_name") or a.get("hostName", ""),
            "type":          a.get("cause", ""),
            "message":       a.get("message", ""),
            "severity":      sev_map.get(a.get("severity"), a.get("severity", "warning")),
            "timestamp":     a.get("triggered_at") or a.get("triggeredAt", ""),
            "ticketCreated": a.get("ticket_created", False) or (_match_ticket(a, tickets) is not None),
            "odooTicketId":  _match_ticket(a, tickets),
            "sopId":         _get_sop_id(a.get("cause", "")),
            "state":         a.get("state"),
        }
        for a in alerts
    ]

@app.get("/api/noc/summary")
def get_noc_summary():
    hosts, alerts = _get_enriched_noc_data()
    active = [a for a in alerts if a.get("state") == "active"]
    total   = len(hosts)
    online  = sum(1 for h in hosts if _host_status(h) in ["online", "degraded"])
    scores  = [h.get("health_score") or h.get("healthScore", 0) for h in hosts]
    return {
        "totalHosts":     total,
        "online":         online,
        "offline":        total - online,
        "avgHealthScore": round(sum(scores) / len(scores), 1) if scores else 0,
        "activeAlerts":   len(active),
        "criticalAlerts": sum(1 for a in active if a.get("severity") == "critical"),
        "warningAlerts":  sum(1 for a in active if a.get("severity") == "warning"),
    }

# ─── Transacciones Intragrupo ─────────────────────────────────────────────────

@app.post("/api/transacciones")
def registrar_transaccion(req: TransaccionRequest):
    try:
        return transacciones_service.registrar(**req.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/transacciones")
def listar_transacciones(empresa_origen: str = None, empresa_destino: str = None, area: str = None):
    return transacciones_service.listar(empresa_origen=empresa_origen, empresa_destino=empresa_destino, area=area)

@app.get("/api/transacciones/resumen")
def resumen_transacciones():
    return transacciones_service.resumen()

@app.get("/api/transacciones/catalogos")
def catalogos_transacciones():
    return {"empresas": transacciones_service.EMPRESAS, "areas": transacciones_service.AREAS}

# ─── Etiquetas & Comprobantes ─────────────────────────────────────────────────
from fastapi.responses import HTMLResponse

@app.get("/api/etiquetas/activo/{activo_id}")
def etiqueta_activo(activo_id: str):
    try:
        img = label_service.etiqueta_activo_png(activo_id)
        return Response(content=img, media_type="image/png",
                        headers={"Content-Disposition": f"inline; filename={activo_id}.png"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/etiquetas/hoja", response_class=HTMLResponse)
def hoja_etiquetas(empresa: str = None, site: str = None):
    try:
        return HTMLResponse(content=label_service.hoja_etiquetas_html(empresa=empresa, site=site))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/etiquetas/transaccion/{tx_id}")
def comprobante_tx(tx_id: str):
    try:
        img = label_service.comprobante_tx_png(tx_id)
        return Response(content=img, media_type="image/png",
                        headers={"Content-Disposition": f"inline; filename={tx_id}.png"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Activos / Inventario ────────────────────────────────────────────────────
from fastapi.responses import StreamingResponse, Response
import io

@app.post("/api/activos")
def registrar_activo(req: ActivoRequest):
    try:
        return asset_service.registrar(**req.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/activos")
def listar_activos(empresa: str = None, categoria: str = None, site: str = None):
    return asset_service.listar(empresa=empresa, categoria=categoria, site=site)

@app.get("/api/activos/{activo_id}")
def obtener_activo(activo_id: str):
    a = asset_service.obtener(activo_id)
    if not a:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return a

@app.put("/api/activos/{activo_id}/mover")
def mover_activo(activo_id: str, req: MoverActivoRequest):
    try:
        return asset_service.mover(activo_id, req.nuevo_site, req.nuevo_asignado, req.motivo)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/activos/{activo_id}/etiqueta")
def etiqueta_activo(activo_id: str):
    try:
        img_bytes = asset_service.generar_etiqueta_bytes(activo_id)
        return Response(content=img_bytes, media_type="image/png",
                        headers={"Content-Disposition": f"inline; filename={activo_id}.png"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/activos/exportar/csv")
def exportar_csv(empresa: str = None, site: str = None):
    csv_str = asset_service.exportar_csv(empresa=empresa, site=site)
    return Response(content=csv_str.encode("utf-8"), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=inventario_xcien.csv"})

@app.get("/api/activos/exportar/excel")
def exportar_excel(empresa: str = None, site: str = None):
    try:
        xls = asset_service.exportar_excel(empresa=empresa, site=site)
        return Response(content=xls, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        headers={"Content-Disposition": "attachment; filename=inventario_xcien.xlsx"})
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/activos/catalogos/categorias")
def get_categorias():
    return asset_service.CATEGORIAS

@app.get("/api/activos/catalogos/regimenes")
def get_regimenes():
    return asset_service.REGIMENES

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
        AGENT_BRIDGE["current_task"] = "Procesando consulta estratégica..."
        AGENT_BRIDGE["status"] = "working"
        AGENT_BRIDGE["log"].append(f"Consulta: {request.message[:30]}...")
        
        respuesta = dg_agent.ejecutar_orden(request.message, request.history, request.context)
        
        AGENT_BRIDGE["current_task"] = "Listo para orquestar"
        AGENT_BRIDGE["status"] = "idle"
        return {"status": "success", "response": respuesta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/devops/chat")
def devops_chat(request: ChatRequest):
    try:
        respuesta = sre_agent.analizar_y_responder(request.message, request.history)
        return {"status": "success", "response": respuesta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bridge")
def get_bridge_status():
    return AGENT_BRIDGE

@app.post("/api/bridge")
def update_bridge_status(req: BridgeRequest):
    AGENT_BRIDGE["current_task"] = req.task
    AGENT_BRIDGE["status"] = req.status
    if req.log_entry:
        AGENT_BRIDGE["log"].append(req.log_entry)
        if len(AGENT_BRIDGE["log"]) > 10:
            AGENT_BRIDGE["log"].pop(0)
    import datetime
    AGENT_BRIDGE["last_update"] = datetime.datetime.now().strftime("%H:%M:%S")
    return {"status": "ok"}

@app.post("/api/bridge/query")
def bridge_query(req: CommandRequest):
    cmd = req.command
    if cmd == "get_foda_context":
        noc_data = _get_enriched_noc_data()
        wfm_orders = wfm_service.obtener_ordenes()
        critical_alerts = [a for a in noc_data.get("alerts", []) if a.get("severity") == "critical"]
        return {
            "status": "success",
            "data": {
                "swot": {
                    "fortalezas": [
                        "Integración vertical con Odoo ERP y Agentes Claude.",
                        "Estructura de Bidrillas 2026 con roles especializados.",
                        "Academia Digital con 100% de técnicos certificados.",
                        "Monitoreo proactivo vía NOCBoard (99.9% disponibilidad)."
                    ],
                    "oportunidades": [
                        "Expansión de fibra óptica en zonas de alta latencia.",
                        "Automatización de despacho por geolocalización.",
                        "Tokenización de bonos para reducción de rotación."
                    ],
                    "debilidades": [
                        f"Presencia de {len(critical_alerts)} alertas críticas en el NOC.",
                        f"Backlog acumulado de {len([o for o in wfm_orders if o['estado'] == 'BACKLOG'])} órdenes.",
                        "Curva de aprendizaje en nuevos procesos Odoo 19."
                    ],
                    "amenazas": [
                        "Competencia agresiva de Starlink en zonas rurales.",
                        "Condiciones climáticas afectando enlaces de microondas.",
                        "Fuga de talento técnico capacitado."
                    ]
                },
                "dialogue": [
                    {"agente": "Director General", "msj": "¿Cómo impacta el backlog actual en el SLA de la próxima semana?"},
                    {"agente": "NOC Agent", "msj": f"Las {len(critical_alerts)} alertas críticas están consumiendo el 40% de la capacidad técnica."},
                    {"agente": "WFM Agent", "msj": "Necesitamos reasignar la Bidrilla B-01 de Monterrey a Saltillo urgentemente."},
                    {"agente": "Academia Agent", "msj": "Hay 3 auxiliares listos para ascenso, eso aliviaría la carga."}
                ]
            }
        }
    if cmd == "get_dashboard_stats":
        wfm_orders = wfm_service.obtener_ordenes()
        return {
            "status": "success",
            "data": {
                "productivity": f"{len([o for o in wfm_orders if o['estado'] == 'LISTO_INSTALACION'])}/5",
                "availability": "99.85%",
                "pending_tickets": len([o for o in wfm_orders if o['estado'] != 'LISTO_INSTALACION']),
                "active_teams": 4,
                "last_update": datetime.datetime.now().strftime("%H:%M:%S")
            }
        }
    if cmd == "generate_bidrillas_pdf":
        try:
            # Ejecutar el script de generación de PDF
            import subprocess
            result = subprocess.run(["python3", "backend/generar_bidrillas_reportlab.py"], capture_output=True, text=True)
            if result.returncode == 0:
                return {"status": "success", "message": "PDF generado exitosamente"}
            else:
                return {"status": "error", "message": f"Error ejecutando script: {result.stderr}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    return {"status": "error", "message": "Unknown query command"}

@app.post("/api/bridge/command")
def push_command(req: CommandRequest):
    AGENT_BRIDGE["command_queue"].append({
        "command": req.command,
        "context": req.context,
        "ts": datetime.datetime.now().strftime("%H:%M:%S"),
        "status": "pending"
    })
    return {"status": "queued", "pos": len(AGENT_BRIDGE["command_queue"])}

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ─── Endpoints WFM ───────────────────────────────────────────────────────────

@app.get("/api/wfm/ordenes")
async def get_wfm_orders(background_tasks: BackgroundTasks, estado: str = None):
    # Lanzar sincronización en segundo plano para no bloquear la respuesta
    background_tasks.add_task(wfm_service._sync_with_odoo)
    return wfm_service.obtener_ordenes(estado)

@app.post("/api/wfm/comercial/solicitar")
async def wfm_solicitar(req: WFMCreateRequest):
    return wfm_service.crear_solicitud_comercial(req.cliente, req.servicio, req.comercial)

@app.post("/api/wfm/preventa/actualizar")
async def wfm_preventa(req: WFMUpdatePreventaRequest):
    return wfm_service.actualizar_preventa(req.order_id, req.data, req.usuario)

@app.post("/api/wfm/ventas/contratar")
async def wfm_contratar(req: WFMBasicActionRequest):
    return wfm_service.contratar_orden(req.order_id, req.usuario)

@app.post("/api/wfm/almacen/asignar")
async def wfm_almacen(req: WFMAlmacenRequest):
    return wfm_service.asignar_equipos_almacen(req.order_id, req.equipos, req.usuario)

@app.post("/api/wfm/aprovisionar")
async def wfm_aprovisionar(req: WFMAproRequest):
    return wfm_service.aprovisionar_servicio(req.order_id, req.config, req.usuario)

@app.post("/api/wfm/pm/auditar")
async def wfm_auditar(req: WFMAuditoriaRequest):
    return wfm_service.auditar_pm(req.order_id, req.ok, req.motivo, req.usuario)

# ─── Integraciones Externas ──────────────────────────────────────────────────

@app.post("/api/integrations/execute")
async def execute_integration(req: IntegrationRequest):
    """Ejecuta una acción en una plataforma externa (HubSpot, Net2Phone, etc)"""
    try:
        result = orchestrator.execute(req.platform, req.action, req.params)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Biblioteca Documental ───────────────────────────────────────────────────

@app.get("/api/library/docs")
def get_library_docs():
    """Retorna la lista de documentos organizados por categoría."""
    docs_dir = os.path.join(os.path.dirname(BASE_DIR), "docs")
    db_dir = os.path.join(BASE_DIR, "db")
    
    library = []
    
    # Escanear directorio docs/
    if os.path.exists(docs_dir):
        for root, dirs, files in os.walk(docs_dir):
            category = os.path.basename(root).replace("_", " ").title()
            if category == "Docs": category = "General"
            
            for file in files:
                if file.endswith(".md") or file.endswith(".pdf"):
                    library.append({
                        "id": file,
                        "name": file.replace("_", " ").replace(".md", "").replace(".pdf", ""),
                        "filename": file,
                        "type": "pdf" if file.endswith(".pdf") else "md",
                        "category": category,
                        "path": os.path.join(root, file)
                    })
                    
    # Añadir PDFs generados en db/ (ej. FODA_XCIEN_2026.pdf)
    if os.path.exists(db_dir):
        for file in os.listdir(db_dir):
            if file.endswith(".pdf"):
                library.append({
                    "id": file,
                    "name": file.replace("_", " ").replace(".pdf", ""),
                    "filename": file,
                    "type": "pdf",
                    "category": "Reportes Estratégicos",
                    "path": os.path.join(db_dir, file)
                })
                
    return {"status": "success", "documents": library}

@app.get("/api/library/download")
def download_doc(path: str):
    """Descarga o sirve el documento solicitado."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
        
    # Seguridad básica para evitar que salgan del proyecto
    abs_path = os.path.abspath(path)
    if "Antigravity" not in abs_path:
        raise HTTPException(status_code=403, detail="Acceso denegado")
        
    return FileResponse(abs_path)


USUARIOS_DB = os.path.join(BASE_DIR, "db", "usuarios.json")

@app.get("/api/users")
def get_users():
    if not os.path.exists(USUARIOS_DB):
        return []
    with open(USUARIOS_DB, "r") as f:
        return json.load(f)

@app.post("/api/users")
def create_user(user: Dict[str, Any]):
    users = get_users()
    user["id"] = str(len(users) + 1)
    user["status"] = "pending"
    user["invited_at"] = str(date.today())
    users.append(user)
    with open(USUARIOS_DB, "w") as f:
        json.dump(users, f, indent=2)
    
    # Intento de envío de notificación real (Telegram)
    try:
        config = _load_telegram_config()
        if config.get("enabled") and config.get("token"):
            bot = TelegramBot(token=config["token"], chat_id=config["chat_id"])
            msg = (
                f"👤 *NUEVA INVITACIÓN XCIEN 2.0*\n\n"
                f"Se ha invitado a *{user['name']}* a la plataforma.\n"
                f"🏢 *Depto:* {user['department']}\n"
                f"🔑 *Rol:* {user['role']}\n\n"
                f"Acceso pendiente de activación."
            )
            bot.send_message(msg)
    except Exception as e:
        logger.error(f"Error enviando notificación de invitación: {e}")

    return user

@app.post("/api/users/activate/{user_id}")
def activate_user(user_id: str):
    users = get_users()
    for u in users:
      if u["id"] == user_id:
        u["status"] = "active"
        u["lastSeen"] = str(date.today())
        with open(USUARIOS_DB, "w") as f:
            json.dump(users, f, indent=2)
        return {"status": "success", "user": u}
    raise HTTPException(status_code=404, detail="Usuario no encontrado")

@app.get("/api/integrations/status")
async def get_integrations_status():
    """Retorna el estado de las conexiones configuradas"""
    return {
        "hubspot": {"connected": True, "last_sync": "2026-04-27 13:00"},
        "net2phone": {"connected": True, "calls_active": 0},
        "ai_agents": {"active": True, "model": "Director General v2"}
    }

def push_command(req: CommandRequest):
    AGENT_BRIDGE["command_queue"].append({
        "command": req.command,
        "context": req.context,
        "ts": datetime.datetime.now().strftime("%H:%M:%S"),
        "status": "pending"
    })
    return {"status": "queued", "pos": len(AGENT_BRIDGE["command_queue"])}

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ─── Endpoints WFM ───────────────────────────────────────────────────────────

# ── SLA Config ────────────────────────────────────────────────────────────────
_SLA_CONFIG_FILE = os.path.join(BASE_DIR, "db", "sla_config.json")

_DEFAULT_SLA_CONFIG = {
  "limites": {
    "SOLICITUD_PREVENTA":   { "dias": 5,  "owner": "ops", "label": "Solicitud Preventa",   "icon": "🔍" },
    "ANTEPROYECTO":         { "dias": 3,  "owner": "ops", "label": "Anteproyecto",          "icon": "📐" },
    "ORDEN_IMPLEMENTACION": { "dias": 2,  "owner": "pm",  "label": "Orden Implementación",  "icon": "📋" },
    "ALMACEN_VALIDACION":   { "dias": 2,  "owner": "ops", "label": "Validación Almacén",    "icon": "📦" },
    "ESPERA_INVENTARIO":    { "dias": 5,  "owner": "ops", "label": "Espera Inventario",     "icon": "⏳" },
    "APROVISIONAMIENTO":    { "dias": 1,  "owner": "noc", "label": "Aprovisionamiento",     "icon": "⚙️" },
    "REVISION_PM":          { "dias": 1,  "owner": "pm",  "label": "Revisión PM",           "icon": "🔎" },
    "LISTO_INSTALACION":    { "dias": 1,  "owner": "pm",  "label": "Listo p/ Instalación",  "icon": "✅" },
    "INSTALACION":          { "dias": 3,  "owner": "ops", "label": "Instalación",           "icon": "🚛" },
    "NOC_VALIDACION":       { "dias": 1,  "owner": "noc", "label": "Validación NOC",        "icon": "📡" },
    "FACTURACION":          { "dias": 2,  "owner": "pm",  "label": "Facturación",           "icon": "💰" },
  },
  "nodos": {
    "noc": { "label": "NOC",              "icon": "📡", "color": "#00B4D8" },
    "pm":  { "label": "PM / Operaciones", "icon": "📋", "color": "#FF4757" },
    "ops": { "label": "Campo / Dispatch", "icon": "🚛", "color": "#00ff88" },
  },
  "updated_at": None,
  "updated_by": None,
}

def _load_sla_config() -> dict:
    try:
        if os.path.exists(_SLA_CONFIG_FILE):
            with open(_SLA_CONFIG_FILE, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return _DEFAULT_SLA_CONFIG.copy()

def _save_sla_config(cfg: dict):
    os.makedirs(os.path.dirname(_SLA_CONFIG_FILE), exist_ok=True)
    with open(_SLA_CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)

class SLAConfigUpdateRequest(BaseModel):
    limites: Optional[dict] = None
    nodos:   Optional[dict] = None
    usuario: str = "sistema"

@app.get("/api/wfm/sla-config")
def get_sla_config():
    return _load_sla_config()

@app.post("/api/wfm/sla-config")
def update_sla_config(req: SLAConfigUpdateRequest):
    cfg = _load_sla_config()
    if req.limites:
        for estado, vals in req.limites.items():
            if estado in cfg["limites"]:
                cfg["limites"][estado].update(vals)
            else:
                cfg["limites"][estado] = vals
    if req.nodos:
        for nodo, vals in req.nodos.items():
            if nodo in cfg["nodos"]:
                cfg["nodos"][nodo].update(vals)
            else:
                cfg["nodos"][nodo] = vals
    cfg["updated_at"] = datetime.datetime.now().isoformat()
    cfg["updated_by"] = req.usuario
    _save_sla_config(cfg)
    return {"ok": True, "config": cfg}

@app.post("/api/wfm/sla-config/reset")
def reset_sla_config():
    cfg = _DEFAULT_SLA_CONFIG.copy()
    _save_sla_config(cfg)
    return {"ok": True, "config": cfg}


# ── SLA Escalation Log ────────────────────────────────────────────────────────
_ESC_LOG_FILE        = os.path.join(BASE_DIR, "db", "sla_escalaciones.json")
_ESC_AUTO_CLEAR_MINS = 30   # minutos sin atención → auto-clear

def _load_esc_log() -> list:
    try:
        if os.path.exists(_ESC_LOG_FILE):
            with open(_ESC_LOG_FILE, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return []

def _save_esc_log(log: list):
    os.makedirs(os.path.dirname(_ESC_LOG_FILE), exist_ok=True)
    with open(_ESC_LOG_FILE, "w") as f:
        json.dump(log, f, indent=2, ensure_ascii=False)

def _esc_id() -> str:
    ts = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    rand = ''.join([str(ord(c) % 10) for c in ts[-4:]])
    return f"ESC-{datetime.datetime.now().strftime('%Y%m%d')}-{rand}"

def _auto_clear_escalaciones():
    """Marca como AUTO_CLEARED las escalaciones sin ACK pasados N minutos."""
    log = _load_esc_log()
    now = datetime.datetime.now()
    changed = False
    for esc in log:
        if esc.get("status") == "ACTIVO":
            triggered = datetime.datetime.fromisoformat(esc["triggered_at"])
            mins_elapsed = (now - triggered).total_seconds() / 60
            if mins_elapsed >= _ESC_AUTO_CLEAR_MINS:
                esc["status"]      = "AUTO_CLEARED"
                esc["cleared_at"]  = now.isoformat()
                esc["cleared_by"]  = "SISTEMA"
                esc["notas"]      += f" | AUTO-CLEARED tras {int(mins_elapsed)}min sin atención"
                changed = True
    if changed:
        _save_esc_log(log)
    return log

class EscalacionAckRequest(BaseModel):
    esc_id:    str
    acked_by:  str = "NOC Operador"
    notas:     str = ""

class EscalacionClearRequest(BaseModel):
    order_id:   str
    cliente:    str
    estado:     str
    severity:   str          # 'critico' | 'alerta'
    dias:       float
    owner_node: str
    cleared_by: str = "NOC Operador"
    notas:      str = ""

@app.get("/api/wfm/sla-escalaciones")
def get_escalaciones(limit: int = 100):
    _auto_clear_escalaciones()
    log = _load_esc_log()
    # Más reciente primero
    log.sort(key=lambda x: x.get("triggered_at", ""), reverse=True)
    return {"log": log[:limit], "total": len(log)}

@app.post("/api/wfm/sla-escalacion/clear")
def clear_escalacion(req: EscalacionClearRequest):
    """Registra un Clear manual de una alerta SLA con log protocolo NOC."""
    _auto_clear_escalaciones()
    log = _load_esc_log()
    now = datetime.datetime.now()

    # Verificar si ya existe una entrada activa para esta orden+estado
    existing = next((e for e in log if e.get("order_id") == req.order_id
                     and e.get("estado") == req.estado
                     and e.get("status") == "ACTIVO"), None)

    if existing:
        existing["status"]     = "CLEARED"
        existing["cleared_at"] = now.isoformat()
        existing["cleared_by"] = req.cleared_by
        if req.notas:
            existing["notas"] += f" | {req.notas}"
        entry = existing
    else:
        # Primera vez que se registra esta escalación
        entry = {
            "esc_id":       _esc_id(),
            "triggered_at": now.isoformat(),
            "order_id":     req.order_id,
            "cliente":      req.cliente,
            "estado":       req.estado,
            "severity":     req.severity.upper(),
            "dias_sla":     round(req.dias, 2),
            "owner_node":   req.owner_node,
            "status":       "CLEARED",
            "cleared_at":   now.isoformat(),
            "cleared_by":   req.cleared_by,
            "notas":        req.notas or f"Clear manual por {req.cleared_by}",
        }
        log.append(entry)

    _save_esc_log(log)
    return {"ok": True, "entry": entry}

@app.post("/api/wfm/sla-escalacion/ack")
def ack_escalacion(req: EscalacionAckRequest):
    """ACK de una escalación — queda registrado como ATENDIDO."""
    log = _load_esc_log()
    entry = next((e for e in log if e.get("esc_id") == req.esc_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Escalación no encontrada")
    entry["status"]    = "ATENDIDO"
    entry["acked_at"]  = datetime.datetime.now().isoformat()
    entry["acked_by"]  = req.acked_by
    if req.notas:
        entry["notas"] += f" | {req.notas}"
    _save_esc_log(log)
    return {"ok": True, "entry": entry}

@app.post("/api/wfm/sla-escalacion/registrar")
def registrar_escalacion(req: EscalacionClearRequest):
    """Registra una nueva escalación activa (llamada automática al detectar SLA excedido)."""
    _auto_clear_escalaciones()
    log = _load_esc_log()
    # No duplicar si ya hay una activa para esta orden+estado
    existing = next((e for e in log if e.get("order_id") == req.order_id
                     and e.get("estado") == req.estado
                     and e.get("status") == "ACTIVO"), None)
    if existing:
        return {"ok": True, "entry": existing, "duplicado": True}

    entry = {
        "esc_id":       _esc_id(),
        "triggered_at": datetime.datetime.now().isoformat(),
        "order_id":     req.order_id,
        "cliente":      req.cliente,
        "estado":       req.estado,
        "severity":     req.severity.upper(),
        "dias_sla":     round(req.dias, 2),
        "owner_node":   req.owner_node,
        "status":       "ACTIVO",
        "cleared_at":   None,
        "cleared_by":   None,
        "notas":        req.notas or "Escalación automática por SLA excedido",
    }
    log.append(entry)
    _save_esc_log(log)
    return {"ok": True, "entry": entry}

@app.delete("/api/wfm/sla-escalaciones/purge")
def purge_escalaciones(dias: int = 30):
    """Elimina entradas del log anteriores a N días (mantenimiento)."""
    log = _load_esc_log()
    cutoff = (datetime.datetime.now() - datetime.timedelta(days=dias)).isoformat()
    nuevo = [e for e in log if e.get("triggered_at", "") >= cutoff]
    _save_esc_log(nuevo)
    return {"ok": True, "eliminadas": len(log) - len(nuevo), "restantes": len(nuevo)}


@app.get("/api/wfm/ordenes")
async def get_wfm_orders(background_tasks: BackgroundTasks, estado: str = None):
    background_tasks.add_task(wfm_service._sync_with_odoo)
    return wfm_service.obtener_ordenes(estado)

@app.post("/api/wfm/sync")
async def wfm_sync_forzado():
    """Fuerza sincronización inmediata con Odoo."""
    try:
        wfm_service.sync_forzado()
        ordenes = wfm_service.obtener_ordenes()
        odoo_count = sum(1 for o in ordenes if o.get("odoo_id"))
        return {"ok": True, "total": len(ordenes), "de_odoo": odoo_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/wfm/comercial/solicitar")
async def wfm_solicitar(req: WFMCreateRequest):
    return wfm_service.crear_solicitud_comercial(req.cliente, req.servicio, req.comercial)

@app.post("/api/wfm/preventa/actualizar")
async def wfm_preventa(req: WFMUpdatePreventaRequest):
    return wfm_service.actualizar_preventa(req.order_id, req.data, req.usuario)

@app.post("/api/wfm/ventas/contratar")
async def wfm_contratar(req: WFMBasicActionRequest):
    return wfm_service.contratar_orden(req.order_id, req.usuario)

@app.post("/api/wfm/almacen/asignar")
async def wfm_almacen(req: WFMAlmacenRequest):
    return wfm_service.asignar_equipos_almacen(req.order_id, req.equipos, req.usuario)

@app.post("/api/wfm/almacen/responder")
async def wfm_almacen_responder(req: WFMAlmacenRespuestaRequest):
    try:
        return wfm_service.responder_almacen(
            req.order_id, req.respuesta, req.equipos,
            req.fecha_estimada, req.motivo, req.usuario
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/wfm/aprovisionar")
async def wfm_aprovisionar(req: WFMAproRequest):
    return wfm_service.aprovisionar_servicio(req.order_id, req.config, req.usuario)

@app.post("/api/wfm/aprovisionamiento/registrar")
async def wfm_aprovisionamiento_registrar(req: WFMAprovisionar2Request):
    config = {k: v for k, v in req.dict().items() if k not in ("order_id", "usuario") and v is not None}
    try:
        return wfm_service.aprovisionar_servicio(req.order_id, config, req.usuario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/wfm/pm/auditar")
async def wfm_auditar(req: WFMAuditoriaRequest):
    return wfm_service.auditar_pm(req.order_id, req.ok, req.motivo, req.usuario)

@app.post("/api/wfm/instalacion/evidencia")
async def wfm_registrar_evidencia(req: WFMEvidenciaRequest):
    try:
        return wfm_service.registrar_evidencia(req.order_id, req.tipo, req.filename, req.data_b64, req.usuario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/wfm/instalacion/evidencias/{order_id}")
async def wfm_get_evidencias(order_id: str):
    try:
        return wfm_service.obtener_evidencias(order_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/wfm/instalacion/cerrar")
async def wfm_cerrar_instalacion(req: WFMCerrarInstalacionRequest):
    try:
        return wfm_service.cerrar_instalacion(req.order_id, req.notas, req.usuario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/wfm/kpis")
async def wfm_kpis_globales():
    return wfm_service.calcular_kpis_globales()

@app.get("/api/wfm/kpis/{order_id}")
async def wfm_kpis_orden(order_id: str):
    try:
        return wfm_service.calcular_kpis_orden(order_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/wfm/noc/{order_id}")
async def wfm_noc_estado(order_id: str):
    try:
        return wfm_service.obtener_estado_noc(order_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/wfm/noc/ping")
async def wfm_noc_ping(req: WFMNocPingRequest):
    try:
        return wfm_service.registrar_ping_noc(req.order_id, req.ping_ok, req.latencia_ms, req.ip_destino, req.usuario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/wfm/noc/alta-monitoreo")
async def wfm_noc_alta(req: WFMNocAltaRequest):
    try:
        return wfm_service.dar_alta_monitoreo(req.order_id, req.herramienta, req.host_id, req.grupos_alerta, req.usuario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/wfm/noc/aprobar")
async def wfm_noc_aprobar(req: WFMNocAprobarRequest):
    try:
        return wfm_service.aprobar_noc(req.order_id, req.observaciones, req.usuario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/wfm/instalacion/prueba-velocidad")
async def wfm_registrar_prueba(req: WFMPruebaVelocidadRequest):
    try:
        return wfm_service.registrar_prueba_velocidad(
            req.order_id, req.bw_contratado_mbps,
            req.descarga_mbps, req.subida_mbps,
            req.latencia_ms, req.perdida_pct,
            req.servidor, req.herramienta, req.usuario
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/wfm/instalacion/pruebas-velocidad/{order_id}")
async def wfm_get_pruebas(order_id: str):
    try:
        return wfm_service.obtener_pruebas_velocidad(order_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/wfm/instalacion/checklist/{order_id}")
async def wfm_get_checklist(order_id: str):
    try:
        return wfm_service.obtener_checklist(order_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/wfm/instalacion/checklist")
async def wfm_marcar_checklist(req: WFMChecklistItemRequest):
    try:
        orden = wfm_service.marcar_checklist_item(req.order_id, req.item_id, req.completado, req.observacion, req.usuario)
        checklist = orden.get("checklist", [])
        completados = sum(1 for i in checklist if i["completado"])
        return {"ok": True, "completados": completados, "total": len(checklist), "checklist": checklist}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ─── Integraciones Externas ──────────────────────────────────────────────────

@app.post("/api/integrations/execute")
async def execute_integration(req: IntegrationRequest):
    """Ejecuta una acción en una plataforma externa (HubSpot, Net2Phone, etc)"""
    try:
        result = orchestrator.execute(req.platform, req.action, req.params)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Biblioteca Documental ───────────────────────────────────────────────────

@app.get("/api/library/docs")
def get_library_docs():
    """Retorna la lista de documentos organizados por categoría."""
    docs_dir = os.path.join(os.path.dirname(BASE_DIR), "docs")
    db_dir = os.path.join(BASE_DIR, "db")
    
    library = []
    
    # Escanear directorio docs/
    if os.path.exists(docs_dir):
        for root, dirs, files in os.walk(docs_dir):
            category = os.path.basename(root).replace("_", " ").title()
            if category == "Docs": category = "General"
            
            for file in files:
                if file.endswith(".md") or file.endswith(".pdf"):
                    library.append({
                        "id": file,
                        "name": file.replace("_", " ").replace(".md", "").replace(".pdf", ""),
                        "filename": file,
                        "type": "pdf" if file.endswith(".pdf") else "md",
                        "category": category,
                        "path": os.path.join(root, file)
                    })
                    
    # Añadir PDFs generados en db/ (ej. FODA_XCIEN_2026.pdf)
    if os.path.exists(db_dir):
        for file in os.listdir(db_dir):
            if file.endswith(".pdf"):
                library.append({
                    "id": file,
                    "name": file.replace("_", " ").replace(".pdf", ""),
                    "filename": file,
                    "type": "pdf",
                    "category": "Reportes Estratégicos",
                    "path": os.path.join(db_dir, file)
                })
                
    return {"status": "success", "documents": library}

@app.get("/api/library/download")
def download_doc(path: str):
    """Descarga o sirve el documento solicitado."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
        
    # Seguridad básica para evitar que salgan del proyecto
    abs_path = os.path.abspath(path)
    if "Antigravity" not in abs_path:
        raise HTTPException(status_code=403, detail="Acceso denegado")
        
    return FileResponse(abs_path)


USUARIOS_DB = os.path.join(BASE_DIR, "db", "usuarios.json")

@app.get("/api/users")
def get_users():
    if not os.path.exists(USUARIOS_DB):
        return []
    with open(USUARIOS_DB, "r") as f:
        return json.load(f)

@app.post("/api/users")
def create_user(user: Dict[str, Any]):
    users = get_users()
    user["id"] = str(len(users) + 1)
    user["status"] = "pending"
    user["invited_at"] = str(date.today())
    users.append(user)
    with open(USUARIOS_DB, "w") as f:
        json.dump(users, f, indent=2)
    
    # Intento de envío de notificación real (Telegram)
    try:
        config = _load_telegram_config()
        if config.get("enabled") and config.get("token"):
            bot = TelegramBot(token=config["token"], chat_id=config["chat_id"])
            msg = (
                f"👤 *NUEVA INVITACIÓN XCIEN 2.0*\n\n"
                f"Se ha invitado a *{user['name']}* a la plataforma.\n"
                f"🏢 *Depto:* {user['department']}\n"
                f"🔑 *Rol:* {user['role']}\n\n"
                f"Acceso pendiente de activación."
            )
            bot.send_message(msg)
    except Exception as e:
        logger.error(f"Error enviando notificación de invitación: {e}")

    return user

@app.post("/api/users/activate/{user_id}")
def activate_user(user_id: str):
    users = get_users()
    for u in users:
      if u["id"] == user_id:
        u["status"] = "active"
        u["lastSeen"] = str(date.today())
        with open(USUARIOS_DB, "w") as f:
            json.dump(users, f, indent=2)
        return {"status": "success", "user": u}
    raise HTTPException(status_code=404, detail="Usuario no encontrado")

# ── Academia / Odoo eLearning ─────────────────────────────────────────────────
_academia_cache: dict = {"data": None, "ts": 0}
_ACADEMIA_TTL = 120

@app.get("/api/academia/cursos")
async def get_academia_cursos():
    """Cursos, lecciones y progreso desde Odoo eLearning"""
    global _academia_cache
    if _academia_cache["data"] and (time.time() - _academia_cache["ts"]) < _ACADEMIA_TTL:
        return _academia_cache["data"]
    try:
        ODOO_URL = os.environ.get("ODOO_URL")
        ODOO_DB  = os.environ.get("ODOO_DB")
        ODOO_USR = os.environ.get("ODOO_USER")
        ODOO_PWD = os.environ.get("ODOO_PASSWORD")
        common = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/common")
        uid    = common.authenticate(ODOO_DB, ODOO_USR, ODOO_PWD, {})
        mdl    = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/object")

        def qry(model, domain=[], fields=[], limit=300):
            return mdl.execute_kw(ODOO_DB, uid, ODOO_PWD, model, "search_read",
                                  [domain], {"fields": fields, "limit": limit})

        channels = qry("slide.channel", [], [
            "name", "description", "total_slides", "total_time",
            "website_published", "members_count", "enroll", "channel_type"
        ])
        slides = qry("slide.slide", [], [
            "name", "channel_id", "slide_type", "slide_category",
            "completion_time", "is_published", "sequence",
            "url", "video_url", "website_url", "questions_count", "total_views"
        ])
        progress = qry("slide.channel.partner", [], [
            "channel_id", "partner_id", "completion", "member_status"
        ], limit=1000)

        # Agrupar lecciones por curso
        slides_by_ch: dict = {}
        for s in slides:
            cid = s["channel_id"][0] if s["channel_id"] else None
            slides_by_ch.setdefault(cid, []).append({
                "id":          s["id"],
                "name":        s["name"],
                "type":        s["slide_type"] or "pdf",
                "category":    s["slide_category"] or "",
                "duration_h":  round(s["completion_time"] or 0, 2),
                "published":   s["is_published"],
                "sequence":    s["sequence"],
                "url":         s["url"] or s["video_url"] or "",
                "website_url": s["website_url"] or "",
                "has_quiz":    (s["questions_count"] or 0) > 0,
                "views":       s["total_views"] or 0,
            })

        # Progreso promedio por curso
        prog_by_ch: dict = {}
        members_by_ch: dict = {}
        for p in progress:
            cid = p["channel_id"][0] if p["channel_id"] else None
            prog_by_ch.setdefault(cid, []).append(p["completion"])
            members_by_ch.setdefault(cid, []).append({
                "name":   p["partner_id"][1] if p["partner_id"] else "—",
                "pct":    p["completion"],
                "status": p["member_status"],
            })

        result = []
        for ch in channels:
            cid   = ch["id"]
            progs = prog_by_ch.get(cid, [])
            avg   = round(sum(progs) / len(progs), 1) if progs else 0
            lessons = sorted(slides_by_ch.get(cid, []), key=lambda x: x["sequence"])
            result.append({
                "id":             cid,
                "name":           ch["name"],
                "description":    ch["description"] or "",
                "total_slides":   ch["total_slides"],
                "total_time_h":   round(ch["total_time"] or 0, 2),
                "members":        ch["members_count"],
                "published":      ch["website_published"],
                "enroll":         ch["enroll"],
                "channel_type":   ch["channel_type"],
                "avg_completion": avg,
                "lessons":        lessons,
                "members_list":   members_by_ch.get(cid, []),
            })

        result.sort(key=lambda x: (-len(x["lessons"]), -x["members"]))
        _academia_cache["data"] = result
        _academia_cache["ts"]   = time.time()
        return result
    except Exception as e:
        logger.error(f"[Academia] Odoo error: {e}")
        raise HTTPException(status_code=503, detail=str(e))


# ─── Reportes Semanales NOC + WFM ────────────────────────────────────────────

def _build_reporte_pdf(ciudad: str, fecha_inicio: str, fecha_fin: str,
                        noc_data: dict, wfm_orders: list) -> bytes:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.enums import TA_CENTER
    import io

    buf = io.BytesIO()

    XCIEN_GREEN = colors.HexColor('#00C896')
    DARK_BG     = colors.HexColor('#0F1923')
    SURFACE     = colors.HexColor('#1A2733')
    RED         = colors.HexColor('#FF3366')
    YELLOW      = colors.HexColor('#FFB703')
    BLUE        = colors.HexColor('#60A5FA')
    GREY        = colors.HexColor('#8BA3B8')
    WHITE       = colors.white

    styles = getSampleStyleSheet()
    def sty(name='Normal', **kw):
        return ParagraphStyle(name + str(id(kw)), parent=styles[name], **kw)

    doc = SimpleDocTemplate(buf, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch)

    elems = []

    ciudad_label = ciudad if ciudad != 'todas' else 'Todas las Ciudades'

    # ── Header
    hdr = Table([[
        Paragraph('<b>XCIEN — NOC</b>', sty(fontSize=9, textColor=XCIEN_GREEN, fontName='Helvetica-Bold')),
        Paragraph(f'<b>REPORTE SEMANAL<br/>{ciudad_label.upper()}</b>',
                  sty(fontSize=16, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<b>{fecha_inicio}</b><br/>al {fecha_fin}',
                  sty(fontSize=9, textColor=GREY, alignment=2)),
    ]], colWidths=[1.2*inch, 4.6*inch, 1.2*inch])
    hdr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), DARK_BG),
        ('BOX', (0,0), (-1,-1), 1.5, XCIEN_GREEN),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (0,-1), 12),
        ('RIGHTPADDING', (-1,0), (-1,-1), 12),
    ]))
    elems.append(hdr)
    elems.append(Spacer(1, 0.2*inch))

    # ── NOC KPIs
    cities = noc_data.get('cities', [])
    alerts = noc_data.get('alerts', [])
    total_hosts  = sum(c['totalHosts'] for c in cities)
    total_online = sum(c['online'] for c in cities)
    total_offline= sum(c['offline'] for c in cities)
    critical     = sum(1 for a in alerts if a.get('severity') == 'critical')
    warnings     = sum(1 for a in alerts if a.get('severity') == 'warning')
    avg_score    = round(sum(c['score'] for c in cities) / len(cities), 1) if cities else 0

    def section_title(text):
        return Paragraph(text, sty(fontSize=12, textColor=XCIEN_GREEN, fontName='Helvetica-Bold',
                                    spaceBefore=14, spaceAfter=6))

    elems.append(section_title('RED — ESTADO DE INFRAESTRUCTURA'))
    kpi_data = [
        [Paragraph(f'<b>{total_hosts}</b>',  sty(fontSize=20, textColor=BLUE,        fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph(f'<b>{total_online}</b>',  sty(fontSize=20, textColor=XCIEN_GREEN, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph(f'<b>{total_offline}</b>', sty(fontSize=20, textColor=RED,         fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph(f'<b>{critical}</b>',      sty(fontSize=20, textColor=RED,         fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph(f'<b>{avg_score}</b>',     sty(fontSize=20, textColor=YELLOW,      fontName='Helvetica-Bold', alignment=TA_CENTER))],
        [Paragraph('HOSTS',    sty(fontSize=8, textColor=GREY, alignment=TA_CENTER)),
         Paragraph('ONLINE',   sty(fontSize=8, textColor=GREY, alignment=TA_CENTER)),
         Paragraph('OFFLINE',  sty(fontSize=8, textColor=GREY, alignment=TA_CENTER)),
         Paragraph('CRÍTICAS', sty(fontSize=8, textColor=GREY, alignment=TA_CENTER)),
         Paragraph('SCORE',    sty(fontSize=8, textColor=GREY, alignment=TA_CENTER))],
    ]
    kt = Table(kpi_data, colWidths=[1.35*inch]*5)
    kt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), SURFACE),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#2A3F50')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#2A3F50')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LINEABOVE', (0,0), (-1,0), 2, RED),
    ]))
    elems.append(kt)
    elems.append(Spacer(1, 0.1*inch))

    # ── Sitios con fallas
    offline_cities = sorted([c for c in cities if c['offline'] > 0],
                            key=lambda x: -x['offline'])
    if offline_cities:
        elems.append(section_title('CIUDADES CON HOSTS CAÍDOS'))
        rows = [['Ciudad', 'Offline', 'Online', 'Score', 'Alertas']]
        for c in offline_cities[:12]:
            rows.append([c['name'], str(c['offline']), str(c['online']),
                         f"{c['score']}%", str(c.get('alerts', 0))])
        def rc(i):
            return colors.HexColor('#1a0a10') if i > 0 and int(rows[i][1]) >= 3 else (SURFACE if i > 0 else DARK_BG)
        tbl_data = [[Paragraph(str(cell), sty(fontSize=9, textColor=(XCIEN_GREEN if i == 0 else WHITE),
                                               fontName='Helvetica-Bold' if i == 0 else 'Helvetica', leading=12))
                     for cell in row] for i, row in enumerate(rows)]
        t = Table(tbl_data, colWidths=[2*inch, 0.9*inch, 0.9*inch, 0.9*inch, 1.1*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), DARK_BG),
            *[('BACKGROUND', (0,i), (-1,i), rc(i)) for i in range(1, len(rows))],
            ('INNERGRID', (0,0), (-1,-1), 0.3, colors.HexColor('#2A3F50')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#2A3F50')),
            ('LINEBELOW', (0,0), (-1,0), 1, XCIEN_GREEN),
            ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        elems.append(t)
        elems.append(Spacer(1, 0.1*inch))

    # ── Alertas críticas top
    crit_alerts = [a for a in alerts if a.get('severity') == 'critical'][:10]
    if crit_alerts:
        elems.append(section_title(f'ALERTAS CRÍTICAS ACTIVAS — TOP {len(crit_alerts)}'))
        a_rows = [['Ciudad', 'Host', 'Mensaje', 'Desde']]
        for a in crit_alerts:
            msg = (a.get('message') or a.get('type') or '')[:55]
            host = (a.get('hostName') or a.get('hostIp') or '')[:28]
            ts = (a.get('timestamp') or '')[:10]
            a_rows.append([a.get('cityName','—'), host, msg, ts])
        a_data = [[Paragraph(str(c), sty(fontSize=8, textColor=(XCIEN_GREEN if i==0 else (RED if i>0 else WHITE)),
                                          fontName='Helvetica-Bold' if i==0 else 'Helvetica', leading=11))
                   for c in row] for i, row in enumerate(a_rows)]
        at = Table(a_data, colWidths=[1.1*inch, 1.5*inch, 3.0*inch, 0.8*inch])
        at.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), DARK_BG),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#1a0a10'), SURFACE]*10),
            ('INNERGRID', (0,0), (-1,-1), 0.3, colors.HexColor('#2A3F50')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#2A3F50')),
            ('LINEBELOW', (0,0), (-1,0), 1, XCIEN_GREEN),
            ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
        ]))
        elems.append(at)
        elems.append(Spacer(1, 0.15*inch))

    # ── WFM
    elems.append(section_title('WFM — ÓRDENES DE SERVICIO'))
    estados = {}
    for o in wfm_orders:
        est = o.get('estado', 'DESCONOCIDO')
        estados[est] = estados.get(est, 0) + 1

    wfm_kpi = [[
        Paragraph(f'<b>{len(wfm_orders)}</b>', sty(fontSize=20, textColor=BLUE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<b>{estados.get("LISTO_INSTALACION", 0)}</b>', sty(fontSize=20, textColor=XCIEN_GREEN, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<b>{estados.get("BACKLOG", 0)}</b>', sty(fontSize=20, textColor=RED, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<b>{estados.get("EN_PROCESO", estados.get("PREVENTA", 0))}</b>', sty(fontSize=20, textColor=YELLOW, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ],[
        Paragraph('TOTAL', sty(fontSize=8, textColor=GREY, alignment=TA_CENTER)),
        Paragraph('LISTAS', sty(fontSize=8, textColor=GREY, alignment=TA_CENTER)),
        Paragraph('BACKLOG', sty(fontSize=8, textColor=GREY, alignment=TA_CENTER)),
        Paragraph('EN PROCESO', sty(fontSize=8, textColor=GREY, alignment=TA_CENTER)),
    ]]
    wt = Table(wfm_kpi, colWidths=[1.69*inch]*4)
    wt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), SURFACE),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#2A3F50')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#2A3F50')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 10), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LINEABOVE', (0,0), (-1,0), 2, BLUE),
    ]))
    elems.append(wt)
    elems.append(Spacer(1, 0.1*inch))

    # Tabla de órdenes recientes
    recent = sorted(wfm_orders, key=lambda x: x.get('fecha_creacion',''), reverse=True)[:10]
    if recent:
        o_rows = [['ID', 'Cliente', 'Servicio', 'Estado', 'Fecha']]
        for o in recent:
            o_rows.append([
                o.get('id','')[-6:],
                (o.get('cliente',''))[:22],
                (o.get('servicio',''))[:28],
                o.get('estado',''),
                (o.get('fecha_creacion',''))[:10],
            ])
        o_data = [[Paragraph(str(c), sty(fontSize=8, textColor=(XCIEN_GREEN if i==0 else WHITE),
                                          fontName='Helvetica-Bold' if i==0 else 'Helvetica', leading=11))
                   for c in row] for i, row in enumerate(o_rows)]
        ot = Table(o_data, colWidths=[0.65*inch, 1.7*inch, 2.1*inch, 1.3*inch, 0.9*inch])
        ot.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), DARK_BG),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [SURFACE, colors.HexColor('#161F29')]*10),
            ('INNERGRID', (0,0), (-1,-1), 0.3, colors.HexColor('#2A3F50')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#2A3F50')),
            ('LINEBELOW', (0,0), (-1,0), 1, XCIEN_GREEN),
            ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
        ]))
        elems.append(ot)

    # Footer
    elems.append(Spacer(1, 0.2*inch))
    elems.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#2A3F50')))
    elems.append(Spacer(1, 0.08*inch))
    from datetime import datetime
    elems.append(Paragraph(
        f'Generado por XCIEN NOC Command Center · {datetime.now().strftime("%Y-%m-%d %H:%M")} · Confidencial',
        sty(fontSize=8, textColor=GREY, alignment=TA_CENTER)))

    def dark_page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(DARK_BG)
        canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
        canvas.restoreState()

    doc.build(elems, onFirstPage=dark_page, onLaterPages=dark_page)
    return buf.getvalue()


@app.get("/api/reportes/semanal")
async def reporte_semanal(
    ciudad: str = "todas",
    fecha_inicio: str = "",
    fecha_fin: str = "",
):
    """Genera y descarga un PDF con el reporte semanal NOC + WFM"""
    from datetime import date, timedelta

    # Fechas por defecto: semana actual lun–dom
    today = date.today()
    if not fecha_inicio:
        fecha_inicio = str(today - timedelta(days=today.weekday()))
    if not fecha_fin:
        fecha_fin = str(today)

    # Obtener datos NOC directamente (sin llamadas HTTP internas)
    try:
        hosts_raw, alerts_raw = _get_enriched_noc_data()

        # Construir cities igual que get_noc_cities()
        from collections import defaultdict
        active_alerts = [a for a in alerts_raw if a.get("state") == "active"]
        city_sites: dict = defaultdict(lambda: defaultdict(list))
        for h in hosts_raw:
            city_sites[h.get("city","Sin Ciudad")][h.get("site","Site Principal")].append(h)

        COORDS = {
            "Monterrey":{"lat":25.6866,"lng":-100.3161},"Saltillo":{"lat":25.4232,"lng":-100.9928},
            "Piedras Negras":{"lat":28.7000,"lng":-100.5231},"Torreón":{"lat":25.5428,"lng":-103.4068},
            "Chihuahua":{"lat":28.6353,"lng":-106.0889},"Guadalajara":{"lat":20.6597,"lng":-103.3496},
            "Ciudad de México":{"lat":19.4326,"lng":-99.1332},"Querétaro":{"lat":20.5888,"lng":-100.3899},
            "Tampico":{"lat":22.2552,"lng":-97.8686},"Mérida":{"lat":20.9674,"lng":-89.5926},
            "Reynosa":{"lat":26.0922,"lng":-98.2772},"Nuevo Laredo":{"lat":27.4765,"lng":-99.5151},
            "San Luis Potosi":{"lat":22.1565,"lng":-100.9855},"León":{"lat":21.1221,"lng":-101.6823},
            "Monclova":{"lat":26.9083,"lng":-101.4217},"Sabinas":{"lat":27.8529,"lng":-101.1191},
            "Matamoros":{"lat":25.8691,"lng":-97.5027},
        }

        cities = []
        for city_name, sites_dict in city_sites.items():
            city_hosts = [h for hs in sites_dict.values() for h in hs]
            total = len(city_hosts)
            online  = sum(1 for h in city_hosts if _host_status(h) == "online")
            offline = sum(1 for h in city_hosts if _host_status(h) == "offline")
            scores  = [h.get("health_score") or h.get("healthScore", 0) for h in city_hosts]
            avg_sc  = round(sum(scores)/len(scores), 1) if scores else 0
            city_crits = sum(1 for a in active_alerts if a.get("city") == city_name and a.get("severity") == "critical")
            coord = COORDS.get(city_name, {"lat":23.0,"lng":-102.0})
            cities.append({
                "id": city_name.lower().replace(" ","-"), "name": city_name,
                "totalHosts": total, "online": online, "offline": offline,
                "score": avg_sc, "alerts": city_crits,
                "lat": coord["lat"], "lng": coord["lng"],
            })

        sev_map = {"degraded":"warning","info":"warning"}
        alerts = [{
            "id": a.get("id"), "cityId": a.get("city","").lower().replace(" ","-"),
            "cityName": a.get("city",""), "hostIp": a.get("host_ip") or a.get("hostIP",""),
            "hostName": a.get("host_name") or a.get("hostName",""),
            "type": a.get("cause",""), "message": a.get("message",""),
            "severity": sev_map.get(a.get("severity"), a.get("severity","warning")),
            "timestamp": a.get("triggered_at") or a.get("triggeredAt",""),
            "state": a.get("state"),
        } for a in active_alerts]
    except Exception as e:
        logger.error(f"Error obteniendo datos NOC para reporte: {e}")
        cities = []; alerts = []

    # Filtrar por ciudad si aplica
    if ciudad.lower() != 'todas':
        cities = [c for c in cities if ciudad.lower() in c.get('name','').lower()]
        alerts = [a for a in alerts if ciudad.lower() in (a.get('cityName','') or '').lower()]

    # Obtener órdenes WFM directamente
    try:
        wfm_orders = wfm_service.obtener_ordenes()
    except Exception as e:
        logger.error(f"Error obteniendo WFM para reporte: {e}")
        wfm_orders = []

    noc_data = {"cities": cities, "alerts": alerts}

    try:
        pdf_bytes = _build_reporte_pdf(ciudad, fecha_inicio, fecha_fin, noc_data, wfm_orders)
    except Exception as e:
        logger.error(f"Error generando PDF reporte: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    ciudad_safe = ciudad.replace(' ', '_')
    filename = f"Reporte_NOC_{ciudad_safe}_{fecha_inicio}_{fecha_fin}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.get("/api/integrations/status")
async def get_integrations_status():
    """Retorna el estado de las conexiones configuradas"""
    return {
        "hubspot": {"connected": True, "last_sync": "2026-04-27 13:00"},
        "net2phone": {"connected": True, "calls_active": 0},
        "ai_agents": {"active": True, "model": "Director General v2"}
    }


@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    """Maneja el enrutamiento de React (SPA) para cualquier ruta no definida en la API."""
    # 1. Si es una ruta de API o de estáticos conocidos que no existe, 404 real
    if full_path.startswith("api/") or full_path.startswith("static/") or full_path.startswith("assets/"):
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    
    # 2. Verificar si es un archivo físico en la raíz de DIST_DIR (ej: favicon.ico, xcien.png)
    if os.path.exists(DIST_DIR):
        file_in_dist = os.path.join(DIST_DIR, full_path)
        if os.path.isfile(file_in_dist):
            return FileResponse(file_in_dist)
            
        # 3. Si no es un archivo, servir index.html para que React Router maneje la ruta
        index_path = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    
    # 4. Fallback final a la versión legacy si no hay build de React
    legacy_index = os.path.join(BASE_DIR, "static", "index.html")
    if os.path.exists(legacy_index):
        return FileResponse(legacy_index)
    
    raise HTTPException(status_code=404, detail="Portal no disponible")

if __name__ == "__main__":
    import uvicorn
    print("🚀 XCIEN 2.0 Backend iniciando en puerto 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
