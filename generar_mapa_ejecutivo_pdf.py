#!/usr/bin/env python3
"""
MAPA DE AGENTES XCIEN 2026 — PDF Ejecutivo Premium
Diseño limpio, sin parser de markdown, columnas exactas.
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
from datetime import datetime

OUTPUT = "/Users/mesquite/Antigravity/MAPA_AGENTES_XCIEN_EJECUTIVO.pdf"

# ── Página y márgenes ─────────────────────────────────────────────────────────
PW, PH   = letter          # 612 x 792 pts
ML = MR  = 0.75 * inch
MT = MB  = 0.75 * inch
TW       = PW - ML - MR   # ancho útil = 7.0 in

# ── Paleta ────────────────────────────────────────────────────────────────────
C_VERDE      = colors.HexColor("#00b86b")
C_VERDE_DARK = colors.HexColor("#007a47")
C_AZUL       = colors.HexColor("#0077b6")
C_AZUL_LIGHT = colors.HexColor("#90e0ef")
C_AMARILLO   = colors.HexColor("#f4a900")
C_ROJO       = colors.HexColor("#d62828")
C_NEGRO      = colors.HexColor("#0d1117")
C_GRIS_OSC   = colors.HexColor("#1e2530")
C_GRIS_MED   = colors.HexColor("#3a4455")
C_GRIS_CLAR  = colors.HexColor("#8899aa")
C_FONDO_TAB  = colors.HexColor("#f4f7fb")
C_FONDO_ALT  = colors.HexColor("#eaf4ff")
C_BLANCO     = colors.white
C_LINEA      = colors.HexColor("#dce5ef")

# ── Estilos ───────────────────────────────────────────────────────────────────
def E(name, **kw):
    return ParagraphStyle(name, **kw)

sPortadaTitulo = E("portada_titulo",
    fontName="Helvetica-Bold", fontSize=28,
    textColor=C_BLANCO, alignment=TA_CENTER,
    leading=34, spaceAfter=8)

sPortadaSub = E("portada_sub",
    fontName="Helvetica", fontSize=13,
    textColor=colors.HexColor("#a0c8e8"), alignment=TA_CENTER,
    leading=18, spaceAfter=6)

sPortadaMeta = E("portada_meta",
    fontName="Helvetica", fontSize=10,
    textColor=colors.HexColor("#6a8faf"), alignment=TA_CENTER,
    leading=14)

sSeccion = E("seccion",
    fontName="Helvetica-Bold", fontSize=13,
    textColor=C_AZUL, leading=16,
    spaceBefore=20, spaceAfter=10)

sSubSeccion = E("sub_seccion",
    fontName="Helvetica-Bold", fontSize=11,
    textColor=C_NEGRO, leading=14,
    spaceBefore=14, spaceAfter=6)

sBody = E("body",
    fontName="Helvetica", fontSize=9.5,
    textColor=C_NEGRO, leading=14,
    spaceAfter=4)

sBodyBold = E("body_bold",
    fontName="Helvetica-Bold", fontSize=9.5,
    textColor=C_NEGRO, leading=14)

sCelda = E("celda",
    fontName="Helvetica", fontSize=8.5,
    textColor=C_NEGRO, leading=12)

sCeldaBold = E("celda_bold",
    fontName="Helvetica-Bold", fontSize=8.5,
    textColor=C_NEGRO, leading=12)

sCeldaVerde = E("celda_verde",
    fontName="Helvetica-Bold", fontSize=8.5,
    textColor=C_VERDE_DARK, leading=12)

sCeldaAzul = E("celda_azul",
    fontName="Helvetica-Bold", fontSize=8.5,
    textColor=C_AZUL, leading=12)

sCeldaRojo = E("celda_rojo",
    fontName="Helvetica-Bold", fontSize=8.5,
    textColor=C_ROJO, leading=12)

sCeldaAmarillo = E("celda_amarillo",
    fontName="Helvetica-Bold", fontSize=8.5,
    textColor=C_AMARILLO, leading=12)

sCeldaGris = E("celda_gris",
    fontName="Helvetica", fontSize=8,
    textColor=C_GRIS_CLAR, leading=11)

sFooter = E("footer",
    fontName="Helvetica", fontSize=8,
    textColor=C_GRIS_CLAR, alignment=TA_CENTER, leading=11)

sNota = E("nota",
    fontName="Helvetica-Oblique", fontSize=8.5,
    textColor=colors.HexColor("#885500"), leading=12,
    leftIndent=8)

# ── Helpers ───────────────────────────────────────────────────────────────────
def hr_verde():
    return HRFlowable(width="100%", thickness=1.5, color=C_VERDE,
                      spaceAfter=10, spaceBefore=4)

def hr_gris():
    return HRFlowable(width="100%", thickness=0.5, color=C_LINEA,
                      spaceAfter=8, spaceBefore=4)

def P(text, style):
    return Paragraph(text, style)

def sp(h=6):
    return Spacer(1, h)


def tabla_ejecutiva(data, col_widths, zebra=True):
    """
    Tabla profesional con header azul oscuro y zebra opcional.
    data[0] = fila de encabezados (strings o Paragraphs)
    """
    assert abs(sum(col_widths) - TW) < 2, f"Anchos suman {sum(col_widths):.1f}, deben ser {TW:.1f}"

    t = Table(data, colWidths=col_widths, repeatRows=1)
    cmds = [
        # Header
        ("BACKGROUND",    (0, 0), (-1, 0), C_GRIS_OSC),
        ("TEXTCOLOR",     (0, 0), (-1, 0), C_BLANCO),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0), 8.5),
        ("ALIGN",         (0, 0), (-1, 0), "CENTER"),
        ("VALIGN",        (0, 0), (-1, 0), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("LEFTPADDING",   (0, 0), (-1, 0), 8),
        ("RIGHTPADDING",  (0, 0), (-1, 0), 8),
        ("LINEBELOW",     (0, 0), (-1, 0), 2, C_VERDE),
        # Body
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 8.5),
        ("ALIGN",         (0, 1), (-1, -1), "LEFT"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("LEFTPADDING",   (0, 1), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 1), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.4, C_LINEA),
        ("LINEBELOW",     (0, -1), (-1, -1), 1, C_LINEA),
    ]
    if zebra:
        for i in range(1, len(data), 2):
            cmds.append(("BACKGROUND", (0, i), (-1, i), C_FONDO_TAB))
        for i in range(2, len(data), 2):
            cmds.append(("BACKGROUND", (0, i), (-1, i), C_FONDO_ALT))

    t.setStyle(TableStyle(cmds))
    return t


def badge(texto, color):
    return Paragraph(texto, E(f"badge_{texto}",
        fontName="Helvetica-Bold", fontSize=8,
        textColor=color, leading=10))


# ── Header y footer de página ─────────────────────────────────────────────────
def primera_pagina(canvas, doc):
    pass  # Portada maneja su propio diseño

def paginas_siguientes(canvas, doc):
    canvas.saveState()
    # Header línea superior
    canvas.setStrokeColor(C_VERDE)
    canvas.setLineWidth(2)
    canvas.line(ML, PH - 0.45*inch, PW - MR, PH - 0.45*inch)
    # Texto header
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(C_GRIS_OSC)
    canvas.drawString(ML, PH - 0.35*inch, "XCIEN 2026 · MAPA DE AGENTES & ALCANCE")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(C_GRIS_CLAR)
    canvas.drawRightString(PW - MR, PH - 0.35*inch,
        f"Confidencial · Emitido: {datetime.now().strftime('%d/%m/%Y')}")
    # Footer
    canvas.setStrokeColor(C_LINEA)
    canvas.setLineWidth(0.5)
    canvas.line(ML, 0.5*inch, PW - MR, 0.5*inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(C_GRIS_CLAR)
    canvas.drawString(ML, 0.35*inch, "Antigravity · Dirección General XCIEN")
    canvas.drawRightString(PW - MR, 0.35*inch, f"Página {doc.page}")
    canvas.restoreState()


# ══ BUILD ══════════════════════════════════════════════════════════════════════
def build():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=letter,
        leftMargin=ML, rightMargin=MR,
        topMargin=MT + 0.3*inch,   # espacio para header
        bottomMargin=MB + 0.2*inch,
        title="Mapa de Agentes XCIEN 2026",
        author="Antigravity — XCIEN",
        subject="Arquitectura Multi-Agente Operativo",
    )

    story = []

    # ══════════════════════════════════════════════════════════════
    #  PORTADA
    # ══════════════════════════════════════════════════════════════
    # Bloque de color de fondo simulado con tabla
    portada_data = [[
        Paragraph("XCIEN 2026", E("p1", fontName="Helvetica-Bold", fontSize=11,
            textColor=C_VERDE, alignment=TA_CENTER, leading=14)),
        Paragraph("· MAPA DE AGENTES & ALCANCE ·", E("p2", fontName="Helvetica",
            fontSize=11, textColor=colors.HexColor("#6a8faf"),
            alignment=TA_CENTER, leading=14)),
    ]]
    t_header_top = Table(portada_data, colWidths=[TW * 0.3, TW * 0.7])
    t_header_top.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), C_GRIS_OSC),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
        ("LINEBELOW",     (0, 0), (-1, 0), 3, C_VERDE),
    ]))
    story.append(t_header_top)
    story.append(sp(30))

    story.append(P("GABINETE DE INTELIGENCIA OPERATIVA", E("port_label",
        fontName="Helvetica", fontSize=10, textColor=C_GRIS_CLAR,
        alignment=TA_CENTER, leading=14, spaceAfter=8)))

    story.append(P("Arquitectura Multi-Agente", E("port_titulo",
        fontName="Helvetica-Bold", fontSize=32, textColor=C_NEGRO,
        alignment=TA_CENTER, leading=38, spaceAfter=4)))

    story.append(P("XCIEN · Wispi · Luminet WAN · Huus · Sandur", E("port_brands",
        fontName="Helvetica", fontSize=12, textColor=C_AZUL,
        alignment=TA_CENTER, leading=16, spaceAfter=30)))

    story.append(HRFlowable(width="60%", thickness=2, color=C_VERDE,
                            hAlign="CENTER", spaceAfter=30))

    # Resumen stats en portada
    stats = [
        ["24", "AGENTES\nMAPEADOS"],
        ["6", "CAPAS\nJERÁRQUICAS"],
        ["8", "SUB-AGENTES\nESPECIALISTAS"],
        ["9", "SERVICIOS\nOPERATIVOS"],
    ]
    w = TW / 4
    stats_data = [[
        Table([[
            P(n, E(f"sn{i}", fontName="Helvetica-Bold", fontSize=28,
                textColor=C_VERDE, alignment=TA_CENTER, leading=32)),
            P(l, E(f"sl{i}", fontName="Helvetica", fontSize=8,
                textColor=C_GRIS_CLAR, alignment=TA_CENTER, leading=10)),
        ]], colWidths=[w - 0.2*inch])
        for i, (n, l) in enumerate(stats)
    ]]
    t_stats = Table(stats_data, colWidths=[w] * 4)
    t_stats.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), C_FONDO_TAB),
        ("GRID",          (0, 0), (-1, -1), 1, C_LINEA),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
        ("LINEABOVE",     (0, 0), (-1, 0), 2, C_VERDE),
        ("LINEBELOW",     (0, -1), (-1, -1), 2, C_AZUL),
    ]))
    story.append(t_stats)
    story.append(sp(40))

    # Meta info portada
    meta = [
        ["Clasificación:", "Documento Ejecutivo Estratégico — Confidencial"],
        ["Emisor:", "Antigravity · Orquestador XCIEN"],
        ["Fecha:", datetime.now().strftime("%d de %B de %Y")],
        ["Versión:", "2.0 — Junio 2026"],
        ["Modelos:", "claude-sonnet-4-6 · claude-haiku-4-5 · Gemini 2.5"],
    ]
    meta_rows = [[
        P(k, E(f"mk{i}", fontName="Helvetica-Bold", fontSize=9,
            textColor=C_AZUL, leading=13)),
        P(v, E(f"mv{i}", fontName="Helvetica", fontSize=9,
            textColor=C_NEGRO, leading=13)),
    ] for i, (k, v) in enumerate(meta)]

    t_meta = Table(meta_rows, colWidths=[1.5*inch, TW - 1.5*inch])
    t_meta.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1), colors.HexColor("#eef4fb")),
        ("BACKGROUND",    (1, 0), (1, -1), C_BLANCO),
        ("GRID",          (0, 0), (-1, -1), 0.5, C_LINEA),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(t_meta)

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════
    #  1. JERARQUÍA DEL GABINETE
    # ══════════════════════════════════════════════════════════════
    story.append(P("1.  JERARQUÍA DEL GABINETE", sSeccion))
    story.append(hr_verde())
    story.append(P(
        "El ecosistema XCIEN opera bajo una cadena de mando de 6 capas. "
        "Cada capa tiene responsabilidades exclusivas y canales de comunicación definidos.",
        sBody))
    story.append(sp(10))

    # Columnas: Capa | Agente/Rol | Tecnología | Canal | Alcance Principal
    c1, c2, c3, c4, c5 = 0.9*inch, 1.5*inch, 1.1*inch, 1.2*inch, 2.3*inch
    assert abs(c1+c2+c3+c4+c5 - TW) < 1

    jerar_header = ["CAPA", "AGENTE / ROL", "TECNOLOGÍA", "CANAL", "ALCANCE PRINCIPAL"]
    jerar_rows = [
        ["1 — Humano",
         "Miguel Macías\nDirector General",
         "—",
         "Chat directo\ncon Antigravity",
         "Decisiones estratégicas, aprobación de operaciones y visión de negocio."],
        ["2 — Ingeniero IA",
         "Antigravity\n(Orquestador)",
         "Gemini 2.5\nClaude Sonnet",
         "IDE · Terminal\n· Chat",
         "Escribe código, ejecuta comandos, crea documentos y coordina todos los agentes."],
        ["3A — Portal IA",
         "Director General V2\ndirector_general_v2.py",
         "claude-\nsonnet-4-6",
         "localhost:8000\nAPI REST",
         "Responde consultas operativas con datos WFM + Libro Maestro en tiempo real."],
        ["3B — CLI IA",
         "Simulador DG\nsimulador_agentes.py",
         "claude-\nhaiku-4-5",
         "Terminal (CLI)",
         "Orquesta y delega automáticamente a 8 agentes por palabras clave."],
        ["4 — Sub-Agentes",
         "NOC · Ops · RRHH\nOdoo · Dispatch\nComercial · Preventa\nLegal",
         "claude-\nhaiku-4-5",
         "Delegado\ndesde CLI",
         "Cada agente resuelve un dominio específico con expertise especializado."],
        ["5 — Servicios",
         "WFM · Assets · X-Token\nAuth · Odoo · UISP\nLabel · Transacciones",
         "Python + JSON\nxmlrpc · JWT",
         "API :8000\nInterno",
         "Motor transaccional: órdenes de trabajo, activos, economía interna, autenticación."],
    ]

    jerar_data = [[P(h, E(f"jh{i}", fontName="Helvetica-Bold", fontSize=8,
                          textColor=C_BLANCO, alignment=TA_CENTER, leading=11))
                   for i, h in enumerate(jerar_header)]]
    for row in jerar_rows:
        jerar_data.append([P(cell, sCelda) for cell in row])

    story.append(tabla_ejecutiva(jerar_data, [c1, c2, c3, c4, c5]))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════
    #  2. AGENTES IA — ALCANCE DETALLADO
    # ══════════════════════════════════════════════════════════════
    story.append(P("2.  AGENTES IA — ALCANCE DETALLADO", sSeccion))
    story.append(hr_verde())

    agentes = [
        {
            "emoji": "🧠",
            "nombre": "DIRECTOR GENERAL V2",
            "archivo": "director_general_v2.py",
            "modelo": "claude-sonnet-4-6",
            "estado": "OPERATIVO",
            "estado_color": C_VERDE_DARK,
            "trigger": "Portal Web · POST /api/director/chat · localhost:8000",
            "alcance": [
                "Consultas operativas en lenguaje natural con datos WFM en tiempo real.",
                "Análisis de tickets: asignación óptima de técnicos por skill y zona.",
                "Lectura del Libro Maestro de Operaciones XCIEN como contexto base.",
                "Generación de reportes ejecutivos y análisis de incidentes bajo demanda.",
                "Escalamiento inteligente: clasifica y escala incidentes al agente correcto.",
            ],
            "fuera": "No ejecuta comandos del sistema ni modifica datos directamente.",
        },
        {
            "emoji": "🎭",
            "nombre": "SIMULADOR — DIRECTOR GENERAL CLI",
            "archivo": "simulador_agentes.py",
            "modelo": "claude-haiku-4-5",
            "estado": "OPERATIVO",
            "estado_color": C_VERDE_DARK,
            "trigger": "Terminal · python3 simulador_agentes.py",
            "alcance": [
                "Detección automática de dominio por palabras clave en lenguaje natural.",
                "Delegación a 8 agentes especializados de forma autónoma e inteligente.",
                "Sesión de chat continua con memoria de turno (historial en contexto).",
                "Respuesta coordinada cuando un query abarca múltiples dominios.",
            ],
            "fuera": "No accede a base de datos de producción directamente.",
        },
        {
            "emoji": "📡",
            "nombre": "AGENTE NOC — Network Operations Center",
            "archivo": "agent_noc.py (vía simulador)",
            "modelo": "claude-haiku-4-5",
            "estado": "VÍA SIMULADOR",
            "estado_color": C_AZUL,
            "trigger": "Palabras clave: caído · enlace · falla · red · noc · nodo · troncal",
            "alcance": [
                "Clasificación de incidentes de red: P1-Crítico / P2-Alto / P3-Medio.",
                "Protocolo de respuesta inmediata para pérdida de enlace troncal.",
                "Análisis de impacto: clientes afectados y tiempo de restauración estimado.",
                "Guía de escalamiento a coordinador de guardia según severidad.",
                "Recomendaciones de configuración y diagnóstico para nodos caídos.",
            ],
            "fuera": "No ejecuta cambios en routers o switches directamente.",
        },
        {
            "emoji": "🔧",
            "nombre": "AGENTE OPERACIONES — Field Service",
            "archivo": "vía simulador_agentes.py",
            "modelo": "claude-haiku-4-5",
            "estado": "VÍA SIMULADOR",
            "estado_color": C_AZUL,
            "trigger": "Palabras clave: campo · EPP · instalación · técnico · mástil · seguridad",
            "alcance": [
                "Checklists de seguridad para trabajo en campo y en altura.",
                "Estándares corporativos de instalación de antenas y equipos XCIEN.",
                "Protocolos de EPP (Equipo de Protección Personal) por tipo de trabajo.",
                "Validación de condiciones de trabajo seguro en cada plaza activa.",
                "Procedimientos de instalación en zonas urbanas y rurales.",
            ],
            "fuera": "No gestiona asignación de tickets (función exclusiva de Dispatch).",
        },
        {
            "emoji": "🎓",
            "nombre": "AGENTE RRHH / ACADEMIA",
            "archivo": "vía simulador_agentes.py",
            "modelo": "claude-haiku-4-5",
            "estado": "VÍA SIMULADOR",
            "estado_color": C_AZUL,
            "trigger": "Palabras clave: capacitación · curso · examen · academia · certificación",
            "alcance": [
                "Diseño de rutas de capacitación personalizadas por nivel técnico.",
                "Generación de exámenes diagnósticos con IA (motor Ollama local).",
                "Protocolo de promoción técnica: Técnico I → Técnico III → Senior.",
                "Seguimiento y actualización de la matriz de habilidades del equipo.",
                "Evaluaciones de desempeño con estructura de retroalimentación formal.",
            ],
            "fuera": "No procesa nómina ni gestiona contratos laborales.",
        },
        {
            "emoji": "💼",
            "nombre": "AGENTE ODOO ERP",
            "archivo": "simulador + odoo_connector.py",
            "modelo": "claude-haiku-4-5 + xmlrpc",
            "estado": "VÍA SIMULADOR",
            "estado_color": C_AZUL,
            "trigger": "Palabras clave: odoo · erp · módulo · ticket · registro · wispi17",
            "alcance": [
                "Consultas a base Odoo 17 (wispi17) vía XML-RPC autenticado.",
                "Gestión de tickets en el módulo helpdesk del ERP corporativo.",
                "Actualización de registros de clientes, contratos y servicios activos.",
                "Reportes de facturación, inventario y KPIs desde el ERP.",
                "Sincronización bidireccional de datos WFM ↔ Odoo.",
            ],
            "fuera": "No realiza cambios contables o de nómina sin validación humana.",
        },
        {
            "emoji": "🚚",
            "nombre": "AGENTE DISPATCH — Logística de Campo",
            "archivo": "vía simulador_agentes.py",
            "modelo": "claude-haiku-4-5",
            "estado": "VÍA SIMULADOR",
            "estado_color": C_AZUL,
            "trigger": "Palabras clave: asignar · ruta · despacho · agenda · dispatch · logística",
            "alcance": [
                "Asignación inteligente de técnico a ticket por skill y ubicación geográfica.",
                "Optimización de rutas de visita por plaza: NL, JAL, CDMX, QRO, SLP.",
                "Programación de agenda de instalaciones y mantenimientos preventivos.",
                "Seguimiento en tiempo real del estado de órdenes en campo.",
            ],
            "fuera": "No gestiona pagos de viáticos, combustible ni horas extras.",
        },
        {
            "emoji": "💰",
            "nombre": "AGENTE COMERCIAL — Ventas & CRM",
            "archivo": "vía simulador_agentes.py",
            "modelo": "claude-haiku-4-5",
            "estado": "VÍA SIMULADOR",
            "estado_color": C_AZUL,
            "trigger": "Palabras clave: venta · cotización · prospecto · cliente · comercial",
            "alcance": [
                "Generación de cotizaciones para clientes residenciales y empresariales.",
                "Análisis del portafolio: XCIEN, Wispi, Luminet WAN, Huus, Sandur.",
                "Seguimiento del pipeline de ventas y estado de prospectos activos.",
                "Comparativa de planes, SLAs y precios por segmento de cliente.",
                "Recomendaciones de upsell y cross-sell para clientes existentes.",
            ],
            "fuera": "No firma contratos ni genera facturas fiscales.",
        },
        {
            "emoji": "📐",
            "nombre": "AGENTE PREVENTA — Factibilidad Técnica",
            "archivo": "vía simulador_agentes.py",
            "modelo": "claude-haiku-4-5",
            "estado": "VÍA SIMULADOR",
            "estado_color": C_AZUL,
            "trigger": "Palabras clave: factibilidad · coordenadas · antena · señal · cobertura",
            "alcance": [
                "Análisis de factibilidad técnica por coordenadas GPS del cliente.",
                "Evaluación de cobertura de red por zona geográfica y tecnología.",
                "Recomendación de tecnología óptima: FTTH, microondas o VSAT.",
                "Estimación de materiales y costos de instalación por sitio.",
                "Validación de viabilidad técnica antes de firma de contrato.",
            ],
            "fuera": "No emite órdenes de compra de equipo al proveedor.",
        },
        {
            "emoji": "⚖️",
            "nombre": "AGENTE LEGAL — Contratos & Regulación",
            "archivo": "vía simulador_agentes.py",
            "modelo": "claude-haiku-4-5",
            "estado": "VÍA SIMULADOR",
            "estado_color": C_AZUL,
            "trigger": "Palabras clave: contrato · IFT · arrendamiento · SLA · cláusula · legal",
            "alcance": [
                "Revisión de cláusulas en contratos de servicio XCIEN y CMTT.",
                "Asesoría en regulación IFT para ISPs: concesiones, obligaciones.",
                "Plantillas de SLA (Service Level Agreement) por tipo de cliente.",
                "NDAs para consorcios, alianzas estratégicas y proyectos especiales.",
                "Identificación de riesgos en arrendamientos de infraestructura pasiva.",
            ],
            "fuera": "Orientación inicial únicamente. No sustituye asesoría legal certificada.",
        },
    ]

    # Anchos para tarjetas de agente
    wa, wb, wc, wd = 1.0*inch, 1.1*inch, 0.9*inch, TW - 1.0 - 1.1 - 0.9

    for ag in agentes:
        bloque = []

        # Header del agente
        hdr_data = [[
            P(f"{ag['emoji']}  {ag['nombre']}", E("ah", fontName="Helvetica-Bold",
                fontSize=10, textColor=C_BLANCO, leading=13)),
            P(ag["archivo"], E("af", fontName="Courier", fontSize=8,
                textColor=colors.HexColor("#a0d0f0"), leading=11,
                alignment=TA_RIGHT)),
        ]]
        t_hdr = Table(hdr_data, colWidths=[TW * 0.6, TW * 0.4])
        t_hdr.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), C_GRIS_OSC),
            ("TOPPADDING",    (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING",   (0, 0), (-1, -1), 12),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("LINEBELOW",     (0, 0), (-1, 0), 2, C_VERDE),
        ]))
        bloque.append(t_hdr)

        # Fila de metadata
        meta_data = [[
            P("MODELO", sCeldaGris),
            P(ag["modelo"], sCeldaAzul),
            P("ESTADO", sCeldaGris),
            P(ag["estado"], E("est", fontName="Helvetica-Bold", fontSize=8,
                textColor=ag["estado_color"], leading=11)),
            P("TRIGGER DE ACTIVACIÓN", sCeldaGris),
            P(ag["trigger"], sCelda),
        ]]
        t_meta = Table(meta_data, colWidths=[
            0.65*inch, 1.3*inch, 0.55*inch, 0.85*inch, 1.3*inch, TW - 0.65 - 1.3 - 0.55 - 0.85 - 1.3
        ])
        t_meta.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#f0f4fa")),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("GRID",          (0, 0), (-1, -1), 0.4, C_LINEA),
            ("LINEBELOW",     (0, 0), (-1, -1), 1, C_LINEA),
        ]))
        bloque.append(t_meta)

        # Alcance
        alc_header = [[
            P("◈  ALCANCE — ¿QUÉ PUEDE HACER ESTE AGENTE?", E("alch",
                fontName="Helvetica-Bold", fontSize=8, textColor=C_BLANCO,
                leading=11)),
        ]]
        t_alc_hdr = Table(alc_header, colWidths=[TW])
        t_alc_hdr.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), C_VERDE_DARK),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ]))
        bloque.append(t_alc_hdr)

        alc_rows = [[
            P("›", E("ai", fontName="Helvetica-Bold", fontSize=11,
                textColor=C_VERDE_DARK, leading=13)),
            P(item, sCelda),
        ] for item in ag["alcance"]]

        t_alc = Table(alc_rows, colWidths=[0.25*inch, TW - 0.25*inch])
        t_alc.setStyle(TableStyle([
            ("TOPPADDING",    (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("LINEBELOW",     (0, 0), (-1, -1), 0.3, C_LINEA),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [C_BLANCO, colors.HexColor("#f5faf7")]),
        ]))
        bloque.append(t_alc)

        # Fuera de alcance
        fuera_data = [[
            P("⚠", E("fw", fontName="Helvetica-Bold", fontSize=10,
                textColor=C_AMARILLO, leading=12)),
            P(f"Fuera de alcance:  {ag['fuera']}", sNota),
        ]]
        t_fuera = Table(fuera_data, colWidths=[0.3*inch, TW - 0.3*inch])
        t_fuera.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#fffbf0")),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("LINEABOVE",     (0, 0), (-1, 0), 0.5, colors.HexColor("#f4a900")),
            ("LINEBELOW",     (0, -1), (-1, -1), 1.5, C_LINEA),
        ]))
        bloque.append(t_fuera)
        bloque.append(sp(12))

        story.append(KeepTogether(bloque))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════
    #  3. SERVICIOS OPERATIVOS
    # ══════════════════════════════════════════════════════════════
    story.append(P("3.  SERVICIOS OPERATIVOS — Motor de Negocio", sSeccion))
    story.append(hr_verde())
    story.append(P(
        "Los servicios no utilizan IA directamente sino lógica de negocio pura. "
        "Se exponen como API REST en el puerto 8000 y son consumidos por los agentes y el portal web.",
        sBody))
    story.append(sp(10))

    # Columnas: Servicio | Archivo | Función | Endpoints | Estado
    s1, s2, s3, s4, s5 = 1.1*inch, 1.4*inch, 2.1*inch, 1.7*inch, 0.7*inch
    assert abs(s1+s2+s3+s4+s5 - TW) < 1

    svc_header = ["SERVICIO", "ARCHIVO", "FUNCIÓN PRINCIPAL", "ENDPOINTS CLAVE", "ESTADO"]
    svc_rows = [
        ["WFM Workflow",
         "wfm_workflow_\nservice.py",
         "Motor de órdenes de trabajo con 8 etapas (Solicitud → Cierre). Asignación automática por skill y plaza.",
         "/api/wfm/tickets\n/api/wfm/tecnicos\n/api/wfm/asignar/{id}",
         "✅ Activo"],
        ["Assets",
         "asset_service.py",
         "Control de activos físicos: antenas, routers, cables, equipos. Registro y trazabilidad por QR.",
         "/api/activos/registrar\n/api/activos/listar\n/api/activos/{id}/label",
         "✅ Activo"],
        ["X-Token Economy",
         "token_service.py",
         "Economía interna de incentivos XCIEN. Tokens 1:1 MXN por desempeño técnico y calidad.",
         "/api/tokens/emitir\n/api/tokens/listar\n/api/tokens/operativo",
         "✅ Activo"],
        ["Auth Service",
         "auth_service.py",
         "Autenticación JWT + bcrypt con control de acceso por roles (Admin, Operador, Técnico).",
         "/api/auth/login\n/api/auth/refresh\n/api/auth/verify",
         "✅ Activo"],
        ["Transacciones",
         "transacciones_\nservice.py",
         "Flujos intercompany entre entidades del grupo: XCIEN, Wispi, S7, CMTT.",
         "/api/transacciones/\nregistrar\n/api/transacciones/\nresumen",
         "✅ Activo"],
        ["Odoo Connector",
         "odoo_connector.py",
         "Puente XML-RPC a Odoo 17 (wispi17). Fuente de verdad única del ERP corporativo.",
         "Uso interno\n(no expuesto\ndirectamente)",
         "✅ Activo"],
        ["UISP Service",
         "uisp_service.py",
         "Integración con UISP (Ubiquiti ISP Platform) para gestión de dispositivos y clientes de red.",
         "En desarrollo",
         "🔄 En prog."],
        ["Label Service",
         "label_service.py",
         "Generación de etiquetas QR/PDF para activos físicos y comprobantes de transacciones.",
         "/api/activos/{id}/label\n/api/trans/{id}/label",
         "✅ Activo"],
        ["Auditor Calidad",
         "auditor_calidad.py",
         "Verificación de calidad operativa: checklist EPP, evidencias fotográficas, estándares de campo.",
         "CLI / Interno",
         "✅ Activo"],
    ]

    svc_data = [[P(h, E(f"sh{i}", fontName="Helvetica-Bold", fontSize=8,
                        textColor=C_BLANCO, alignment=TA_CENTER, leading=11))
                 for i, h in enumerate(svc_header)]]
    for row in svc_rows:
        svc_data.append([P(cell, sCelda) for cell in row])

    story.append(tabla_ejecutiva(svc_data, [s1, s2, s3, s4, s5]))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════
    #  4. FLUJO WFM — 8 ETAPAS
    # ══════════════════════════════════════════════════════════════
    story.append(P("4.  FLUJO OPERATIVO — ORDEN DE TRABAJO (8 ETAPAS)", sSeccion))
    story.append(hr_verde())
    story.append(P(
        "Cada nueva instalación o servicio pasa por 8 etapas secuenciales gestionadas "
        "por el WFMWorkflowService. Cada etapa tiene un responsable humano y un agente IA de soporte.",
        sBody))
    story.append(sp(10))

    w1 = 0.35*inch
    w2 = 1.2*inch
    w3 = 1.2*inch
    w4 = 1.4*inch
    w5 = TW - w1 - w2 - w3 - w4

    wfm_header = ["#", "ETAPA", "RESPONSABLE", "AGENTE IA", "DESCRIPCIÓN"]
    wfm_rows = [
        ["01", "Solicitud\nComercial", "Área Comercial", "Agente Comercial",
         "El cliente solicita el servicio. Se genera la oportunidad en el CRM y se abre la orden de trabajo."],
        ["02", "Preventa /\nFactibilidad", "Preventa", "Agente Preventa",
         "Análisis técnico por coordenadas GPS: cobertura, tecnología disponible y viabilidad del sitio."],
        ["03", "Contratación", "Legal + DG", "Agente Legal",
         "Elaboración y firma del contrato de servicio. Validación de cláusulas y SLA acordado."],
        ["04", "Almacén", "Logística", "Asset Service",
         "Solicitud y entrega de equipos desde bodega: router, cables, antena y accesorios necesarios."],
        ["05", "Aprovisiona-\nmiento", "NOC / TI", "Agente NOC",
         "Configuración de red: asignación de IP, VLAN, ancho de banda, gateway y firmware del equipo."],
        ["06", "Instalación\nen Campo", "Técnico", "Agente Ops\n+ Dispatch",
         "Trabajo en sitio: checklist de EPP, evidencias fotográficas, prueba de velocidad y entrega."],
        ["07", "Alta NOC", "NOC", "Agente NOC",
         "Alta del cliente en el sistema de monitoreo. Confirmación de ping, latencia y disponibilidad."],
        ["08", "Cierre &\nEntrega", "Técnico +\nCoordinador", "WFM + DG V2",
         "Firma de entrega por el cliente. Ticket cerrado. Datos sincronizados a Odoo 17 (wispi17)."],
    ]

    wfm_data = [[P(h, E(f"wh{i}", fontName="Helvetica-Bold", fontSize=8,
                        textColor=C_BLANCO, alignment=TA_CENTER, leading=11))
                 for i, h in enumerate(wfm_header)]]
    for i, row in enumerate(wfm_rows):
        styled = [
            P(row[0], E("wn", fontName="Helvetica-Bold", fontSize=14,
                textColor=C_VERDE if i == 7 else C_GRIS_MED,
                alignment=TA_CENTER, leading=16)),
            P(row[1], sCeldaBold),
            P(row[2], sCelda),
            P(row[3], sCeldaAzul),
            P(row[4], sCelda),
        ]
        wfm_data.append(styled)

    story.append(tabla_ejecutiva(wfm_data, [w1, w2, w3, w4, w5]))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════
    #  5. INVENTARIO COMPLETO
    # ══════════════════════════════════════════════════════════════
    story.append(P("5.  INVENTARIO COMPLETO DE ARCHIVOS", sSeccion))
    story.append(hr_verde())
    story.append(P(
        "Registro exhaustivo de todos los archivos de agentes y servicios del ecosistema XCIEN 2026, "
        "con su estado de operación actual verificado.",
        sBody))
    story.append(sp(10))

    i1, i2, i3, i4, i5, i6 = 0.3*inch, 2.05*inch, 1.55*inch, 1.25*inch, 0.9*inch, 0.95*inch
    assert abs(i1+i2+i3+i4+i5+i6 - TW) < 1

    inv_header = ["#", "ARCHIVO", "CLASE / ROL", "MODELO", "ESTADO", "EJECUTABLE"]
    inv_rows = [
        ("01", "director_general_v2.py",     "DirectorGeneralV2",       "claude-sonnet-4-6",      "✅ OPERATIVO",  "Sí"),
        ("02", "simulador_agentes.py",        "Agent + DirectorGeneral", "claude-haiku-4-5",       "✅ OPERATIVO",  "Sí"),
        ("03", "agente_claude.py",            "AgenteClaude",            "claude-sonnet-4-6",      "✅ CONECTADO", "Sí"),
        ("04", "creador_manuales.py",         "Creador Docs IA",         "claude-sonnet-4-6",      "✅ LISTO",      "Sí"),
        ("05", "devops_agent.py",             "DevOpsAgent",             "claude-sonnet-4-6",      "✅ LISTO",      "Sí"),
        ("06", "claude_hygienic_review.py",   "Revisor de Higiene",      "hereda agente_claude",   "✅ LISTO",      "Sí"),
        ("07", "consolidacion_entrega.py",    "Consolidador de Entrega", "hereda agente_claude",   "✅ LISTO",      "Sí"),
        ("08", "auditor_calidad.py",          "OdooAuditor",             "— (Odoo xmlrpc)",        "✅ LISTO",      "Sí"),
        ("09", "auth_service.py",             "AuthService JWT/bcrypt",  "—",                      "✅ ACTIVO",     "No"),
        ("10", "wfm_workflow_service.py",     "WFMWorkflowService",      "— (Odoo + JSON)",        "✅ ACTIVO",     "No"),
        ("11", "asset_service.py",            "AssetService",            "—",                      "✅ ACTIVO",     "No"),
        ("12", "token_service.py",            "TokenService",            "—",                      "✅ ACTIVO",     "No"),
        ("13", "transacciones_service.py",    "TransaccionesService",    "—",                      "✅ ACTIVO",     "No"),
        ("14", "odoo_connector.py",           "OdooConnector (xmlrpc)",  "—",                      "✅ ACTIVO",     "No"),
        ("15", "uisp_service.py",             "UISPService",             "—",                      "🔄 EN PROG.",   "No"),
        ("16", "label_service.py",            "LabelService",            "—",                      "✅ LISTO",      "No"),
        ("17", "integration_orchestrator.py", "IntegrationOrchestrator", "—",                      "⚠️ VACÍO",      "No"),
        ("18", "agent_noc.py",               "NOCAgent (stub)",         "—",                      "⚠️ STUB",       "No"),
        ("19", "agent_wfm.py",               "WFMAgent (stub)",         "—",                      "⚠️ STUB",       "No"),
        ("20", "agent_academia.py",           "AcademiaAgent (stub)",    "—",                      "⚠️ STUB",       "No"),
        ("21", "agent_finances.py",           "FinanceAgent (stub)",     "—",                      "⚠️ STUB",       "No"),
        ("22", "agent_inventory.py",          "InventoryAgent (stub)",   "—",                      "⚠️ STUB",       "No"),
        ("23", "agent_call_center.py",        "CallCenterAgent (stub)",  "—",                      "⚠️ STUB",       "No"),
        ("24", "telegram_bot.py",             "TelegramBot",             "—",                      "✅ ACTIVO",     "Sí"),
    ]

    def estado_style(est):
        if "✅" in est:  return sCeldaVerde
        if "🔄" in est:  return sCeldaAzul
        if "⚠️" in est:  return sCeldaAmarillo
        if "❌" in est:  return sCeldaRojo
        return sCelda

    inv_data = [[P(h, E(f"ih{i}", fontName="Helvetica-Bold", fontSize=8,
                        textColor=C_BLANCO, alignment=TA_CENTER, leading=11))
                 for i, h in enumerate(inv_header)]]
    for row in inv_rows:
        num, archivo, clase, modelo, estado, exec_ = row
        inv_data.append([
            P(num, E("in", fontName="Helvetica-Bold", fontSize=8,
                textColor=C_GRIS_CLAR, alignment=TA_CENTER, leading=11)),
            P(archivo, E("ia", fontName="Courier", fontSize=7.5,
                textColor=C_NEGRO, leading=11)),
            P(clase, sCelda),
            P(modelo, sCeldaGris),
            P(estado, estado_style(estado)),
            P(exec_, E("ie", fontName="Helvetica", fontSize=8,
                textColor=C_NEGRO, alignment=TA_CENTER, leading=11)),
        ])

    story.append(tabla_ejecutiva(inv_data, [i1, i2, i3, i4, i5, i6]))

    # ══════════════════════════════════════════════════════════════
    #  FOOTER FINAL
    # ══════════════════════════════════════════════════════════════
    story.append(sp(20))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_VERDE,
                            spaceAfter=10, spaceBefore=6))
    story.append(P(
        f"Documento elaborado por Antigravity · Orquestador XCIEN 2026 · "
        f"Emitido el {datetime.now().strftime('%d/%m/%Y a las %H:%M hrs')}",
        sFooter))
    story.append(P(
        "Uso interno · Confidencial · Propiedad de la Dirección General XCIEN",
        sFooter))

    # ── Construir ─────────────────────────────────────────────────────────────
    doc.build(
        story,
        onFirstPage=primera_pagina,
        onLaterPages=paginas_siguientes
    )
    print(f"✅ PDF ejecutivo generado: {OUTPUT}")


if __name__ == "__main__":
    build()
