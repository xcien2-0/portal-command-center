"""
Director Claude — orquestador de datos sin consumo de tokens.

Reemplaza director_general_v2.py (Gemini).  No llama a ninguna API de LLM.
Usa keyword-routing + funciones directas para responder con datos reales.
La inteligencia interpretativa vive en la sesión de Claude Code del operador.

Interfaz pública idéntica al anterior:
    agent = DirectorClaude()
    texto = agent.ejecutar_orden(instruccion, history, context)
"""
import os
import json
from datetime import datetime
from dotenv import load_dotenv

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)

WFM_FILE   = os.path.join(BASE_DIR, "db", "wfm_data.json")
WFM_ORDERS = os.path.join(BASE_DIR, "db", "wfm_orders.json")
FIBRA_FILE = os.path.join(BASE_DIR, "data", "fibra_x100.json")
XCIEN_DOCS = os.path.join(BASE_DIR, "Xcien_Docs")


# ─── Funciones de datos ───────────────────────────────────────────────────────

def _noc_status() -> dict:
    try:
        import requests
        for port in (8000, 8002):
            try:
                r = requests.get(f"http://localhost:{port}/api/noc/summary", timeout=2)
                if r.ok:
                    return r.json()
            except Exception:
                pass
    except ImportError:
        pass
    return {"totalHosts": 0, "online": 0, "activeAlerts": 0, "avgHealthScore": 0}


def _wfm_data(estado_filter: str = None) -> dict:
    result = {"tecnicos": [], "tickets": [], "ordenes": []}
    try:
        with open(WFM_FILE, "r", encoding="utf-8") as f:
            d = json.load(f)
            result["tecnicos"] = d.get("tecnicos", [])
            result["tickets"]  = d.get("tickets", [])
    except Exception:
        pass
    try:
        with open(WFM_ORDERS, "r", encoding="utf-8") as f:
            ordenes = json.load(f)
        if estado_filter:
            ordenes = [o for o in ordenes if o.get("estado") == estado_filter.upper()]
        result["ordenes"] = ordenes
    except Exception:
        pass
    return result


def _fibra_data() -> dict:
    try:
        with open(FIBRA_FILE, "r", encoding="utf-8") as f:
            d = json.load(f)
        return {
            "plazas":      d.get("plazas", []),
            "compromisos": d.get("compromisos", []),
            "sitios":      d.get("sitios", []),
        }
    except Exception as e:
        return {"error": str(e)}


def _xcien_docs(query: str) -> list[dict]:
    results = []
    query_low = query.lower()
    try:
        for fname in sorted(os.listdir(XCIEN_DOCS)):
            if not fname.endswith(".md"):
                continue
            path = os.path.join(XCIEN_DOCS, fname)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            if query_low and query_low not in content.lower():
                continue
            results.append({"archivo": fname, "extracto": content[:600]})
            if len(results) >= 3:
                break
    except Exception:
        pass
    return results


# ─── Formatters ───────────────────────────────────────────────────────────────

def _fmt_noc(data: dict) -> str:
    total    = data.get("totalHosts", 0)
    online   = data.get("online", 0)
    alertas  = data.get("activeAlerts", 0)
    health   = data.get("avgHealthScore", 0)
    offline  = total - online
    status   = "🟢 Estable" if offline == 0 and alertas == 0 else "🔴 Con incidencias"
    lines = [
        f"**Estado de Red NOC** — {status}",
        f"- Hosts monitoreados: {total}  |  En línea: {online}  |  Offline: {offline}",
        f"- Alertas activas: {alertas}  |  Health score: {health}",
    ]
    if offline > 0:
        lines.append(f"⚠️ Hay {offline} hosts fuera de línea. Verificar alimentación y conectividad.")
    if alertas > 0:
        lines.append(f"⚠️ {alertas} alertas requieren atención.")
    return "\n".join(lines)


def _fmt_wfm(data: dict, filtro: str = None) -> str:
    tecnicos = data.get("tecnicos", [])
    tickets  = data.get("tickets", [])
    ordenes  = data.get("ordenes", [])

    backlog   = [o for o in ordenes if o.get("estado") == "BACKLOG"]
    en_campo  = [o for o in ordenes if o.get("estado") == "EN_CAMPO"]
    almacen   = [o for o in ordenes if o.get("estado") == "ALMACEN_VALIDACION"]

    lines = [f"**Estado Operativo WFM**"]
    lines.append(f"- Técnicos activos: {len(tecnicos)}")
    if tecnicos:
        lines.append("  " + "  |  ".join(t.get("nombre", t.get("name", "?")) for t in tecnicos[:6]))
    lines.append(f"- Tickets pendientes: {len(tickets)}")
    lines.append(f"- Órdenes: {len(ordenes)} total  |  Backlog: {len(backlog)}  |  En campo: {len(en_campo)}  |  Almacén: {len(almacen)}")
    if backlog:
        lines.append(f"⚠️ {len(backlog)} órdenes en backlog requieren intervención.")
    return "\n".join(lines)


def _fmt_fibra(data: dict) -> str:
    if "error" in data:
        return f"**Fibra X100** — Error cargando datos: {data['error']}"
    plazas     = data.get("plazas", [])
    compromisos = data.get("compromisos", [])
    lines = [f"**Programa Fibra X100** — {len(plazas)} plazas"]
    for p in plazas:
        clientes = p.get("clientes_actuales", p.get("clients", 0))
        estado   = p.get("estado", p.get("status", "—"))
        lines.append(f"  • {p.get('nombre', p.get('name', p.get('id', '?')))}: {estado} | {clientes} clientes")
    lines.append(f"- Compromisos registrados: {len(compromisos)}")
    return "\n".join(lines)


def _fmt_docs(docs: list, query: str) -> str:
    if not docs:
        return f"No encontré documentos sobre '{query}' en Xcien_Docs."
    lines = [f"**Documentos sobre '{query}'**"]
    for d in docs:
        lines.append(f"\n📄 **{d['archivo']}**\n{d['extracto']}")
    return "\n".join(lines)


# ─── Router ───────────────────────────────────────────────────────────────────

_KW_NOC    = {"red", "noc", "host", "hosts", "alerta", "alertas", "online", "offline",
              "caido", "caída", "latencia", "monitoreo", "dispositivo", "dispositivos",
              "health", "score"}
_KW_WFM    = {"técnico", "tecnico", "técnicos", "tecnicos", "ticket", "tickets",
              "orden", "ordenes", "wfm", "campo", "instalación", "instalacion",
              "backlog", "almacén", "almacen", "operativo", "operación"}
_KW_FIBRA  = {"fibra", "x100", "plaza", "plazas", "monterrey", "mty", "saltillo",
              "slt", "piedras negras", "pn", "sitio", "sitios", "compromiso"}
_KW_DOCS   = {"proceso", "manual", "procedimiento", "estándar", "estandar",
              "soporte", "protocolo", "documento", "política", "politica"}
_KW_ESTADO = {"estado", "resumen", "reporte", "situación", "situacion",
              "cómo estamos", "como estamos", "general", "todo", "overview"}


def _tokens(texto: str) -> set:
    import re
    return set(re.findall(r"[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+", texto.lower()))


def _score(tokens: set, keywords: set) -> int:
    return len(tokens & keywords)


class DirectorClaude:
    def __init__(self):
        self.name = "Director General (Data Router — sin tokens)"
        print(f"🤖 [{self.name}] Sistema en línea.")

    def ejecutar_orden(self, instruccion_usuario: str, history=None, context="") -> str:
        print(f"\n{'='*45}")
        print(f"👤 DIRECTOR (ctx={context}): {instruccion_usuario[:80]}")
        print(f"{'='*45}")

        tokens = _tokens(instruccion_usuario)

        score_noc   = _score(tokens, _KW_NOC)
        score_wfm   = _score(tokens, _KW_WFM)
        score_fibra = _score(tokens, _KW_FIBRA)
        score_docs  = _score(tokens, _KW_DOCS)
        score_all   = _score(tokens, _KW_ESTADO)

        # Resumen general: NOC + WFM
        if score_all >= 1 and score_noc + score_wfm + score_fibra == 0:
            noc = _noc_status()
            wfm = _wfm_data()
            parts = [
                f"**Reporte General XCIEN** — {datetime.now().strftime('%d/%m/%Y %H:%M')}",
                "",
                _fmt_noc(noc),
                "",
                _fmt_wfm(wfm),
            ]
            return "\n".join(parts)

        parts = []
        ts = datetime.now().strftime("%d/%m/%Y %H:%M")

        if score_noc > 0 or score_all >= 2:
            parts.append(_fmt_noc(_noc_status()))

        if score_wfm > 0 or score_all >= 2:
            estado_filtro = None
            for kw in ("backlog", "campo", "almacen", "almacén", "cerrado"):
                if kw in tokens:
                    estado_filtro = kw.upper().replace("ALMACÉN", "ALMACEN_VALIDACION").replace("CAMPO", "EN_CAMPO")
                    break
            parts.append(_fmt_wfm(_wfm_data(estado_filtro), estado_filtro))

        if score_fibra > 0:
            parts.append(_fmt_fibra(_fibra_data()))

        if score_docs > 0:
            parts.append(_fmt_docs(_xcien_docs(instruccion_usuario[:60]), instruccion_usuario[:40]))

        if parts:
            return ("\n\n" + "─" * 36 + "\n\n").join(parts)

        # Sin match — respuesta base sin LLM
        return (
            "Hola, soy el Director General de XCIEN.\n"
            "Puedo consultarte datos en tiempo real sobre:\n"
            "- **Red / NOC** (hosts, alertas, health score)\n"
            "- **WFM** (técnicos, tickets, órdenes de campo)\n"
            "- **Fibra X100** (plazas, compromisos, sitios)\n"
            "- **Documentos internos** (manuales, procesos, estándares)\n\n"
            "¿Sobre qué tema necesitas información?"
        )


# Alias de compatibilidad — servidor_academia.py importa DirectorGeneralV2
DirectorGeneralV2 = DirectorClaude
