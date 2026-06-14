"""
Bot de Telegram con IA — XCIEN 2.0
Recibe alertas, escucha instrucciones y rutea a los agentes correctos.
"""

import os
import asyncio
import logging
import anthropic
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
ALLOWED_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

_claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

SYSTEM_PROMPT = """Eres el asistente operativo de XCIEN 2.0 en Telegram.

Tu trabajo es entender las instrucciones de José Miguel y ejecutarlas o rutearlas al agente correcto.

AGENTES DISPONIBLES:
- noc: monitoreo de red, alertas, hosts offline, ping
- wfm: técnicos en campo, tickets, instalaciones, asignaciones
- director: análisis estratégico, reportes ejecutivos, decisiones
- academia: cursos, exámenes, técnicos, escalafón
- finanzas: reportes financieros, transacciones
- inventario: equipos, materiales, stock

FORMATO DE RESPUESTA (siempre en JSON):
{
  "agente": "noc|wfm|director|academia|finanzas|inventario|yo",
  "accion": "descripción corta de lo que se va a hacer",
  "respuesta": "respuesta directa al usuario en español",
  "urgente": true|false
}

Si la instrucción es una pregunta simple que puedes responder tú mismo, usa agente: "yo".
Responde siempre en español. Sé directo y operativo."""


def _autorizado(update: Update) -> bool:
    chat_id = str(update.effective_chat.id)
    if ALLOWED_CHAT_ID and chat_id != ALLOWED_CHAT_ID:
        logger.warning(f"Acceso denegado: {chat_id}")
        return False
    return True


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not _autorizado(update): return
    await update.message.reply_text(
        "🤖 *XCIEN 2.0 — Bot Operativo*\n\n"
        "Estoy listo. Puedo:\n"
        "• Avisarte de alertas NOC en tiempo real\n"
        "• Ejecutar instrucciones a los agentes\n"
        "• Darte status del sistema\n\n"
        "Comandos:\n"
        "/status — Estado general\n"
        "/alertas — Alertas activas\n"
        "/ayuda — Qué puedo hacer\n\n"
        "O escríbeme lo que necesites.",
        parse_mode="Markdown"
    )


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not _autorizado(update): return
    await update.message.reply_text("⏳ Consultando estado del sistema...")
    try:
        import requests
        r = requests.get("http://localhost:8000/api/status", timeout=5)
        if r.ok:
            d = r.json()
            msg = (
                f"📊 *Estado XCIEN 2.0*\n\n"
                f"🟢 Backend: Online\n"
                f"📡 NOC: {d.get('noc', '—')}\n"
                f"👷 WFM: {d.get('wfm', '—')}\n"
                f"🤖 Agentes: {d.get('agents', '—')}"
            )
        else:
            msg = "⚠️ Backend responde pero con error."
    except Exception:
        msg = "🔴 Backend no responde en localhost:8000"
    await update.message.reply_text(msg, parse_mode="Markdown")


async def cmd_alertas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not _autorizado(update): return
    await update.message.reply_text("⏳ Consultando alertas NOC...")
    try:
        import requests
        r = requests.get("http://localhost:8000/api/noc/alertas", timeout=5)
        if r.ok:
            alertas = r.json()
            if not alertas:
                await update.message.reply_text("✅ Sin alertas activas.")
                return
            msg = f"🚨 *{len(alertas)} alertas activas*\n\n"
            for a in alertas[:5]:
                emoji = "🔴" if a.get("severity") == "critical" else "🟡"
                msg += f"{emoji} {a.get('host','?')} — {a.get('description','?')}\n"
            if len(alertas) > 5:
                msg += f"\n_...y {len(alertas)-5} más_"
        else:
            msg = "⚠️ No se pudo obtener alertas del backend."
    except Exception:
        msg = "🔴 Backend no responde — verifica que el servidor esté corriendo."
    await update.message.reply_text(msg, parse_mode="Markdown")


async def cmd_ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not _autorizado(update): return
    await update.message.reply_text(
        "💡 *¿Qué puedo hacer?*\n\n"
        "*NOC:* 'muéstrame los hosts offline en monterrey'\n"
        "*WFM:* 'asigna técnico al ticket 456'\n"
        "*Reportes:* 'genera reporte ejecutivo de hoy'\n"
        "*Alertas:* 'silencia alertas de saltillo por 1 hora'\n"
        "*General:* cualquier instrucción en español\n\n"
        "Simplemente escríbeme lo que necesitas.",
        parse_mode="Markdown"
    )


async def handle_mensaje(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not _autorizado(update): return

    texto = update.message.text
    logger.info(f"Mensaje recibido: {texto}")

    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")

    try:
        # Claude entiende la instrucción y la rutea
        resp = _claude.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": texto}]
        )

        import json
        raw = resp.content[0].text.strip()

        # Limpiar markdown si Claude lo envuelve
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        data = json.loads(raw)
        agente = data.get("agente", "yo")
        respuesta = data.get("respuesta", "Entendido.")
        accion = data.get("accion", "")
        urgente = data.get("urgente", False)

        # Ejecutar en el backend si hay agente específico
        resultado = ""
        if agente != "yo":
            try:
                import requests
                payload = {"instruccion": texto, "accion": accion}
                r = requests.post(
                    f"http://localhost:8000/api/agente/{agente}",
                    json=payload, timeout=10
                )
                if r.ok:
                    resultado = r.json().get("resultado", "")
            except Exception as e:
                resultado = f"(Backend no disponible: {e})"

        # Armar respuesta final
        emoji = "🚨" if urgente else "🤖"
        msg = f"{emoji} *Agente: {agente.upper()}*\n\n{respuesta}"
        if resultado:
            msg += f"\n\n📋 *Resultado:*\n{resultado}"

        await update.message.reply_text(msg, parse_mode="Markdown")

    except Exception as e:
        logger.error(f"Error procesando mensaje: {e}")
        await update.message.reply_text(
            f"❌ Error procesando tu instrucción.\n`{str(e)[:100]}`",
            parse_mode="Markdown"
        )


def run_bot():
    if not TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN no configurado en .env")
        return

    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("alertas", cmd_alertas))
    app.add_handler(CommandHandler("ayuda", cmd_ayuda))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_mensaje))

    logger.info("🤖 Bot XCIEN 2.0 iniciado — escuchando mensajes...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    run_bot()
