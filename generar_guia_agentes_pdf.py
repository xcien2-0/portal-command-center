#!/usr/bin/env python3
"""Generador de PDF — Guía de Agentes XCIEN 2026"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime

OUTPUT = "GUIA_AGENTES_XCIEN_2026.pdf"

# ── Paleta de colores XCIEN ────────────────────────────────────────────────────
NEGRO      = colors.HexColor("#0a0a0f")
VERDE      = colors.HexColor("#00ff88")
VERDE_OSC  = colors.HexColor("#00cc6a")
AZUL       = colors.HexColor("#00cfff")
GRIS_OSC   = colors.HexColor("#1a1a2e")
GRIS_MED   = colors.HexColor("#2d2d44")
GRIS_CLAR  = colors.HexColor("#e8e8f0")
BLANCO     = colors.white
AMARILLO   = colors.HexColor("#ffd700")
ROJO_SOFT  = colors.HexColor("#ff4d6d")

# ── Estilos ───────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def estilo(nombre, **kw):
    return ParagraphStyle(nombre, parent=styles["Normal"], **kw)

titulo_doc = estilo("titulo_doc",
    fontSize=28, textColor=VERDE, alignment=TA_CENTER,
    fontName="Helvetica-Bold", spaceAfter=6, leading=34)

subtitulo_doc = estilo("subtitulo_doc",
    fontSize=12, textColor=AZUL, alignment=TA_CENTER,
    fontName="Helvetica", spaceAfter=4)

meta_doc = estilo("meta_doc",
    fontSize=9, textColor=GRIS_CLAR, alignment=TA_CENTER,
    fontName="Helvetica", spaceAfter=20)

h1 = estilo("h1",
    fontSize=16, textColor=VERDE, fontName="Helvetica-Bold",
    spaceBefore=18, spaceAfter=8, leading=20)

h2 = estilo("h2",
    fontSize=13, textColor=AZUL, fontName="Helvetica-Bold",
    spaceBefore=14, spaceAfter=6, leading=16)

h3 = estilo("h3",
    fontSize=11, textColor=AMARILLO, fontName="Helvetica-Bold",
    spaceBefore=10, spaceAfter=4)

body = estilo("body",
    fontSize=9.5, textColor=GRIS_CLAR, fontName="Helvetica",
    spaceBefore=2, spaceAfter=4, leading=14)

code = estilo("code",
    fontSize=8.5, textColor=VERDE, fontName="Courier",
    backColor=GRIS_OSC, leftIndent=12, rightIndent=12,
    spaceBefore=4, spaceAfter=4, leading=13)

badge_ok  = estilo("badge_ok",  fontSize=9, textColor=VERDE,  fontName="Helvetica-Bold")
badge_warn= estilo("badge_warn",fontSize=9, textColor=AMARILLO,fontName="Helvetica-Bold")
badge_err = estilo("badge_err", fontSize=9, textColor=ROJO_SOFT,fontName="Helvetica-Bold")

footer_s  = estilo("footer_s",  fontSize=8, textColor=GRIS_MED,
    alignment=TA_CENTER, fontName="Helvetica")

# ── Helper: tabla oscura ──────────────────────────────────────────────────────
def tabla_dark(data, col_widths, header_bg=GRIS_OSC, row_bg=NEGRO, alt_bg=GRIS_OSC):
    t = Table(data, colWidths=col_widths)
    style = [
        # Encabezado
        ("BACKGROUND",  (0,0), (-1,0), header_bg),
        ("TEXTCOLOR",   (0,0), (-1,0), VERDE),
        ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",    (0,0), (-1,0), 9),
        ("ALIGN",       (0,0), (-1,0), "CENTER"),
        ("BOTTOMPADDING",(0,0),(-1,0), 8),
        ("TOPPADDING",  (0,0), (-1,0), 8),
        # Filas
        ("FONTSIZE",    (0,1), (-1,-1), 8.5),
        ("FONTNAME",    (0,1), (-1,-1), "Helvetica"),
        ("TEXTCOLOR",   (0,1), (-1,-1), GRIS_CLAR),
        ("ALIGN",       (0,1), (-1,-1), "LEFT"),
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",  (0,1), (-1,-1), 5),
        ("BOTTOMPADDING",(0,1),(-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING",(0,0), (-1,-1), 8),
        ("GRID",        (0,0), (-1,-1), 0.4, GRIS_MED),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[row_bg, alt_bg]),
        ("LINEBELOW",   (0,0), (-1,0), 1.5, VERDE),
    ]
    t.setStyle(TableStyle(style))
    return t

def hr(): return HRFlowable(width="100%", thickness=0.5, color=GRIS_MED, spaceAfter=10, spaceBefore=6)

# ── Contenido ─────────────────────────────────────────────────────────────────
def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=letter,
        leftMargin=0.7*inch, rightMargin=0.7*inch,
        topMargin=0.7*inch, bottomMargin=0.7*inch,
        title="Guía de Agentes XCIEN 2026",
        author="Antigravity"
    )

    story = []

    # ── PORTADA ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.6*inch))
    story.append(Paragraph("🤖 GUÍA DE AGENTES XCIEN", titulo_doc))
    story.append(Paragraph("Ecosistema de Inteligencia Artificial Operativa", subtitulo_doc))
    story.append(Paragraph(
        f"Versión 1.0  ·  {datetime.now().strftime('%d %B %Y')}  ·  Emitido por Antigravity",
        meta_doc))
    story.append(HRFlowable(width="100%", thickness=2, color=VERDE, spaceAfter=20))

    # Resumen ejecutivo portada
    story.append(Paragraph(
        "Este documento describe el ecosistema completo de agentes de IA y servicios operativos "
        "que integran la plataforma XCIEN 2026. Cubre arquitectura, roles, contexto de uso, "
        "comandos de activación y estado real verificado.",
        body))

    story.append(PageBreak())

    # ── 1. TIPOS DE AGENTES ───────────────────────────────────────────────────
    story.append(Paragraph("1. TIPOS DE AGENTES", h1))
    story.append(hr())
    story.append(Paragraph(
        "Un agente en XCIEN es un programa Python con un <b>rol empresarial específico</b>. "
        "Existen tres categorías:", body))
    story.append(Spacer(1, 8))

    tipos = [
        ["TIPO", "DESCRIPCIÓN", "EJEMPLO"],
        ["🧠 Agente IA", "Usa Claude (Anthropic) para razonar y generar respuestas", "director_general_v2.py"],
        ["⚙️ Agente Operativo", "Lógica de negocio con datos reales, sin IA", "wfm_workflow_service.py"],
        ["🔲 Agente Stub", "Estructura lista, pendiente de implementación completa", "agent_noc.py"],
    ]
    story.append(tabla_dark(tipos, [1.4*inch, 3.2*inch, 2.4*inch]))

    # ── 2. ARQUITECTURA ───────────────────────────────────────────────────────
    story.append(Paragraph("2. ARQUITECTURA DEL ECOSISTEMA", h1))
    story.append(hr())

    story.append(Paragraph("JERARQUÍA DE CONTROL", h2))
    story.append(Spacer(1, 6))

    jerarquia = [
        ["CAPA", "AGENTE / ROL", "TECNOLOGÍA", "CANAL"],
        ["Humano", "Miguel Macías — Director General", "—", "Conversación"],
        ["Orquestador", "Antigravity — Ingeniero", "Gemini/Claude", "IDE + Terminal"],
        ["Portal Web", "Director General V2", "claude-sonnet-4-6", "localhost:8000"],
        ["CLI Orquestador", "Simulador / Director General", "claude-haiku-4-5", "Terminal"],
        ["Sub-agentes (×8)", "NOC, Ops, RRHH, Odoo, Dispatch,\nComercial, Preventa, Legal", "claude-haiku-4-5", "CLI (delegado)"],
        ["Servicios", "WFM, Assets, Tokens, Odoo", "Python + JSON/xmlrpc", "API REST :8000"],
    ]
    story.append(tabla_dark(jerarquia, [1.1*inch, 2.2*inch, 1.5*inch, 1.7*inch]))

    story.append(Spacer(1, 16))
    story.append(Paragraph("FLUJO DE COMUNICACIÓN", h2))
    story.append(Spacer(1, 6))

    flujo_txt = (
        "Miguel  →  Antigravity  →  Portal (:8000) / CLI\n"
        "Portal  →  Director General V2  →  API REST  →  Servicios (WFM / Assets / Tokens / Odoo)\n"
        "CLI     →  Simulador  →  delega por palabras clave  →  8 Agentes Especializados  →  Servicios"
    )
    for linea in flujo_txt.split("\n"):
        story.append(Paragraph(linea, code))

    story.append(PageBreak())

    # ── 3. GUÍA POR AGENTE ────────────────────────────────────────────────────
    story.append(Paragraph("3. GUÍA DE USO — AGENTES IA", h1))
    story.append(hr())

    agentes_ia = [
        {
            "nombre": "🧠 Director General V2",
            "archivo": "director_general_v2.py",
            "modelo": "claude-sonnet-4-6",
            "contexto": "Portal Web · localhost:8000",
            "funcion": "Cerebro ejecutivo del portal. Responde con datos reales de WFM (tickets, técnicos), el Libro Maestro de Operaciones y el estado de la red. Recomienda asignaciones, analiza urgencias y genera reportes ejecutivos.",
            "cuando": "Cuando necesitas información de operaciones, estado de tickets, análisis de técnicos disponibles o cualquier consulta de alto nivel.",
            "cmd": [
                "# Arrancar el portal completo:",
                "python3 backend/servidor_academia.py",
                "",
                "# Consulta vía API:",
                'curl -X POST http://localhost:8000/api/director/chat \\',
                "  -H 'Content-Type: application/json' \\",
                "  -d '{\"message\": \"dame el estado de los tickets\"}'",
            ],
        },
        {
            "nombre": "🎭 Simulador — Director General CLI",
            "archivo": "simulador_agentes.py",
            "modelo": "claude-haiku-4-5-20251001",
            "contexto": "CLI · Terminal",
            "funcion": "Orquestador de los 8 agentes especializados. Recibe una instrucción en lenguaje natural y la delega automáticamente al agente correcto según palabras clave detectadas.",
            "cuando": "Cuando necesitas que un agente especializado (NOC, Legal, Comercial, etc.) analice algo desde la terminal.",
            "cmd": [
                "cd /Users/mesquite/Antigravity/backend/agents",
                "python3 simulador_agentes.py",
            ],
        },
        {
            "nombre": "🛠️ DevOps Agent",
            "archivo": "devops_agent.py",
            "modelo": "claude-sonnet-4-6",
            "contexto": "CLI · Diagnóstico del sistema",
            "funcion": "Revisa el estado real del sistema: Git, PM2, Odoo, métricas del servidor. Analiza los resultados con Claude y genera un diagnóstico ejecutivo.",
            "cuando": "Cuando algo falla en producción o necesitas un health-check completo del sistema.",
            "cmd": [
                "cd /Users/mesquite/Antigravity/backend/agents",
                "python3 devops_agent.py",
            ],
        },
        {
            "nombre": "📝 Creador de Manuales",
            "archivo": "creador_manuales.py",
            "modelo": "claude-sonnet-4-6",
            "contexto": "CLI · Generación de documentos",
            "funcion": "Genera manuales técnicos en formato Markdown listos para la Biblioteca del portal. Usa el contexto de XCIEN para producir documentación profesional.",
            "cuando": "Cuando necesitas crear o actualizar manuales técnicos para el portal.",
            "cmd": [
                "cd /Users/mesquite/Antigravity/backend/agents",
                "python3 creador_manuales.py",
            ],
        },
        {
            "nombre": "🔍 Auditor de Código",
            "archivo": "auditor_codigo.py",
            "modelo": "claude-sonnet-4-6",
            "contexto": "CLI · Revisión de calidad",
            "funcion": "Audita archivos de código buscando problemas de higiene, seguridad y arquitectura. Emite un veredicto: PASA o REQUIERE REFACTOR.",
            "cuando": "Antes de un despliegue o cuando sospechas que un archivo tiene problemas.",
            "cmd": [
                "# Auditar archivo específico:",
                "python3 auditor_codigo.py --file backend/agents/director_general_v2.py",
                "",
                "# Listar archivos auditables:",
                "python3 auditor_codigo.py --list",
                "",
                "# Auditoría global:",
                "python3 auditor_codigo.py --full",
            ],
        },
    ]

    for ag in agentes_ia:
        story.append(Paragraph(ag["nombre"], h2))
        info = [
            ["Archivo", ag["archivo"]],
            ["Modelo", ag["modelo"]],
            ["Contexto", ag["contexto"]],
        ]
        t_info = Table(info, colWidths=[1.2*inch, 5.8*inch])
        t_info.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (0,-1), GRIS_OSC),
            ("BACKGROUND", (1,0), (1,-1), NEGRO),
            ("TEXTCOLOR", (0,0), (0,-1), AZUL),
            ("TEXTCOLOR", (1,0), (1,-1), GRIS_CLAR),
            ("FONTNAME", (0,0), (-1,-1), "Helvetica"),
            ("FONTSIZE", (0,0), (-1,-1), 8.5),
            ("GRID", (0,0), (-1,-1), 0.3, GRIS_MED),
            ("LEFTPADDING", (0,0), (-1,-1), 8),
            ("TOPPADDING", (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ]))
        story.append(t_info)
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<b>Función:</b> {ag['funcion']}", body))
        story.append(Paragraph(f"<b>Cuándo usarlo:</b> {ag['cuando']}", body))
        story.append(Spacer(1, 4))
        for linea in ag["cmd"]:
            if linea == "":
                story.append(Spacer(1, 3))
            else:
                story.append(Paragraph(linea, code))
        story.append(Spacer(1, 12))

    story.append(PageBreak())

    # ── 4. ROUTING DEL SIMULADOR ──────────────────────────────────────────────
    story.append(Paragraph("4. ROUTING DEL SIMULADOR — 8 AGENTES", h1))
    story.append(hr())
    story.append(Paragraph(
        "El Simulador detecta palabras clave en tu mensaje y delega automáticamente al agente correcto:",
        body))
    story.append(Spacer(1, 8))

    routing = [
        ["PALABRAS CLAVE (en tu mensaje)", "AGENTE ASIGNADO", "ROL"],
        ["caído, enlace, noc, red, falla, monitoreo, nodo", "📡 Agente NOC", "Network Operations Center"],
        ["campo, EPP, instalación, técnico, seguridad, mástil", "🔧 Agente Operaciones", "Field Service Management"],
        ["capacitación, curso, academia, examen, manual", "🎓 Agente RRHH/Academia", "Capacitación y Certificación"],
        ["odoo, erp, módulo, ticket, registro", "💼 Agente Odoo", "ERP wispi17"],
        ["asignar, ruta, despacho, agenda, dispatch", "🚚 Agente Dispatch", "Logística de campo"],
        ["venta, comercial, cotización, prospecto, cliente", "💰 Agente Comercial", "Ventas y CRM"],
        ["factibilidad, preventa, coordenadas, antena, señal", "📐 Agente Preventa", "Factibilidad técnica"],
        ["contrato, legal, IFT, arrendamiento, SLA, cláusula", "⚖️ Agente Legal", "Asesoría legal telecom"],
    ]
    story.append(tabla_dark(routing, [2.8*inch, 1.8*inch, 2.4*inch]))

    story.append(Spacer(1, 20))

    # ── 5. SERVICIOS OPERATIVOS ───────────────────────────────────────────────
    story.append(Paragraph("5. SERVICIOS OPERATIVOS (SIN IA)", h1))
    story.append(hr())

    servicios = [
        ["SERVICIO", "FUNCIÓN", "ENDPOINTS PRINCIPALES"],
        ["WFMWorkflowService", "Motor de órdenes de trabajo\n(8 etapas: Solicitud → Cierre)",
         "/api/wfm/tickets\n/api/wfm/tecnicos\n/api/wfm/asignar/{id}"],
        ["AssetService", "Control de activos físicos\n(antenas, equipos, sites)",
         "/api/activos/registrar\n/api/activos/listar\n/api/activos/{id}/label"],
        ["TokenService", "X-Token economy XCIEN\n(oportunidades, RRHH)",
         "/api/tokens/emitir\n/api/tokens/operativo\n/api/tokens/listar"],
        ["TransaccionesService", "Flujos intercompany\nentre empresas del grupo",
         "/api/transacciones/registrar\n/api/transacciones/resumen"],
        ["OdooConnector", "Conexión XML-RPC\na base wispi17",
         "Usado internamente\npor otros servicios"],
        ["LabelService", "Etiquetas QR/PDF\npara activos y tickets",
         "/api/activos/{id}/label\n/api/transacciones/{id}/label"],
    ]
    story.append(tabla_dark(servicios, [1.6*inch, 2.0*inch, 3.4*inch]))

    story.append(PageBreak())

    # ── 6. FLUJO WFM ──────────────────────────────────────────────────────────
    story.append(Paragraph("6. FLUJO COMPLETO DE UNA ORDEN WFM", h1))
    story.append(hr())
    story.append(Paragraph(
        "Cada instalación de cliente pasa por 8 etapas gestionadas por WFMWorkflowService:", body))
    story.append(Spacer(1, 8))

    wfm_etapas = [
        ["#", "ETAPA", "RESPONSABLE", "DESCRIPCIÓN"],
        ["1", "Solicitud Comercial", "Área Comercial", "El cliente pide el servicio. Se genera la orden."],
        ["2", "Preventa", "Agente Preventa", "Análisis de factibilidad técnica: coordenadas, señal, cobertura."],
        ["3", "Contratación", "Legal + Dirección", "Firma del contrato. Aprobación formal de la orden."],
        ["4", "Almacén", "Logística", "Solicitud de equipos: router, cables, antena, accesorios."],
        ["5", "Aprovisionamiento", "NOC / TI", "Configuración de red: IP, VLAN, BW, gateway, firmware."],
        ["6", "Instalación", "Técnico de Campo", "Trabajo en sitio con checklist, evidencias fotográficas y prueba de velocidad."],
        ["7", "Alta NOC", "NOC", "Alta del cliente en el sistema de monitoreo. Ping confirmado."],
        ["8", "Cierre", "Técnico + Coordinador", "Entrega formal. Firma del cliente. Ticket cerrado."],
    ]
    story.append(tabla_dark(wfm_etapas, [0.3*inch, 1.4*inch, 1.4*inch, 3.9*inch]))

    story.append(Spacer(1, 20))

    # ── 7. ESTADO REAL ────────────────────────────────────────────────────────
    story.append(Paragraph("7. ESTADO REAL — VERIFICADO 2026-05-15", h1))
    story.append(hr())

    estado = [
        ["AGENTE", "ESTADO", "MODELO", "CONTEXTO"],
        ["director_general_v2", "✅ OPERATIVO", "claude-sonnet-4-6", "Portal :8000"],
        ["simulador_agentes (×8)", "✅ OPERATIVO", "claude-haiku-4-5", "CLI"],
        ["devops_agent", "✅ LISTO", "claude-sonnet-4-6", "CLI"],
        ["creador_manuales", "✅ LISTO", "claude-sonnet-4-6", "CLI"],
        ["auditor_codigo", "✅ LISTO", "claude-sonnet-4-6", "CLI"],
        ["wfm_workflow_service", "✅ OPERATIVO", "— (Odoo+JSON)", "API :8000"],
        ["asset_service", "✅ OPERATIVO", "—", "API :8000"],
        ["token_service", "✅ OPERATIVO", "—", "API :8000"],
        ["transacciones_service", "✅ OPERATIVO", "—", "API :8000"],
        ["odoo_connector", "✅ OPERATIVO", "— (xmlrpc)", "Servicio interno"],
        ["puente (bridge)", "⚠️ CONDICIONAL", "—", "Requiere :8000 activo"],
        ["telegram_bot", "❌ SIN TOKEN", "—", "Pendiente configurar"],
        ["agent_noc / wfm / academia...", "⚠️ STUBS", "—", "Pendiente implementar"],
    ]
    story.append(tabla_dark(estado, [2.0*inch, 1.2*inch, 1.5*inch, 2.3*inch]))

    story.append(Spacer(1, 20))

    # ── 8. COMANDOS RÁPIDOS ───────────────────────────────────────────────────
    story.append(Paragraph("8. COMANDOS RÁPIDOS — REFERENCIA", h1))
    story.append(hr())

    cmds = [
        ("Arrancar el portal completo (backend + portal)",
         ["cd /Users/mesquite/Antigravity",
          "lsof -ti :8000 | xargs kill -9 2>/dev/null",
          "python3 backend/servidor_academia.py",
          "# → http://localhost:8000"]),
        ("Correr el Simulador de 8 Agentes",
         ["cd /Users/mesquite/Antigravity/backend/agents",
          "python3 simulador_agentes.py"]),
        ("Auditar un archivo de código",
         ["python3 auditor_codigo.py --file backend/agents/director_general_v2.py"]),
        ("Ver estado del puente (bridge)",
         ["python3 puente.py --query"]),
        ("Actualizar tarea en el dashboard",
         ["python3 puente.py --task 'Procesando facturas' --status working"]),
    ]

    for titulo, lineas in cmds:
        story.append(Paragraph(f"<b>{titulo}</b>", body))
        for linea in lineas:
            story.append(Paragraph(linea, code))
        story.append(Spacer(1, 8))

    # ── 9. REGLAS DE ORO ──────────────────────────────────────────────────────
    story.append(Paragraph("9. REGLAS DE ORO DEL ECOSISTEMA", h1))
    story.append(hr())

    reglas = [
        ["#", "REGLA", "POR QUÉ"],
        ["1", "No duplicar dashboards — toda nueva funcionalidad va en Xcien2Page",
         "Evitar fragmentación y mantener una sola fuente de verdad visual"],
        ["2", "Usar variables CSS: var(--xcien-accent), var(--xcien-bg)...",
         "El sistema de temas cambia colores globalmente; hex hardcodeado lo rompe"],
        ["3", "El Hub Principal (/) es sagrado — no se elimina",
         "Es la puerta de entrada del sistema para todos los usuarios"],
        ["4", "ESTADO_SISTEMA.md es la fuente de verdad — actualizar en cada cambio mayor",
         "Garantiza que cualquier IA que tome el contexto tenga información correcta"],
        ["5", "Antigravity escribe código, no toma decisiones operativas",
         "Las decisiones operativas son del Director General humano (Miguel)"],
        ["6", "Verificar el servidor antes de hacer cambios",
         "El sistema puede estar en producción; un cambio sin verificar puede romperlo"],
    ]
    story.append(tabla_dark(reglas, [0.3*inch, 3.5*inch, 3.2*inch]))

    # ── PIE DE PÁGINA ─────────────────────────────────────────────────────────
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=1.5, color=VERDE, spaceAfter=10))
    story.append(Paragraph(
        f"Documento generado por Antigravity  ·  XCIEN 2026  ·  {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        footer_s))
    story.append(Paragraph(
        "Uso interno · Confidencial · Para uso del Director General y Coordinadores XCIEN",
        footer_s))

    doc.build(story)
    print(f"✅ PDF generado: {OUTPUT}")

if __name__ == "__main__":
    build_pdf()
