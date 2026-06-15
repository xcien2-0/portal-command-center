#!/usr/bin/env python3
"""
Generador PDF — Mapa de Agentes & Alcance XCIEN 2026
Antigravity · Dirección General XCIEN
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime

OUTPUT = "/Users/mesquite/Antigravity/MAPA_AGENTES_XCIEN_2026.pdf"

# ── Paleta XCIEN ──────────────────────────────────────────────────────────────
NEGRO     = colors.HexColor("#050810")
VERDE     = colors.HexColor("#00ff88")
VERDE_OSC = colors.HexColor("#00aa55")
AZUL      = colors.HexColor("#00cfff")
AZUL_OSC  = colors.HexColor("#005f7f")
GRIS_OSC  = colors.HexColor("#12172a")
GRIS_MED  = colors.HexColor("#252d48")
GRIS_CLAR = colors.HexColor("#dde4f0")
BLANCO    = colors.white
AMARILLO  = colors.HexColor("#ffd700")
NARANJA   = colors.HexColor("#ff9900")
ROJO      = colors.HexColor("#ff4d6d")
LILA      = colors.HexColor("#b07fff")

# ── Estilos ───────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, parent=styles["Normal"], **kw)

TITULO    = S("titulo", fontSize=26, textColor=VERDE, alignment=TA_CENTER,
              fontName="Helvetica-Bold", spaceAfter=6, leading=30)
SUB       = S("sub", fontSize=11, textColor=AZUL, alignment=TA_CENTER,
              fontName="Helvetica", spaceAfter=4)
META      = S("meta", fontSize=9, textColor=GRIS_CLAR, alignment=TA_CENTER,
              fontName="Helvetica", spaceAfter=20)
H1        = S("H1", fontSize=15, textColor=VERDE, fontName="Helvetica-Bold",
              spaceBefore=20, spaceAfter=8, leading=18)
H2        = S("H2", fontSize=12, textColor=AZUL, fontName="Helvetica-Bold",
              spaceBefore=12, spaceAfter=6, leading=14)
BODY      = S("body", fontSize=9.5, textColor=colors.black, fontName="Helvetica",
              spaceBefore=2, spaceAfter=4, leading=14)
BADGE_OK  = S("ok",   fontSize=9, textColor=VERDE,   fontName="Helvetica-Bold")
BADGE_WRN = S("wrn",  fontSize=9, textColor=AMARILLO, fontName="Helvetica-Bold")
BADGE_ERR = S("err",  fontSize=9, textColor=ROJO,    fontName="Helvetica-Bold")
FOOTER    = S("ft",   fontSize=8, textColor=GRIS_MED, alignment=TA_CENTER)
CODE      = S("code", fontSize=8, textColor=VERDE, fontName="Courier",
              backColor=GRIS_OSC, leftIndent=10, leading=12)

# ── Helpers ───────────────────────────────────────────────────────────────────
def HR():
    return HRFlowable(width="100%", thickness=0.5, color=GRIS_MED,
                      spaceAfter=8, spaceBefore=4)

def HR_VERDE():
    return HRFlowable(width="100%", thickness=1.5, color=VERDE,
                      spaceAfter=12, spaceBefore=4)

def tabla(data, col_widths, header_bg=GRIS_OSC, alt=True):
    t = Table(data, colWidths=col_widths, repeatRows=1)
    ts = TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), header_bg),
        ("TEXTCOLOR",    (0,0), (-1,0), VERDE),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,0), 8.5),
        ("ALIGN",        (0,0), (-1,0), "CENTER"),
        ("BOTTOMPADDING",(0,0), (-1,0), 8),
        ("TOPPADDING",   (0,0), (-1,0), 8),
        ("LINEBELOW",    (0,0), (-1,0), 1.5, VERDE),
        ("FONTSIZE",     (0,1), (-1,-1), 8.2),
        ("FONTNAME",     (0,1), (-1,-1), "Helvetica"),
        ("TEXTCOLOR",    (0,1), (-1,-1), colors.black),
        ("ALIGN",        (0,1), (-1,-1), "LEFT"),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",   (0,1), (-1,-1), 5),
        ("BOTTOMPADDING",(0,1), (-1,-1), 5),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("GRID",         (0,0), (-1,-1), 0.35, colors.lightgrey),
    ])
    if alt:
        for i in range(1, len(data), 2):
            ts.add("BACKGROUND", (0,i), (-1,i), colors.HexColor("#f0f4fa"))
    t.setStyle(ts)
    return t

# ── Contenido ─────────────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=letter,
        leftMargin=0.65*inch, rightMargin=0.65*inch,
        topMargin=0.65*inch,  bottomMargin=0.65*inch,
        title="Mapa de Agentes XCIEN 2026", author="Antigravity"
    )
    story = []
    ahora = datetime.now().strftime("%d/%m/%Y %H:%M")

    # ══ PORTADA ═══════════════════════════════════════════════════════════════
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("🤖 MAPA DE AGENTES & ALCANCE", TITULO))
    story.append(Paragraph("Gabinete de Inteligencia Operativa · XCIEN 2026", SUB))
    story.append(Paragraph(
        f"Versión 2.0  ·  Emitido: {ahora}  ·  Orquestador: Antigravity",
        META))
    story.append(HR_VERDE())
    story.append(Spacer(1, 0.2*inch))

    resumen_data = [
        ["CAPA", "AGENTES ACTIVOS", "MODELO BASE", "ESTADO"],
        ["Orquestador Humano", "Miguel Macías (DG)", "—", "✅ EN COMANDO"],
        ["Ingeniero IA",       "Antigravity",         "Gemini/Claude", "✅ OPERATIVO"],
        ["Portal Web",         "Director General V2", "claude-sonnet-4-6", "✅ ACTIVO"],
        ["CLI Orquestador",    "Simulador DG (×8)",   "claude-haiku-4-5", "✅ ACTIVO"],
        ["Servicios Ops",      "WFM, Assets, Tokens, Odoo", "Python+Odoo", "✅ ACTIVO"],
        ["Alertas / Comms",    "Telegram Bot",        "—", "❌ SIN TOKEN"],
    ]
    story.append(tabla(resumen_data,
        [1.6*inch, 1.9*inch, 1.7*inch, 1.5*inch]))

    story.append(PageBreak())

    # ══ 1. JERARQUÍA VISUAL ══════════════════════════════════════════════════
    story.append(Paragraph("1. JERARQUÍA DEL GABINETE", H1))
    story.append(HR())

    jerarquia = [
        ["NIVEL", "ROL / AGENTE", "TECNOLOGÍA", "CANAL DE ACCESO", "ALCANCE PRINCIPAL"],
        ["1 — Humano",
         "Miguel Macías\nDirector General",
         "—",
         "Conversación directa\ncon Antigravity",
         "Decisiones estratégicas, aprobación de operaciones, visión de negocio"],
        ["2 — Ingeniero IA",
         "Antigravity\n(Orquestador)",
         "Gemini 2.5 /\nClaude Sonnet",
         "IDE · Terminal · Chat",
         "Escribe código, ejecuta comandos, crea documentos, orquesta agentes"],
        ["3 — Portal IA",
         "Director General V2\n(director_general_v2.py)",
         "claude-sonnet-4-6",
         "localhost:8000\nAPI REST",
         "Responde consultas operativas con datos WFM + Libro Maestro en tiempo real"],
        ["4 — CLI IA",
         "Simulador / DG CLI\n(simulador_agentes.py)",
         "claude-haiku-4-5",
         "Terminal (CLI)",
         "Orquesta y delega a 8 agentes especializados por palabras clave"],
        ["5 — Sub-Agentes",
         "NOC · Ops · RRHH\nOdoo · Dispatch\nComercial · Preventa · Legal",
         "claude-haiku-4-5",
         "Delegado desde CLI",
         "Cada agente resuelve un dominio específico dentro de su área de expertise"],
        ["6 — Servicios",
         "WFM · Assets · Tokens\nTransacciones · Odoo\nLabel · Auth",
         "Python + JSON\nxmlrpc + JWT",
         "API :8000 / interno",
         "Lógica de negocio pura: órdenes, activos, economía X-Token, autenticación"],
    ]
    story.append(tabla(jerarquia,
        [1.1*inch, 1.4*inch, 1.1*inch, 1.3*inch, 2.9*inch],
        header_bg=GRIS_OSC))

    story.append(Spacer(1, 14))

    # ══ 2. AGENTES IA — ALCANCE DETALLADO ════════════════════════════════════
    story.append(Paragraph("2. AGENTES IA — ALCANCE DETALLADO", H1))
    story.append(HR())

    agentes = [
        {
            "nombre": "🧠 Director General V2",
            "archivo": "director_general_v2.py",
            "modelo": "claude-sonnet-4-6",
            "estado": "✅ OPERATIVO",
            "trigger": "Chat en portal web / API POST /api/director/chat",
            "alcance": [
                "Consultas operativas en lenguaje natural (tickets, técnicos, NOC)",
                "Análisis de datos WFM: asignación óptima de técnicos",
                "Lectura del Libro Maestro de Operaciones XCIEN",
                "Generación de reportes ejecutivos por petición",
                "Escalamiento inteligente de incidentes críticos",
            ],
            "fuera": "No ejecuta comandos del sistema ni modifica datos directamente",
        },
        {
            "nombre": "🎭 Simulador — Director General CLI",
            "archivo": "simulador_agentes.py",
            "modelo": "claude-haiku-4-5",
            "estado": "✅ OPERATIVO",
            "trigger": "Ejecución en terminal: python3 simulador_agentes.py",
            "alcance": [
                "Detección automática de dominio por palabras clave",
                "Delegación a 8 agentes especializados (NOC, Ops, RRHH, Odoo, Dispatch, Comercial, Preventa, Legal)",
                "Sesión de chat continua con memoria de turno",
                "Respuesta multi-agente coordinada cuando el query abarca varios dominios",
            ],
            "fuera": "No accede a base de datos de producción directamente",
        },
        {
            "nombre": "📡 Agente NOC",
            "archivo": "agent_noc.py (vía simulador)",
            "modelo": "claude-haiku-4-5",
            "estado": "✅ VÍA SIMULADOR",
            "trigger": "Palabras clave: caído, enlace, falla, red, noc, nodo, troncal",
            "alcance": [
                "Clasificación de incidentes de red: P1-Crítico / P2-Alto / P3-Medio",
                "Protocolo de respuesta inmediata para pérdida de enlace troncal",
                "Guía de escalamiento a coordinador de guardia",
                "Análisis de impacto: clientes afectados, tiempo estimado de restauración",
                "Recomendaciones de configuración para nodos caídos",
            ],
            "fuera": "No ejecuta cambios en routers/switches directamente",
        },
        {
            "nombre": "🔧 Agente Operaciones",
            "archivo": "simulador_agentes.py (Ops agent)",
            "modelo": "claude-haiku-4-5",
            "estado": "✅ VÍA SIMULADOR",
            "trigger": "Palabras clave: campo, EPP, instalación, técnico, mástil, seguridad",
            "alcance": [
                "Checklists de seguridad para trabajo en campo y alturas",
                "Estándares de instalación de antenas y equipos",
                "Protocolos de EPP (Equipo de Protección Personal)",
                "Validación de condiciones de trabajo seguro",
                "Guías de procedimiento para instalaciones en plazas activas",
            ],
            "fuera": "No gestiona asignación de tickets (eso es Dispatch)",
        },
        {
            "nombre": "🎓 Agente RRHH / Academia",
            "archivo": "simulador_agentes.py (RRHH agent)",
            "modelo": "claude-haiku-4-5",
            "estado": "✅ VÍA SIMULADOR",
            "trigger": "Palabras clave: capacitación, curso, examen, academia, manual, certificación",
            "alcance": [
                "Diseño de rutas de capacitación por nivel técnico",
                "Generación de exámenes diagnósticos con IA",
                "Protocolo de promoción técnica (Técnico I → Técnico III → Senior)",
                "Seguimiento de matriz de habilidades del equipo",
                "Evaluaciones de desempeño y retroalimentación estructurada",
            ],
            "fuera": "No procesa nómina ni gestiona contratos laborales",
        },
        {
            "nombre": "💼 Agente Odoo",
            "archivo": "simulador_agentes.py / odoo_connector.py",
            "modelo": "claude-haiku-4-5 + xmlrpc",
            "estado": "✅ VÍA SIMULADOR",
            "trigger": "Palabras clave: odoo, erp, módulo, ticket, registro, wispi17",
            "alcance": [
                "Consultas a base Odoo 17 (wispi17) vía XML-RPC",
                "Gestión de tickets en módulo helpdesk de Odoo",
                "Actualización de registros de clientes y contratos",
                "Reportes de facturación e inventario desde ERP",
                "Sincronización de datos WFM ↔ Odoo",
            ],
            "fuera": "No realiza cambios contables o de nómina sin validación humana",
        },
        {
            "nombre": "🚚 Agente Dispatch",
            "archivo": "simulador_agentes.py (Dispatch agent)",
            "modelo": "claude-haiku-4-5",
            "estado": "✅ VÍA SIMULADOR",
            "trigger": "Palabras clave: asignar, ruta, despacho, agenda, dispatch, logística",
            "alcance": [
                "Asignación inteligente de técnico a ticket por skill y ubicación",
                "Optimización de rutas de visitas por plaza (NL, JAL, CDMX, QRO)",
                "Programación de agenda de instalaciones y mantenimientos",
                "Notificación de asignaciones al técnico responsable",
                "Seguimiento de estado de órdenes en campo",
            ],
            "fuera": "No gestiona pagos de viáticos ni combustible directamente",
        },
        {
            "nombre": "💰 Agente Comercial",
            "archivo": "simulador_agentes.py (Comercial agent)",
            "modelo": "claude-haiku-4-5",
            "estado": "✅ VÍA SIMULADOR",
            "trigger": "Palabras clave: venta, cotización, prospecto, cliente, comercial",
            "alcance": [
                "Generación de cotizaciones para nuevos clientes empresariales",
                "Análisis de portafolio: XCIEN, Wispi, Luminet WAN, Huus, Sandur",
                "Seguimiento de pipeline de ventas y prospectos",
                "Comparativa de planes y SLA por tipo de cliente",
                "Recomendaciones de upsell para clientes existentes",
            ],
            "fuera": "No firma contratos ni genera facturas",
        },
        {
            "nombre": "📐 Agente Preventa",
            "archivo": "simulador_agentes.py (Preventa agent)",
            "modelo": "claude-haiku-4-5",
            "estado": "✅ VÍA SIMULADOR",
            "trigger": "Palabras clave: factibilidad, coordenadas, antena, señal, cobertura, preventa",
            "alcance": [
                "Análisis de factibilidad técnica por coordenadas GPS",
                "Evaluación de cobertura de red por zona geográfica",
                "Recomendación de tecnología: FTTH, microondas, VSAT",
                "Estimación de materiales necesarios para instalación",
                "Validación de viabilidad técnica antes de firma de contrato",
            ],
            "fuera": "No emite órdenes de compra de equipo",
        },
        {
            "nombre": "⚖️ Agente Legal",
            "archivo": "simulador_agentes.py (Legal agent)",
            "modelo": "claude-haiku-4-5",
            "estado": "✅ VÍA SIMULADOR",
            "trigger": "Palabras clave: contrato, IFT, arrendamiento, SLA, cláusula, legal",
            "alcance": [
                "Revisión de cláusulas de contratos de servicio",
                "Asesoría en regulación IFT para ISPs en México",
                "Plantillas de SLA (Service Level Agreement) por tipo de cliente",
                "NDAs para consorcios y alianzas estratégicas (CMTT)",
                "Identificación de riesgos legales en acuerdos de arrendamiento de infraestructura",
            ],
            "fuera": "No sustituye a un abogado certificado; es orientación inicial",
        },
    ]

    for ag in agentes:
        bloque = []
        # Header del agente
        bloque.append(Paragraph(ag["nombre"], H2))
        meta_data = [
            ["Archivo", "Modelo", "Estado", "Trigger de Activación"],
            [ag["archivo"], ag["modelo"],
             Paragraph(ag["estado"], BADGE_OK if "✅" in ag["estado"] else BADGE_WRN),
             ag["trigger"]],
        ]
        t_meta = Table(meta_data, colWidths=[1.8*inch, 1.4*inch, 1.0*inch, 3.5*inch])
        t_meta.setStyle(TableStyle([
            ("BACKGROUND",   (0,0), (-1,0), GRIS_MED),
            ("TEXTCOLOR",    (0,0), (-1,0), AZUL),
            ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",     (0,0), (-1,0), 8),
            ("BACKGROUND",   (0,1), (-1,1), colors.HexColor("#f7f9fd")),
            ("FONTSIZE",     (0,1), (-1,1), 8),
            ("FONTNAME",     (0,1), (-1,1), "Helvetica"),
            ("TEXTCOLOR",    (0,1), (-1,1), colors.black),
            ("GRID",         (0,0), (-1,-1), 0.3, colors.lightgrey),
            ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING",   (0,0), (-1,-1), 5),
            ("BOTTOMPADDING",(0,0), (-1,-1), 5),
            ("LEFTPADDING",  (0,0), (-1,-1), 7),
        ]))
        bloque.append(t_meta)
        bloque.append(Spacer(1, 5))

        # Alcance
        alcance_rows = [["✔", desc] for desc in ag["alcance"]]
        alcance_rows.insert(0, ["", "ALCANCE — ¿QUÉ PUEDE HACER?"])
        t_alc = Table(alcance_rows, colWidths=[0.25*inch, 7.5*inch])
        t_alc.setStyle(TableStyle([
            ("BACKGROUND",   (0,0), (-1,0), VERDE_OSC),
            ("TEXTCOLOR",    (0,0), (-1,0), BLANCO),
            ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",     (0,0), (-1,0), 8),
            ("SPAN",         (0,0), (-1,0)),
            ("ALIGN",        (0,0), (-1,0), "CENTER"),
            ("FONTSIZE",     (0,1), (-1,-1), 8.2),
            ("FONTNAME",     (0,1), (-1,-1), "Helvetica"),
            ("TEXTCOLOR",    (0,1), (0,-1), VERDE_OSC),
            ("FONTNAME",     (0,1), (0,-1), "Helvetica-Bold"),
            ("TEXTCOLOR",    (1,1), (1,-1), colors.black),
            ("GRID",         (0,0), (-1,-1), 0.25, colors.lightgrey),
            ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING",   (0,0), (-1,-1), 4),
            ("BOTTOMPADDING",(0,0), (-1,-1), 4),
            ("LEFTPADDING",  (0,0), (-1,-1), 7),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[BLANCO, colors.HexColor("#f0fff7")]),
        ]))
        bloque.append(t_alc)

        # Fuera de alcance
        bloque.append(Spacer(1, 3))
        bloque.append(Paragraph(f"⚠️  Fuera de alcance: {ag['fuera']}", S(
            "fuera", fontSize=8, textColor=colors.HexColor("#884400"),
            fontName="Helvetica-Oblique", backColor=colors.HexColor("#fff8e1"),
            leftIndent=8, rightIndent=8, spaceBefore=2, spaceAfter=8,
            leading=12, borderPadding=6)))

        story.append(KeepTogether(bloque))

    story.append(PageBreak())

    # ══ 3. SERVICIOS OPERATIVOS ══════════════════════════════════════════════
    story.append(Paragraph("3. SERVICIOS OPERATIVOS (Motor de Negocio)", H1))
    story.append(HR())
    story.append(Paragraph(
        "Los servicios no usan IA directamente pero son el motor transaccional del sistema. "
        "Se exponen como API REST en el puerto 8000 y son consumidos por los agentes y el portal.",
        BODY))
    story.append(Spacer(1, 10))

    svc_data = [
        ["SERVICIO", "ARCHIVO", "FUNCIÓN PRINCIPAL", "ENDPOINTS CLAVE", "ESTADO"],
        ["WFM Workflow",
         "wfm_workflow_service.py",
         "Motor de órdenes de trabajo (8 etapas: Solicitud → Cierre). Asignación automática de técnicos por skill y plaza.",
         "/api/wfm/tickets\n/api/wfm/tecnicos\n/api/wfm/asignar/{id}",
         "✅"],
        ["Assets",
         "asset_service.py",
         "Control de activos físicos: antenas, routers, cables, equipos de campo. Registro y trazabilidad por QR.",
         "/api/activos/registrar\n/api/activos/listar\n/api/activos/{id}/label",
         "✅"],
        ["X-Token Economy",
         "token_service.py",
         "Economía interna de incentivos XCIEN. Tokens 1:1 MXN por desempeño técnico y calidad de servicio.",
         "/api/tokens/emitir\n/api/tokens/listar\n/api/tokens/operativo",
         "✅"],
        ["Transacciones",
         "transacciones_service.py",
         "Flujos intercompany entre entidades del grupo (XCIEN, Wispi, S7, CMTT). Registro y reconciliación.",
         "/api/transacciones/registrar\n/api/transacciones/resumen",
         "✅"],
        ["Auth Service",
         "auth_service.py",
         "Autenticación JWT + bcrypt. Control de acceso por roles (Admin, Operador, Técnico). RBAC.",
         "/api/auth/login\n/api/auth/refresh\n/api/auth/verify",
         "✅"],
        ["Odoo Connector",
         "odoo_connector.py",
         "Puente XML-RPC a Odoo 17 (base wispi17). FUENTE DE VERDAD ÚNICA del ERP corporativo.",
         "Uso interno\n(no expuesto directamente)",
         "✅"],
        ["UISP Service",
         "uisp_service.py",
         "Integración con UISP (Ubiquiti ISP Platform) para gestión de dispositivos y clientes de red.",
         "Integración en progreso",
         "🔄"],
        ["Label Service",
         "label_service.py",
         "Generación de etiquetas QR/PDF para activos físicos y comprobantes de transacciones.",
         "/api/activos/{id}/label\n/api/transacciones/{id}/label",
         "✅"],
        ["Auditor Calidad",
         "auditor_calidad.py",
         "Verificación de calidad operativa en campo: checklist de EPP, evidencias fotográficas, cumplimiento de estándares.",
         "CLI / interno",
         "✅"],
    ]
    story.append(tabla(svc_data,
        [1.0*inch, 1.4*inch, 2.4*inch, 1.5*inch, 0.45*inch]))

    story.append(PageBreak())

    # ══ 4. FLUJO WFM ═════════════════════════════════════════════════════════
    story.append(Paragraph("4. FLUJO OPERATIVO — ORDEN DE TRABAJO (8 ETAPAS)", H1))
    story.append(HR())

    wfm = [
        ["#", "ETAPA", "RESPONSABLE", "AGENTE INVOLUCRADO", "DESCRIPCIÓN"],
        ["1", "Solicitud Comercial", "Área Comercial", "Agente Comercial",
         "El cliente solicita el servicio. Se genera la oportunidad en CRM."],
        ["2", "Preventa / Factibilidad", "Preventa", "Agente Preventa",
         "Análisis técnico por coordenadas, cobertura y tecnología disponible."],
        ["3", "Contratación", "Legal + DG", "Agente Legal",
         "Elaboración y firma del contrato. Validación de cláusulas SLA."],
        ["4", "Almacén", "Logística", "Asset Service",
         "Solicitud y entrega de equipos: router, cables, antena, accesorios."],
        ["5", "Aprovisionamiento", "NOC / TI", "Agente NOC",
         "Configuración de red: IP, VLAN, BW, gateway, firmware del equipo."],
        ["6", "Instalación en Campo", "Técnico", "Agente Ops + Dispatch",
         "Trabajo en sitio: checklist EPP, evidencias fotográficas, prueba de velocidad."],
        ["7", "Alta NOC", "NOC", "Agente NOC",
         "Alta del cliente en sistema de monitoreo. Confirmación de ping y latencia."],
        ["8", "Cierre y Entrega", "Técnico + Coord.", "WFM + Director General V2",
         "Firma de entrega por el cliente. Ticket cerrado. Datos sincronizados a Odoo."],
    ]
    story.append(tabla(wfm, [0.3*inch, 1.1*inch, 1.0*inch, 1.4*inch, 3.9*inch]))

    story.append(Spacer(1, 18))

    # ══ 5. INVENTARIO COMPLETO ═══════════════════════════════════════════════
    story.append(Paragraph("5. INVENTARIO COMPLETO DE ARCHIVOS", H1))
    story.append(HR())

    inventario = [
        ["#", "ARCHIVO", "CLASE / ROL", "MODELO", "ESTADO", "EXEC"],
        ["1",  "director_general_v2.py",     "DirectorGeneralV2",      "claude-sonnet-4-6",     "✅ OPERATIVO", "Sí"],
        ["2",  "simulador_agentes.py",        "Agent + DirectorGeneral", "claude-haiku-4-5",     "✅ OPERATIVO", "Sí"],
        ["3",  "agente_claude.py",            "AgenteClaude",            "claude-sonnet-4-6",    "✅ CONECTADO", "Sí"],
        ["4",  "creador_manuales.py",         "Creador Docs IA",         "claude-sonnet-4-6",    "✅ LISTO",     "Sí"],
        ["5",  "devops_agent.py",             "DevOpsAgent",             "claude-sonnet-4-6",    "✅ LISTO",     "Sí"],
        ["6",  "claude_hygienic_review.py",   "Revisor Higiene",         "(hereda agente_claude)","✅ LISTO",    "Sí"],
        ["7",  "consolidacion_entrega.py",    "Consolidador",            "(hereda agente_claude)","✅ LISTO",    "Sí"],
        ["8",  "auditor_calidad.py",          "OdooAuditor",             "— (Odoo)",             "✅ LISTO",     "Sí"],
        ["9",  "auth_service.py",             "AuthService JWT/bcrypt",  "—",                    "✅ ACTIVO",    "No"],
        ["10", "wfm_workflow_service.py",     "WFMWorkflowService",      "— (Odoo+JSON)",        "✅ ACTIVO",    "No"],
        ["11", "asset_service.py",            "AssetService",            "—",                    "✅ ACTIVO",    "No"],
        ["12", "token_service.py",            "TokenService",            "—",                    "✅ ACTIVO",    "No"],
        ["13", "transacciones_service.py",    "TransaccionesService",    "—",                    "✅ ACTIVO",    "No"],
        ["14", "odoo_connector.py",           "OdooConnector (xmlrpc)",  "—",                    "✅ ACTIVO",    "No"],
        ["15", "uisp_service.py",             "UIsPService",             "—",                    "🔄 EN PROG.", "No"],
        ["16", "label_service.py",            "LabelService",            "—",                    "✅ LISTO",     "No"],
        ["17", "integration_orchestrator.py", "IntegrationOrchestrator", "—",                   "⚠️ VACÍO",    "No"],
        ["18", "agent_noc.py",               "NOCAgent (stub)",         "—",                    "⚠️ STUB",      "No"],
        ["19", "agent_wfm.py",               "WFMAgent (stub)",         "—",                    "⚠️ STUB",      "No"],
        ["20", "agent_academia.py",           "AcademiaAgent (stub)",    "—",                   "⚠️ STUB",      "No"],
        ["21", "agent_finances.py",           "FinanceAgent (stub)",     "—",                   "⚠️ STUB",      "No"],
        ["22", "agent_inventory.py",          "InventoryAgent (stub)",   "—",                   "⚠️ STUB",      "No"],
        ["23", "agent_call_center.py",        "CallCenterAgent (stub)",  "—",                   "⚠️ STUB",      "No"],
        ["24", "telegram_bot.py",             "TelegramBot",             "—",                    "❌ SIN TOKEN", "No"],
    ]
    story.append(tabla(inventario,
        [0.28*inch, 2.0*inch, 1.4*inch, 1.2*inch, 0.95*inch, 0.45*inch]))

    # ══ PIE DE PÁGINA ════════════════════════════════════════════════════════
    story.append(Spacer(1, 30))
    story.append(HR_VERDE())
    story.append(Paragraph(
        f"Documento generado por Antigravity  ·  XCIEN 2026  ·  {ahora}",
        FOOTER))
    story.append(Paragraph(
        "Uso interno · Confidencial · Propiedad de la Dirección General XCIEN",
        FOOTER))

    doc.build(story)
    print(f"✅ PDF generado: {OUTPUT}")

if __name__ == "__main__":
    build()
