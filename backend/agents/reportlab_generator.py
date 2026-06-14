"""
XCIEN ReportLab Generator
Genera PDFs con formato corporativo XCIEN (blanco/verde con logo).
"""
import io
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Flowable,
    Paragraph, Spacer, Table, TableStyle, PageBreak, NextPageTemplate
)

# ── Paleta XCIEN ──────────────────────────────────────────────────────────────
WHITE   = colors.HexColor("#ffffff")
SURF2   = colors.HexColor("#f0f4f0")
SURF3   = colors.HexColor("#e8f5e9")
LINE    = colors.HexColor("#d0d8d0")
GREEN   = colors.HexColor("#2e7d32")
GREEN2  = colors.HexColor("#43a047")
DARK    = colors.HexColor("#1b5e20")
RED     = colors.HexColor("#c62828")
ORANGE  = colors.HexColor("#e65100")
GRAY    = colors.HexColor("#546e7a")

LOGO_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "dist", "xcien.png"
)
W, H = letter  # 612 x 792

# ── Estilos de párrafo ────────────────────────────────────────────────────────
def _s(name, **kw):
    return ParagraphStyle(name, **{
        "fontName": "Helvetica", "fontSize": 10, "leading": 14,
        "textColor": colors.HexColor("#212121"), **kw
    })

ST = {
    "body":  _s("body"),
    "small": _s("small", fontSize=8, leading=11, textColor=GRAY),
    "white": _s("white", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE),
    "meta":  _s("meta", fontSize=9, leading=12, textColor=GRAY),
}

# ── Page callbacks ────────────────────────────────────────────────────────────
def _draw_cover(c, doc, title, subtitle, date_str, extra=""):
    c.saveState()
    c.setFillColor(GREEN)
    c.rect(0, 0, 1.15*inch, H, fill=1, stroke=0)
    c.setFillColor(SURF2)
    c.rect(1.15*inch, 0, W - 1.15*inch, H, fill=1, stroke=0)
    if os.path.exists(LOGO_PATH):
        try:
            c.drawImage(LOGO_PATH, W - 2.1*inch, H - 1.0*inch,
                        width=1.8*inch, height=0.68*inch,
                        preserveAspectRatio=True, mask="auto")
        except Exception:
            pass
    mid = H * 0.52
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(DARK)
    c.drawString(1.55*inch, mid, title)
    c.setFont("Helvetica", 13)
    c.setFillColor(GREEN)
    c.drawString(1.55*inch, mid - 26, subtitle)
    c.setStrokeColor(GREEN2)
    c.setLineWidth(1.5)
    c.line(1.55*inch, mid - 36, W - 0.75*inch, mid - 36)
    c.setFont("Helvetica", 10)
    c.setFillColor(GRAY)
    c.drawString(1.55*inch, mid - 52, date_str)
    if extra:
        c.drawString(1.55*inch, mid - 68, extra)
    c.setFillColor(GREEN)
    c.rect(0, 0, W, 0.42*inch, fill=1, stroke=0)
    c.setFont("Helvetica", 8)
    c.setFillColor(WHITE)
    c.drawString(1.55*inch, 0.14*inch, "XCIEN S.A. DE C.V.  |  Documento Confidencial")
    c.restoreState()

def _draw_page(c, doc, header_text):
    c.saveState()
    c.setFillColor(GREEN)
    c.rect(0, H - 0.5*inch, W, 0.5*inch, fill=1, stroke=0)
    if os.path.exists(LOGO_PATH):
        try:
            c.drawImage(LOGO_PATH, 0.38*inch, H - 0.47*inch,
                        width=1.2*inch, height=0.39*inch,
                        preserveAspectRatio=True, mask="auto")
        except Exception:
            pass
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(WHITE)
    c.drawString(1.75*inch, H - 0.32*inch, header_text)
    c.setFillColor(GREEN)
    c.rect(0, 0, W, 0.38*inch, fill=1, stroke=0)
    c.setFont("Helvetica", 8)
    c.setFillColor(WHITE)
    c.drawCentredString(W / 2, 0.12*inch, f"XCIEN S.A. de C.V.  ·  Página {doc.page}")
    c.restoreState()

# ── Story builder helpers ─────────────────────────────────────────────────────
def section_hdr(text):
    return [
        Table(
            [[Paragraph(text, ST["white"])]],
            colWidths=[W - 1.5*inch],
            style=TableStyle([
                ("BACKGROUND",    (0,0), (-1,-1), GREEN2),
                ("TOPPADDING",    (0,0), (-1,-1), 6),
                ("BOTTOMPADDING", (0,0), (-1,-1), 6),
                ("LEFTPADDING",   (0,0), (-1,-1), 10),
                ("RIGHTPADDING",  (0,0), (-1,-1), 10),
            ])
        ),
        Spacer(1, 7),
    ]

def xcien_ts(num_rows, header_rows=1):
    styles = [
        ("BACKGROUND",    (0, 0), (-1, header_rows-1), GREEN),
        ("TEXTCOLOR",     (0, 0), (-1, header_rows-1), WHITE),
        ("FONTNAME",      (0, 0), (-1, header_rows-1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, header_rows-1), 9),
        ("FONTNAME",      (0, header_rows), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, header_rows), (-1, -1), 9),
        ("ALIGN",         (0, 0), (-1, 0), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("GRID",          (0, 0), (-1, -1), 0.5, LINE),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
    ]
    for i in range(num_rows - header_rows):
        bg = WHITE if i % 2 == 0 else SURF2
        styles.append(("BACKGROUND", (0, header_rows + i), (-1, header_rows + i), bg))
    return TableStyle(styles)

def kpi_row(items):
    """items: [(label, value, hex_color)]"""
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
                ("BACKGROUND",    (0,0), (-1,-1), SURF3),
                ("BOX",           (0,0), (-1,-1), 2, col),
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
                  ("ALIGN",         (0,0), (-1,-1), "CENTER"),
                  ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
                  ("LEFTPADDING",   (0,0), (-1,-1), 4),
                  ("RIGHTPADDING",  (0,0), (-1,-1), 4),
              ])),
        Spacer(1, 12),
    ]

# ── Document factory ──────────────────────────────────────────────────────────
def _build_doc(cover_fn, body_fn, story_body) -> bytes:
    """
    Page 1: cover (purely drawn by cover_fn, no flowable content)
    Page 2+: body content
    """
    buf = io.BytesIO()
    cover_frame = Frame(0, 0, W, H,
                        leftPadding=0, rightPadding=0,
                        topPadding=0, bottomPadding=0,
                        id="cover_frame")
    body_frame = Frame(0.75*inch, 0.55*inch,
                       W - 1.5*inch, H - 1.2*inch,
                       id="body_frame")

    doc = BaseDocTemplate(
        buf, pagesize=letter,
        leftMargin=0, rightMargin=0, topMargin=0, bottomMargin=0
    )
    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=cover_fn),
        PageTemplate(id="Body",  frames=[body_frame],  onPage=body_fn),
    ])

    story = [NextPageTemplate("Body"), PageBreak()] + story_body
    doc.build(story)
    return buf.getvalue()

# ── Report builders ───────────────────────────────────────────────────────────
def generar_barrido(datos: dict) -> bytes:
    sitio    = datos.get("sitio", "N/D")
    tecnico  = datos.get("tecnico", "N/D")
    fecha    = datos.get("fecha", datetime.now().strftime("%Y-%m-%d"))
    notas    = datos.get("notas", "")
    mediciones = datos.get("mediciones", [])

    def cover(c, d):
        _draw_cover(c, d, "BARRIDO DE FRECUENCIAS", f"Sitio: {sitio}",
                    f"Fecha: {fecha}", f"Técnico: {tecnico}")
    def body(c, d):
        _draw_page(c, d, "BARRIDO DE FRECUENCIAS")

    s = []
    s += section_hdr("Información del Sitio")
    rows = [["Sitio", sitio], ["Técnico", tecnico], ["Fecha", fecha]]
    t = Table(rows, colWidths=[2*inch, W - 1.5*inch - 2*inch])
    t.setStyle(xcien_ts(len(rows), header_rows=0))
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (0,-1), SURF2),
        ("FONTNAME",      (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 9),
        ("GRID",          (0,0), (-1,-1), 0.5, LINE),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ]))
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
        t2.setStyle(xcien_ts(len(rows2)))
        s.append(t2)
    else:
        s.append(Paragraph("No se registraron mediciones.", ST["meta"]))

    return _build_doc(cover, body, s)


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
    timeline   = datos.get("timeline", [])

    def cover(c, d):
        _draw_cover(c, d, "REPORTE DE INCIDENTE", f"{empresa}  ·  {ticket}",
                    fecha_ini or datetime.now().strftime("%Y-%m-%d"),
                    f"Estatus: {estatus}")
    def body(c, d):
        _draw_page(c, d, f"INCIDENTE — {ticket}")

    s = []
    s += kpi_row([
        ("Ticket",  ticket,  "#2e7d32"),
        ("Estatus", estatus, "#e65100" if estatus.lower() != "cerrado" else "#2e7d32"),
        ("Empresa", empresa, "#1565c0"),
        ("Impacto", impacto or "—", "#c62828"),
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
    t.setStyle(xcien_ts(len(info_rows)))
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

    if timeline:
        s += section_hdr("Línea de Tiempo")
        tl_rows = [["Hora / Fecha", "Evento"]] + [
            [e.get("hora",""), e.get("evento","")] for e in timeline
        ]
        t2 = Table(tl_rows, colWidths=[1.9*inch, W - 1.5*inch - 1.9*inch])
        t2.setStyle(xcien_ts(len(tl_rows)))
        s.append(t2)

    return _build_doc(cover, body, s)


def generar_noc_caidas(datos: dict) -> bytes:
    semana    = datos.get("semana", "")
    analista  = datos.get("analista", "NOC XCIEN")
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
        ("Caídas",                   str(total_c),      "#c62828"),
        ("Dispositivos Monitoreados", str(total_dis),   "#2e7d32"),
        ("Plazas Afectadas",          str(len(plazas)), "#e65100"),
        ("Disponibilidad",            dispon,            "#1565c0"),
    ])

    if hallazgo:
        s += section_hdr("Hallazgo Principal")
        s.append(Table(
            [[Paragraph(hallazgo, ST["body"])]],
            colWidths=[W - 1.5*inch],
            style=TableStyle([
                ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#fff0f0")),
                ("BOX",           (0,0), (-1,-1), 1.5, RED),
                ("TOPPADDING",    (0,0), (-1,-1), 8),
                ("BOTTOMPADDING", (0,0), (-1,-1), 8),
                ("LEFTPADDING",   (0,0), (-1,-1), 10),
            ])
        ))
        s.append(Spacer(1, 10))

    if caidas:
        s += section_hdr("Detalle de Caídas")
        headers = ["Dispositivo", "IP", "Inicio", "Min", "Causa", "Plaza"]
        rows = [headers] + [[
            c.get("dispositivo",""), c.get("ip",""), c.get("inicio",""),
            str(c.get("duracion_min","")), c.get("causa",""), c.get("plaza","")
        ] for c in caidas]
        cws = [1.6*inch, 1.05*inch, 1.15*inch, 0.7*inch, 1.45*inch, 1.0*inch]
        t = Table(rows, colWidths=cws)
        t.setStyle(xcien_ts(len(rows)))
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
        ("Tickets Abiertos",  str(metricas.get("tickets_abiertos", len(tickets))), "#c62828"),
        ("Tickets Cerrados",  str(metricas.get("tickets_cerrados", "—")),           "#2e7d32"),
        ("NPS",               str(metricas.get("nps", "—")),                        "#1565c0"),
        ("Uptime",            str(metricas.get("uptime", "—")),                     "#43a047"),
    ])

    if tickets:
        s += section_hdr("Tickets de Soporte")
        headers = ["Folio", "Cliente", "Descripción", "Etapa", "Técnico"]
        rows = [headers] + [[
            t.get("folio",""), t.get("cliente",""), t.get("descripcion",""),
            t.get("etapa",""), t.get("tecnico","")
        ] for t in tickets]
        cws = [0.75*inch, 1.3*inch, 2.3*inch, 1.1*inch, 1.05*inch]
        tbl = Table(rows, colWidths=cws)
        tbl.setStyle(xcien_ts(len(rows)))
        s.append(tbl)
        s.append(Spacer(1, 10))

    if instalaciones:
        s += section_hdr("Instalaciones / Habilitaciones")
        headers2 = ["Folio", "Cliente", "Servicio", "Estado"]
        rows2 = [headers2] + [[
            i.get("folio",""), i.get("cliente",""), i.get("servicio",""), i.get("estado","")
        ] for i in instalaciones]
        cws2 = [0.85*inch, 1.85*inch, 2.3*inch, 1.5*inch]
        tbl2 = Table(rows2, colWidths=cws2)
        tbl2.setStyle(xcien_ts(len(rows2)))
        s.append(tbl2)
        s.append(Spacer(1, 10))

    if notas:
        s += section_hdr("Notas del Gerente de Plaza")
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
        raise ValueError(f"Tipo desconocido: {tipo!r}. Opciones: {list(GENERADORES)}")
    return fn(datos)
