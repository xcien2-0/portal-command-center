import os
import json
import anthropic
from dotenv import load_dotenv

load_dotenv()

WFM_DB = "db/wfm_data.json"
SKILLS_DB = "db/skills_2026.json"

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
        self.client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        self.contexto_maestro = self._cargar_contexto()
        print(f"💎 [{self.name}] Sistema en línea. Claude conectado. Base de Conocimiento Xcien cargada.")

    def _cargar_contexto(self):
        try:
            with open("LIBRO_MAESTRO_OPERACIONES_XCIEN_2026.md", "r", encoding="utf-8") as f:
                return f.read()
        except:
            return "No se encontró el manual maestro. Operando con conocimiento base."

    def ejecutar_orden(self, instruccion_usuario):
        print(f"\n=========================================")
        print(f"👤 ALTA GERENCIA: {instruccion_usuario}")
        print(f"=========================================")

        # Cargar datos en tiempo real
        wfm = _cargar_wfm()
        skills = _cargar_skills()

        tecnicos_resumen = "\n".join([
            f"- {t['nombre']} | Zona: {t.get('zona','N/A')} | Status: {t['status']} | Skills: {t.get('skills', {})}"
            for t in wfm.get("tecnicos", [])
        ])
        tickets_resumen = "\n".join([
            f"- Ticket {t['id']}: {t.get('tipo','?')} en {t.get('zona','?')} | Status: {t['status']} | Asignado: {t.get('asignado','Sin asignar')}"
            for t in wfm.get("tickets", [])
        ])
        skills_resumen = "\n".join([
            f"- {nombre}: última actualización {datos.get('last_update','?')} | Habilidades: {datos.get('skills', {})}"
            for nombre, datos in skills.items()
        ]) if skills else "Sin evaluaciones de habilidades registradas."

        system_prompt = f"""Eres el DIRECTOR GENERAL de XCIEN, una empresa ISP que opera 5 operadoras: XCIEN, Wispi, Luminet WAN, Huus y Sandur.
Tienes a tu cargo: Operaciones de Campo, RRHH, NOC y Dispatch.
Tu personalidad es profesional, ejecutiva y orientada a resultados. Respondes siempre en español.

═══ MANUAL MAESTRO DE OPERACIONES ═══
{self.contexto_maestro[:4000]}

═══ DATOS EN TIEMPO REAL (WFM) ═══
TÉCNICOS DE CAMPO:
{tecnicos_resumen if tecnicos_resumen else 'Sin datos WFM disponibles'}

TICKETS ACTIVOS:
{tickets_resumen if tickets_resumen else 'Sin tickets activos'}

MATRIZ DE HABILIDADES:
{skills_resumen}

═══ INSTRUCCIONES ═══
Al recibir una orden:
1. Analiza la instrucción con los datos REALES anteriores.
2. Si mencionan un técnico específico, usa sus datos reales.
3. Si involucra campo, cita la regla del manual.
4. Da una respuesta ejecutiva, clara y accionable.
5. Usa Markdown con bullets y secciones. Sé conciso pero completo."""

        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": instruccion_usuario}
                ]
            )
            response_text = message.content[0].text
            print(f"\n💎 [Director General]:\n{response_text}")
            return response_text
        except Exception as e:
            return f"⚠️ [Director General] Error en el centro de mando: {e}"

if __name__ == "__main__":
    dg = DirectorGeneralV2()
    orden = "Dame un resumen del estado operativo del equipo de campo ahora mismo."
    dg.ejecutar_orden(orden)
