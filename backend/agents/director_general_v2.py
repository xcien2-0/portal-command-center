import os
import json
import anthropic
from datetime import date
from dotenv import load_dotenv

# Configuración de rutas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)

LIBRO_MAESTRO = os.path.join(BASE_DIR, "docs", "estandares", "Estándar_Proceso_Soporte_HL.md")
WFM_FILE = os.path.join(BASE_DIR, "db", "wfm_data.json")
SKILLS_DB = os.path.join(BASE_DIR, "db", "skills_matrix.json")

def _cargar_wfm():
    data = {"tecnicos": [], "tickets": [], "ordenes_wfm": []}
    try:
        with open(WFM_FILE, "r", encoding="utf-8") as f:
            d = json.load(f)
            data["tecnicos"] = d.get("tecnicos", [])
            data["tickets"] = d.get("tickets", [])
    except: pass
    
    try:
        orders_path = os.path.join(BASE_DIR, "db", "wfm_orders.json")
        with open(orders_path, "r", encoding="utf-8") as f:
            data["ordenes_wfm"] = json.load(f)
    except: pass
    
    return data

def _get_noc_summary():
    # Intentar obtener del backend vivo
    try:
        import requests
        res = requests.get("http://localhost:8000/api/noc/summary", timeout=1)
        if res.ok: return res.json()
    except: pass
    return {"totalHosts": 0, "online": 0, "activeAlerts": 0, "avgHealthScore": 0}

class DirectorGeneralV2:
    def __init__(self):
        self.name = "Director General (Claude-Powered Antigravity)"
        self.contexto_maestro = self._cargar_contexto()
        self.client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        print(f"💎 [{self.name}] Sistema en línea. Motor Claude Haiku activado.")

    def _cargar_contexto(self):
        try:
            with open(LIBRO_MAESTRO, "r", encoding="utf-8") as f:
                return f.read()
        except: return "No se encontró el manual maestro."

    def ejecutar_orden(self, instruccion_usuario, history=None, context=""):
        if history is None: history = []
        print(f"\n=========================================")
        print(f"👤 ALTA GERENCIA (Contexto: {context}): {instruccion_usuario}")
        print(f"=========================================")

        # 1. Cargar datos frescos
        wfm = _cargar_wfm()
        noc = _get_noc_summary()
        
        # 2. Construir Prompt de Sistema con datos reales
        system_prompt = f"""Eres el Director General de XCIEN, un asistente de IA de alto nivel encargado de la orquestación operativa.
Tu tono es profesional, ejecutivo y resolutivo. Tienes acceso a datos en tiempo real:

[DATOS OPERATIVOS WFM]
- Técnicos Activos: {json.dumps(wfm.get('tecnicos', []), indent=2)}
- Tickets Pendientes: {json.dumps(wfm.get('tickets', []), indent=2)}

[DATOS DE RED NOC]
- Resumen: {json.dumps(noc, indent=2)}

[MANUAL MAESTRO (Contexto Corporativo)]
{self.contexto_maestro[:2000]}... (resumido)

Instrucciones:
1. Responde preguntas sobre el estado de la red, los técnicos o los tickets usando los datos arriba provistos.
2. Si el usuario pide "sincronizar", "crear", "asignar" o "ejecutar", confirma que estás encolando la orden.
3. Si la instrucción es ambigua, pide aclaración pero siempre mantén la postura de mando.
"""

        try:
            # 3. Llamada a Claude via SDK oficial
            messages = []
            for h in history[-6:]:
                messages.append({"role": h["role"], "content": h["content"]})
            messages.append({"role": "user", "content": instruccion_usuario})

            response = self.client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=system_prompt,
                messages=messages
            )
            respuesta_final = response.content[0].text
        except Exception as e:
            print(f"❌ Error Comunicación Claude: {e}")
            respuesta_final = f"**[Antigravity Engine]** Error de comunicación con el núcleo de inteligencia. Detalle: {str(e)}"

        # 4. Conexión con el Bridge (Antigravity IA Ejecutora) — via API, sin import circular
        inst = instruccion_usuario.lower()
        actionable = ["sincroniza", "crea", "audita", "genera", "actualiza", "monitorea", "ejecuta", "borra", "asigna"]
        if any(k in inst for k in actionable):
            try:
                import requests, datetime
                requests.post("http://localhost:8000/api/bridge", json={
                    "task": instruccion_usuario,
                    "status": "working",
                    "log_entry": f"Orden DG recibida (Vista: {context}) — {datetime.datetime.now().strftime('%H:%M:%S')}"
                }, timeout=2)
                respuesta_final += "\n\n🚀 **ORDEN ENCOLADA:** Antigravity ha recibido la instrucción y está procesando la ejecución técnica."
            except:
                pass

        return respuesta_final

if __name__ == "__main__":
    dg = DirectorGeneralV2()
    print(dg.ejecutar_orden("¿Qué técnicos tengo disponibles y cómo está la red?"))
