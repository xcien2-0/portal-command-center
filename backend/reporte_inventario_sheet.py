#!/usr/bin/env python3
"""Reporte de Inventario — Google Sheet CDMX / Querétaro / Guadalajara · B&W + color"""
import os, sys, json, re, datetime

# ── Leer datos del archivo ya descargado ──────────────────────────────────────
SHEET_FILE = os.path.expanduser(
    "~/.claude/projects/-Users-mesquite/"
    "fef4f1e4-0b3f-45a1-96c3-99daa861d17c/tool-results/"
    "mcp-claude_ai_Google_Drive-read_file_content-1779245620037.txt"
)
with open(SHEET_FILE) as f:
    raw = json.load(f)
lines = raw["fileContent"].split("\n")

OUTPUT = os.path.join(os.path.dirname(__file__), "..", "reporte_inventario_sheet_2026.pdf")
NOW    = datetime.datetime.now()
DATE   = NOW.strftime("%d de %B de %Y")

# ── Parseo ────────────────────────────────────────────────────────────────────
def parse_val(s):
    s = s.strip().replace("$","").replace(",","")
    try: return float(s)
    except: return 0.0

section_starts = [i for i,l in enumerate(lines) if "Producto | Cantidad en inventario" in l]
summary_starts = [i for i,l in enumerate(lines) if "Comentarios | Producto | Cantidad" in l]

# resumen de cabecera
ALMACENES_META = {
    "CDMX":        {"val": 1_299_982.00, "idx": 0},
    "QUERÉTARO":   {"val":   773_084.52, "idx": 1},
    "GUADALAJARA": {"val":   697_809.59, "idx": 2},
}
ALMACEN_NAMES = list(ALMACENES_META.keys())

def parse_section(start_line, end_line):
    productos = {}
    for line in lines[start_line+1:end_line]:
        if not line.startswith("| \\["):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 7: continue
        producto   = parts[1]
        try: qty   = float(parts[2].replace(",",""))
        except: qty = 0
        lote       = parts[4].strip()
        valor      = parse_val(parts[5])
        comentario = parts[6].strip() if len(parts) > 6 else ""
        sku_m = re.search(r"\\\[(.+?)\\\]", producto)
        sku   = sku_m.group(1) if sku_m else producto[:35]
        nombre = re.sub(r"\\\[.*?\\\]\s*","",producto).strip()[:65]
        if sku not in productos:
            productos[sku] = {"nombre": nombre, "qty": 0, "valor": 0,
                              "comentario": comentario, "series": []}
        productos[sku]["qty"]   += qty
        productos[sku]["valor"] += valor
        if lote: productos[sku]["series"].append(lote)
    return productos

secciones = {}
for i, name in enumerate(ALMACEN_NAMES):
    s = section_starts[i]
    e = summary_starts[i]
    secciones[name] = parse_section(s, e)

# ── ReportLab ─────────────────────────────────────────────────────────────────
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, PageBreak, KeepTogether,
                                 CondPageBreak)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY

BLACK  = colors.HexColor("#0D0D0D")
NAVY   = colors.HexColor("#1A3A5C")
BLUE   = colors.HexColor("#1976D2")
BLUE_L = colors.HexColor("#BBDEFB")
GREEN  = colors.HexColor("#2E7D32")
GREEN_L= colors.HexColor("#C8E6C9")
ORANGE = colors.HexColor("#E65100")
ORANGE_L=colors.HexColor("#FFE0B2")
MID    = colors.HexColor("#555555")
LIGHT  = colors.HexColor("#888888")
RULE   = colors.HexColor("#CCCCCC")
OFFWHT = colors.HexColor("#F0F4F8")
WHITE  = colors.white

CITY_COLORS = {
    "CDMX":        (NAVY,   BLUE_L),
    "QUERÉTARO":   (GREEN,  GREEN_L),
    "GUADALAJARA": (ORANGE, ORANGE_L),
}

PW = 7.8 * inch

def S(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#1A1A1A"), leading=14)
    base.update(kw)
    return ParagraphStyle(name, **base)

def P(text, style):
    return Paragraph(text, style)

def sp(h=6):
    return Spacer(1, h)

def rule_line(color=NAVY, thick=1.5):
    return HRFlowable(width="100%", thickness=thick, color=color, spaceAfter=0, spaceBefore=0)

def thin():
    return HRFlowable(width="100%", thickness=0.3, color=RULE, spaceAfter=0, spaceBefore=0)

STYLES = {
    "cover_t": S("ct", fontSize=30, fontName="Helvetica-Bold",
                 textColor=BLACK, leading=34),
    "cover_s": S("cs", fontSize=12, textColor=MID, leading=16),
    "cover_m": S("cm", fontSize=8,  textColor=LIGHT),
    "sec_num": S("sn", fontSize=8,  fontName="Helvetica-Bold", textColor=LIGHT),
    "sec_ttl": S("st", fontSize=15, fontName="Helvetica-Bold", textColor=BLACK, leading=19, spaceBefore=3),
    "sub":     S("sb", fontSize=9.5,fontName="Helvetica-Bold", textColor=BLACK, spaceBefore=10, spaceAfter=4),
    "body":    S("bo", fontSize=8.5,textColor=colors.HexColor("#1A1A1A"), leading=14,
                 alignment=TA_JUSTIFY, spaceAfter=4),
    "body_sm": S("bs", fontSize=8,  textColor=MID, leading=12),
    "th":      S("th", fontSize=7.5,fontName="Helvetica-Bold", textColor=WHITE),
    "th_r":    S("thr",fontSize=7.5,fontName="Helvetica-Bold", textColor=WHITE, alignment=TA_RIGHT),
    "td":      S("td", fontSize=8,  textColor=BLACK, leading=11),
    "td_r":    S("tdr",fontSize=8,  textColor=BLACK, leading=11, alignment=TA_RIGHT),
    "td_m":    S("tdm",fontSize=8,  textColor=MID, leading=11),
    "tag":     S("tg", fontSize=7,  fontName="Helvetica-Bold", textColor=WHITE, alignment=TA_CENTER),
    "tag_o":   S("to", fontSize=7,  fontName="Helvetica-Bold", textColor=BLACK, alignment=TA_CENTER),
    "kpi_n":   S("kn", fontSize=26, fontName="Helvetica-Bold", textColor=BLACK,
                 alignment=TA_CENTER, leading=28),
    "kpi_l":   S("kl", fontSize=7.5,textColor=LIGHT, alignment=TA_CENTER, leading=10),
    "footer":  S("ft", fontSize=7,  textColor=LIGHT),
}

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 6.5)
    canvas.setFillColor(LIGHT)
    canvas.drawString(0.6*inch, 0.42*inch,
        f"Inventario Físico XCIEN / Sandur / Luminet · CDMX · Querétaro · Guadalajara · {DATE}")
    canvas.drawRightString(8.0*inch, 0.42*inch, f"Pág. {doc.page}")
    canvas.setStrokeColor(RULE); canvas.setLineWidth(0.3)
    canvas.line(0.6*inch, 0.52*inch, 8.0*inch, 0.52*inch)
    canvas.restoreState()

def dark_table(headers, rows, widths, right_cols=None, header_color=NAVY):
    right_cols = right_cols or []
    hrow = [P(h, STYLES["th_r"] if i in right_cols else STYLES["th"]) for i,h in enumerate(headers)]
    body = []
    for ri, row in enumerate(rows):
        trow = []
        for ci, cell in enumerate(row):
            s = STYLES["td_r"] if ci in right_cols else STYLES["td"]
            trow.append(P(str(cell), s))
        body.append(trow)
    t = Table([hrow]+body, colWidths=widths, repeatRows=1)
    ts = TableStyle([
        ("BACKGROUND",    (0,0),(-1,0),  header_color),
        ("TOPPADDING",    (0,0),(-1,-1), 5),
        ("BOTTOMPADDING", (0,0),(-1,-1), 5),
        ("LEFTPADDING",   (0,0),(-1,-1), 7),
        ("RIGHTPADDING",  (0,0),(-1,-1), 7),
        ("LINEBELOW",     (0,0),(-1,0),  1,   header_color),
        ("LINEBELOW",     (0,1),(-1,-1), 0.3, RULE),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
    ])
    for i in range(len(rows)):
        bg = WHITE if i%2==0 else OFFWHT
        ts.add("BACKGROUND",(0,i+1),(-1,i+1),bg)
    t.setStyle(ts)
    return t

def callout(text, label="NOTA", accent=NAVY):
    inner = [
        P(label, S(f"cl{label[:3]}", fontSize=6.5, fontName="Helvetica-Bold",
                   textColor=accent, spaceAfter=2)),
        P(text, S("ci", fontSize=8.5, fontName="Helvetica-Bold",
                  textColor=BLACK, leading=13, alignment=TA_JUSTIFY)),
    ]
    t = Table([[inner]], colWidths=[PW])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), OFFWHT),
        ("LEFTPADDING",   (0,0),(-1,-1), 14),
        ("RIGHTPADDING",  (0,0),(-1,-1), 14),
        ("TOPPADDING",    (0,0),(-1,-1), 9),
        ("BOTTOMPADDING", (0,0),(-1,-1), 9),
        ("LINEBEFORE",    (0,0),(0,-1),  4, accent),
    ]))
    return t

def city_badge(name, valor, total_global, accent, accent_l):
    pct = valor / total_global * 100
    t = Table([[
        P(name, S(f"cn{name[:3]}", fontSize=11, fontName="Helvetica-Bold",
                  textColor=WHITE, alignment=TA_CENTER)),
        [P(f"${valor:,.0f}", S(f"cv{name[:3]}", fontSize=15, fontName="Helvetica-Bold",
                               textColor=BLACK, leading=17)),
         P(f"MXN · {pct:.1f}% del total",
           S(f"cp{name[:3]}", fontSize=7.5, textColor=MID))]
    ]], colWidths=[1.3*inch, PW-1.3*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(0,-1),  accent),
        ("BACKGROUND",    (1,0),(1,-1),  accent_l),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(-1,-1), 8),
        ("BOTTOMPADDING", (0,0),(-1,-1), 8),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
    ]))
    return t

def section_header(num, title):
    return KeepTogether([
        sp(16),
        P(f"{num:02d}", STYLES["sec_num"]),
        P(title, STYLES["sec_ttl"]),
        rule_line(),
        sp(8),
    ])

# ══════════════════════════════════════════════════════════════════════════════
def make_report():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=letter,
        leftMargin=0.6*inch, rightMargin=0.6*inch,
        topMargin=0.65*inch, bottomMargin=0.75*inch,
        title="Inventario Físico XCIEN 2026 — CDMX / Querétaro / Guadalajara",
    )
    story = []

    total_global = sum(m["val"] for m in ALMACENES_META.values())

    # ── PORTADA ───────────────────────────────────────────────────────────────
    story += [
        sp(0.7*inch),
        rule_line(BLACK, 2.5), sp(6),
        P("INVENTARIO FÍSICO<br/>REGIONAL 2026", STYLES["cover_t"]),
        sp(8),
        P("CDMX · Querétaro · Guadalajara · Fuente: Google Sheets (05/mayo/2026)", STYLES["cover_s"]),
        sp(24), thin(), sp(8),
    ]
    meta = Table([[
        P("Fecha corte",  STYLES["cover_m"]), P("05 de mayo de 2026",       STYLES["body"]),
        P("Fuente",       STYLES["cover_m"]), P("Google Sheets compartido", STYLES["body"]),
        P("Empresas",     STYLES["cover_m"]), P("XCIEN / Sandur / Luminet", STYLES["body"]),
    ]], colWidths=[0.9*inch,1.8*inch,0.6*inch,1.7*inch,0.7*inch,2.1*inch])
    meta.setStyle(TableStyle([
        ("TOPPADDING",(0,0),(-1,-1),2),("BOTTOMPADDING",(0,0),(-1,-1),2),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),6),
    ]))
    story += [meta, sp(6), thin(), PageBreak()]

    # ── 01 · RESUMEN EJECUTIVO ────────────────────────────────────────────────
    story.append(section_header(1, "Resumen Ejecutivo"))

    # KPI total
    kpi_t = Table([[
        P(f"${total_global:,.0f}", S("kt", fontSize=32, fontName="Helvetica-Bold",
                                     textColor=BLACK, alignment=TA_CENTER)),
        [P("MXN", S("ku", fontSize=14, textColor=MID)),
         P("Valor total inventario físico · 3 almacenes",
           S("kd", fontSize=8, textColor=LIGHT))]
    ]], colWidths=[3.2*inch, PW-3.2*inch])
    kpi_t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),OFFWHT),
        ("LINEBEFORE",(0,0),(0,-1), 5, NAVY),
        ("TOPPADDING",(0,0),(-1,-1),12),("BOTTOMPADDING",(0,0),(-1,-1),12),
        ("LEFTPADDING",(0,0),(-1,-1),18),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ]))
    story += [kpi_t, sp(14)]

    # Badges por ciudad
    for name, meta_d in ALMACENES_META.items():
        ac, acl = CITY_COLORS[name]
        story.append(city_badge(name, meta_d["val"], total_global, ac, acl))
        story.append(sp(4))

    story += [sp(10), callout(
        f"El inventario total verificado asciende a <b>${total_global:,.2f} MXN</b> distribuido en "
        "tres almacenes regionales. CDMX concentra el mayor valor (46.9%), seguido de Querétaro "
        "(27.9%) y Guadalajara (25.2%). Los datos provienen del inventario físico levantado el "
        "5 de mayo de 2026 en la hoja de cálculo compartida — fuente independiente de Odoo.",
        label="HALLAZGO PRINCIPAL", accent=NAVY
    ), sp(6)]

    # ── 02–04 · DETALLE POR ALMACÉN ──────────────────────────────────────────
    for sec_idx, (name, meta_d) in enumerate(ALMACENES_META.items(), start=2):
        prods  = secciones[name]
        ac, acl = CITY_COLORS[name]
        total_v = sum(p["valor"] for p in prods.values())
        total_q = sum(p["qty"]   for p in prods.values())
        alto    = {k:v for k,v in prods.items() if v["comentario"]=="Alto Mov"}
        lento   = {k:v for k,v in prods.items() if v["comentario"]=="Lento Mov"}
        alto_v  = sum(p["valor"] for p in alto.values())
        lento_v = sum(p["valor"] for p in lento.values())
        alto_q  = sum(p["qty"]   for p in alto.values())
        lento_q = sum(p["qty"]   for p in lento.values())
        con_serie = sum(1 for p in prods.values() if p["series"])
        sin_serie = len(prods) - con_serie

        story.append(section_header(sec_idx, f"Almacén {name}"))
        story.append(city_badge(name, total_v, total_global, ac, acl))
        story.append(sp(10))

        # KPIs del almacén
        kpis = [
            (f"{len(prods)}", "SKUs únicos"),
            (f"{total_q:,.0f}", "Unidades"),
            (f"{len(alto)}", "SKUs Alto Mov"),
            (f"{len(lento)}", "SKUs Lento Mov"),
        ]
        krow1 = [P(v, STYLES["kpi_n"]) for v,_ in kpis]
        krow2 = [P(l, STYLES["kpi_l"]) for _,l in kpis]
        kt = Table([krow1, krow2], colWidths=[PW/4]*4)
        kt.setStyle(TableStyle([
            ("ALIGN",(0,0),(-1,-1),"CENTER"),
            ("LINEAFTER",(0,0),(2,-1),0.3,RULE),
            ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
        ]))
        story += [kt, sp(10)]

        # Tabla alto vs lento
        story.append(dark_table(
            ["Clasificación", "SKUs", "Unidades", "Valor", "% del almacén"],
            [
                ("Alto Mov",  str(len(alto)),  f"{alto_q:,.0f}",
                 f"${alto_v:,.2f}", f"{alto_v/total_v*100:.1f}%"),
                ("Lento Mov", str(len(lento)), f"{lento_q:,.0f}",
                 f"${lento_v:,.2f}", f"{lento_v/total_v*100:.1f}%"),
                ("TOTAL",     str(len(prods)), f"{total_q:,.0f}",
                 f"${total_v:,.2f}", "100%"),
            ],
            [1.4*inch, 0.65*inch, 0.85*inch, 1.5*inch, 1.3*inch],
            right_cols=[1,2,3,4], header_color=ac
        ))
        story += [sp(6)]

        # Trazabilidad
        story.append(callout(
            f"<b>Trazabilidad:</b> {con_serie} de {len(prods)} SKUs tienen número de serie registrado "
            f"({con_serie/len(prods)*100:.0f}%). {sin_serie} SKUs sin número de serie — "
            "estos no pueden auditarse pieza por pieza sin un conteo físico adicional.",
            label="TRAZABILIDAD", accent=ac
        ))
        story.append(sp(10))

        # Top 15 por valor
        story.append(CondPageBreak(4.5*inch))
        story.append(P(f"Top 15 productos por valor — {name}", STYLES["sub"]))
        top15 = sorted(prods.items(), key=lambda x: -x[1]["valor"])[:15]
        rows15 = []
        for sku, p in top15:
            mov_bg = "Alto Mov" if p["comentario"]=="Alto Mov" else "Lento Mov"
            rows15.append((
                f"[{sku[:28]}]",
                p["nombre"][:45],
                f"{p['qty']:,.0f}",
                f"${p['valor']:,.2f}",
                mov_bg,
            ))
        story.append(dark_table(
            ["SKU", "Descripción", "Qty", "Valor MXN", "Movimiento"],
            rows15,
            [1.35*inch, 2.6*inch, 0.55*inch, 1.25*inch, 0.9*inch],
            right_cols=[2,3], header_color=ac
        ))
        story += [sp(6)]

        # Top 10 Lento Mov (capital inmovilizado)
        if lento:
            story.append(CondPageBreak(4*inch))
            story.append(P(f"Lento Movimiento — capital inmovilizado (top 10)", STYLES["sub"]))
            top_lento = sorted(lento.items(), key=lambda x: -x[1]["valor"])[:10]
            rows_l = []
            for sku, p in top_lento:
                rows_l.append((
                    f"[{sku[:28]}]",
                    p["nombre"][:50],
                    f"{p['qty']:,.0f}",
                    f"${p['valor']:,.2f}",
                ))
            story.append(dark_table(
                ["SKU", "Descripción", "Qty", "Valor MXN"],
                rows_l,
                [1.35*inch, 3.15*inch, 0.55*inch, 1.35*inch],
                right_cols=[2,3], header_color=ORANGE
            ))
            story.append(sp(6))

        story.append(PageBreak())

    # ── 05 · ANÁLISIS COMPARATIVO ─────────────────────────────────────────────
    story.append(section_header(5, "Análisis Comparativo"))

    comp_rows = []
    for name, meta_d in ALMACENES_META.items():
        prods  = secciones[name]
        alto   = {k:v for k,v in prods.items() if v["comentario"]=="Alto Mov"}
        lento  = {k:v for k,v in prods.items() if v["comentario"]=="Lento Mov"}
        total_v = sum(p["valor"] for p in prods.values())
        lento_v = sum(p["valor"] for p in lento.values())
        comp_rows.append((
            name,
            str(len(prods)),
            f"{sum(p['qty'] for p in prods.values()):,.0f}",
            f"${total_v:,.2f}",
            f"{total_v/total_global*100:.1f}%",
            f"${lento_v:,.2f}",
            f"{lento_v/total_v*100:.1f}%",
        ))
    story.append(dark_table(
        ["Almacén","SKUs","Uds","Valor total","% nacional","Val. Lento Mov","% inmovilizado"],
        comp_rows,
        [1.05*inch,0.5*inch,0.65*inch,1.3*inch,0.8*inch,1.25*inch,0.9*inch],
        right_cols=[1,2,3,4,5,6], header_color=NAVY
    ))
    story += [sp(8)]

    # Hallazgos cruzados
    hallazgos = [
        ("Guadalajara NO está en Odoo",
         "El almacén de Guadalajara tiene $697,810 MXN en inventario físico documentado en "
         "este sheet. Sin embargo, sus almacenes en Odoo (SGdIn, SGdCo, LGdIn, LGdCo) "
         "no tienen ubicaciones internas configuradas ni stock.quant registrado. "
         "El inventario existe físicamente pero no está capturado en el sistema."),
        ("Capital inmovilizado: $765,395 MXN en Lento Mov",
         "Sumando las tres plazas, el inventario clasificado como Lento Movimiento "
         "representa capital que no está rotando. Los productos de mayor valor son "
         "antenas sectoriales y radios de generaciones anteriores."),
        ("Trazabilidad parcial",
         "Muchos productos tipo consumible (herrajes, fusibles, organizadores) no tienen "
         "número de serie o lote registrado. Esto impide auditorías pieza a pieza "
         "y dificulta la conciliación con Odoo."),
        ("Datos al 05/mayo/2026 — posible desactualización",
         "Este sheet representa un corte de inventario de hace 14 días. "
         "Los movimientos ocurridos desde entonces no están reflejados. "
         "Se recomienda actualización mensual o conexión directa con Odoo."),
    ]
    for titulo, desc in hallazgos:
        num_style = ParagraphStyle("hn", fontSize=9, fontName="Helvetica-Bold",
                                   textColor=WHITE, alignment=TA_CENTER)
        row = Table([[
            P(titulo, S("ht", fontSize=8.5, fontName="Helvetica-Bold",
                        textColor=BLACK, spaceAfter=3)),
            P(desc, STYLES["body"]),
        ]], colWidths=[2.0*inch, PW-2.0*inch])
        row.setStyle(TableStyle([
            ("VALIGN",(0,0),(-1,-1),"TOP"),
            ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6),
            ("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),
            ("LINEBELOW",(0,0),(-1,-1),0.3,RULE),
            ("BACKGROUND",(0,0),(0,-1),OFFWHT),
        ]))
        story += [row, sp(2)]

    # Footer
    story += [sp(20), thin(), sp(4),
        P(f"Reporte generado por Antigravity Portal · {DATE} · "
          "Fuente: Google Sheets inventario físico (compartido) · Confidencial — uso interno",
          STYLES["footer"])]

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"✅  PDF generado: {os.path.abspath(OUTPUT)}")

if __name__ == "__main__":
    make_report()
