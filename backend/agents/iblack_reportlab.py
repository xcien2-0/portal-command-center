"""
iBlack ReportLab Generator
Genera PDFs con identidad corporativa iBlack Internet Premium.
Paleta: fondo oscuro #0d0d1a, acento morado #7c3aed, lila #a855f7
"""
import io, os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Flowable,
    Paragraph, Spacer, Table, TableStyle, PageBreak, NextPageTemplate
)

# ── Paleta iBlack ─────────────────────────────────────────────────────────────
DARK      = colors.HexColor("#0d0d1a")   # fondo principal
DARK2     = colors.HexColor("#1e1b2e")   # cards / filas alternas
PURPLE    = colors.HexColor("#7c3aed")   # acento principal
LILAC     = colors.HexColor("#a855f7")   # acento secundario
PINK      = colors.HexColor("#e040fb")   # gradiente logo
WHITE     = colors.HexColor("#ffffff")
GRAY      = colors.HexColor("#94a3b8")
GRAY2     = colors.HexColor("#475569")
LINE      = colors.HexColor("#2d2a45")   # bordes de tabla

LOGO_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "assets", "iblack_logo.jpg"
)
W, H = letter  # 612 x 792

# ── Estilos ───────────────────────────────────────────────────────────────────
def _s(name, **kw):
    return ParagraphStyle(name, **{
        "fontName": "Helvetica", "fontSize": 10, "leading": 14,
        "textColor": WHITE, **kw
    })

ST = {
    "body":  _s("body", textColor=WHITE),
    "small": _s("small", fontSize=8, leading=11, textColor=GRAY),
    "white": _s("white", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE),
    "meta":  _s("meta", fontSize=9, leading=12, textColor=GRAY),
    "dark":  _s("dark", textColor=colors.HexColor("#0d0d1a")),
}

# ── Page callbacks ────────────────────────────────────────────────────────────
def _draw_cover(c, doc, title, subtitle, date_str, extra=""):
    c.saveState()
    # Fondo completo oscuro
    c.setFillColor(DARK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    # Barra lateral morada
    c.setFillColor(PURPLE)
    c.rect(0, 0, 0.9*inch, H, fill=1, stroke=0)
    # Franja decorativa lila
    c.setFillColor(LILAC)
    c.rect(0.9*inch, 0, 0.08*inch, H, fill=1, stroke=0)
    # Card central oscuro
    c.setFillColor(DARK2)
    c.roundRect(1.3*inch, H*0.3, W - 2.1*inch, H*0.38, 12, fill=1, stroke=0)

    # Logo
    if os.path.exists(LOGO_PATH):
        try:
            c.drawImage(LOGO_PATH, W - 2.4*inch, H - 0.95*inch,
                        width=2.1*inch, height=0.72*inch,
                        preserveAspectRatio=True, mask="auto")
        except Exception:
            pass

    mid = H * 0.56
    # Título
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(WHITE)
    c.drawString(1.6*inch, mid, title)
    # Subtítulo en morado
    c.setFont("Helvetica", 14)
    c.setFillColor(LILAC)
    c.drawString(1.6*inch, mid - 30, subtitle)
    # Línea decorativa
    c.setStrokeColor(PURPLE)
    c.setLineWidth(2)
    c.line(1.6*inch, mid - 42, W - 0.9*inch, mid - 42)
    # Fecha
    c.setFont("Helvetica", 10)
    c.setFillColor(GRAY)
    c.drawString(1.6*inch, mid - 58, date_str)
    if extra:
        c.drawString(1.6*inch, mid - 74, extra)

    # Footer
    c.setFillColor(PURPLE)
    c.rect(0, 0, W, 0.42*inch, fill=1, stroke=0)
    c.setFont("Helvetica", 8)
    c.setFillColor(WHITE)
    c.drawString(1.3*inch, 0.14*inch, "iBlack Internet Premium  |  Documento Confidencial")
    c.restoreState()

def _draw_page(c, doc, header_text):
    c.saveState()
    # Header oscuro con franja morada
    c.setFillColor(DARK)
    c.rect(0, H - 0.52*inch, W, 0.52*inch, fill=1, stroke=0)
    c.setFillColor(PURPLE)
    c.rect(0, H - 0.52*inch, W, 0.04*inch, fill=1, stroke=0)
    # Logo
    if os.path.exists(LOGO_PATH):
        try:
            c.drawImage(LOGO_PATH, 0.35*inch, H - 0.49*inch,
                        width=1.35*inch, height=0.42*inch,
                        preserveAspectRatio=True, mask="auto")
        except Exception:
            pass
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(LILAC)
    c.drawString(1.9*inch, H - 0.32*inch, header_text)
    # Footer
    c.setFillColor(DARK)
    c.rect(0, 0, W, 0.38*inch, fill=1, stroke=0)
    c.setFillColor(PURPLE)
    c.rect(0, 0.36*inch, W, 0.02*inch, fill=1, stroke=0)
    c.setFont("Helvetica", 8)
    c.setFillColor(GRAY)
    c.drawCentredString(W / 2, 0.12*inch, f"iBlack Internet Premium  ·  Página {doc.page}")
    c.restoreState()

# ── Helpers ───────────────────────────────────────────────────────────────────
def section_hdr(text):
    return [
        Table(
            [[Paragraph(text, ST["white"])]],
            colWidths=[W - 1.5*inch],
            style=TableStyle([
                ("BACKGROUND",    (0,0), (-1,-1), PURPLE),
                ("TOPPADDING",    (0,0), (-1,-1), 6),
                ("BOTTOMPADDING", (0,0), (-1,-1), 6),
                ("LEFTPADDING",   (0,0), (-1,-1), 10),
                ("RIGHTPADDING",  (0,0), (-1,-1), 10),
            ])
        ),
        Spacer(1, 7),
    ]

def iblack_ts(num_rows, header_rows=1):
    styles = [
        ("BACKGROUND",    (0, 0), (-1, header_rows-1), DARK),
        ("TEXTCOLOR",     (0, 0), (-1, header_rows-1), LILAC),
        ("FONTNAME",      (0, 0), (-1, header_rows-1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, header_rows-1), 9),
        ("FONTNAME",      (0, header_rows), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, header_rows), (-1, -1), 9),
        ("TEXTCOLOR",     (0, header_rows), (-1, -1), WHITE),
        ("ALIGN",         (0, 0), (-1, 0), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("GRID",          (0, 0), (-1, -1), 0.5, LINE),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
    ]
    for i in range(num_rows - header_rows):
        bg = DARK2 if i % 2 == 0 else DARK
        styles.append(("BACKGROUND", (0, header_rows + i), (-1, header_rows + i), bg))
    return TableStyle(styles)

def kpi_row(items):
    cells = []
    for label, value, hex_color in items:
        col = colors.HexColor(hex_color)
        cell = Table(
            [[Paragraph(f"<b>{value}</b>",
                        ParagraphStyle("kv", fontName="Helvetica-Bold", fontSize=17,
                                       textColor=col, alignment=1))],
             [Paragraph(label,
                        ParagraphStyle("kl", fontName="Helvetica", fontSize=8,
                                       textColor=GRAY, alignment=1))]],
            style=TableStyle([
                ("BACKGROUND",    (0,0), (-1,-1), DARK2),
                ("BOX",           (0,0), (-1,-1), 1.5, col),
                ("ALIGN",         (0,0), (-1,-1), "CENTER"),
                ("TOPPADDING",    (0,0), (-1,-1), 8),
                ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ])
        )
        cells.append(cell)
    n = len(cells)
    cw = (W - 1.5*inch) / n
    return [
        Table([cells], colWidths=[cw]*n,
              style=TableStyle([
                  ("ALIGN",  (0,0), (-1,-1), "CENTER"),
                  ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                  ("LEFTPADDING",  (0,0), (-1,-1), 4),
                  ("RIGHTPADDING", (0,0), (-1,-1), 4),
              ])),
        Spacer(1, 12),
    ]

# ── Document factory ──────────────────────────────────────────────────────────
def _build_doc(cover_fn, body_fn, story_body) -> bytes:
    buf = io.BytesIO()
    cover_frame = Frame(0, 0, W, H, leftPadding=0, rightPadding=0,
                        topPadding=0, bottomPadding=0, id="cover_frame")
    body_frame  = Frame(0.75*inch, 0.55*inch,
                        W - 1.5*inch, H - 1.2*inch, id="body_frame")
    doc = BaseDocTemplate(buf, pagesize=letter,
                          leftMargin=0, rightMargin=0,
                          topMargin=0, bottomMargin=0)
    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=cover_fn),
        PageTemplate(id="Body",  frames=[body_frame],  onPage=body_fn),
    ])
    story = [NextPageTemplate("Body"), PageBreak()] + story_body
    doc.build(story)
    return buf.getvalue()

# ── Reportes ──────────────────────────────────────────────────────────────────
def generar_incidente(datos: dict) -> bytes:
    empresa    = datos.get("empresa", "N/D")
    ticket     = datos.get("ticket", "N/D")
    servicio   = datos.get("servicio", "")
    fecha_ini  = datos.get("fecha_inicio", "")
    fecha_fin  = datos.get("fecha_cierre", "")
    descripcion= datos.get("descripcion", "")
    causa_raiz = datos.get("causa_raiz", "")
    acciones   = datos.get("acciones", "")
    impacto    = datos.get("impacto", "")
    estatus    = datos.get("estatus", "Cerrado")
    responsable= datos.get("responsable", "")

    def cover(c, d):
        _draw_cover(c, d, "REPORTE DE INCIDENTE",
                    f"{empresa}  ·  {ticket}",
                    fecha_ini or datetime.now().strftime("%Y-%m-%d"),
                    f"Estatus: {estatus}")
    def body(c, d):
        _draw_page(c, d, f"INCIDENTE — {ticket}")

    s = []
    s += kpi_row([
        ("Ticket",  ticket,  "#a855f7"),
        ("Estatus", estatus, "#e040fb" if estatus.lower() != "cerrado" else "#a855f7"),
        ("Empresa", empresa, "#7c3aed"),
        ("Impacto", impacto or "—", "#e040fb"),
    ])
    s += section_hdr("Datos del Incidente")
    info_rows = [["Campo", "Valor"]]
    for lbl, val in [
        ("Empresa / Cliente", empresa), ("Ticket / Folio", ticket),
        ("Servicio", servicio), ("Fecha Inicio", fecha_ini),
        ("Fecha Cierre", fecha_fin), ("Responsable", responsable),
        ("Estatus", estatus),
    ]:
        if val:
            info_rows.append([lbl, val])
    t = Table(info_rows, colWidths=[2.1*inch, W - 1.5*inch - 2.1*inch])
    t.setStyle(iblack_ts(len(info_rows)))
    s.append(t)
    s.append(Spacer(1, 12))

    for hdr_text, content in [
        ("Descripción del Incidente", descripcion),
        ("Causa Raíz", causa_raiz),
        ("Acciones Tomadas", acciones),
    ]:
        if content:
            s += section_hdr(hdr_text)
            s.append(Paragraph(content, ST["body"]))
            s.append(Spacer(1, 10))

    return _build_doc(cover, body, s)


def generar_barrido(datos: dict) -> bytes:
    sitio   = datos.get("sitio", "N/D")
    tecnico = datos.get("tecnico", "N/D")
    fecha   = datos.get("fecha", datetime.now().strftime("%Y-%m-%d"))
    notas   = datos.get("notas", "")
    mediciones = datos.get("mediciones", [])

    def cover(c, d):
        _draw_cover(c, d, "BARRIDO DE SEÑAL", f"Sitio: {sitio}",
                    f"Fecha: {fecha}", f"Técnico: {tecnico}")
    def body(c, d):
        _draw_page(c, d, "BARRIDO DE SEÑAL")

    s = []
    s += section_hdr("Información del Sitio")
    rows = [["Sitio", sitio], ["Técnico", tecnico], ["Fecha", fecha]]
    t = Table(rows, colWidths=[2*inch, W - 1.5*inch - 2*inch])
    t.setStyle(iblack_ts(len(rows), header_rows=0))
    s.append(t)
    s.append(Spacer(1, 14))

    if notas:
        s += section_hdr("Notas de Campo")
        s.append(Paragraph(notas, ST["body"]))
        s.append(Spacer(1, 14))

    s += section_hdr("Mediciones de Frecuencias")
    if mediciones:
        headers = ["Frecuencia (MHz)", "Nivel (dBm)", "Canal", "Estado"]
        rows2 = [headers] + [[
            str(m.get("frecuencia","")), str(m.get("nivel_dbm","")),
            str(m.get("canal","")), m.get("estado","")
        ] for m in mediciones]
        t2 = Table(rows2, colWidths=[1.9*inch, 1.6*inch, 1.6*inch, 1.6*inch])
        t2.setStyle(iblack_ts(len(rows2)))
        s.append(t2)
    else:
        s.append(Paragraph("No se registraron mediciones.", ST["meta"]))

    return _build_doc(cover, body, s)


def generar_noc_caidas(datos: dict) -> bytes:
    semana    = datos.get("semana", "")
    analista  = datos.get("analista", "NOC iBlack")
    total_dis = int(datos.get("total_dispositivos", 0) or 0)
    caidas    = datos.get("caidas", [])
    hallazgo  = datos.get("hallazgo_principal", "")
    acciones  = datos.get("acciones_preventivas", "")

    total_c = len(caidas)
    plazas  = list({c.get("plaza","") for c in caidas if c.get("plaza")})
    dispon  = f"{100 - round(total_c / max(total_dis,1) * 100, 1)}%" if total_dis else "—"

    def cover(c, d):
        _draw_cover(c, d, "NOC — CAÍDAS SEMANALES", f"Semana: {semana}",
                    datetime.now().strftime("%Y-%m-%d"), f"Analista: {analista}")
    def body(c, d):
        _draw_page(c, d, f"NOC CAÍDAS — {semana}")

    s = []
    s += kpi_row([
        ("Caídas",                    str(total_c),      "#e040fb"),
        ("Dispositivos Monitoreados", str(total_dis),    "#a855f7"),
        ("Plazas Afectadas",          str(len(plazas)), "#7c3aed"),
        ("Disponibilidad",            dispon,            "#a855f7"),
    ])

    if hallazgo:
        s += section_hdr("Hallazgo Principal")
        s.append(Table(
            [[Paragraph(hallazgo, ST["body"])]],
            colWidths=[W - 1.5*inch],
            style=TableStyle([
                ("BACKGROUND",    (0,0), (-1,-1), DARK2),
                ("BOX",           (0,0), (-1,-1), 1.5, PINK),
                ("TOPPADDING",    (0,0), (-1,-1), 8),
                ("BOTTOMPADDING", (0,0), (-1,-1), 8),
                ("LEFTPADDING",   (0,0), (-1,-1), 10),
            ])
        ))
        s.append(Spacer(1, 10))

    if caidas:
        s += section_hdr("Detalle de Caídas")
        headers = ["Dispositivo", "IP", "Inicio", "Min", "Causa", "Sitio"]
        rows = [headers] + [[
            c.get("dispositivo",""), c.get("ip",""), c.get("inicio",""),
            str(c.get("duracion_min","")), c.get("causa",""), c.get("plaza","")
        ] for c in caidas]
        t = Table(rows, colWidths=[1.6*inch, 1.05*inch, 1.15*inch, 0.7*inch, 1.45*inch, 1.0*inch])
        t.setStyle(iblack_ts(len(rows)))
        s.append(t)
        s.append(Spacer(1, 10))

    if acciones:
        s += section_hdr("Acciones Preventivas")
        s.append(Paragraph(acciones, ST["body"]))

    return _build_doc(cover, body, s)


def generar_operativo(datos: dict) -> bytes:
    plaza   = datos.get("plaza", "N/D")
    fecha   = datos.get("fecha", datetime.now().strftime("%Y-%m-%d"))
    gerente = datos.get("gerente", "")
    tickets = datos.get("tickets", [])
    instalaciones = datos.get("instalaciones", [])
    metricas = datos.get("metricas", {}) or {}
    notas   = datos.get("notas", "")

    def cover(c, d):
        _draw_cover(c, d, "REPORTE OPERATIVO", f"Plaza: {plaza}", fecha,
                    f"Gerente: {gerente}" if gerente else "")
    def body(c, d):
        _draw_page(c, d, f"REPORTE OPERATIVO — {plaza}")

    s = []
    s += kpi_row([
        ("Tickets Abiertos", str(metricas.get("tickets_abiertos", len(tickets))), "#e040fb"),
        ("Tickets Cerrados", str(metricas.get("tickets_cerrados", "—")),          "#a855f7"),
        ("NPS",              str(metricas.get("nps", "—")),                       "#7c3aed"),
        ("Uptime",           str(metricas.get("uptime", "—")),                    "#a855f7"),
    ])

    if tickets:
        s += section_hdr("Tickets de Soporte")
        headers = ["Folio", "Cliente", "Descripción", "Etapa", "Técnico"]
        rows = [headers] + [[
            t.get("folio",""), t.get("cliente",""), t.get("descripcion",""),
            t.get("etapa",""), t.get("tecnico","")
        ] for t in tickets]
        tbl = Table(rows, colWidths=[0.75*inch, 1.3*inch, 2.3*inch, 1.1*inch, 1.05*inch])
        tbl.setStyle(iblack_ts(len(rows)))
        s.append(tbl)
        s.append(Spacer(1, 10))

    if notas:
        s += section_hdr("Notas del Gerente")
        s.append(Paragraph(notas, ST["body"]))

    return _build_doc(cover, body, s)


# ── Dispatcher ────────────────────────────────────────────────────────────────
GENERADORES = {
    "barrido":    generar_barrido,
    "incidente":  generar_incidente,
    "noc_caidas": generar_noc_caidas,
    "operativo":  generar_operativo,
}

def generar_reporte(tipo: str, datos: dict) -> bytes:
    fn = GENERADORES.get(tipo)
    if not fn:
        raise ValueError(f"Tipo desconocido: {tipo!r}")
    return fn(datos)
