from __future__ import annotations
import os
import json
import google.generativeai as genai
import anthropic
from dotenv import load_dotenv

# Paths relativos al directorio backend/ (donde corre el servidor)
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_BACKEND_DIR, ".env"), override=True)

WFM_DB = os.path.join(_BACKEND_DIR, "db", "wfm_data.json")
SKILLS_DB = os.path.join(_BACKEND_DIR, "db", "skills_2026.json")
LIBRO_MAESTRO = os.path.join(_BACKEND_DIR, "..", "docs", "auditoria_2026", "LIBRO_MAESTRO_OPERACIONES_XCIEN_2026.md")

def _cargar_wfm():
    try:
        with open(WFM_DB, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {"tecnicos": [], "tickets": []}

def _cargar_skills():
    try:
        with open(SKILLS_DB, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

class DirectorGeneralV2:
    def __init__(self):
        self.name = "Director General"
        self.gemini_key = os.environ.get("GEMINI_API_KEY")
        self.anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
        
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self.mode = "gemini"
        elif self.anthropic_key:
            self.client_anthropic = anthropic.Anthropic(api_key=self.anthropic_key)
            self.mode = "claude"
        else:
            self.mode = "error"
            
        self.contexto_maestro = self._cargar_contexto()
        print(f"💎 [{self.name}] Sistema en línea. Modo: {self.mode}. Base de Conocimiento cargada.")

    def _cargar_contexto(self):
        try:
            with open(LIBRO_MAESTRO, "r", encoding="utf-8") as f:
                return f.read()
        except:
            return "No se encontró el manual maestro. Operando con conocimiento base."

    def ejecutar_orden(self, instruccion_usuario, history=None):
        if history is None:
            history = []
        print(f"\n=========================================")
        print(f"👤 ALTA GERENCIA: {instruccion_usuario}")
        print(f"=========================================")

        # Cargar datos en tiempo real (cambian frecuentemente — NO se cachean)
        wfm = _cargar_wfm()
        skills = _cargar_skills()

        tecnicos_resumen = "\n".join([
            f"- {t.get('nombre', t.get('name','?'))} | Zona: {t.get('zona', t.get('zone','N/A'))} | Status: {t['status']} | Skills: {t.get('skills', {})}"
            for t in wfm.get("tecnicos", [])
        ])
        tickets_resumen = "\n".join([
            f"- Ticket {t['id']}: {t.get('tipo','?')} en {t.get('zona', t.get('zone','?'))} | Status: {t.get('status','?')} | Asignado: {t.get('asignado', t.get('assignedTo','Sin asignar'))}"
            for t in wfm.get("tickets", [])
        ])
        skills_resumen = "\n".join([
            f"- {nombre}: última actualización {datos.get('last_update','?')} | Habilidades: {datos.get('skills', {})}"
            for nombre, datos in skills.items()
        ]) if skills else "Sin evaluaciones de habilidades registradas."

        # ── Prompt con caché ─────────────────────────────────────────────────
        # Bloque 1 (CACHEADO): identidad + manual maestro — no cambia entre llamadas
        # Bloque 2 (NO cacheado): datos WFM en tiempo real — cambia con cada llamada
        # Ahorro: ~80% menos costo en el bloque 1 a partir del 2do mensaje
        system_instruction = (
            "Eres el DIRECTOR GENERAL de XCIEN, empresa ISP que opera 5 operadoras: "
            "XCIEN, Wispi, Luminet WAN, Huus y Sandur.\n"
            "Tienes a tu cargo: Operaciones de Campo, RRHH, NOC y Dispatch.\n"
            "Tu personalidad es profesional, ejecutiva y orientada a resultados. "
            "Respondes siempre en español. Usas Markdown con bullets y secciones.\n\n"
            "═══ MANUAL MAESTRO DE OPERACIONES ═══\n"
            f"{self.contexto_maestro[:6000]}\n\n"
            "═══ DATOS EN TIEMPO REAL (WFM) ═══\n"
            f"TÉCNICOS DE CAMPO:\n{tecnicos_resumen or 'Sin datos WFM disponibles'}\n\n"
            f"TICKETS ACTIVOS:\n{tickets_resumen or 'Sin tickets activos'}\n\n"
            f"MATRIZ DE HABILIDADES:\n{skills_resumen}\n\n"
            "═══ INSTRUCCIONES ═══\n"
            "1. Analiza la instrucción con los datos REALES del bloque WFM.\n"
            "2. Si mencionan un técnico específico, usa sus datos reales.\n"
            "3. Si involucra campo, cita la regla del manual.\n"
            "4. Da una respuesta ejecutiva, clara y accionable.\n"
            "5. Sé conciso pero completo."
        )

        try:
            if self.mode == "gemini":
                model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_instruction)
                gemini_history = []
                for msg in history:
                    role = "user" if msg.get("role") == "user" else "model"
                    gemini_history.append({"role": role, "parts": [msg.get("content", "")]})
                chat = model.start_chat(history=gemini_history)
                response = chat.send_message(instruccion_usuario)
                response_text = response.text
            elif self.mode == "claude":
                prompt_claude = f"{system_instruction}\n\nHistorial:\n{json.dumps(history)}\n\nUsuario: {instruccion_usuario}"
                message = self.client_anthropic.messages.create(
                    model="claude-3-5-sonnet-20240620",
                    max_tokens=2048,
                    messages=[{"role": "user", "content": prompt_claude}]
                )
                response_text = message.content[0].text
            else:
                return "⚠️ [Director General] No se encontró clave de API (Gemini o Anthropic). Por favor configura el archivo .env"

            print(f"\n💎 [Director General - {self.mode.upper()}]")
            print(response_text)
            return response_text
        except Exception as e:
            return f"⚠️ [Director General] Error en el centro de mando ({self.mode}): {e}"

if __name__ == "__main__":
    dg = DirectorGeneralV2()
    orden = "Dame un resumen del estado operativo del equipo de campo ahora mismo."
    dg.ejecutar_orden(orden)
