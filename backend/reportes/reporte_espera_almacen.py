"""
Reporte WFM — Casos Detenidos por Almacén (ESPERA_ALMACEN)
Fuente: /api/wfm/almacen/detenidos + stock.picking Odoo (confirmed/waiting outgoing)
Envía PDF a Telegram @jmmc2026_bot
"""
import os, sys, json, datetime, requests, xmlrpc.client as xr
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame,
                                Paragraph, Spacer, Table, TableStyle, HRFlowable)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# ── Paleta XCIEN ──────────────────────────────────────────────────────────────
XCIEN_DARK   = colors.HexColor('#0D5C2E')
XCIEN_GREEN  = colors.HexColor('#00A859')
XCIEN_BRIGHT = colors.HexColor('#2DC84D')
XCIEN_LIGHT  = colors.HexColor('#F0FAF4')
NARANJA      = colors.HexColor('#F97316')
ROJO         = colors.HexColor('#EF4444')
AMARILLO     = colors.HexColor('#F59E0B')
GRIS         = colors.HexColor('#6B7280')
GRIS_CLARO   = colors.HexColor('#F3F4F6')
NAVY         = colors.HexColor('#1A2438')

HOY  = datetime.date.today().strftime('%d/%m/%Y')
NOW  = datetime.datetime.now().isoformat()
OUT  = f"/tmp/WFM_EsperaAlmacen_{datetime.date.today().isoformat()}.pdf"

# ── Datos fuente 1: portal XCIEN ─────────────────────────────────────────────
try:
    r = requests.get("http://localhost:8002/api/wfm/almacen/detenidos", timeout=10)
    portal_data = r.json() if r.ok else {"total": 0, "ordenes": []}
except Exception as e:
    print(f"⚠️ Portal no disponible: {e}")
    portal_data = {"total": 0, "ordenes": []}

portal_casos = portal_data.get("ordenes", [])

# ── Datos fuente 2: Odoo stock.picking ────────────────────────────────────────
odoo_url  = os.environ.get("ODOO_URL",      "https://odoo.wispi.mx")
odoo_db   = os.environ.get("ODOO_DB",       "wispi17")
odoo_user = os.environ.get("ODOO_USER",     "miguel.macias@xcien.com")
odoo_pass = os.environ.get("ODOO_PASSWORD", "Malpa501@")

odoo_picks = []
try:
    common = xr.ServerProxy(f"{odoo_url}/xmlrpc/2/common")
    uid    = common.authenticate(odoo_db, odoo_user, odoo_pass, {})
    mdls   = xr.ServerProxy(f"{odoo_url}/xmlrpc/2/object")

    hace_1yr = (datetime.date.today() - datetime.timedelta(days=365)).isoformat()
    raw = mdls.execute_kw(odoo_db, uid, odoo_pass, "stock.picking", "search_read",
        [[["state","in",["confirmed","waiting"]],
          ["picking_type_code","=","outgoing"],
          ["scheduled_date",">=", hace_1yr]]],
        {"fields":["id","name","state","picking_type_id","origin","partner_id","scheduled_date"],
         "limit": 300, "order": "scheduled_date asc"})

    # Agrupar por almacén
    por_almacen: dict = {}
    for p in raw:
        alm = p["picking_type_id"][1] if p["picking_type_id"] else "Sin almacén"
        alm_short = alm.split(":")[0].strip()
        por_almacen.setdefault(alm_short, []).append(p)

    odoo_picks = raw
    print(f"✅ Odoo: {len(raw)} albaranes detenidos en el último año")
except Exception as e:
    print(f"⚠️ Odoo no disponible: {e}")
    por_almacen = {}

# ── Helpers de estilo ─────────────────────────────────────────────────────────
def sty(name, **kw):
    return ParagraphStyle(name, **kw)

S = {
    'titulo':  sty('t',  fontName='Helvetica-Bold', fontSize=18, textColor=XCIEN_DARK, spaceAfter=4),
    'sub':     sty('s',  fontName='Helvetica',      fontSize=10, textColor=GRIS, spaceAfter=14),
    'h2':      sty('h2', fontName='Helvetica-Bold', fontSize=11, textColor=XCIEN_DARK,
                   spaceBefore=14, spaceAfter=6),
    'body':    sty('b',  fontName='Helvetica',      fontSize=9,  textColor=colors.black, leading=13),
    'cel':     sty('c',  fontName='Helvetica',      fontSize=8,  textColor=colors.black, leading=11),
    'celb':    sty('cb', fontName='Helvetica-Bold', fontSize=8,  textColor=XCIEN_DARK,   leading=11),
    'nota':    sty('n',  fontName='Helvetica-Oblique', fontSize=8, textColor=GRIS, leading=11),
    'hdr':     sty('hd', fontName='Helvetica-Bold', fontSize=8,  textColor=colors.white,
                   alignment=TA_CENTER),
}

# ── Cabecera / pie ────────────────────────────────────────────────────────────
W, H = letter

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(XCIEN_DARK)
    canvas.rect(0, H - 2.2*cm, W, 2.2*cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 14)
    canvas.drawString(1.5*cm, H - 1.4*cm, "XCIEN Networks")
    canvas.setFont("Helvetica", 9)
    canvas.drawString(1.5*cm, H - 1.85*cm, "WFM — Casos Detenidos por Almacén")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(W - 1.5*cm, H - 1.4*cm, HOY)
    canvas.drawRightString(W - 1.5*cm, H - 1.85*cm, f"Pág. {doc.page}")
    canvas.setStrokeColor(XCIEN_BRIGHT)
    canvas.setLineWidth(2)
    canvas.line(0, H - 2.2*cm, W, H - 2.2*cm)
    canvas.setFillColor(GRIS)
    canvas.setFont("Helvetica", 7)
    canvas.drawCentredString(W/2, 0.6*cm, "Documento interno XCIEN Networks — Confidencial")
    canvas.restoreState()

# ── Documento ─────────────────────────────────────────────────────────────────
doc = BaseDocTemplate(OUT, pagesize=letter,
                      leftMargin=1.5*cm, rightMargin=1.5*cm,
                      topMargin=3.0*cm, bottomMargin=1.5*cm)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='main')
doc.addPageTemplates([PageTemplate(id='main', frames=[frame], onPage=on_page)])

story = []
story.append(Spacer(1, 0.4*cm))
story.append(Paragraph("Casos Detenidos por Almacén", S['titulo']))
story.append(Paragraph(f"Reporte operativo · {HOY}", S['sub']))

# KPI
kpi = Table([
    ['Portal XCIEN', 'Odoo (albaranes sin stock)', 'Almacenes afectados'],
    [str(len(portal_casos)), str(len(odoo_picks)), str(len(por_almacen))],
], colWidths=[6*cm, 6*cm, 6*cm])
kpi.setStyle(TableStyle([
    ('BACKGROUND',  (0,0), (-1,0), XCIEN_DARK),
    ('TEXTCOLOR',   (0,0), (-1,0), colors.white),
    ('FONTNAME',    (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',    (0,0), (-1,0), 9),
    ('BACKGROUND',  (0,1), (0,1), colors.HexColor('#FFF7ED')),
    ('BACKGROUND',  (1,1), (1,1), colors.HexColor('#FEF2F2')),
    ('BACKGROUND',  (2,1), (2,1), colors.HexColor('#FFFBEB')),
    ('FONTNAME',    (0,1), (-1,1), 'Helvetica-Bold'),
    ('FONTSIZE',    (0,1), (-1,1), 22),
    ('TEXTCOLOR',   (0,1), (0,1), NARANJA),
    ('TEXTCOLOR',   (1,1), (1,1), ROJO),
    ('TEXTCOLOR',   (2,1), (2,1), AMARILLO),
    ('ALIGN',       (0,0), (-1,-1), 'CENTER'),
    ('VALIGN',      (0,0), (-1,-1), 'MIDDLE'),
    ('ROWHEIGHT',   (0,0), (0,0), 0.7*cm),
    ('ROWHEIGHT',   (0,1), (0,1), 1.3*cm),
    ('GRID',        (0,0), (-1,-1), 0.5, colors.white),
]))
story.append(kpi)
story.append(Spacer(1, 0.4*cm))
story.append(HRFlowable(width='100%', thickness=1, color=XCIEN_GREEN))

# ── Sección A: Casos portal XCIEN (ESPERA_ALMACEN) ────────────────────────────
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("⏸  Casos marcados ESPERA_ALMACEN en portal XCIEN", S['h2']))
story.append(Paragraph(
    "Órdenes que fueron marcadas manualmente por el jefe de almacén desde el portal.",
    S['nota']))
story.append(Spacer(1, 0.2*cm))

if portal_casos:
    hdr = [Paragraph(t, S['hdr']) for t in ['ID', 'Cliente', 'Servicio', 'Motivo', 'Responsable', 'Fecha']]
    rows = [hdr]
    for c in portal_casos:
        alm = c.get('almacen', {})
        fecha = (alm.get('fecha_respuesta') or c.get('fecha_creacion',''))[:10]
        rows.append([
            Paragraph(c.get('id','—'), S['cel']),
            Paragraph(c.get('cliente','—')[:30], S['cel']),
            Paragraph(c.get('servicio','—')[:35], S['cel']),
            Paragraph((alm.get('motivo') or '—')[:40], S['cel']),
            Paragraph((alm.get('respondido_por') or '—')[:20], S['cel']),
            Paragraph(fecha, S['cel']),
        ])
    t = Table(rows, colWidths=[2.2*cm, 3.8*cm, 3.8*cm, 4.0*cm, 2.5*cm, 1.7*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',     (0,0), (-1,0), NARANJA),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [GRIS_CLARO, colors.white]),
        ('GRID',           (0,0), (-1,-1), 0.3, colors.HexColor('#D1D5DB')),
        ('ALIGN',          (0,0), (-1,-1), 'LEFT'),
        ('VALIGN',         (0,0), (-1,-1), 'MIDDLE'),
        ('ROWHEIGHT',      (0,0), (-1,-1), 0.65*cm),
        ('LEFTPADDING',    (0,0), (-1,-1), 4),
    ]))
    story.append(t)
else:
    story.append(Paragraph(
        "Sin casos marcados como ESPERA_ALMACEN aún. "
        "Para registrar un caso: WFM → orden → botón 'Detener por Almacén'.",
        S['body']))

story.append(Spacer(1, 0.5*cm))
story.append(HRFlowable(width='100%', thickness=0.5, color=GRIS_CLARO))

# ── Sección B: Albaranes Odoo sin stock (por almacén) ─────────────────────────
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("📦  Albaranes de salida sin stock — Odoo (último año)", S['h2']))
story.append(Paragraph(
    "Órdenes de entrega en estado 'confirmed' o 'waiting' que no han podido salir por falta de inventario.",
    S['nota']))
story.append(Spacer(1, 0.2*cm))

if por_almacen:
    for alm_name, picks in sorted(por_almacen.items(), key=lambda x: -len(x[1])):
        story.append(Paragraph(f"<b>{alm_name}</b> — {len(picks)} albaranes", S['body']))
        hdr2 = [Paragraph(t, S['hdr']) for t in ['Albaran', 'Estado', 'Cliente', 'Origen (SO)', 'Fecha Prog.']]
        rows2 = [hdr2]
        for p in sorted(picks, key=lambda x: str(x.get('scheduled_date','')))[:30]:
            partner = p['partner_id'][1][:30] if p['partner_id'] else '—'
            fecha   = str(p.get('scheduled_date','—'))[:10]
            estado  = '⏳ Confirmado' if p['state'] == 'confirmed' else '🔄 Esperando'
            rows2.append([
                Paragraph(p['name'], S['cel']),
                Paragraph(estado, S['cel']),
                Paragraph(partner, S['cel']),
                Paragraph(str(p.get('origin','—'))[:20], S['cel']),
                Paragraph(fecha, S['cel']),
            ])
        t2 = Table(rows2, colWidths=[3.2*cm, 2.6*cm, 5.5*cm, 3.5*cm, 2.2*cm])
        t2.setStyle(TableStyle([
            ('BACKGROUND',     (0,0), (-1,0), NAVY),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [GRIS_CLARO, colors.white]),
            ('GRID',           (0,0), (-1,-1), 0.3, colors.HexColor('#D1D5DB')),
            ('ALIGN',          (0,0), (-1,-1), 'LEFT'),
            ('VALIGN',         (0,0), (-1,-1), 'MIDDLE'),
            ('ROWHEIGHT',      (0,0), (-1,-1), 0.6*cm),
            ('LEFTPADDING',    (0,0), (-1,-1), 4),
        ]))
        story.append(t2)
        if len(picks) > 30:
            story.append(Paragraph(f"  … y {len(picks)-30} más", S['nota']))
        story.append(Spacer(1, 0.3*cm))
else:
    story.append(Paragraph("Sin albaranes detenidos en el último año.", S['body']))

# ── Pie: proceso recomendado ──────────────────────────────────────────────────
story.append(HRFlowable(width='100%', thickness=1, color=XCIEN_GREEN))
story.append(Spacer(1, 0.3*cm))
rec = Table([[
    Paragraph("📋 Proceso XCIEN", sty('rt', fontName='Helvetica-Bold', fontSize=9, textColor=XCIEN_DARK)),
    Paragraph(
        "1. Jefe de almacén abre la orden en el portal WFM.<br/>"
        "2. Presiona <b>Detener por Almacén</b> e ingresa motivo.<br/>"
        "3. La orden entra en etapa <b>ESPERA_ALMACEN</b> (naranja).<br/>"
        "4. Al llegar el equipo, presiona <b>Liberar</b> → vuelve a Validación.<br/>"
        "5. Este reporte se genera diariamente y se envía a Telegram.",
        sty('rb', fontName='Helvetica', fontSize=8, textColor=colors.black, leading=12)),
]], colWidths=[3.5*cm, 14.5*cm])
rec.setStyle(TableStyle([
    ('BACKGROUND',   (0,0), (-1,-1), XCIEN_LIGHT),
    ('VALIGN',       (0,0), (-1,-1), 'TOP'),
    ('LEFTPADDING',  (0,0), (-1,-1), 8),
    ('TOPPADDING',   (0,0), (-1,-1), 8),
    ('BOTTOMPADDING',(0,0), (-1,-1), 8),
]))
story.append(rec)

doc.build(story)
print(f"✅ PDF: {OUT}  ({os.path.getsize(OUT):,} bytes)")

# ── Enviar a Telegram ─────────────────────────────────────────────────────────
TOKEN   = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHAT_ID = "6609271992"

if not TOKEN:
    env_file = os.path.join(Path(__file__).parent.parent, ".env")
    for line in open(env_file):
        if line.startswith("TELEGRAM_BOT_TOKEN="):
            TOKEN = line.strip().split("=",1)[1]
            break

caption = (
    f"⏸ *WFM — Casos Detenidos por Almacén*\n"
    f"📦 Portal XCIEN: {len(portal_casos)} casos\n"
    f"🗂 Odoo albaranes sin stock: {len(odoo_picks)}\n"
    f"🏭 Almacenes afectados: {len(por_almacen)}\n"
    f"📅 {HOY}"
)

resp = requests.post(
    f"https://api.telegram.org/bot{TOKEN}/sendDocument",
    files={"document": (f"WFM_EsperaAlmacen_{datetime.date.today().isoformat()}.pdf", open(OUT,'rb'))},
    data={"chat_id": CHAT_ID, "caption": caption, "parse_mode": "Markdown"},
    timeout=30,
)
result = resp.json()
if result.get("ok"):
    print("✅ Enviado a Telegram")
else:
    print(f"❌ Telegram error: {result}")
