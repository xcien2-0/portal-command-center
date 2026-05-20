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
from fastapi import FastAPI, HTTPException, Response, Request, Depends
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

ROOT_DIR = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(ROOT_DIR, ".env"), override=True)
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)  # backend/.env si existe

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
from agents import auth_service
from agents.auth_service import get_current_user, require_rol
from agents import uisp_service

# Instanciar el Director General y el SRE
dg_agent = DirectorGeneralV2()
sre_agent = DevOpsAgent()
wfm_service = WFMWorkflowService()

# Crear admin inicial si no hay usuarios
auth_service.init_admin()

print("🚀 [XCIEN-BACKEND] Servidor cargado/recargado correctamente.")

# ─── Cliente Claude ───────────────────────────────────────────────────────────
_claude_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def ask_claude(prompt: str) -> str:
    try:
        msg = _claude_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )
        return msg.content[0].text
    except Exception as e:
        logger.error(f"Error en comunicación con Claude: {e}")
        return '{"titulo": "Error de Conexión", "preguntas": []}'

def ask_claude_with_system(system: str, prompt: str) -> str:
    try:
        msg = _claude_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": prompt}]
        )
        return msg.content[0].text
    except Exception as e:
        logger.error(f"Error en ask_claude_with_system: {e}")
        return f"No se pudo procesar la consulta: {str(e)}"

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
        "http://localhost:8002",
        "http://127.0.0.1:8002",
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
    modulo: Optional[str] = None
    empresa: Optional[str] = "xcien"

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

class TransaccionUpdateRequest(BaseModel):
    empresa_origen: str = None
    empresa_destino: str = None
    area_origen: str = None
    area_destino: str = None
    concepto: str = None
    precio_mercado: float = None
    precio_preferencial: float = None
    responsable: str = None
    notas: str = None

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

# ─── RRHH Endpoints ───────────────────────────────────────────────────────────

@app.get("/api/rrhh/empleados")
def api_rrhh_empleados():
    """Lista completa de empleados desde Odoo."""
    fields = [
        'name', 'job_title', 'job_id', 'department_id', 'company_id',
        'work_email', 'mobile_phone', 'work_phone',
        'parent_id', 'active',
        'work_location_id', 'resource_calendar_id',
    ]
    # Usamos execute directamente para pasar fields/limit como kwargs (el conector tiene un bug con search_read)
    raw = odoo_conn.execute('hr.employee', 'search_read', [['active', '=', True]], fields=fields, limit=500)
    if raw is None:
        raise HTTPException(status_code=500, detail="Error conectando con Odoo")

    employees = []
    for e in raw:
        employees.append({
            "id": e.get("id"),
            "name": e.get("name", ""),
            "job_title": e.get("job_title") or (e["job_id"][1] if e.get("job_id") else ""),
            "department": e["department_id"][1] if e.get("department_id") else "Sin departamento",
            "department_id": e["department_id"][0] if e.get("department_id") else None,
            "company": e["company_id"][1] if e.get("company_id") else "",
            "company_id": e["company_id"][0] if e.get("company_id") else None,
            "email": e.get("work_email") or "",
            "phone": e.get("mobile_phone") or e.get("work_phone") or "",
            "manager": e["parent_id"][1] if e.get("parent_id") else None,
            "manager_id": e["parent_id"][0] if e.get("parent_id") else None,
            "location": e["work_location_id"][1] if e.get("work_location_id") else "",
            "schedule": e["resource_calendar_id"][1] if e.get("resource_calendar_id") else "",
            "avatar": None,  # loaded on demand via /api/rrhh/empleado/{id}
        })
    return employees


@app.get("/api/rrhh/stats")
def api_rrhh_stats():
    """Estadísticas globales de RRHH."""
    try:
        employees = api_rrhh_empleados()
    except Exception:
        employees = []

    from collections import Counter
    by_dept = Counter(e["department"] for e in employees)
    by_company = Counter(e["company"] for e in employees)
    by_location = Counter(e["location"] for e in employees if e["location"])

    return {
        "total": len(employees),
        "by_department": [{"name": k, "count": v} for k, v in by_dept.most_common(20)],
        "by_company": [{"name": k, "count": v} for k, v in by_company.most_common()],
        "by_location": [{"name": k, "count": v} for k, v in by_location.most_common(10)],
    }


@app.get("/api/rrhh/empleado/{emp_id}")
def api_rrhh_empleado_detalle(emp_id: int):
    """Detalle de un empleado."""
    fields = [
        'name', 'job_title', 'job_id', 'department_id', 'company_id',
        'work_email', 'mobile_phone', 'work_phone', 'parent_id',
        'child_ids', 'work_location_id', 'resource_calendar_id',
    ]
    raw = odoo_conn.execute('hr.employee', 'search_read', [['id', '=', emp_id]], fields=fields, limit=1)
    if raw is None:
        raise HTTPException(status_code=500, detail="Error conectando con Odoo")
    if not raw:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    e = raw[0]
    return {
        "id": e.get("id"),
        "name": e.get("name", ""),
        "job_title": e.get("job_title") or (e["job_id"][1] if e.get("job_id") else ""),
        "department": e["department_id"][1] if e.get("department_id") else "",
        "company": e["company_id"][1] if e.get("company_id") else "",
        "email": e.get("work_email") or "",
        "phone": e.get("mobile_phone") or e.get("work_phone") or "",
        "manager": e["parent_id"][1] if e.get("parent_id") else None,
        "location": e["work_location_id"][1] if e.get("work_location_id") else "",
        "schedule": e["resource_calendar_id"][1] if e.get("resource_calendar_id") else "",
        "avatar": None,
        "subordinates_count": len(e.get("child_ids") or []),
    }


@app.get("/api/rrhh/empleado/{emp_id}/foto")
def api_rrhh_empleado_foto(emp_id: int):
    """Devuelve la foto del empleado como imagen PNG. Usa hr.employee.public para acceso sin privilegios HR."""
    import base64
    # hr.employee.public expone image_128 sin requerir grupo HR Officer
    raw = odoo_conn.execute('hr.employee.public', 'search_read', [['id', '=', emp_id]], fields=['image_128'], limit=1)
    if raw and raw[0].get('image_128'):
        img_bytes = base64.b64decode(raw[0]['image_128'])
        return Response(content=img_bytes, media_type="image/png")
    # Fallback: intentar hr.employee con image_128 directamente
    raw2 = odoo_conn.execute('hr.employee', 'search_read', [['id', '=', emp_id]], fields=['image_128'], limit=1)
    if raw2 and raw2[0].get('image_128'):
        img_bytes = base64.b64decode(raw2[0]['image_128'])
        return Response(content=img_bytes, media_type="image/png")
    raise HTTPException(status_code=404, detail="Foto no disponible")


# ─── KMZ / Fibra Óptica Layers ────────────────────────────────────────────────

import zipfile as _zipfile
import xml.etree.ElementTree as _ET

_KMZ_DIR = os.path.join(BASE_DIR, "data", "kmz")

_KMZ_GROUPS = [
    {"id": "podi",     "label": "Fibra PODI · Cristales", "color": "#FF6B35", "subdir": "KMZ FIBRA PODI A CRISTALES 72 Y SUS DERIBACIONES"},
    {"id": "alpha",    "label": "Fibras Alpha",            "color": "#00B4D8", "subdir": "KMZ FIBRAS ALPHA"},
    {"id": "negras",   "label": "Piedras Negras",          "color": "#8B5CF6", "subdir": "KMZ PIEDRAS NEGRAS"},
    {"id": "saltillo", "label": "Saltillo",                "color": "#00A859", "subdir": "KMZ SALTILLO"},
]

def _kmz_to_geojson(kmz_path: str) -> dict:
    """Convierte un archivo KMZ a GeoJSON usando solo stdlib."""
    features = []
    try:
        with _zipfile.ZipFile(kmz_path, 'r') as z:
            kml_files = [f for f in z.namelist() if f.lower().endswith('.kml')]
            if not kml_files:
                return {"type": "FeatureCollection", "features": []}
            kml_data = z.read(kml_files[0]).decode('utf-8', errors='replace')
    except Exception as e:
        logger.error(f"KMZ read error {kmz_path}: {e}")
        return {"type": "FeatureCollection", "features": []}

    try:
        root = _ET.fromstring(kml_data)
    except Exception as e:
        logger.error(f"KML parse error {kmz_path}: {e}")
        return {"type": "FeatureCollection", "features": []}

    # Detectar namespace
    ns = root.tag.split('}')[0].lstrip('{') if '}' in root.tag else ''
    def tag(name): return f'{{{ns}}}{name}' if ns else name

    def parse_coords(text: str):
        pts = []
        for token in text.strip().split():
            parts = token.split(',')
            if len(parts) >= 2:
                try: pts.append([float(parts[0]), float(parts[1])])
                except: pass
        return pts

    for pm in root.iter(tag('Placemark')):
        name_el = pm.find(tag('name'))
        name = (name_el.text or '').strip() if name_el is not None else ''

        for ls in pm.iter(tag('LineString')):
            c = ls.find(tag('coordinates'))
            if c is not None and c.text:
                coords = parse_coords(c.text)
                if len(coords) >= 2:
                    features.append({"type": "Feature", "geometry": {"type": "LineString", "coordinates": coords}, "properties": {"name": name}})

        for pt in pm.iter(tag('Point')):
            c = pt.find(tag('coordinates'))
            if c is not None and c.text:
                parts = c.text.strip().split(',')
                if len(parts) >= 2:
                    try: features.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [float(parts[0]), float(parts[1])]}, "properties": {"name": name}})
                    except: pass

        for poly in pm.iter(tag('Polygon')):
            outer = poly.find(f'.//{tag("outerBoundaryIs")}/{tag("LinearRing")}/{tag("coordinates")}')
            if outer is not None and outer.text:
                coords = parse_coords(outer.text)
                if len(coords) >= 3:
                    features.append({"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [coords]}, "properties": {"name": name}})

    return {"type": "FeatureCollection", "features": features}

# Cache en memoria (cargado al primer request)
_kmz_cache: dict = {}
_kmz_index: list = []

def _ensure_kmz():
    global _kmz_cache, _kmz_index
    if _kmz_cache:
        return
    groups_out = []
    for grp in _KMZ_GROUPS:
        group_dir = os.path.join(_KMZ_DIR, grp["subdir"])
        if not os.path.isdir(group_dir):
            continue
        layers = []
        for fname in sorted(os.listdir(group_dir)):
            if not fname.lower().endswith('.kmz'):
                continue
            layer_id = f"{grp['id']}_{fname[:-4].replace(' ', '_').replace('/', '-')}"
            fpath = os.path.join(group_dir, fname)
            _kmz_cache[layer_id] = {"path": fpath, "geojson": None}  # lazy
            layers.append({"id": layer_id, "name": fname[:-4]})
        if layers:
            groups_out.append({"id": grp["id"], "label": grp["label"], "color": grp["color"], "layers": layers})
    _kmz_index = groups_out
    logger.info(f"KMZ index built: {sum(len(g['layers']) for g in groups_out)} layers in {len(groups_out)} groups")

@app.get("/api/red/kmz-capas")
def api_red_kmz_capas():
    """Lista de grupos y capas KMZ disponibles."""
    _ensure_kmz()
    return _kmz_index

@app.get("/api/red/kmz/{layer_id:path}")
def api_red_kmz_geojson(layer_id: str):
    """GeoJSON de una capa KMZ específica (con caché en memoria)."""
    _ensure_kmz()
    entry = _kmz_cache.get(layer_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Capa no encontrada")
    if entry["geojson"] is None:
        entry["geojson"] = _kmz_to_geojson(entry["path"])
    return entry["geojson"]

# ─── Sala de Juntas / Calendario ──────────────────────────────────────────────

import urllib.request as _urllib_req
import re as _re

def _parse_ical(text: str) -> list:
    """Parser iCal manual — extrae VEVENT sin dependencias externas."""
    events = []
    for block in _re.split(r'BEGIN:VEVENT', text)[1:]:
        end = block.find('END:VEVENT')
        block = block[:end] if end != -1 else block

        def field(name):
            # Handles multi-line folded values
            pattern = rf'(?:^|\n){name}(?:;[^\n:]*)?\:([^\n]*)(?:\n[ \t]([^\n]*))*'
            m = _re.search(pattern, block, _re.MULTILINE)
            if not m: return ''
            val = m.group(1) or ''
            # Unfold continuation lines
            val = _re.sub(r'\n[ \t]', '', val)
            return val.strip()

        def parse_dt(val: str) -> str:
            """Normaliza datetime iCal a ISO8601 (YYYYMMDDTHHMMSSZ → YYYY-MM-DDTHH:MM:SS)."""
            val = val.split(';')[-1]  # quitar TZID=...
            val = val.replace('Z', '')
            if 'T' in val:
                d, t = val.split('T')
                return f"{d[:4]}-{d[4:6]}-{d[6:8]}T{t[:2]}:{t[2:4]}:{t[4:6]}"
            return f"{val[:4]}-{val[4:6]}-{val[6:8]}T00:00:00"

        uid     = field('UID')
        summary = field('SUMMARY').replace('\\n', ' ').replace('\\,', ',')
        desc    = field('DESCRIPTION').replace('\\n', '\n').replace('\\,', ',')
        loc     = field('LOCATION').replace('\\,', ',')
        dtstart = field('DTSTART')
        dtend   = field('DTEND')

        if not summary or not dtstart:
            continue
        try:
            start = parse_dt(dtstart)
            end_  = parse_dt(dtend) if dtend else start
        except:
            continue

        events.append({
            'id':       uid or summary + start,
            'title':    summary,
            'start':    start,
            'end':      end_,
            'location': loc,
            'desc':     desc[:300] if desc else '',
            'source':   'gcal',
        })
    return events


@app.get("/api/calendario/eventos")
def api_calendario_eventos(start: str = '', end: str = ''):
    """Eventos Odoo: calendar.event + hr.leave aprobadas."""
    results = []

    # Dominio de fechas
    domain_cal: list = []
    domain_leave: list = []
    if start:
        domain_cal.append(['start', '>=', start])
        domain_leave.append(['date_from', '>=', start])
    if end:
        domain_cal.append(['stop', '<=', end])
        domain_leave.append(['date_to', '<=', end])

    # calendar.event
    raw_cal = odoo_conn.execute('calendar.event', 'search_read', domain_cal,
        fields=['name','start','stop','partner_ids','user_id','location','description'],
        limit=200) or []

    for e in raw_cal:
        results.append({
            'id':       f"odoo_cal_{e['id']}",
            'title':    e.get('name', ''),
            'start':    (e.get('start') or '').replace(' ', 'T'),
            'end':      (e.get('stop')  or '').replace(' ', 'T'),
            'location': e.get('location') or '',
            'desc':     (e.get('description') or '')[:300],
            'owner':    e['user_id'][1] if e.get('user_id') else '',
            'source':   'odoo_meeting',
        })

    # hr.leave (ausencias aprobadas)
    raw_leave = odoo_conn.execute('hr.leave', 'search_read',
        domain_leave + [['state', '=', 'validate']],
        fields=['name','date_from','date_to','employee_id','holiday_status_id','number_of_days'],
        limit=200) or []

    for e in raw_leave:
        emp = e['employee_id'][1] if e.get('employee_id') else ''
        tipo = e['holiday_status_id'][1] if e.get('holiday_status_id') else 'Ausencia'
        results.append({
            'id':     f"odoo_leave_{e['id']}",
            'title':  f"{emp} — {tipo}",
            'start':  (e.get('date_from') or '').replace(' ', 'T'),
            'end':    (e.get('date_to')   or '').replace(' ', 'T'),
            'days':   e.get('number_of_days', 1),
            'source': 'odoo_leave',
        })

    return results


_GCAL_TOKEN_FILE   = os.path.join(BASE_DIR, "data", "gcal_token.json")
_GCAL_SCOPES       = ["https://www.googleapis.com/auth/calendar.readonly"]
_GCAL_REDIRECT_URI = "http://localhost:8002/api/calendario/auth/callback"
_gcal_flow         = None   # guardamos el flow entre /auth y /callback

def _gcal_creds():
    """Devuelve credenciales válidas o None si no hay token."""
    if not os.path.exists(_GCAL_TOKEN_FILE):
        return None
    try:
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request as GRequest
        creds = Credentials.from_authorized_user_file(_GCAL_TOKEN_FILE, _GCAL_SCOPES)
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(GRequest())
            with open(_GCAL_TOKEN_FILE, "w") as f:
                f.write(creds.to_json())
        return creds if creds and creds.valid else None
    except Exception as e:
        logger.error(f"gcal_creds error: {e}")
        return None

@app.get("/api/calendario/auth/status")
def api_gcal_auth_status():
    """¿Está conectado Google Calendar?"""
    creds = _gcal_creds()
    return {"connected": creds is not None}

@app.get("/api/calendario/auth")
def api_gcal_auth():
    """Inicia el flujo OAuth de Google Calendar. Devuelve la URL de autorización."""
    global _gcal_flow
    client_id     = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=503, detail="GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET no configurados en .env")
    try:
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            from google_auth_oauthlib.flow import Flow
        _gcal_flow = Flow.from_client_config(
            {"web": {"client_id": client_id, "client_secret": client_secret,
                     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                     "token_uri": "https://oauth2.googleapis.com/token"}},
            scopes=_GCAL_SCOPES, redirect_uri=_GCAL_REDIRECT_URI,
        )
        auth_url, _ = _gcal_flow.authorization_url(prompt="consent", access_type="offline")
        return {"url": auth_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/calendario/auth/callback")
def api_gcal_callback(code: str = '', error: str = ''):
    """Callback OAuth — guarda el token y redirige al portal."""
    global _gcal_flow
    if error or not code:
        return RedirectResponse("/?gcal=error")
    try:
        _gcal_flow.fetch_token(code=code)
        creds = _gcal_flow.credentials
        os.makedirs(os.path.dirname(_GCAL_TOKEN_FILE), exist_ok=True)
        with open(_GCAL_TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
        return RedirectResponse("/?gcal=ok")
    except Exception as e:
        logger.error(f"gcal callback error: {e}")
        return RedirectResponse("/?gcal=error")

@app.get("/api/calendario/auth/disconnect")
def api_gcal_disconnect():
    """Desconecta Google Calendar eliminando el token."""
    if os.path.exists(_GCAL_TOKEN_FILE):
        os.remove(_GCAL_TOKEN_FILE)
    return {"status": "disconnected"}

@app.get("/api/calendario/gcal-calendarios")
def api_gcal_calendarios():
    """Lista los calendarios disponibles en la cuenta de Google."""
    creds = _gcal_creds()
    if not creds:
        raise HTTPException(status_code=401, detail="Google Calendar no conectado")
    try:
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            from googleapiclient.discovery import build
        service = build("calendar", "v3", credentials=creds)
        items = service.calendarList().list().execute().get("items", [])
        return [{"id": c["id"], "name": c.get("summary",""), "color": c.get("backgroundColor","#4285F4"), "primary": c.get("primary", False)} for c in items]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/calendario/gcal-eventos")
def api_gcal_eventos(start: str = '', end: str = '', calendars: str = ''):
    """Eventos de Google Calendar en rango de fechas. calendars = IDs separados por coma."""
    creds = _gcal_creds()
    if not creds:
        raise HTTPException(status_code=401, detail="Google Calendar no conectado")
    try:
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            from googleapiclient.discovery import build
        service = build("calendar", "v3", credentials=creds)

        cal_ids = [c.strip() for c in calendars.split(",")] if calendars else ["primary"]
        all_events = []

        time_min = f"{start}T00:00:00Z" if start else None
        time_max = f"{end}T23:59:59Z"   if end   else None

        for cal_id in cal_ids:
            params: dict = {"calendarId": cal_id, "singleEvents": True,
                            "orderBy": "startTime", "maxResults": 250}
            if time_min: params["timeMin"] = time_min
            if time_max: params["timeMax"] = time_max
            items = service.events().list(**params).execute().get("items", [])
            for e in items:
                s = e.get("start", {})
                en = e.get("end", {})
                all_events.append({
                    "id":       e.get("id", ""),
                    "title":    e.get("summary", "(Sin título)"),
                    "start":    s.get("dateTime", s.get("date", "")),
                    "end":      en.get("dateTime", en.get("date", "")),
                    "location": e.get("location", ""),
                    "desc":     (e.get("description") or "")[:300],
                    "calendar": cal_id,
                    "source":   "gcal",
                    "allDay":   "date" in s and "dateTime" not in s,
                })
        return all_events
    except Exception as e:
        logger.error(f"gcal eventos error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
        _hook_token_operativo({**req, **token} if isinstance(token, dict) else {**req})
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

    # Auto-emit token academia por cada resultado guardado
    scores = result.resultados or {}
    global_score = scores.get("Global") or (sum(scores.values()) / len(scores) if scores else 0)
    approved = global_score >= 70
    try:
        auto_emit(
            domain="academia",
            entity=result.empresa or "xcien",
            payload={
                "tecnico": result.nombre_tecnico,
                "modulo": result.modulo or "Evaluación técnica",
                "score": round(global_score, 1),
                "pilares": scores,
                "aprobado": approved,
                "nivel": "Aprobado" if approved else "No aprobado",
            },
            created_by=result.nombre_tecnico or "sistema",
            notes=f"{'✅ Aprobado' if approved else '❌ No aprobado'} — {round(global_score, 1)}%",
            ext_system="save_skill_result",
        )
    except Exception:
        pass

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
    _hook_wfm_ticket(new_ticket, action="created")
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
            _hook_wfm_ticket(t, action="updated")
            return {"status": "updated", "ticket": t}
    raise HTTPException(status_code=404, detail="Ticket no encontrado")

# ─── NOC: Datos reales desde NOCBoard ────────────────────────────────────────

NOCBOARD_DIR = os.path.expanduser("~/Library/Application Support/NOCBoard")
NOCBOARD_HOSTS_FILE   = os.path.join(NOCBOARD_DIR, "hosts.json")
NOCBOARD_ALERTS_FILE  = os.path.join(NOCBOARD_DIR, "alerts.json")
NOCBOARD_API_BASE = "http://localhost:9401/api"
NOCBOARD_API_KEY  = "87a08190b801416392e944ab79c7e3c9"

import requests
import threading
import subprocess as _sp

def _nocboard_watchdog():
    """Verifica cada 60s que NOCBoard esté activa; si no, la reabre."""
    import time
    while True:
        try:
            r = requests.get(f"{NOCBOARD_API_BASE}/hosts",
                             headers={"X-API-Key": NOCBOARD_API_KEY}, timeout=3)
            if r.status_code != 200:
                raise Exception("status != 200")
        except Exception:
            logger.warning("NOCBoard watchdog: puerto 9401 no responde — reabriendo app...")
            _sp.Popen(["open", "-a", "NOCBoard"])
        time.sleep(60)

threading.Thread(target=_nocboard_watchdog, daemon=True, name="nocboard-watchdog").start()

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
        "Monterrey":        {"lat": 25.6866,  "lng": -100.3161},
        "Saltillo":         {"lat": 25.4232,  "lng": -100.9928},
        "Piedras Negras":   {"lat": 28.7000,  "lng": -100.5231},
        "San Luis Potosi":  {"lat": 22.1565,  "lng": -100.9855},
        "San Luis Potosí":  {"lat": 22.1565,  "lng": -100.9855},
        "Torreón":          {"lat": 25.5428,  "lng": -103.4068},
        "Torreon":          {"lat": 25.5428,  "lng": -103.4068},
        "Chihuahua":        {"lat": 28.6353,  "lng": -106.0889},
        "Nuevo Laredo":     {"lat": 27.4765,  "lng": -99.5151 },
        "Reynosa":          {"lat": 26.0922,  "lng": -98.2772 },
        "Matamoros":        {"lat": 25.8691,  "lng": -97.5027 },
        "Monclova":         {"lat": 26.9083,  "lng": -101.4217},
        "Sabinas":          {"lat": 27.8529,  "lng": -101.1191},
        "Guadalajara":      {"lat": 20.6597,  "lng": -103.3496},
        "Ciudad de México":  {"lat": 19.4326,  "lng": -99.1332 },
        "Querétaro":        {"lat": 20.5888,  "lng": -100.3899},
        "Celaya":           {"lat": 20.5200,  "lng": -100.8161},
        "León":             {"lat": 21.1221,  "lng": -101.6823},
        "Tampico":          {"lat": 22.2552,  "lng": -97.8686 },
        "Mérida":           {"lat": 20.9674,  "lng": -89.5926 },
        "Puebla":           {"lat": 19.0414,  "lng": -98.2063 },
        "Coco":             {"lat": 25.5000,  "lng": -103.5000},
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
                        "score":    round(h.get("health_score") or h.get("healthScore") or 0, 1),
                        "status":   _host_status(h),
                        "lastSeen": (h.get("ping") or h.get("lastPingResult") or {}).get("timestamp", ""),
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
        tx = transacciones_service.registrar(**req.dict())
        _hook_transaccion(tx)
        return tx
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/transacciones")
def listar_transacciones(empresa_origen: str = None, empresa_destino: str = None, area: str = None):
    return transacciones_service.listar(empresa_origen=empresa_origen, empresa_destino=empresa_destino, area=area)

@app.get("/api/transacciones/resumen")
def resumen_transacciones():
    return transacciones_service.resumen()

@app.put("/api/transacciones/{tx_id}")
def actualizar_transaccion(tx_id: str, req: TransaccionUpdateRequest):
    tx = transacciones_service.actualizar(tx_id, req.dict(exclude_none=True))
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return tx

@app.delete("/api/transacciones/{tx_id}")
def eliminar_transaccion(tx_id: str):
    ok = transacciones_service.eliminar(tx_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return {"ok": True}

@app.get("/api/transacciones/catalogos")
def catalogos_transacciones():
    return {"empresas": transacciones_service.EMPRESAS, "areas": transacciones_service.AREAS}

@app.get("/api/transacciones/tokens")
def tokens_areas():
    return token_service.saldos_areas()

@app.get("/api/transacciones/tokens/{token_id}/verificar")
def verificar_token_area(token_id: str):
    return token_service.verificar_tx_token(token_id)

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

# ─── Inventario Odoo ─────────────────────────────────────────────────────────

@app.get("/api/inventario/odoo/productos")
def api_odoo_productos(
    search: str = '',
    tipo: str = '',
    offset: int = 0,
    limit: int = 50
):
    """Lista productos de Odoo."""
    try:
        # Construir dominio sin usar operador 'in' (falla en XML-RPC de este Odoo)
        if search and tipo:
            domain = ['&', '|',
                      ['name', 'ilike', search],
                      ['default_code', 'ilike', search],
                      ['type', '=', tipo]]
        elif search:
            domain = ['|',
                      ['name', 'ilike', search],
                      ['default_code', 'ilike', search]]
        elif tipo:
            domain = [['type', '=', tipo]]
        else:
            domain = []   # todos los productos

        fields = ['id', 'name', 'default_code', 'categ_id', 'type',
                  'qty_available', 'virtual_available', 'uom_id']
        result = odoo_conn.execute('product.product', 'search_read',
                                   domain, fields=fields,
                                   limit=limit, offset=offset,
                                   order='qty_available desc, name asc')
        total = odoo_conn.execute('product.product', 'search_count', domain)

        return {"productos": result or [], "total": total or 0, "offset": offset, "limit": limit}
    except Exception as e:
        logger.error(f"odoo productos error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/inventario/odoo/categorias")
def api_odoo_categorias():
    """Árbol de categorías de productos Odoo."""
    try:
        cats = odoo_conn.execute('product.category', 'search_read',
                                  [], fields=['id', 'name', 'complete_name', 'parent_id'])
        return {"categorias": cats or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/inventario/odoo/stock-por-ubicacion/{product_id}")
def api_odoo_stock_ubicacion(product_id: int):
    """Stock de un producto desglosado por ubicación."""
    try:
        quants = odoo_conn.execute('stock.quant', 'search_read',
                                    [['product_id', '=', product_id]],
                                    fields=['location_id', 'quantity', 'reserved_quantity'],
                                    limit=20)
        return {"quants": quants or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/inventario/odoo/resumen")
def api_odoo_resumen():
    """Resumen estadístico del inventario Odoo."""
    try:
        total_prods    = odoo_conn.execute('product.product', 'search_count', []) or 0
        con_stock      = odoo_conn.execute('product.product', 'search_count',
                                            [['qty_available', '>', 0]]) or 0
        sin_stock      = odoo_conn.execute('product.product', 'search_count',
                                            [['qty_available', '<=', 0]]) or 0
        total_cats     = odoo_conn.execute('product.category', 'search_count', []) or 0
        total_pickings = odoo_conn.execute('stock.picking', 'search_count',
                                            [['state', '=', 'done'],
                                             ['date_done', '>=', '2026-01-01']]) or 0
        return {
            "total_productos": total_prods,
            "con_stock": con_stock,
            "sin_stock": sin_stock,
            "total_categorias": total_cats,
            "movimientos_2026": total_pickings,
        }
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
# ─── Centro de Agentes ───────────────────────────────────────────────────────
import subprocess as _subprocess

AGENTS_CATALOG = [
    {"id": "director",   "nombre": "Director General",     "icon": "🧠", "color": "#00B4D8",
     "rol": "Estrategia & Decisiones", "endpoint": "/api/director/chat",
     "descripcion": "Análisis estratégico, reportes ejecutivos, orquestación de agentes",
     "capacidades": ["Análisis FODA", "KPIs ejecutivos", "Decisiones operativas", "Reportes gerenciales"]},
    {"id": "noc",        "nombre": "NOC Agent",             "icon": "📡", "color": "#00ff88",
     "rol": "Monitoreo de Red", "endpoint": "/api/agentes/noc/chat",
     "descripcion": "Diagnóstico de red, alertas, hosts offline, análisis de incidentes",
     "capacidades": ["Diagnóstico de hosts", "Análisis de alertas", "Rutas de reparación", "SLA NOC"]},
    {"id": "wfm",        "nombre": "WFM Agent",             "icon": "⚙️", "color": "#FF6B35",
     "rol": "Control Operativo", "endpoint": "/api/agentes/wfm/chat",
     "descripcion": "Gestión de fuerza de trabajo, tickets, instalaciones, asignaciones",
     "capacidades": ["Optimizar flujo", "Asignar técnicos", "Estado de órdenes", "Backlog"]},
    {"id": "academia",   "nombre": "Academia Agent",        "icon": "🎓", "color": "#FFB703",
     "rol": "Certificación & Talento", "endpoint": "/api/agentes/academia/chat",
     "descripcion": "Cursos, exámenes, escalafón técnico, certificaciones",
     "capacidades": ["Progreso técnicos", "Examinar", "Escalafón", "Recomendaciones"]},
    {"id": "finanzas",   "nombre": "Finanzas Agent",        "icon": "💰", "color": "#9B59B6",
     "rol": "Finanzas & Facturación", "endpoint": "/api/agentes/finanzas/chat",
     "descripcion": "Reportes financieros, transacciones, facturación Odoo",
     "capacidades": ["Reportes financieros", "Transacciones", "Facturación", "KPIs financieros"]},
    {"id": "inventario", "nombre": "Inventario Agent",      "icon": "📦", "color": "#1ABC9C",
     "rol": "Stock & Activos", "endpoint": "/api/agentes/inventario/chat",
     "descripcion": "Equipos, materiales, stock, activos de red",
     "capacidades": ["Consultar stock", "Movimientos", "Activos", "Alertas inventario"]},
    {"id": "devops",     "nombre": "DevOps/SRE Agent",      "icon": "🔧", "color": "#E74C3C",
     "rol": "Infraestructura & Deploy", "endpoint": "/api/devops/chat",
     "descripcion": "Monitoreo de servidores, deploys, diagnóstico de servicios",
     "capacidades": ["Estado servidores", "Diagnóstico", "Deploy", "Logs"]},
    {"id": "telegram",   "nombre": "Telegram Bot",          "icon": "✈️", "color": "#2CA5E0",
     "rol": "Canal de Comunicación", "endpoint": None,
     "descripcion": "Bot activo en Telegram — recibe órdenes y envía alertas en tiempo real",
     "capacidades": ["Alertas NOC", "Comandos operativos", "Reportes express", "Notificaciones"]},
]

_agent_activity: dict = {}  # agent_id -> {"last_msg": str, "last_ts": str, "calls": int}

def _agent_pm2_status(name: str) -> str:
    try:
        r = _subprocess.run(["pm2", "jlist"], capture_output=True, text=True, timeout=5)
        procs = json.loads(r.stdout)
        for p in procs:
            if name in p.get("name", ""):
                return p.get("pm2_env", {}).get("status", "stopped")
    except Exception:
        pass
    return "unknown"

@app.get("/api/agentes/status")
def get_agentes_status():
    """Estado actual de todos los agentes del ecosistema XCIEN."""
    tg_status = _agent_pm2_status("xcien-telegram")
    backend_ok = True  # si llegamos aquí el backend está vivo

    result = []
    for ag in AGENTS_CATALOG:
        act = _agent_activity.get(ag["id"], {})
        # Determinar status
        if ag["id"] == "telegram":
            status = "online" if tg_status == "online" else "offline"
        elif ag["id"] in ("director", "devops", "noc", "wfm", "academia", "finanzas", "inventario"):
            status = "online" if backend_ok else "offline"
            if act.get("working"):
                status = "busy"
        else:
            status = "online" if backend_ok else "offline"
        result.append({
            **ag,
            "status": status,
            "calls_today": act.get("calls", 0),
            "last_msg": act.get("last_msg", ""),
            "last_ts": act.get("last_ts", ""),
        })
    return {"agentes": result, "total": len(result)}

class AgentChatRequest(BaseModel):
    agente_id: str
    message: str
    history: list = []

@app.post("/api/agentes/chat")
def agentes_chat_unificado(req: AgentChatRequest):
    """Chat unificado: enruta al agente correcto según agente_id."""
    from agents.agent_noc import NOCAgent
    from agents.agent_wfm import WFMAgent
    from agents.agent_academia import AcademiaAgent
    from agents.agent_finances import FinanceAgent
    from agents.agent_inventory import InventoryAgent

    aid = req.agente_id
    now_str = datetime.datetime.now().strftime("%H:%M:%S")

    # Registrar actividad
    if aid not in _agent_activity:
        _agent_activity[aid] = {"calls": 0, "working": False}
    _agent_activity[aid]["calls"] += 1
    _agent_activity[aid]["last_msg"] = req.message[:60]
    _agent_activity[aid]["last_ts"] = now_str
    _agent_activity[aid]["working"] = True

    _AGENT_PROMPTS = {
        "noc":       "Eres el Agente NOC de XCIEN. Eres experto en monitoreo de red, diagnóstico de hosts, análisis de alertas Zabbix, latencia, pérdida de paquetes y mantenimiento de infraestructura de telecomunicaciones. Responde en español de forma técnica y concisa.",
        "wfm":       "Eres el Agente WFM de XCIEN. Experto en gestión de fuerza de trabajo, órdenes de servicio, asignación de técnicos de campo, instalaciones, mantenimientos y optimización operativa. Responde en español.",
        "academia":  "Eres el Agente Academia de XCIEN. Experto en cursos de certificación, progreso de técnicos, exámenes, escalafón técnico y desarrollo de talento en telecomunicaciones. Responde en español.",
        "finanzas":  "Eres el Agente Finanzas de XCIEN. Experto en reportes financieros, facturación Odoo, transacciones, tokens de servicio, KPIs financieros y control presupuestal. Responde en español.",
        "inventario":"Eres el Agente Inventario de XCIEN. Experto en gestión de equipos, activos de red, stock de materiales, movimientos de almacén y auditoría de activos. Responde en español.",
    }

    try:
        if aid == "director":
            resp = dg_agent.ejecutar_orden(req.message, req.history, {})
        elif aid == "devops":
            resp = sre_agent.analizar_y_responder(req.message, req.history)
        elif aid in _AGENT_PROMPTS:
            # Construir historial para Claude
            history_text = ""
            for m in (req.history or [])[-6:]:
                role_label = "Usuario" if m.get("role") == "user" else "Asistente"
                history_text += f"{role_label}: {m.get('content','')}\n"
            full_prompt = f"{history_text}Usuario: {req.message}"
            resp = ask_claude_with_system(_AGENT_PROMPTS[aid], full_prompt)
        elif aid == "telegram":
            resp = "El bot de Telegram está activo. Envía tus instrucciones directamente al chat."
        else:
            resp = f"Agente '{aid}' no reconocido."
    except Exception as e:
        resp = f"Error en agente {aid}: {str(e)}"
    finally:
        if aid in _agent_activity:
            _agent_activity[aid]["working"] = False

    return {"status": "success", "agente": aid, "response": resp}

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


# ── Field Service: habilitaciones y fallas desde Odoo helpdesk ─────────────────
CAST_TEAM_IDS   = [6, 39, 60, 41, 44, 48, 67]
FS_TYPE_IDS     = [34, 8, 6, 4]   # INSTALACION, Falla General, Visita Técnica, Soporte

# Mapeo etapa Odoo → etapa operativa (0=NOC, 1=Dispatch, 2=Almacén, 3=Operaciones, 4=NOC Cierra)
STAGE_TO_OP = {
    97:  0,   # Nuevo
    24:  0,   # CAST Nvl:1
    129: 0,   # CAST Nivel:1
    119: 0,   # Nuevo
    27:  0,   # Nuevo
    25:  1,   # CAST Nvl:2
    116: 1,   # Turnado
    60:  1,   # CAE-Visita
    68:  1,   # Acceso a Sitios
    57:  3,   # COR Nvl:3
    130: 3,   # CAST Nivel:3 Ingeniería On Site
    132: 3,   # Nivel:3 PE Levantamiento
    155: 4,   # COR Nivel 3 en Validación CAST
    164: 4,   # COR N3 RES X VALID CAST
    168: 4,   # TT VALIDADO SOL. MONITOREO
    54:  4,   # CAST Nvl:1-Resuelto
    101: 4,   # CAST Nvl:2-Resuelto
    100: 4,   # CAE-Resuelto
    121: 4,   # CAE-Resuelto
    120: 4,   # CAST Nvl:2 Resuelto
    69:  4,   # COR Resuelto
    35:  4,   # Resuelto
    51:  4,   # Solved
}

OP_STAGE_NAMES = ["NOC", "Dispatch", "Almacén", "Operaciones", "NOC Cierra"]
OP_STAGE_COLORS = ["#00B4D8", "#FF6B35", "#FFB703", "#00ff88", "#00C896"]

PRIORITY_MAP = {"0": "normal", "1": "alta", "2": "urgente", "3": "crítica"}

@app.get("/api/wfm/field-tickets")
def get_field_tickets(limit: int = 150, tipo: str = None, estado_op: int = None):
    """
    Retorna tickets de Field Service desde Odoo (CAST + INSTALACION/Fallas).
    tipo: 'habilitacion' | 'falla' | None (todos)
    estado_op: 0-4 para filtrar por etapa operativa
    """
    import xmlrpc.client as _xr

    odoo_url  = os.environ.get("ODOO_URL", "https://odoo.wispi.mx")
    odoo_db   = os.environ.get("ODOO_DB", "wispi17")
    odoo_user = os.environ.get("ODOO_USER", "miguel.macias@xcien.com")
    odoo_pass = os.environ.get("ODOO_PASSWORD", "Malpa501@")

    try:
        common = _xr.ServerProxy(f"{odoo_url}/xmlrpc/2/common")
        uid = common.authenticate(odoo_db, odoo_user, odoo_pass, {})
        if not uid:
            raise HTTPException(status_code=503, detail="No se pudo autenticar en Odoo")
        models = _xr.ServerProxy(f"{odoo_url}/xmlrpc/2/object")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Error conectando Odoo: {e}")

    # Construir dominio
    type_filter = [34, 8, 6]  # INSTALACION, Falla General, Visita Técnica
    if tipo == "habilitacion":
        type_filter = [34]
    elif tipo == "falla":
        type_filter = [8, 4]

    domain = [
        ["team_id", "in", CAST_TEAM_IDS],
        ["ticket_type_id", "in", type_filter],
    ]

    fields = ["id", "name", "stage_id", "ticket_type_id", "priority",
              "partner_id", "user_id", "create_date", "close_date", "kanban_state", "description"]

    try:
        raw = models.execute_kw(odoo_db, uid, odoo_pass, "helpdesk.ticket",
                                "search_read", [domain],
                                {"fields": fields, "limit": limit, "order": "id desc"})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error leyendo Odoo: {e}")

    tickets = []
    for r in raw:
        stage_id   = r["stage_id"][0] if r["stage_id"] else 0
        stage_name = r["stage_id"][1] if r["stage_id"] else "—"
        op_idx     = STAGE_TO_OP.get(stage_id, 0)

        # Determinar tipo operativo
        type_id    = r["ticket_type_id"][0] if r["ticket_type_id"] else 0
        op_type    = "habilitacion" if type_id == 34 else "falla"

        t = {
            "id":           f"HD-{r['id']}",
            "odoo_id":      r["id"],
            "nombre":       r["name"],
            "cliente":      r["partner_id"][1] if r["partner_id"] else "—",
            "tecnico":      r["user_id"][1]    if r["user_id"]    else None,
            "tipo":         op_type,
            "tipo_label":   r["ticket_type_id"][1] if r["ticket_type_id"] else "—",
            "prioridad":    PRIORITY_MAP.get(r["priority"], "normal"),
            "etapa_odoo":   stage_name,
            "etapa_op_idx": op_idx,
            "etapa_op":     OP_STAGE_NAMES[op_idx],
            "etapa_color":  OP_STAGE_COLORS[op_idx],
            "fecha_creacion": r["create_date"],
            "fecha_cierre":   r["close_date"] or None,
            "cerrado":       bool(r["close_date"]),
            "kanban_state":  r["kanban_state"],
        }
        if estado_op is None or op_idx == estado_op:
            tickets.append(t)

    return {
        "total": len(tickets),
        "tickets": tickets,
        "stages": [
            {"idx": i, "nombre": n, "color": c}
            for i, (n, c) in enumerate(zip(OP_STAGE_NAMES, OP_STAGE_COLORS))
        ]
    }


@app.get("/api/wfm/field-tickets/summary")
def get_field_tickets_summary():
    """Conteo por etapa operativa para KPIs rápidos."""
    data = get_field_tickets(limit=500)
    tickets = data["tickets"]
    by_stage = {i: 0 for i in range(5)}
    by_type  = {"habilitacion": 0, "falla": 0}
    open_count = 0
    for t in tickets:
        by_stage[t["etapa_op_idx"]] += 1
        by_type[t["tipo"]] += 1
        if not t["cerrado"]:
            open_count += 1
    return {
        "total": len(tickets),
        "abiertos": open_count,
        "cerrados": len(tickets) - open_count,
        "habilitaciones": by_type["habilitacion"],
        "fallas": by_type["falla"],
        "por_etapa": [
            {"idx": i, "nombre": OP_STAGE_NAMES[i], "color": OP_STAGE_COLORS[i], "count": by_stage[i]}
            for i in range(5)
        ]
    }

class TicketComentarioReq(BaseModel):
    mensaje: str

@app.get("/api/wfm/field-tickets/{ticket_id}")
def get_field_ticket_detalle(ticket_id: int):
    """Detalle completo de un ticket helpdesk + chatter + etapas disponibles."""
    import xmlrpc.client as _xr
    import re as _re
    from concurrent.futures import ThreadPoolExecutor, as_completed as _as_completed

    _url  = os.environ.get("ODOO_URL", "https://odoo.wispi.mx")
    _db   = os.environ.get("ODOO_DB", "wispi17")
    _user = os.environ.get("ODOO_USER", "miguel.macias@xcien.com")
    _pw   = os.environ.get("ODOO_PASSWORD", "Malpa501@")

    try:
        common = _xr.ServerProxy(f"{_url}/xmlrpc/2/common")
        uid    = common.authenticate(_db, _user, _pw, {})
        if not uid:
            raise HTTPException(503, "No se pudo autenticar en Odoo")
        models = _xr.ServerProxy(f"{_url}/xmlrpc/2/object")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(503, f"Error conectando Odoo: {e}")

    # Fetch ticket
    tickets = models.execute_kw(_db, uid, _pw, "helpdesk.ticket", "search_read",
        [[["id", "=", ticket_id]]],
        {"fields": ["id","name","description","partner_id","stage_id","team_id",
                    "ticket_type_id","priority","user_id","create_date",
                    "date_last_stage_update","kanban_state"],
         "limit": 1})
    if not tickets:
        raise HTTPException(404, "Ticket no encontrado")
    t = tickets[0]
    team_id = t["team_id"][0] if t.get("team_id") else None

    # Fetch stages and chatter in parallel — each thread gets its own ServerProxy
    def _get_stages():
        if not team_id:
            return []
        _m = _xr.ServerProxy(f"{_url}/xmlrpc/2/object")
        raw = _m.execute_kw(_db, uid, _pw, "helpdesk.stage", "search_read",
            [[["team_ids", "in", [team_id]]]],
            {"fields": ["id", "name"], "order": "sequence asc", "limit": 20})
        return [{"id": s["id"], "nombre": s["name"]} for s in raw]

    def _get_chatter():
        _m = _xr.ServerProxy(f"{_url}/xmlrpc/2/object")
        msgs = _m.execute_kw(_db, uid, _pw, "mail.message", "search_read",
            [[["model", "=", "helpdesk.ticket"], ["res_id", "=", ticket_id],
              ["message_type", "in", ["comment", "email"]]]],
            {"fields": ["id", "author_id", "date", "body", "message_type"],
             "order": "date asc", "limit": 50})
        result = []
        for m in msgs:
            body = (m.get("body") or "").replace("<br>", "\n").replace("</p>", "\n")
            body = _re.sub(r"<[^>]+>", "", body).strip()
            if body:
                result.append({
                    "id": m["id"],
                    "autor": m["author_id"][1] if m.get("author_id") else "Sistema",
                    "fecha": (m.get("date") or "")[:16],
                    "cuerpo": body,
                    "tipo": m.get("message_type", "comment"),
                })
        return result

    with ThreadPoolExecutor(max_workers=2) as pool:
        f_stages  = pool.submit(_get_stages)
        f_chatter = pool.submit(_get_chatter)
        etapas   = f_stages.result()
        mensajes = f_chatter.result()

    return {
        "id": t["id"],
        "nombre": t["name"],
        "descripcion": _re.sub(r"<[^>]+>", "", (t.get("description") or "")).strip()[:500],
        "etapa_id": t["stage_id"][0] if t.get("stage_id") else None,
        "etapa": t["stage_id"][1] if t.get("stage_id") else "",
        "cliente": t["partner_id"][1] if t.get("partner_id") else None,
        "equipo": t["team_id"][1] if t.get("team_id") else None,
        "tipo": t["ticket_type_id"][1] if t.get("ticket_type_id") else None,
        "prioridad": t.get("priority", "0"),
        "tecnico": t["user_id"][1] if t.get("user_id") else None,
        "creado": (t.get("create_date") or "")[:16],
        "ultimo_cambio": (t.get("date_last_stage_update") or "")[:16],
        "kanban_state": t.get("kanban_state", "normal"),
        "mensajes": mensajes,
        "etapas_disponibles": etapas,
    }

@app.post("/api/wfm/field-tickets/{ticket_id}/comentario")
def post_field_ticket_comentario(ticket_id: int, req: TicketComentarioReq):
    import xmlrpc.client as _xr
    _url  = os.environ.get("ODOO_URL", "https://odoo.wispi.mx")
    _db   = os.environ.get("ODOO_DB", "wispi17")
    _user = os.environ.get("ODOO_USER", "miguel.macias@xcien.com")
    _pw   = os.environ.get("ODOO_PASSWORD", "Malpa501@")
    common = _xr.ServerProxy(f"{_url}/xmlrpc/2/common")
    uid    = common.authenticate(_db, _user, _pw, {})
    models = _xr.ServerProxy(f"{_url}/xmlrpc/2/object")
    models.execute_kw(_db, uid, _pw, "helpdesk.ticket", "message_post",
        [[ticket_id]], {"body": req.mensaje, "message_type": "comment", "subtype_xmlid": "mail.mt_comment"})
    return {"ok": True}

@app.put("/api/wfm/field-tickets/{ticket_id}/etapa")
def put_field_ticket_etapa(ticket_id: int, req: dict):
    import xmlrpc.client as _xr
    _url  = os.environ.get("ODOO_URL", "https://odoo.wispi.mx")
    _db   = os.environ.get("ODOO_DB", "wispi17")
    _user = os.environ.get("ODOO_USER", "miguel.macias@xcien.com")
    _pw   = os.environ.get("ODOO_PASSWORD", "Malpa501@")
    stage_id = req.get("stage_id")
    if not stage_id:
        raise HTTPException(400, "stage_id requerido")
    common = _xr.ServerProxy(f"{_url}/xmlrpc/2/common")
    uid    = common.authenticate(_db, _user, _pw, {})
    models = _xr.ServerProxy(f"{_url}/xmlrpc/2/object")
    models.execute_kw(_db, uid, _pw, "helpdesk.ticket", "write",
        [[ticket_id], {"stage_id": stage_id}])
    return {"ok": True}

@app.get("/api/wfm/bidrillas")
def get_bidrillas():
    """
    Cuadrillas Field Service — todos los técnicos asignados en Odoo.
    Descubre técnicos dinámicamente desde project.task / Field Service.
    """
    import xmlrpc.client as _xr

    odoo_url  = os.environ.get("ODOO_URL", "https://odoo.wispi.mx")
    odoo_db   = os.environ.get("ODOO_DB", "wispi17")
    odoo_user = os.environ.get("ODOO_USER", "miguel.macias@xcien.com")
    odoo_pass = os.environ.get("ODOO_PASSWORD", "Malpa501@")

    CLOSED_KW = {"done", "resuelto", "cerrado", "completado", "resolved", "closed"}

    try:
        common = _xr.ServerProxy(f"{odoo_url}/xmlrpc/2/common")
        uid = common.authenticate(odoo_db, odoo_user, odoo_pass, {})
        models = _xr.ServerProxy(f"{odoo_url}/xmlrpc/2/object")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Error Odoo: {e}")

    # Todas las tareas Field Service con técnico asignado
    tasks = models.execute_kw(odoo_db, uid, odoo_pass, "project.task", "search_read",
        [[["project_id.name", "ilike", "field"], ["user_ids", "!=", False]]],
        {"fields": ["id", "name", "stage_id", "user_ids", "date_deadline",
                    "create_date", "date_last_stage_update"],
         "limit": 500, "order": "id desc"})

    # Descubrir todos los user_ids únicos
    all_user_ids = list({uid_val for t in tasks for uid_val in t["user_ids"]})

    # Obtener nombres y roles desde hr.employee
    employees = models.execute_kw(odoo_db, uid, odoo_pass, "hr.employee", "search_read",
        [[["user_id", "in", all_user_ids]]],
        {"fields": ["user_id", "name", "job_title"], "limit": 200})
    emp_by_user = {e["user_id"][0]: e for e in employees if e["user_id"]}

    # Nombres desde res.users como fallback
    users = models.execute_kw(odoo_db, uid, odoo_pass, "res.users", "read",
        [all_user_ids], {"fields": ["id", "name"]})
    user_names = {u["id"]: u["name"] for u in users}

    result: dict = {}
    for task in tasks:
        stage_name = task["stage_id"][1] if task["stage_id"] else ""
        is_closed  = any(kw in stage_name.lower() for kw in CLOSED_KW)

        for uid_val in task["user_ids"]:
            if uid_val not in result:
                emp  = emp_by_user.get(uid_val, {})
                nombre = emp.get("name") or user_names.get(uid_val, f"Usuario {uid_val}")
                result[uid_val] = {
                    "id":      f"FS-{uid_val}",
                    "odoo_id": uid_val,
                    "nombre":  nombre,
                    "alias":   nombre.split()[0].capitalize() if nombre else f"Técnico {uid_val}",
                    "rol":     emp.get("job_title") or "Field Service",
                    "total": 0, "abiertos": 0, "cerrados": 0,
                    "tareas": [],
                }
            r = result[uid_val]
            r["total"] += 1
            if is_closed:
                r["cerrados"] += 1
            else:
                r["abiertos"] += 1
                r["tareas"].append({
                    "id":       task["id"],
                    "nombre":   task["name"].replace("[S. E.] ", "").replace("[SE] ", ""),
                    "etapa":    stage_name,
                    "deadline": task["date_deadline"],
                    "creado":   task["create_date"],
                })

    tecnicos = sorted(result.values(), key=lambda x: -x["total"])
    for t in tecnicos:
        total = t["total"] or 1
        t["pct_resolucion"] = round((t["cerrados"] / total) * 100, 1)
        t["tareas"] = sorted(t["tareas"], key=lambda x: x["deadline"] or "9999")[:5]

    return {"total": len(tecnicos), "tecnicos": tecnicos}


@app.get("/api/wfm/bidrillas/desempeno")
def get_desempeno():
    """
    Dashboard de desempeño por técnico FO.
    Score compuesto: Resolución (35%) + Documentación (35%) + Volumen (30%).
    """
    import xmlrpc.client as _xr
    from collections import Counter

    odoo_url  = os.environ.get("ODOO_URL", "https://odoo.wispi.mx")
    odoo_db   = os.environ.get("ODOO_DB", "wispi17")
    odoo_user = os.environ.get("ODOO_USER", "miguel.macias@xcien.com")
    odoo_pass = os.environ.get("ODOO_PASSWORD", "Malpa501@")

    CLOSED_KW = {"done", "resuelto", "cerrado", "completado", "resolved", "closed"}

    try:
        common = _xr.ServerProxy(f"{odoo_url}/xmlrpc/2/common")
        uid = common.authenticate(odoo_db, odoo_user, odoo_pass, {})
        models = _xr.ServerProxy(f"{odoo_url}/xmlrpc/2/object")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Error Odoo: {e}")

    # Todas las tareas Field Service
    tasks = models.execute_kw(odoo_db, uid, odoo_pass, "project.task", "search_read",
        [[["project_id.name","ilike","field"],["user_ids","!=",False]]],
        {"fields": ["id","stage_id","user_ids","date_deadline","date_last_stage_update"],
         "limit": 500, "order": "id desc"})

    # Descubrir todos los técnicos
    all_user_ids = list({u for t in tasks for u in t["user_ids"]})

    employees = models.execute_kw(odoo_db, uid, odoo_pass, "hr.employee", "search_read",
        [[["user_id","in",all_user_ids]]],
        {"fields": ["user_id","name","job_title"], "limit": 200})
    emp_by_user = {e["user_id"][0]: e for e in employees if e["user_id"]}

    users_raw = models.execute_kw(odoo_db, uid, odoo_pass, "res.users", "read",
        [all_user_ids], {"fields": ["id","name"]})
    user_names = {u["id"]: u["name"] for u in users_raw}

    # Inicializar stats y nombre→id para mensajes
    stats: dict = {}
    nombre_to_id: dict = {}
    for u_id in all_user_ids:
        emp    = emp_by_user.get(u_id, {})
        nombre = emp.get("name") or user_names.get(u_id, f"Usuario {u_id}")
        alias  = nombre.split()[0].capitalize()
        stats[u_id] = {"total": 0, "cerradas": 0, "on_time": 0,
                       "nombre": nombre, "alias": alias}
        nombre_to_id[nombre] = u_id

    for t in tasks:
        stage = (t["stage_id"][1] if t["stage_id"] else "").lower()
        is_closed = any(kw in stage for kw in CLOSED_KW)
        dl      = t.get("date_deadline")
        updated = t.get("date_last_stage_update")
        for u_id in t["user_ids"]:
            if u_id not in stats: continue
            stats[u_id]["total"] += 1
            if is_closed:
                stats[u_id]["cerradas"] += 1
                if dl and updated and updated <= dl:
                    stats[u_id]["on_time"] += 1

    # Mensajes por autor
    task_ids = [t["id"] for t in tasks]
    msgs_por_tecnico: dict = {k: 0 for k in all_user_ids}
    if task_ids:
        msgs = models.execute_kw(odoo_db, uid, odoo_pass, "mail.message", "search_read",
            [[["res_id","in",task_ids],["model","=","project.task"],["message_type","=","comment"]]],
            {"fields": ["author_id"], "limit": 5000})
        for m in msgs:
            if m["author_id"]:
                u_id = nombre_to_id.get(m["author_id"][1])
                if u_id:
                    msgs_por_tecnico[u_id] += 1

    max_cerradas = max((s["cerradas"] for s in stats.values()), default=1) or 1
    max_msgs     = max(msgs_por_tecnico.values(), default=1) or 1

    resultado = []
    for u_id, s in stats.items():
        if s["total"] == 0:
            continue
        cerr   = s["cerradas"]
        msgs_n = msgs_por_tecnico.get(u_id, 0)
        total  = s["total"] or 1

        pct_resolucion = round((cerr / total) * 100, 1)
        pct_vol        = (cerr / max_cerradas) * 100
        pct_doc        = (msgs_n / max_msgs) * 100
        pct_puntual    = round((s["on_time"] / cerr * 100) if cerr > 0 else 0, 1)

        score = round(
            (pct_resolucion * 0.35) +
            (pct_doc        * 0.35) +
            (pct_vol        * 0.30), 1
        )

        resultado.append({
            "odoo_id":        u_id,
            "alias":          s["alias"],
            "nombre":         s["nombre"],
            "total":          s["total"],
            "cerradas":       cerr,
            "abiertos":       s["total"] - cerr,
            "on_time":        s["on_time"],
            "mensajes":       msgs_n,
            "pct_resolucion": pct_resolucion,
            "pct_vol":        round(pct_vol, 1),
            "pct_doc":        round(pct_doc, 1),
            "pct_puntual":    pct_puntual,
            "score":          score,
            "detalle": {
                "resolucion_pts": round(pct_resolucion * 0.35, 1),
                "doc_pts":        round(pct_doc * 0.35, 1),
                "volumen_pts":    round(pct_vol * 0.30, 1),
            }
        })

    resultado.sort(key=lambda x: -x["score"])
    # Asignar rank
    for i, r in enumerate(resultado):
        r["rank"] = i + 1

    return {"tecnicos": resultado, "formula": "Score = Resolución×35% + Documentación×35% + Volumen×30%"}


def _odoo_connect():
    """Helper: devuelve (models, db, uid, password) ya autenticado."""
    import xmlrpc.client as _xr
    odoo_url  = os.environ.get("ODOO_URL", "https://odoo.wispi.mx")
    odoo_db   = os.environ.get("ODOO_DB", "wispi17")
    odoo_user = os.environ.get("ODOO_USER", "miguel.macias@xcien.com")
    odoo_pass = os.environ.get("ODOO_PASSWORD", "Malpa501@")
    common = _xr.ServerProxy(f"{odoo_url}/xmlrpc/2/common")
    uid = common.authenticate(odoo_db, odoo_user, odoo_pass, {})
    if not uid:
        raise HTTPException(status_code=503, detail="No se pudo autenticar en Odoo")
    models = _xr.ServerProxy(f"{odoo_url}/xmlrpc/2/object")
    return models, odoo_db, uid, odoo_pass


@app.get("/api/wfm/bidrillas/tarea/{task_id}")
def get_tarea_detalle(task_id: int):
    """Detalle completo de una tarea Field Service + chatter."""
    import re
    models, db, uid, pw = _odoo_connect()

    tasks = models.execute_kw(db, uid, pw, "project.task", "read",
        [[task_id]],
        {"fields": ["id","name","description","stage_id","user_ids","date_deadline",
                    "create_date","partner_id","project_id","priority","message_ids"]})
    if not tasks:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    task = tasks[0]

    msgs_raw = models.execute_kw(db, uid, pw, "mail.message", "search_read",
        [[["res_id","=",task_id],["model","=","project.task"]]],
        {"fields": ["id","body","author_id","date","message_type"], "limit": 30, "order": "date asc"})

    def strip_html(html: str) -> str:
        return re.sub(r'<[^>]+>', '', html or '').strip()

    mensajes = []
    for m in msgs_raw:
        body = strip_html(m["body"])
        if body:
            mensajes.append({
                "id":     m["id"],
                "autor":  m["author_id"][1] if m["author_id"] else "Sistema",
                "fecha":  m["date"],
                "cuerpo": body,
                "tipo":   m["message_type"],
            })

    user_ids = task["user_ids"] or []
    users = []
    if user_ids:
        u_records = models.execute_kw(db, uid, pw, "res.users", "read",
            [user_ids], {"fields": ["id","name"]})
        users = [{"id": u["id"], "nombre": u["name"]} for u in u_records]

    stages = models.execute_kw(db, uid, pw, "project.task.type", "search_read",
        [[["project_ids","in",[task["project_id"][0]]]]],
        {"fields": ["id","name","sequence"], "limit": 20, "order": "sequence asc"})

    return {
        "id":          task["id"],
        "nombre":      task["name"].replace("[S. E.] ","").replace("[SE] ",""),
        "descripcion": strip_html(task["description"] or ""),
        "etapa_id":    task["stage_id"][0] if task["stage_id"] else None,
        "etapa":       task["stage_id"][1] if task["stage_id"] else "—",
        "tecnicos":    users,
        "cliente":     task["partner_id"][1] if task["partner_id"] else None,
        "proyecto":    task["project_id"][1] if task["project_id"] else None,
        "prioridad":   "alta" if task["priority"] == "1" else "normal",
        "deadline":    task["date_deadline"],
        "creado":      task["create_date"],
        "mensajes":    mensajes,
        "etapas_disponibles": [{"id": s["id"], "nombre": s["name"]} for s in stages],
    }


class ComentarioRequest(BaseModel):
    cuerpo: str
    autor: str = "XCIEN 2.0"

@app.post("/api/wfm/bidrillas/tarea/{task_id}/comentario")
def post_comentario(task_id: int, req: ComentarioRequest):
    """Publica un comentario en el chatter de Odoo."""
    if not req.cuerpo.strip():
        raise HTTPException(status_code=400, detail="El comentario no puede estar vacío")
    models, db, uid, pw = _odoo_connect()
    msg_id = models.execute_kw(db, uid, pw, "project.task", "message_post",
        [[task_id]],
        {"body": req.cuerpo, "message_type": "comment", "subtype_xmlid": "mail.mt_comment"})
    return {"ok": True, "message_id": msg_id}


class EtapaRequest(BaseModel):
    etapa_id: int

@app.put("/api/wfm/bidrillas/tarea/{task_id}/etapa")
def update_etapa_tarea(task_id: int, req: EtapaRequest):
    """Cambia la etapa de una tarea Field Service en Odoo."""
    models, db, uid, pw = _odoo_connect()
    ok = models.execute_kw(db, uid, pw, "project.task", "write",
        [[task_id]], {"stage_id": req.etapa_id})
    return {"ok": bool(ok)}


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

# ─── GPS TN360 ───────────────────────────────────────────────────────────────
import requests as _requests
import threading as _threading

TN360_API       = "https://api-latam.telematics.com/v1"
TN360_AUTH_URL  = "https://id-mx.telematics.com/auth/realms/TN360DB/protocol/openid-connect/token"
TN360_USER      = "hector.elizondo@xcien.com"
TN360_PASS      = "Diciembre#05121980"

_gps_cache: dict = {"data": [], "ts": 0, "token": None, "token_ts": 0}
_gps_lock = _threading.Lock()

def _tn360_token() -> str:
    now = time.time()
    if _gps_cache["token"] and now - _gps_cache["token_ts"] < 240:
        return _gps_cache["token"]
    resp = _requests.post(TN360_AUTH_URL, data={
        "grant_type": "password", "client_id": "tn360ui",
        "username": TN360_USER, "password": TN360_PASS
    }, timeout=10)
    resp.raise_for_status()
    token = resp.json()["access_token"]
    _gps_cache["token"] = token
    _gps_cache["token_ts"] = now
    return token

def _fetch_gps_all() -> list:
    from concurrent.futures import ThreadPoolExecutor, as_completed
    token   = _tn360_token()
    headers = {"Authorization": f"Bearer {token}"}
    now_dt  = datetime.datetime.utcnow()
    from_dt = (now_dt - datetime.timedelta(hours=12)).strftime("%Y-%m-%dT%H:%M:%SZ")
    to_dt   = now_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    vehicles_resp = _requests.get(f"{TN360_API}/vehicles?limit=200", headers=headers, timeout=15)
    vehicles = vehicles_resp.json() if vehicles_resp.ok else []

    def _get_vehicle_gps(veh):
        vid  = veh["id"]
        name = veh.get("name", str(vid))
        reg  = veh.get("registration", "")
        try:
            trips_resp = _requests.get(
                f"{TN360_API}/trips?vehicleId={vid}&from={from_dt}&to={to_dt}&limit=1",
                headers=headers, timeout=10
            )
            trips = trips_resp.json() if trips_resp.ok else []
            if not isinstance(trips, list) or not trips:
                return None
            trip = trips[0]
            gps  = trip.get("IgnOffGPS") or trip.get("IgnOnGPS")
            if not gps or not gps.get("valid"):
                return None
            ts_ms  = gps.get("At", 0)
            ts_iso = datetime.datetime.utcfromtimestamp(ts_ms / 1000).strftime("%Y-%m-%d %H:%M") if ts_ms else None
            return {
                "id":         vid,
                "nombre":     name,
                "placa":      reg,
                "lat":        round(gps["Lat"], 6),
                "lng":        round(gps["Lng"], 6),
                "velocidad":  round(gps.get("Spd", 0), 1),
                "direccion":  round(gps.get("Dir", 0), 0),
                "ultima_vez": ts_iso,
                "ubicacion":  trip.get("endLocation") or trip.get("startLocation") or "",
                "activo":     gps.get("Spd", 0) > 2,
            }
        except Exception:
            return None

    result = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = {pool.submit(_get_vehicle_gps, v): v for v in vehicles}
        for fut in as_completed(futures):
            item = fut.result()
            if item:
                result.append(item)
    result.sort(key=lambda x: x["nombre"])
    return result

@app.get("/api/gps/vehiculos")
def get_gps_vehiculos():
    """Posiciones GPS en tiempo real de la flotilla TN360."""
    with _gps_lock:
        now = time.time()
        if now - _gps_cache["ts"] < 90:
            return {"vehiculos": _gps_cache["data"], "total": len(_gps_cache["data"]), "cached": True}
        try:
            data = _fetch_gps_all()
            _gps_cache["data"] = data
            _gps_cache["ts"]   = now
            return {"vehiculos": data, "total": len(data), "cached": False}
        except Exception as e:
            logger.error(f"GPS TN360 error: {e}")
            if _gps_cache["data"]:
                return {"vehiculos": _gps_cache["data"], "total": len(_gps_cache["data"]), "cached": True, "stale": True}
            raise HTTPException(500, f"Error GPS: {e}")

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
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from datetime import datetime
    import io

    buf = io.BytesIO()

    # ── Paleta institucional: blanco/gris limpio + verde XCIEN
    GREEN   = colors.HexColor('#00C896')   # verde XCIEN
    BLACK   = colors.HexColor('#111111')   # texto principal
    DARK    = colors.HexColor('#1A1A1A')   # encabezados
    BGHEAD  = colors.HexColor('#F0FBF7')   # fondo cabecera secciones
    BGROW   = colors.HexColor('#F9F9F9')   # filas alternas
    BORDER  = colors.HexColor('#DDDDDD')   # bordes
    RED     = colors.HexColor('#D62828')   # alertas críticas
    ORANGE  = colors.HexColor('#E07A18')   # advertencias
    GREY    = colors.HexColor('#888888')   # texto secundario
    WHITE   = colors.white

    styles = getSampleStyleSheet()
    def sty(name='Normal', **kw):
        return ParagraphStyle(name + str(id(kw)), parent=styles[name], **kw)

    doc = SimpleDocTemplate(buf, pagesize=letter,
        leftMargin=0.7*inch, rightMargin=0.7*inch,
        topMargin=0.6*inch, bottomMargin=0.6*inch)

    elems = []

    now = datetime.now()
    folio        = f"NOC-{now.strftime('%Y%m%d-%H%M%S')}"
    generated_at = now.strftime("%Y-%m-%d  %H:%M:%S")
    ciudad_label = ciudad if ciudad != 'todas' else 'Todas las Ciudades'

    # ── HEADER institucional ────────────────────────────────────────────────
    hdr = Table([[
        Paragraph(f'<b>XCIEN</b><br/><font size="7" color="#888888">Network Operations</font>',
                  sty(fontSize=14, textColor=GREEN, fontName='Helvetica-Bold')),
        Paragraph(f'<b>REPORTE NOC SEMANAL</b><br/>'
                  f'<font size="10" color="#1A1A1A">{ciudad_label.upper()}</font>',
                  sty(fontSize=16, textColor=DARK, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(
            f'<font size="8" color="#888888">Folio</font><br/>'
            f'<b><font size="9">{folio}</font></b><br/>'
            f'<font size="7" color="#888888">{fecha_inicio} → {fecha_fin}</font><br/>'
            f'<font size="7" color="#888888">Generado: {generated_at}</font>',
            sty(fontSize=8, textColor=GREY, alignment=TA_RIGHT)),
    ]], colWidths=[1.4*inch, 4.2*inch, 1.65*inch])
    hdr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), WHITE),
        ('LINEBELOW',  (0,0), (-1,-1), 2.5, GREEN),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING',  (0,0), (0,-1), 0),
        ('RIGHTPADDING', (-1,0), (-1,-1), 0),
    ]))
    elems.append(hdr)
    elems.append(Spacer(1, 0.18*inch))

    # ── helpers
    cities = noc_data.get('cities', [])
    alerts = noc_data.get('alerts', [])
    total_hosts   = sum(c['totalHosts'] for c in cities)
    total_online  = sum(c['online']     for c in cities)
    total_offline = sum(c['offline']    for c in cities)
    critical      = sum(1 for a in alerts if a.get('severity') == 'critical')
    warnings_n    = sum(1 for a in alerts if a.get('severity') == 'warning')
    avg_score     = round(sum(c['score'] for c in cities) / len(cities), 1) if cities else 0

    def sec(text):
        return Paragraph(
            f'<b>{text}</b>',
            sty(fontSize=10, textColor=DARK, fontName='Helvetica-Bold',
                spaceBefore=14, spaceAfter=5,
                borderPadding=(4,0,4,6),
                backColor=BGHEAD))

    def hdr_tbl(style):
        base = [
            ('BACKGROUND', (0,0), (-1,0), GREEN),
            ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
            ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE',   (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BGROW]),
            ('INNERGRID',  (0,0), (-1,-1), 0.3, BORDER),
            ('BOX',        (0,0), (-1,-1), 0.5, BORDER),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 7),
        ]
        base.extend(style)
        return base

    # ── KPIs NOC ───────────────────────────────────────────────────────────
    elems.append(sec('RED — ESTADO ACTUAL DE INFRAESTRUCTURA'))
    kpi_vals  = [str(total_hosts), str(total_online), str(total_offline),
                 str(critical), str(warnings_n), f'{avg_score}%']
    kpi_lbls  = ['HOSTS TOTALES', 'EN LÍNEA', 'CAÍDOS', 'CRÍTICAS', 'ALERTAS', 'SCORE PROM.']
    kpi_clrs  = [BLACK, GREEN, RED, RED, ORANGE, GREEN]
    kt = Table(
        [[Paragraph(f'<b>{v}</b>', sty(fontSize=22, textColor=c, fontName='Helvetica-Bold', alignment=TA_CENTER))
          for v, c in zip(kpi_vals, kpi_clrs)],
         [Paragraph(l, sty(fontSize=7, textColor=GREY, alignment=TA_CENTER)) for l in kpi_lbls]],
        colWidths=[1.12*inch]*6)
    kt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), WHITE),
        ('BOX',        (0,0), (-1,-1), 0.5, BORDER),
        ('INNERGRID',  (0,0), (-1,-1), 0.3, BORDER),
        ('LINEABOVE',  (0,0), (-1,0),  2.5, GREEN),
        ('ALIGN',      (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elems.append(kt)
    elems.append(Spacer(1, 0.12*inch))

    # ── Ciudades con hosts caídos ──────────────────────────────────────────
    offline_cities = sorted([c for c in cities if c['offline'] > 0], key=lambda x: -x['offline'])
    if offline_cities:
        elems.append(sec('CIUDADES CON HOSTS CAÍDOS'))
        rows = [['Ciudad', 'Caídos', 'En línea', 'Score', 'Alertas crit.']]
        for c in offline_cities[:15]:
            rows.append([c['name'], str(c['offline']), str(c['online']),
                         f"{c['score']}%", str(c.get('alerts', 0))])
        tbl = [[Paragraph(str(cell),
                          sty(fontSize=8, textColor=(WHITE if i==0 else (RED if (i>0 and cell.isdigit() and int(cell)>=3) else BLACK)),
                              fontName='Helvetica-Bold' if i==0 else 'Helvetica', leading=11))
                for cell in row] for i, row in enumerate(rows)]
        t = Table(tbl, colWidths=[2.3*inch, 0.85*inch, 0.85*inch, 0.85*inch, 1.35*inch])
        t.setStyle(TableStyle(hdr_tbl([])))
        elems.append(t)
        elems.append(Spacer(1, 0.12*inch))

    # ── Hosts offline — Detalle con ID de servicio + motivo ───────────────
    # Extraer todos los hosts offline de las ciudades
    offline_hosts = []
    for city in cities:
        for site in city.get('sites', []):
            for h in site.get('hosts', []):
                if h.get('status') == 'offline':
                    offline_hosts.append({
                        'service_id': str(h.get('id', '—')),
                        'name':       (h.get('name') or h.get('ip') or '—')[:35],
                        'ip':         h.get('ip', '—'),
                        'city':       city.get('name', '—'),
                        'site':       site.get('name', '—'),
                        'lastSeen':   (h.get('lastSeen') or '')[:19] or '—',
                    })

    # Cruzar con alertas para obtener motivo / SOP
    alert_by_ip = {}
    for a in alerts:
        ip = a.get('hostIp') or a.get('ip', '')
        if ip and ip not in alert_by_ip:
            alert_by_ip[ip] = a

    if offline_hosts:
        elems.append(sec(f'HOSTS OFFLINE — DETALLE ({len(offline_hosts)} equipos)'))
        h_rows = [['ID Servicio', 'Host / IP', 'Ciudad · Sitio', 'Último contacto', 'Motivo / SOP']]
        for h in offline_hosts[:25]:
            al = alert_by_ip.get(h['ip'], {})
            motivo = (al.get('message') or al.get('type') or 'Sin datos')[:40]
            sop    = al.get('sopId', '')
            motivo_txt = f"{motivo}  [{sop}]" if sop else motivo
            h_rows.append([
                h['service_id'],
                h['name'],
                f"{h['city']} · {h['site']}",
                h['lastSeen'],
                motivo_txt,
            ])
        h_data = [[Paragraph(str(cell),
                             sty(fontSize=7, textColor=(WHITE if i==0 else BLACK),
                                 fontName='Helvetica-Bold' if i==0 else 'Helvetica', leading=10))
                   for cell in row] for i, row in enumerate(h_rows)]
        ht = Table(h_data, colWidths=[0.85*inch, 1.4*inch, 1.45*inch, 1.1*inch, 2.45*inch])
        ht.setStyle(TableStyle(hdr_tbl([
            ('TEXTCOLOR', (4,1), (4,-1), GREY),
        ])))
        elems.append(ht)
        elems.append(Spacer(1, 0.12*inch))

    # ── Alertas críticas ───────────────────────────────────────────────────
    crit_alerts = [a for a in alerts if a.get('severity') == 'critical'][:12]
    if crit_alerts:
        elems.append(sec(f'ALERTAS CRÍTICAS ACTIVAS — {len(crit_alerts)} eventos'))
        a_rows = [['Ciudad', 'Host / IP', 'Causa', 'Fecha/Hora', 'SOP']]
        for a in crit_alerts:
            ts  = (a.get('timestamp') or '')[:19] or '—'
            msg = (a.get('message') or a.get('type') or '—')[:45]
            host = (a.get('hostName') or a.get('hostIp') or '—')[:25]
            a_rows.append([a.get('cityName','—'), host, msg, ts, a.get('sopId','—')])
        a_data = [[Paragraph(str(c),
                             sty(fontSize=7, textColor=(WHITE if i==0 else (RED if (i>0 and j==2) else BLACK)),
                                 fontName='Helvetica-Bold' if i==0 else 'Helvetica', leading=10))
                   for j, c in enumerate(row)] for i, row in enumerate(a_rows)]
        at = Table(a_data, colWidths=[1.0*inch, 1.35*inch, 2.5*inch, 1.1*inch, 0.8*inch])
        at.setStyle(TableStyle(hdr_tbl([])))
        elems.append(at)
        elems.append(Spacer(1, 0.12*inch))

    # ── WFM ────────────────────────────────────────────────────────────────
    elems.append(sec('WFM — ÓRDENES DE SERVICIO'))
    estados = {}
    for o in wfm_orders:
        est = o.get('estado', 'OTRO')
        estados[est] = estados.get(est, 0) + 1

    wfm_vals = [str(len(wfm_orders)),
                str(estados.get('LISTO_INSTALACION', 0)),
                str(estados.get('BACKLOG', 0)),
                str(estados.get('EN_PROCESO', estados.get('PREVENTA', 0)))]
    wfm_lbls = ['TOTAL', 'LISTAS', 'BACKLOG', 'EN PROCESO']
    wfm_clrs = [BLACK, GREEN, RED, ORANGE]
    wt = Table(
        [[Paragraph(f'<b>{v}</b>', sty(fontSize=22, textColor=c, fontName='Helvetica-Bold', alignment=TA_CENTER))
          for v, c in zip(wfm_vals, wfm_clrs)],
         [Paragraph(l, sty(fontSize=7, textColor=GREY, alignment=TA_CENTER)) for l in wfm_lbls]],
        colWidths=[1.69*inch]*4)
    wt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), WHITE),
        ('BOX',        (0,0), (-1,-1), 0.5, BORDER),
        ('INNERGRID',  (0,0), (-1,-1), 0.3, BORDER),
        ('LINEABOVE',  (0,0), (-1,0),  2.5, GREEN),
        ('ALIGN',      (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elems.append(wt)
    elems.append(Spacer(1, 0.1*inch))

    recent = sorted(wfm_orders, key=lambda x: x.get('fecha_creacion',''), reverse=True)[:10]
    if recent:
        o_rows = [['ID', 'Cliente', 'Servicio', 'Estado', 'Fecha']]
        for o in recent:
            o_rows.append([
                str(o.get('id',''))[-6:],
                str(o.get('cliente',''))[:22],
                str(o.get('servicio',''))[:28],
                str(o.get('estado','')),
                str(o.get('fecha_creacion',''))[:10],
            ])
        o_data = [[Paragraph(str(c),
                             sty(fontSize=8, textColor=(WHITE if i==0 else BLACK),
                                 fontName='Helvetica-Bold' if i==0 else 'Helvetica', leading=11))
                   for c in row] for i, row in enumerate(o_rows)]
        ot = Table(o_data, colWidths=[0.65*inch, 1.7*inch, 2.1*inch, 1.3*inch, 0.9*inch])
        ot.setStyle(TableStyle(hdr_tbl([])))
        elems.append(ot)

    # ── Footer ─────────────────────────────────────────────────────────────
    elems.append(Spacer(1, 0.2*inch))
    elems.append(HRFlowable(width='100%', thickness=1, color=GREEN))
    elems.append(Spacer(1, 0.06*inch))
    elems.append(Paragraph(
        f'XCIEN Network Operations Center  ·  Folio: {folio}  ·  {generated_at}  ·  Confidencial',
        sty(fontSize=7, textColor=GREY, alignment=TA_CENTER)))

    doc.build(elems)
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


# ============================================================
# UISP — Mapa de red y estado de dispositivos
# ============================================================

@app.get("/api/red/resumen")
async def red_resumen():
    """KPIs generales de la red UISP."""
    return await uisp_service.get_summary()


@app.get("/api/red/dispositivos")
async def red_dispositivos():
    """Lista de todos los dispositivos con estado."""
    return await uisp_service.get_devices()


@app.get("/api/red/topologia")
async def red_topologia():
    """Nodos + edges para React Flow."""
    return await uisp_service.get_topology()


@app.get("/api/red/links")
async def red_links():
    """Conexiones (data-links) entre dispositivos."""
    return await uisp_service.get_data_links()


@app.get("/api/red/topologia-geo")
async def red_topologia_geo():
    """Links con coordenadas geográficas para dibujar en el mapa."""
    return await uisp_service.get_topology_geo()


@app.get("/api/red/host/{host_id}")
async def red_host_detalle(host_id: str):
    """Detalle completo de un host: NOCBoard + UISP si es Ubiquiti."""
    import httpx

    NOCBOARD_API_BASE = "http://localhost:9401/api"
    NOCBOARD_API_KEY  = "87a08190b801416392e944ab79c7e3c9"

    # Buscar en NOCBoard
    host = None
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(
                f"{NOCBOARD_API_BASE}/hosts",
                headers={"X-API-Key": NOCBOARD_API_KEY}
            )
            hosts = r.json()
            if isinstance(hosts, dict):
                hosts = hosts.get("hosts", [])
            host = next((h for h in hosts if h.get("id") == host_id), None)
    except Exception as e:
        logger.warning(f"NOCBoard host detail error: {e}")

    if not host:
        raise HTTPException(status_code=404, detail="Host no encontrado")

    result = dict(host)

    # Enriquecer con UISP si es Ubiquiti
    if host.get("vendor") == "Ubiquiti":
        try:
            devices = await uisp_service.get_devices()
            # Intentar match por nombre o IP
            uisp_dev = next(
                (d for d in devices if d.get("name") == host.get("name")), None
            )
            if not uisp_dev:
                uisp_dev = next(
                    (d for d in devices if host.get("ip") and d.get("mac") and
                     host.get("name","").lower() in (d.get("name","").lower())), None
                )
            if uisp_dev:
                result["uisp"] = {
                    "signal":        uisp_dev.get("signal"),
                    "uplink_util":   uisp_dev.get("uplink_utilization"),
                    "downlink_util": uisp_dev.get("downlink_utilization"),
                    "stations":      uisp_dev.get("stations_count"),
                    "can_upgrade":   uisp_dev.get("can_upgrade"),
                    "firmware":      uisp_dev.get("firmware"),
                }
        except Exception as e:
            logger.warning(f"UISP enrich error: {e}")

    return result


# ─── Inventario Transfers (tokens de inventario entre almacenes) ───────────────
import inventario_tokens as inv_tk
from inventario_tokens import (
    InventoryTokenCreate, TokenLine,
    create_token, get_token, list_tokens,
    confirm_token, ship_token, receive_token, cancel_token,
    get_virtual_stock, WAREHOUSES, STATES,
)

@app.post("/api/inv-transfers/", status_code=201)
def api_inv_create(data: InventoryTokenCreate):
    try:
        return create_token(data)
    except ValueError as e:
        raise HTTPException(400, str(e))

@app.get("/api/inv-transfers/")
def api_inv_list(
    state: str = None,
    warehouse: str = None,
    limit: int = 50,
    offset: int = 0,
):
    return list_tokens(state=state, warehouse=warehouse, limit=limit, offset=offset)

@app.get("/api/inv-transfers/{token_id}")
def api_inv_get(token_id: str):
    t = get_token(token_id)
    if not t:
        raise HTTPException(404, "Token no encontrado")
    return t

@app.patch("/api/inv-transfers/{token_id}/confirm")
def api_inv_confirm(token_id: str):
    try:
        return confirm_token(token_id)
    except ValueError as e:
        raise HTTPException(400, str(e))

@app.patch("/api/inv-transfers/{token_id}/ship")
def api_inv_ship(token_id: str):
    try:
        return ship_token(token_id)
    except ValueError as e:
        raise HTTPException(400, str(e))

@app.patch("/api/inv-transfers/{token_id}/receive")
def api_inv_receive(token_id: str):
    try:
        return receive_token(token_id)
    except ValueError as e:
        raise HTTPException(400, str(e))

@app.patch("/api/inv-transfers/{token_id}/cancel")
def api_inv_cancel(token_id: str):
    try:
        return cancel_token(token_id)
    except ValueError as e:
        raise HTTPException(400, str(e))

@app.get("/api/inv-transfers/stock/{warehouse}")
def api_inv_stock(warehouse: str):
    if warehouse not in WAREHOUSES:
        raise HTTPException(400, f"Almacén inválido: {list(WAREHOUSES.keys())}")
    return get_virtual_stock(warehouse)

@app.get("/api/inv-transfers/warehouses/all")
def api_inv_warehouses():
    return [
        {
            "code": code,
            "name": cfg["name"],
            "city": cfg["city"],
            "odoo_location_code": cfg["odoo_location_code"],
            "odoo_connected": cfg["odoo_location_id"] is not None,
        }
        for code, cfg in WAREHOUSES.items()
    ]


# ─── XCIEN Tokens Unificados ──────────────────────────────────────────────────
import xcien_tokens as xt
from xcien_tokens import (
    Token, TokenCreate, TransitionRequest,
    create_token as xt_create, get_token as xt_get,
    list_tokens as xt_list, transition_token as xt_transition,
    get_token_events as xt_events, get_stats as xt_stats,
    auto_emit, verify_chain, subscribe as xt_subscribe, unsubscribe as xt_unsubscribe,
    DOMAINS, ENTITIES,
)
from fastapi.responses import StreamingResponse

@app.post("/api/xtokens/", status_code=201)
def api_xt_create(data: TokenCreate):
    try:
        return xt_create(data).model_dump()
    except ValueError as e:
        raise HTTPException(400, str(e))

@app.get("/api/xtokens/")
def api_xt_list(
    domain: str = None, entity: str = None, state: str = None,
    limit: int = 100, offset: int = 0, search: str = None,
):
    return [t.model_dump() for t in xt_list(domain=domain, entity=entity, state=state, limit=limit, offset=offset, search=search)]

@app.get("/api/xtokens/stats")
def api_xt_stats():
    return xt_stats()

@app.get("/api/xtokens/schema")
def api_xt_schema():
    return {
        "domains": {k: {
            "label": v["label"], "icon": v["icon"], "color": v["color"],
            "initial": v["initial"],
            "states": list(v["transitions"].keys()),
            "state_labels": v["state_labels"],
            "transitions": v["transitions"],
        } for k, v in DOMAINS.items()},
        "entities": ENTITIES,
    }

@app.get("/api/xtokens/{token_id}")
def api_xt_get(token_id: str):
    t = xt_get(token_id)
    if not t:
        raise HTTPException(404, "Token no encontrado")
    return t.model_dump()

@app.get("/api/xtokens/{token_id}/events")
def api_xt_events(token_id: str):
    return xt_events(token_id)

@app.post("/api/xtokens/{token_id}/transition")
def api_xt_transition(token_id: str, req: TransitionRequest):
    try:
        return xt_transition(token_id, req).model_dump()
    except ValueError as e:
        raise HTTPException(400, str(e))

@app.get("/api/xtokens/chain/verify")
def api_xt_verify():
    return verify_chain()

@app.get("/api/xtokens/stream")
async def api_xt_stream():
    """SSE — transmite cada evento de token en tiempo real."""
    q = xt_subscribe()
    async def event_generator():
        try:
            # Heartbeat inicial
            yield "data: {\"type\":\"connected\"}\n\n"
            while True:
                try:
                    event = await asyncio.wait_for(q.get(), timeout=20.0)
                    yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                except asyncio.TimeoutError:
                    yield "data: {\"type\":\"ping\"}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            xt_unsubscribe(q)
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Auto-emit hooks — se disparan en los endpoints de acción existentes ───────

def _hook_transaccion(tx: dict):
    """Emite token finanzas cuando se registra una transacción inter-empresa."""
    try:
        auto_emit(
            domain="finanzas", entity=tx.get("empresa_origen", "xcien"),
            payload={k: v for k, v in tx.items() if k != "firma"},
            created_by=tx.get("responsable", "sistema"),
            notes=tx.get("concepto", ""),
            ext_ref=tx.get("tx_id"), ext_system="transacciones_api",
        )
    except Exception:
        pass

def _hook_token_operativo(data: dict):
    """Emite token rrhh/academia cuando se crea un token operativo."""
    tipo = data.get("tipo", "")
    domain = "academia" if tipo in ("certificacion",) else "rrhh"
    try:
        auto_emit(
            domain=domain, entity=data.get("empresa", "xcien"),
            payload={**data, "tipo_original": tipo},
            created_by=data.get("nombre") or data.get("agente") or "sistema",
            notes=data.get("detalle", ""),
            ext_system="tokens_operativo",
        )
    except Exception:
        pass

def _hook_wfm_ticket(ticket: dict, action: str = "created"):
    """Emite token field_service cuando se crea o actualiza un ticket WFM."""
    state_map = {
        "created": "created", "Abierto": "created",
        "Agendado": "assigned", "En Sitio": "in_progress",
        "Cerrado": "completed", "Cancelado": "cancelled",
    }
    state = state_map.get(ticket.get("status", "created"), "created")
    try:
        # Si ya existe un token para este ticket, transicionarlo
        existing = xt_list(domain="field_service", search=ticket.get("id", ""), limit=1)
        if existing and action != "created":
            allowed = DOMAINS["field_service"]["transitions"].get(existing[0].state, [])
            if state in allowed:
                xt_transition(existing[0].token_id, TransitionRequest(
                    new_state=state, transitioned_by="wfm_sistema",
                    notes=f"Status WFM: {ticket.get('status')}",
                ))
            return
        auto_emit(
            domain="field_service", entity="xcien",
            payload={
                "tecnico": ticket.get("asignado"),
                "cliente": ticket.get("client"),
                "sitio": ticket.get("location"),
                "tipo_servicio": ticket.get("tipo"),
                "zona": ticket.get("zona"),
                "priority": ticket.get("priority"),
                "ticket_id": ticket.get("id"),
            },
            created_by="wfm_sistema",
            notes=ticket.get("description", ""),
            ext_ref=ticket.get("id"), ext_system="wfm",
        )
    except Exception:
        pass


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

# ─── Health Check ──────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "XCIEN Backend", "version": "2.0"}

# ─── Auth: Login ───────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = auth_service.autenticar(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas o usuario inactivo")
    return auth_service.crear_token(user)

@app.get("/api/auth/me")
def me(user: dict = Depends(get_current_user)):
    return user

@app.post("/api/auth/logout")
def logout():
    # JWT es stateless; el cliente descarta el token
    return {"status": "ok", "message": "Sesión cerrada"}

# ─── Auth: Gestión de Usuarios ─────────────────────────────────────────────────
class UserCreateRequest(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str
    plaza: str = ""

class UserUpdateRequest(BaseModel):
    nombre: Optional[str] = None
    rol: Optional[str] = None
    plaza: Optional[str] = None
    activo: Optional[bool] = None
    password: Optional[str] = None

@app.get("/api/auth/usuarios")
def listar_usuarios(user: dict = Depends(require_rol("admin", "director"))):
    return auth_service.listar_usuarios()

@app.post("/api/auth/usuarios")
def crear_usuario(req: UserCreateRequest, user: dict = Depends(require_rol("admin"))):
    try:
        nuevo = auth_service.crear_usuario(
            req.nombre, req.email, req.password, req.rol, req.plaza
        )
        return {"status": "success", "usuario": nuevo}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/auth/usuarios/{user_id}")
def actualizar_usuario(user_id: str, req: UserUpdateRequest,
                       user: dict = Depends(require_rol("admin"))):
    try:
        actualizado = auth_service.actualizar_usuario(user_id, req.model_dump(exclude_none=True))
        return {"status": "success", "usuario": actualizado}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/auth/usuarios/{user_id}")
def eliminar_usuario(user_id: str, user: dict = Depends(require_rol("admin"))):
    if user["sub"] == user_id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    auth_service.eliminar_usuario(user_id)
    return {"status": "success"}

@app.get("/api/auth/roles")
def listar_roles(user: dict = Depends(get_current_user)):
    return auth_service.ROLES

# ─── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("🚀 XCIEN 2.0 Backend iniciando en puerto 8002...")
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8002)))
