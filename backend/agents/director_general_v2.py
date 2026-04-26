import os
import json
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
        self.client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        self.contexto_maestro = self._cargar_contexto()
        print(f"💎 [{self.name}] Sistema en línea. Claude conectado. Base de Conocimiento Xcien cargada.")

    def _cargar_contexto(self):
        try:
            with open(LIBRO_MAESTRO, "r", encoding="utf-8") as f:
                return f.read()
        except:
            return "No se encontró el manual maestro. Operando con conocimiento base."

    def ejecutar_orden(self, instruccion_usuario):
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
        system_blocks = [
            {
                "type": "text",
                "text": (
                    "Eres el DIRECTOR GENERAL de XCIEN, empresa ISP que opera 5 operadoras: "
                    "XCIEN, Wispi, Luminet WAN, Huus y Sandur.\n"
                    "Tienes a tu cargo: Operaciones de Campo, RRHH, NOC y Dispatch.\n"
                    "Tu personalidad es profesional, ejecutiva y orientada a resultados. "
                    "Respondes siempre en español. Usas Markdown con bullets y secciones.\n\n"
                    "═══ MANUAL MAESTRO DE OPERACIONES ═══\n"
                    f"{self.contexto_maestro[:6000]}\n\n"
                    "═══ INSTRUCCIONES ═══\n"
                    "1. Analiza la instrucción con los datos REALES del bloque WFM.\n"
                    "2. Si mencionan un técnico específico, usa sus datos reales.\n"
                    "3. Si involucra campo, cita la regla del manual.\n"
                    "4. Da una respuesta ejecutiva, clara y accionable.\n"
                    "5. Sé conciso pero completo."
                ),
                "cache_control": {"type": "ephemeral"},   # ← CACHÉ AQUÍ
            },
            {
                "type": "text",
                "text": (
                    "═══ DATOS EN TIEMPO REAL (WFM) ═══\n"
                    f"TÉCNICOS DE CAMPO:\n{tecnicos_resumen or 'Sin datos WFM disponibles'}\n\n"
                    f"TICKETS ACTIVOS:\n{tickets_resumen or 'Sin tickets activos'}\n\n"
                    f"MATRIZ DE HABILIDADES:\n{skills_resumen}"
                ),
                # Sin cache_control — estos datos cambian frecuentemente
            },
        ]

        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=1024,
                system=system_blocks,
                messages=[{"role": "user", "content": instruccion_usuario}],
                extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
            )
            response_text = message.content[0].text

            # Log de uso de caché
            usage = message.usage
            cache_hit   = getattr(usage, 'cache_read_input_tokens', 0)
            cache_write = getattr(usage, 'cache_creation_input_tokens', 0)
            input_tokens = getattr(usage, 'input_tokens', 0)
            print(f"\n💎 [Director General] | tokens_entrada={input_tokens} | cache_escrito={cache_write} | cache_leído={cache_hit}")
            print(response_text)
            return response_text
        except Exception as e:
            return f"⚠️ [Director General] Error en el centro de mando: {e}"

if __name__ == "__main__":
    dg = DirectorGeneralV2()
    orden = "Dame un resumen del estado operativo del equipo de campo ahora mismo."
    dg.ejecutar_orden(orden)
