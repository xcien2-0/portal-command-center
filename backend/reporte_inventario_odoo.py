#!/usr/bin/env python3
"""Reporte de Inventario Odoo — Presentación a Dirección · B&W Minimalista"""
import os, sys, datetime
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                  TableStyle, HRFlowable, PageBreak, KeepTogether)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY

# ── Paleta B&W ────────────────────────────────────────────────────────────────
BLACK   = colors.HexColor('#0D0D0D')
INK     = colors.HexColor('#1A1A1A')
DARK    = colors.HexColor('#2D2D2D')
MID     = colors.HexColor('#555555')
LIGHT   = colors.HexColor('#888888')
RULE    = colors.HexColor('#CCCCCC')
OFFWHT  = colors.HexColor('#F7F7F7')
WHITE   = colors.white

OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'reporte_inventario_odoo_2026.pdf')
NOW    = datetime.datetime.now()
DATE   = NOW.strftime('%d de %B de %Y')

# ── Estilos ───────────────────────────────────────────────────────────────────
def S(name, **kw):
    base = dict(fontName='Helvetica', fontSize=9, textColor=INK,
                leading=14, spaceAfter=0, spaceBefore=0)
    base.update(kw)
    return ParagraphStyle(name, **base)

STYLES = {
    'cover_title':  S('ct',  fontSize=32, fontName='Helvetica-Bold', textColor=BLACK,
                       leading=36, alignment=TA_LEFT),
    'cover_sub':    S('cs',  fontSize=13, textColor=MID, leading=18, alignment=TA_LEFT),
    'cover_meta':   S('cm',  fontSize=9,  textColor=LIGHT, leading=12, alignment=TA_LEFT),
    'section_num':  S('sn',  fontSize=9,  fontName='Helvetica-Bold', textColor=LIGHT,
                       alignment=TA_LEFT),
    'section_ttl':  S('st',  fontSize=16, fontName='Helvetica-Bold', textColor=BLACK,
                       leading=20, spaceBefore=4),
    'subsection':   S('ss',  fontSize=10, fontName='Helvetica-Bold', textColor=BLACK,
                       spaceBefore=12, spaceAfter=4),
    'body':         S('b',   fontSize=9,  textColor=INK, leading=15, spaceAfter=4,
                       alignment=TA_JUSTIFY),
    'body_sm':      S('bs',  fontSize=8,  textColor=MID, leading=12, spaceAfter=3),
    'bullet':       S('bu',  fontSize=9,  textColor=INK, leading=14, leftIndent=12,
                       spaceAfter=4),
    'caption':      S('cap', fontSize=7.5, textColor=LIGHT, alignment=TA_LEFT,
                       spaceAfter=6, spaceBefore=3),
    'th':           S('th',  fontSize=7.5, fontName='Helvetica-Bold', textColor=WHITE,
                       alignment=TA_LEFT),
    'th_r':         S('thr', fontSize=7.5, fontName='Helvetica-Bold', textColor=WHITE,
                       alignment=TA_RIGHT),
    'td':           S('td',  fontSize=8,  textColor=INK, leading=11),
    'td_r':         S('tdr', fontSize=8,  textColor=INK, leading=11, alignment=TA_RIGHT),
    'td_m':         S('tdm', fontSize=8,  textColor=MID, leading=11),
    'kpi_n':        S('kn',  fontSize=30, fontName='Helvetica-Bold', textColor=BLACK,
                       alignment=TA_CENTER, leading=32),
    'kpi_l':        S('kl',  fontSize=7.5, textColor=LIGHT, alignment=TA_CENTER, leading=10),
    'kpi_ns':       S('kns', fontSize=22, fontName='Helvetica-Bold', textColor=BLACK,
                       alignment=TA_CENTER, leading=24),
    'tag_crit':     S('tc',  fontSize=7,  fontName='Helvetica-Bold', textColor=WHITE,
                       alignment=TA_CENTER),
    'tag_warn':     S('tw',  fontSize=7,  fontName='Helvetica-Bold', textColor=BLACK,
                       alignment=TA_CENTER),
    'footer':       S('ft',  fontSize=7,  textColor=LIGHT, alignment=TA_LEFT),
    'footer_r':     S('ftr', fontSize=7,  textColor=LIGHT, alignment=TA_RIGHT),
    'phase':        S('ph',  fontSize=9,  fontName='Helvetica-Bold', textColor=BLACK,
                       spaceBefore=8, spaceAfter=3),
    'callout':      S('co',  fontSize=9,  textColor=BLACK, fontName='Helvetica-Bold',
                       leading=14, alignment=TA_JUSTIFY),
}

PW = 7.8 * inch   # printable width

# ── Helpers ───────────────────────────────────────────────────────────────────
def rule(thickness=0.5, color=BLACK):
    return HRFlowable(width='100%', thickness=thickness, color=color, spaceAfter=0, spaceBefore=0)

def thin_rule():
    return HRFlowable(width='100%', thickness=0.3, color=RULE, spaceAfter=0, spaceBefore=0)

def sp(h=6):
    return Spacer(1, h)

def P(text, style='body'):
    return Paragraph(text, STYLES[style])

def section_header(num, title):
    return KeepTogether([
        sp(18),
        P(f'{num:02d}', 'section_num'),
        P(title, 'section_ttl'),
        rule(1.5),
        sp(8),
    ])

def dark_table(headers, rows, widths, right_cols=None):
    """Clean table, dark header, alternating rows."""
    right_cols = right_cols or []
    hrow = []
    for i, h in enumerate(headers):
        sty = 'th_r' if i in right_cols else 'th'
        hrow.append(P(h, sty))

    body = []
    for ri, row in enumerate(rows):
        trow = []
        for ci, cell in enumerate(row):
            if ci in right_cols:
                sty = 'td_r'
            elif ci == len(row) - 1 and isinstance(cell, str) and any(
                    w in cell for w in ['Sin dato','—','Básico','Normal','Bajo']):
                sty = 'td_m'
            else:
                sty = 'td'
            trow.append(P(str(cell), sty))
        body.append(trow)

    t = Table([hrow] + body, colWidths=widths, repeatRows=1)
    ts = TableStyle([
        ('BACKGROUND',   (0,0), (-1,0),  BLACK),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ('LINEBELOW',    (0,0), (-1,0),  1,   BLACK),
        ('LINEBELOW',    (0,1), (-1,-1), 0.3, RULE),
        ('VALIGN',       (0,0), (-1,-1), 'TOP'),
    ])
    for i in range(len(rows)):
        bg = WHITE if i % 2 == 0 else OFFWHT
        ts.add('BACKGROUND', (0, i+1), (-1, i+1), bg)
    t.setStyle(ts)
    return t

def callout_box(text, label=None):
    inner = []
    if label:
        inner.append(P(f'<b>{label}</b>', 'body_sm'))
    inner.append(P(text, 'callout'))
    t = Table([[inner]], colWidths=[PW])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), OFFWHT),
        ('LEFTPADDING',   (0,0), (-1,-1), 14),
        ('RIGHTPADDING',  (0,0), (-1,-1), 14),
        ('TOPPADDING',    (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LINEBEFORE',    (0,0), (0,-1),  3, BLACK),
    ]))
    return t

def tag(text, filled=True):
    bg  = BLACK if filled else OFFWHT
    col = WHITE if filled else BLACK
    t = Table([[Paragraph(text, ParagraphStyle('tg', fontSize=7,
                fontName='Helvetica-Bold', textColor=col, alignment=TA_CENTER))]],
              colWidths=[0.75*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), bg),
        ('TOPPADDING',    (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('BOX',           (0,0), (-1,-1), 0.5, BLACK),
    ]))
    return t

def on_page(canvas, doc):
    """Footer on every page."""
    canvas.saveState()
    canvas.setFont('Helvetica', 6.5)
    canvas.setFillColor(LIGHT)
    canvas.drawString(0.6*inch, 0.45*inch, f'XCIEN / Sandur / Luminet · Análisis de Inventario Odoo · {DATE}')
    canvas.drawRightString(8.0*inch, 0.45*inch, f'Página {doc.page}')
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.3)
    canvas.line(0.6*inch, 0.55*inch, 8.0*inch, 0.55*inch)
    canvas.restoreState()

# ── Documento ─────────────────────────────────────────────────────────────────
def make_report():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=letter,
        leftMargin=0.6*inch, rightMargin=0.6*inch,
        topMargin=0.65*inch, bottomMargin=0.75*inch,
        title='Análisis de Inventario Odoo — XCIEN 2026',
        author='Antigravity Portal',
    )
    story = []

    # ══════════════════════════════════════════════════════════════════════════
    # PORTADA
    # ══════════════════════════════════════════════════════════════════════════
    story += [
        sp(0.8*inch),
        rule(2),
        sp(4),
        P('ANÁLISIS DE<br/>INVENTARIO', 'cover_title'),
        sp(8),
        P('Diagnóstico operativo, calidad de datos<br/>y plan de mejora · Odoo wispi17', 'cover_sub'),
        sp(24),
        thin_rule(),
        sp(8),
    ]
    meta = Table([
        [P('Empresas', 'body_sm'),    P('XCIEN / Sandur / Luminet', 'td'),
         P('Fecha', 'body_sm'),       P(DATE, 'td'),
         P('Clasificación', 'body_sm'), P('Uso interno — Dirección', 'td')],
        [P('Fuente', 'body_sm'),      P('Odoo wispi17 (producción)', 'td'),
         P('Elaboró', 'body_sm'),     P('Antigravity Portal', 'td'),
         P('Versión', 'body_sm'),     P('1.0', 'td')],
    ], colWidths=[0.75*inch, 1.65*inch, 0.55*inch, 1.4*inch, 0.85*inch, 1.6*inch])
    meta.setStyle(TableStyle([
        ('TOPPADDING',    (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 8),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ]))
    story += [meta, sp(8), thin_rule(), PageBreak()]

    # ══════════════════════════════════════════════════════════════════════════
    # 1 · KPIs EJECUTIVOS
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header(1, 'Indicadores Clave'))

    kpis = [
        ('6,245',  'Productos en catálogo'),
        ('1,697',  'Con stock en almacén'),
        ('1,663',  'Sin stock (almacenables)'),
        ('$23.7M', 'Valor inventario MXN'),
        ('352',    'Ubicaciones activas'),
        ('70,461', 'Unidades totales'),
    ]
    krow1 = [P(v, 'kpi_n') for v,_ in kpis[:3]]
    krow2 = [P(l, 'kpi_l') for _,l in kpis[:3]]
    krow3 = [P(v, 'kpi_ns') for v,_ in kpis[3:]]
    krow4 = [P(l, 'kpi_l') for _,l in kpis[3:]]

    kw = [PW/3]*3
    kt = Table([krow1, krow2, [sp(8)]*3, krow3, krow4], colWidths=kw)
    kt.setStyle(TableStyle([
        ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('LINEAFTER',     (0,0), (1,-1),  0.3, RULE),
        ('TOPPADDING',    (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW',     (0,1), (-1,1),  0.3, RULE),
    ]))
    story += [kt, sp(12)]

    story.append(callout_box(
        'Solo el 27.2% del catálogo tiene stock físico en almacenes internos. '
        'El valor total verificado es <b>$23,741,798 MXN (~$1.28M USD)</b>, '
        'calculado directamente de stock.quant en ubicaciones internas con cantidad positiva — '
        'excluye equipo instalado en campo y ubicaciones virtuales.',
        label='HALLAZGO PRINCIPAL'
    ))
    story.append(sp(6))

    # ══════════════════════════════════════════════════════════════════════════
    # 2 · VALORIZACIÓN DEL INVENTARIO
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header(2, 'Valorización del Inventario'))

    story.append(P(
        'La valorización se calculó consultando directamente la tabla <b>stock.quant</b> '
        'de Odoo, filtrando únicamente ubicaciones de uso <b>interno</b> (almacenes físicos) '
        'con cantidad positiva. Se excluyen ubicaciones de clientes, proveedores, tránsito '
        'y locaciones virtuales. El precio unitario corresponde al <b>costo estándar</b> '
        '(standard_price) de cada producto en Odoo.', 'body'))
    story.append(sp(8))

    story.append(callout_box(
        'Valor total del inventario en almacenes: <b>$23,741,798 MXN</b>  '
        '(aprox. <b>$1,283,340 USD</b> al tipo de cambio de $18.50). '
        'Base: 7,672 registros de stock.quant · 1,697 productos · 70,461 unidades.',
        label='VALORIZACIÓN VERIFICADA'
    ))
    story.append(sp(10))

    story.append(P('Distribución por categoría principal', 'subsection'))
    story.append(dark_table(
        ['Categoría', 'Valor MXN', '% del total', 'Observación'],
        [
            ('Equipo de Comunicación AF',  '$11,534,573', '48.6 %', 'Radios, antenas y backhaul — activo principal'),
            ('Equipo CV (XCIEN)',           '$8,215,052',  '34.6 %', 'CPEs, mikrotiks, switches de campo'),
            ('Consumibles CV',             '$2,988,253',  '12.6 %', 'Conectores, cables, herrajes, fibra'),
            ('Equipo de Cómputo AF',       '$288,211',    '1.2 %',  'Servidores, switches core'),
            ('De Oficina y otros',         '$715,709',    '3.0 %',  'Mobiliario, limpieza, consumibles'),
        ],
        [2.5*inch, 1.1*inch, 0.85*inch, 3.35*inch], right_cols=[1,2]
    ))
    story.append(sp(10))

    story.append(P('Top 15 productos por valor de inventario', 'subsection'))
    story.append(dark_table(
        ['SKU / Producto', 'Qty', 'Precio unit.', 'Valor total'],
        [
            ('[IN-C5x] Radio Mimosa C5x 5GHz MIMO 2x2 100Mbps',     '444',  '$2,055',    '$912,247'),
            ('[IN-C5C] Radio Mimosa C5C 500+ Mbps 4.9-6.4 GHz',     '272',  '$3,306',    '$899,256'),
            ('[35-0128-001] Tarana RN CPE Cliente 5.8 GHz',          '63',   '$11,070',   '$697,433'),
            ('[IN-AF-5G30-S45] Antena AirFiber 5GHz 30dBi',         '182',  '$2,524',    '$459,363'),
            ('[35-0134-001.1.15] Tarana 5.8 GHz Base Node FCC',      '2',    '$225,000',  '$450,000'),
            ('[IN-CCR2216] MikroTik CCR2216 CPU 16-core',            '7',    '$59,234',   '$414,635'),
            ('[IN-PBE-5AC-GEN2] Ubiquiti PowerBeam airMAX AC',       '173',  '$2,310',    '$399,583'),
            ('[OC-ADSS-72C] Fibra Óptica ADSS 72 hilos 4km',        '6',    '$64,692',   '$388,152'),
            ('[IN-N5-X25] Antenas Modulares Dual Slant 25dBi',       '155',  '$2,221',    '$344,260'),
            ('[IN-RBD52G] MikroTik RB2011 RouterBoard',              '200',  '$1,445',    '$289,046'),
            ('[IN-A5C] Inversor Exeltech XP1100',                    '22',   '$12,986',   '$285,697'),
            ('[IN-C050940A121D] Cambium ePMP 4500 5GHz 8x8',        '8',    '$34,888',   '$279,103'),
            ('[IN-C060940C121C] Cambium ePMP FORCE4600C',           '33',   '$8,353',    '$275,652'),
            ('[IN-CCR2116-12G] MikroTik CCR2116 16-core',            '15',   '$17,693',   '$265,396'),
            ('[RAX721-C] RAD 1U 19" Ethernet Switch',                '2',    '$127,024',  '$254,048'),
        ],
        [3.4*inch, 0.55*inch, 1.0*inch, 1.0*inch], right_cols=[1,2,3]
    ))
    story.append(sp(8))

    story.append(P('Concentración de valor', 'subsection'))
    story.append(dark_table(
        ['Rango de valor por producto', 'Productos', '% productos', 'Valor acumulado', '% del total'],
        [
            ('> $100,000 MXN',    '50',  '2.9 %',  '$12,214,695', '51.4 %'),
            ('$50,000 – $100,000','46',  '2.7 %',  '$3,064,880',  '12.9 %'),
            ('$10,000 – $50,000', '265', '15.6 %', '$5,775,762',  '24.3 %'),
            ('$1,000 – $10,000',  '652', '38.4 %', '$2,460,092',  '10.4 %'),
            ('< $1,000',          '621', '36.6 %', '$226,369',    '1.0 %'),
            ('Sin precio',        '63',  '3.7 %',  '$0',          '—'),
        ],
        [2.1*inch, 0.85*inch, 0.85*inch, 1.3*inch, 0.9*inch], right_cols=[1,2,3,4]
    ))
    story += [
        sp(8),
        P('▸  El <b>5.6% de los SKUs (96 productos)</b> concentra el <b>64.3% del valor total</b>. '
          'Una política de clasificación ABC activará control estricto en este núcleo crítico.', 'bullet'),
        P('▸  <b>63 productos con precio unitario = $0</b> no aportan a la valorización. '
          'Requieren actualización de costo estándar en Odoo para completar el cuadro.', 'bullet'),
        sp(16),
    ]

    # ══════════════════════════════════════════════════════════════════════════
    # 3 · DISTRIBUCIÓN DEL CATÁLOGO
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header(3, 'Composición del Catálogo'))

    story.append(P('El catálogo de <b>product.template</b> (4,678 registros base) se distribuye:', 'body'))
    story.append(sp(6))
    story.append(dark_table(
        ['Tipo', 'Registros', '% catálogo', 'Implicación operativa'],
        [
            ('Almacenable', '3,877', '82.9 %', 'Requiere control físico de stock y ubicación'),
            ('Servicio',    '707',   '15.1 %', 'Sin movimiento físico — mezclado con equipo'),
            ('Consumible',  '94',    '2.0 %',  'Se consume al usar; sin inventario perpetuo'),
        ],
        [1.3*inch, 0.85*inch, 0.85*inch, 3.8*inch], right_cols=[1,2]
    ))
    story += [
        sp(8),
        P('▸  Los <b>707 servicios</b> registrados junto al equipo físico distorsionan los '
          'reportes de stock y dificultan el análisis operativo. Se recomienda '
          'separarlos en un catálogo independiente.', 'bullet'),
        sp(16),
    ]

    story.append(P('Top 8 categorías por volumen de productos', 'subsection'))
    story.append(dark_table(
        ['Categoría', 'Productos', 'Sin stock', '% sin stock'],
        [
            ('CV / Equipo / EquipoCV',                      '1,317', '568', '43 %'),
            ('CV / Consumibles / Consumibles CV',            '1,019', '406', '40 %'),
            ('AF / Eq. de Comunicación / Comunicación AF',   '727',   '255', '35 %'),
            ('G* / Gastos Instalaciones / Herramienta G',    '252',   '145', '58 %'),
            ('G* / Papelería / Consumibles para oficina G',  '120',   '13',  '11 %'),
            ('AF / Eq. de Cómputo / Equipo de cómputo AF',  '104',   '44',  '42 %'),
            ('G* / Mant. Vehículos / Flotilla Vehicular G',  '100',   '8',   '8 %'),
            ('CV / Servicios Offnet',                        '94',    '—',   '—'),
        ],
        [3.1*inch, 0.85*inch, 0.85*inch, 0.9*inch], right_cols=[1,2,3]
    ))
    story.append(sp(6))

    # ══════════════════════════════════════════════════════════════════════════
    # 4 · DIAGNÓSTICO — POR QUÉ HAY TANTO SIN STOCK
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header(4, 'Diagnóstico: Causas del Stock en Cero'))

    story.append(P(
        'Los <b>1,663 productos almacenables con qty = 0</b> no representan necesariamente '
        'pérdida económica, pero sí un riesgo operativo y de calidad de datos. '
        'Se identificaron cinco causas raíz:', 'body'))
    story.append(sp(10))

    causas = [
        ('01', 'Catálogo histórico sin depurar',
         'Equipos instalados en sitios de clientes o dados de baja que no fueron '
         'removidos del catálogo activo. En telecomunicaciones el equipo "desaparece" '
         'del almacén al instalarse sin un proceso formal de baja contable.  '
         'Categorías más afectadas: EquipoCV (568 productos) y Comunicación AF (255).'),
        ('02', 'Compras por proyecto sin reposición',
         'El material se adquiere para cada proyecto y se agota. Sin puntos de reorden '
         'configurados, el catálogo queda con registros de productos históricos en cero. '
         'El stock máximo actual es de 137 piezas (Mikrotik RB2011).'),
        ('03', '1,007 productos sin código interno (SKU)',
         '21.5% del catálogo carece de identificador único. Sin SKU no es posible '
         'hacer conteos físicos confiables, escaneo de código de barras ni rastrear '
         'recepciones. Esto genera duplicados: se detectaron múltiples registros '
         '"Marca MSA Modelo 10077571 (copia)" con distintos IDs.'),
        ('04', 'Sin niveles mínimos de seguridad',
         'Ningún producto tiene configurado qty_min ni reorder_point en Odoo. '
         'Las compras son 100% reactivas. No hay señal automática que anticipe '
         'una ruptura de stock antes de que ocurra.'),
        ('05', 'Stock disperso en 352 ubicaciones',
         'Un mismo SKU puede aparecer con qty = 0 en una ubicación pero tener '
         'existencias en otra ciudad. La vista consolidada está disponible pero '
         'no se utiliza sistemáticamente. 15 ciudades, 3 empresas, nomenclatura '
         'de ubicaciones no estandarizada.'),
    ]

    for num, titulo, desc in causas:
        num_style = ParagraphStyle('cn_'+num, fontSize=11, fontName='Helvetica-Bold',
                                   textColor=WHITE, alignment=TA_CENTER)
        row = Table([[
            Table([[Paragraph(num, num_style)]],
                  colWidths=[0.35*inch],
                  style=TableStyle([
                      ('BACKGROUND',    (0,0), (-1,-1), BLACK),
                      ('TOPPADDING',    (0,0), (-1,-1), 6),
                      ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                  ])),
            [P(f'<b>{titulo}</b>', 'subsection'), P(desc, 'body')]
        ]], colWidths=[0.45*inch, PW - 0.45*inch])
        row.setStyle(TableStyle([
            ('VALIGN',        (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING',    (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('LEFTPADDING',   (0,0), (-1,-1), 0),
            ('RIGHTPADDING',  (0,0), (0,-1),  8),
            ('LINEBELOW',     (0,0), (-1,-1), 0.3, RULE),
        ]))
        story += [row, sp(2)]

    story.append(sp(10))

    # ══════════════════════════════════════════════════════════════════════════
    # 5 · MOVIMIENTOS 2026
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header(5, 'Actividad de Almacén 2026'))

    story.append(P(
        '<b>2,384 movimientos completados</b> entre enero y mayo de 2026 '
        '(~17 movimientos/día). La distribución revela una concentración atípica:', 'body'))
    story.append(sp(6))
    story.append(dark_table(
        ['Tipo de movimiento', 'Qty', '% total', 'Observación'],
        [
            ('Sandur MTY — Transferencias internas',     '1,723', '72.3 %', 'Concentración atípica — posible fragmentación'),
            ('Sandur Independencia — Recibidos',         '214',   '9.0 %',  'Normal'),
            ('Piedras Negras — Transferencias internas', '161',   '6.8 %',  'Normal'),
            ('Sandur Independencia Costo — Recepciones', '42',    '1.8 %',  'Bajo'),
            ('Luminet Wan Independencia — Recibidos',    '32',    '1.3 %',  'Bajo'),
            ('Sandur CDMX Inversión — Recepciones',      '23',    '1.0 %',  'Bajo'),
            ('Otros 28 tipos de movimiento',             '189',   '7.9 %',  '—'),
        ],
        [2.8*inch, 0.6*inch, 0.75*inch, 2.65*inch], right_cols=[1,2]
    ))
    story += [
        sp(8),
        callout_box(
            'El 72% de los movimientos son transferencias internas de Monterrey. '
            'Esto indica un proceso de picking fragmentado o movimientos de ajuste/corrección '
            'recurrentes. Cada transferencia interna innecesaria consume tiempo de almacenista '
            'y genera registros que dificultan la auditoría.',
            label='SEÑAL DE ALERTA'
        ),
        sp(6),
    ]

    # ══════════════════════════════════════════════════════════════════════════
    # 5 · CALIDAD DE DATOS
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header(6, 'Calidad de Datos'))

    hallazgos = [
        ('CRÍTICO', '1,007 productos sin SKU/código interno',
         '21.5% del catálogo no tiene identificador único. Imposible hacer conteos '
         'físicos confiables, escaneo de barras ni trazabilidad.', True),
        ('CRÍTICO', 'Duplicados en catálogo',
         'Múltiples entradas "Marca MSA Modelo 10077571 (copia)" con distintos IDs. '
         'Indica creación de duplicados en lugar de edición de registros existentes.', True),
        ('ALTO', '707 servicios mezclados con productos físicos',
         'Distorsiona reportes de rotación, cobertura de stock y valorización '
         'del inventario.', False),
        ('ALTO', '80 productos sin categoría ("All")',
         'Sin clasificación no es posible aplicar políticas de reorden ni '
         'asignar responsables por familia de producto.', False),
        ('MEDIO', 'Nomenclatura de ubicaciones no estandarizada',
         '352 ubicaciones con prefijos heterogéneos (SC*, LC*, LI*, HS, WININ, '
         'xcien/Proc...). Dificulta reportes consolidados multi-almacén.', False),
        ('MEDIO', 'Sin puntos de reorden configurados',
         'Cero productos con qty_min o reorder_point. Las compras son 100% reactivas.', False),
    ]

    h_rows = []
    for sev, titulo, desc, filled in hallazgos:
        bg  = BLACK if filled else OFFWHT
        col = WHITE if filled else BLACK
        h_rows.append([
            Table([[Paragraph(sev, ParagraphStyle('sv', fontSize=6.5,
                    fontName='Helvetica-Bold', textColor=col, alignment=TA_CENTER))]],
                  colWidths=[0.72*inch],
                  style=TableStyle([
                      ('BACKGROUND',    (0,0), (-1,-1), bg),
                      ('BOX',           (0,0), (-1,-1), 0.5, BLACK),
                      ('TOPPADDING',    (0,0), (-1,-1), 3),
                      ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                  ])),
            [P(f'<b>{titulo}</b>', 'subsection'), P(desc, 'body')],
        ])

    ht = Table(h_rows, colWidths=[0.82*inch, PW - 0.82*inch])
    ht.setStyle(TableStyle([
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (0,-1),  8),
        ('LINEBELOW',     (0,0), (-1,-1), 0.3, RULE),
    ]))
    story += [ht, sp(6)]

    # ══════════════════════════════════════════════════════════════════════════
    # 6 · ESTRUCTURA DE ALMACENES
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header(7, 'Red de Almacenes'))

    story.append(P(
        'El inventario está distribuido en <b>352 ubicaciones internas activas</b>, '
        '15 ciudades y 3 empresas. La granularidad es heterogénea: Independencia MTY '
        'tiene racks y gabinetes numerados; otras ciudades tienen una sola ubicación genérica.', 'body'))
    story.append(sp(8))
    story.append(dark_table(
        ['Almacén / Ciudad', 'Ubic.', 'Granularidad', 'Estado'],
        [
            ('Independencia MTY (Sandur + Luminet)', '~100', 'Racks, tarimas, gabinetes numerados', 'Adecuado'),
            ('Monterrey nodos (SC* / LC*)',          '~74',  'Nodos numerados 005–980',             'Fragmentado'),
            ('Piedras Negras',                       '~20',  'Básico',                              'Sin detalle'),
            ('Saltillo',                             '~15',  'Básico',                              'Sin detalle'),
            ('CDMX',                                 '~12',  'Inversión/Costo separados',           'Sin ubicaciones físicas'),
            ('Querétaro / Reynosa / Torreón',        '~18',  'Básico por ciudad',                   'Sin detalle'),
            ('Hardware Store (HS)',                  '7',    'Existencias / En revisión / Por revisar', 'Flujo correcto'),
            ('Otras (Wispi, SENEL, xcien/Proc…)',    '~106', 'Sin estandarizar',                    'Requiere revisión'),
        ],
        [2.4*inch, 0.5*inch, 2.1*inch, 1.3*inch]
    ))
    story.append(sp(6))

    # ══════════════════════════════════════════════════════════════════════════
    # 7 · PLAN DE MEJORA
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header(8, 'Plan de Mejora'))

    story.append(P(
        'Se propone un plan en tres fases con acciones concretas, responsables sugeridos '
        'y criterios de éxito medibles:', 'body'))
    story.append(sp(10))

    fases = [
        ('FASE 1 · Inmediata', '0 – 30 días', [
            ('Auditoría de catálogo sin stock',
             'Clasificar los 1,663 productos en: (a) instalado en campo, (b) dado de baja, '
             '(c) reposición pendiente, (d) error. Archivar o eliminar histórico muerto. '
             'Meta: reducir sin-stock a menos de 800 productos.'),
            ('Asignar SKUs faltantes',
             'Crear códigos para los 1,007 productos sin código interno. '
             'Nomenclatura sugerida: [EMPRESA]-[CAT]-[CONSECUTIVO]  ej: SC-NET-0001.'),
            ('Eliminar duplicados',
             'Auditar y fusionar todos los registros "(copia)". '
             'Estimar ~50–100 duplicados en el catálogo.'),
        ]),
        ('FASE 2 · Corto plazo', '30 – 90 días', [
            ('Puntos de reorden para top 50 SKUs',
             'Configurar stock_min y qty_multiple en Odoo para los 50 productos '
             'de mayor movimiento. Disparar órdenes de compra automáticas.'),
            ('Separar servicios del inventario físico',
             'Mover los 707 servicios a tipo "service" sin tracking de stock. '
             'El catálogo físico bajará de 6,245 a ~5,400 registros relevantes.'),
            ('Estandarizar nomenclatura de almacenes',
             'Convención: [EMPRESA]-[CIUDAD]-[ZONA]-[POSICIÓN]  '
             'ej: SC-MTY-RACK-A01. Migrar los 352 nombres actuales.'),
        ]),
        ('FASE 3 · Mediano plazo', '90 – 180 días', [
            ('Inventario físico cíclico',
             'Conteo por zona cada semana. Prioridad: EquipoCV y Consumibles CV. '
             'Usar módulo de ajustes de Odoo para corregir discrepancias.'),
            ('Activar scanner QR en campo',
             'El módulo de scanner ya existe en el portal Antigravity. '
             'Conectar recepciones y despachos con lectura de QR en lugar de captura manual.'),
            ('Dashboard KPIs de almacén',
             'Métricas semanales: rotación de inventario, fill rate, '
             'días de inventario, costo de capital inmovilizado.'),
        ]),
    ]

    for fase_titulo, fase_plazo, items in fases:
        header_row = Table([[
            Paragraph(fase_titulo, ParagraphStyle(f'fht_{fase_titulo[:4]}', fontSize=9,
                       fontName='Helvetica-Bold', textColor=WHITE)),
            Paragraph(fase_plazo,  ParagraphStyle(f'fhp_{fase_titulo[:4]}', fontSize=8,
                       textColor=LIGHT, alignment=TA_RIGHT)),
        ]], colWidths=[4*inch, PW - 4*inch])
        header_row.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,-1), BLACK),
            ('TOPPADDING',    (0,0), (-1,-1), 7),
            ('BOTTOMPADDING', (0,0), (-1,-1), 7),
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
            ('RIGHTPADDING',  (0,0), (-1,-1), 10),
            ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(header_row)

        for i, (accion, desc) in enumerate(items):
            bg = WHITE if i % 2 == 0 else OFFWHT
            action_row = Table([[
                Paragraph(f'{i+1}', ParagraphStyle(f'ai_{i}', fontSize=8, fontName='Helvetica-Bold',
                              textColor=MID, alignment=TA_CENTER)),
                [Paragraph(f'<b>{accion}</b>',
                   ParagraphStyle(f'at_{i}', fontSize=8.5, fontName='Helvetica-Bold',
                                  textColor=BLACK, spaceAfter=2)),
                 P(desc, 'body_sm')],
            ]], colWidths=[0.35*inch, PW - 0.35*inch])
            action_row.setStyle(TableStyle([
                ('BACKGROUND',    (0,0), (-1,-1), bg),
                ('TOPPADDING',    (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING',   (0,0), (-1,-1), 10),
                ('RIGHTPADDING',  (0,0), (-1,-1), 10),
                ('VALIGN',        (0,0), (-1,-1), 'TOP'),
                ('LINEBELOW',     (0,0), (-1,-1), 0.3, RULE),
            ]))
            story.append(action_row)
        story.append(sp(12))

    # ══════════════════════════════════════════════════════════════════════════
    # 8 · REORGANIZACIÓN DEL ALMACÉN
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header(9, 'Modelo de Almacén Propuesto'))

    story.append(P(
        'Se propone una estructura de <b>4 zonas funcionales</b> replicable en cada '
        'ciudad, independientemente del tamaño del almacén:', 'body'))
    story.append(sp(8))

    zonas = [
        ('A', 'Alta rotación',
         'Mikrotik, Mimosa, conectores RJ45, cables de uso frecuente.',
         'Frente del almacén, acceso inmediato. Mínimo: 30 días de consumo. Reorden automático.'),
        ('B', 'Media rotación',
         'Antenas, switches, fuentes de poder, herrajes.',
         'Estantería media. Mínimo: 15 días de consumo. Revisión quincenal.'),
        ('C', 'Baja rotación / Proyectos',
         'Equipo especializado, repuestos, activos fijos.',
         'Fondo del almacén, tarimas numeradas. Sin reorden automático.'),
        ('D', 'Cuarentena y baja',
         'Equipo dañado, en revisión, dado de baja.',
         'Área separada con etiqueta visible. Proceso: diagnóstico → reparar / reciclar / dar de baja.'),
    ]

    z_rows = []
    for letra, nombre, desc1, desc2 in zonas:
        z_rows.append([
            Table([[Paragraph(letra, ParagraphStyle(f'zl_{letra}', fontSize=16, fontName='Helvetica-Bold',
                       textColor=WHITE, alignment=TA_CENTER))]],
                  colWidths=[0.5*inch],
                  style=TableStyle([
                      ('BACKGROUND',    (0,0), (-1,-1), BLACK),
                      ('TOPPADDING',    (0,0), (-1,-1), 10),
                      ('BOTTOMPADDING', (0,0), (-1,-1), 10),
                  ])),
            [Paragraph(f'<b>Zona {letra} — {nombre}</b>',
               ParagraphStyle(f'zt_{letra}', fontSize=9, fontName='Helvetica-Bold',
                              textColor=BLACK, spaceAfter=3)),
             P(desc1, 'body_sm'),
             P(desc2, 'body_sm')],
        ])

    zt = Table(z_rows, colWidths=[0.6*inch, PW - 0.6*inch])
    zt.setStyle(TableStyle([
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING',    (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (0,-1),  10),
        ('LINEBELOW',     (0,0), (-1,-1), 0.3, RULE),
    ]))
    story += [zt, sp(6)]

    # ══════════════════════════════════════════════════════════════════════════
    # 9 · CONCLUSIONES
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header(10, 'Conclusiones para Dirección'))

    conclusiones = [
        ('El inventario tiene <b>alta cantidad de registros pero baja calidad de datos</b>. '
         'El primer paso obligatorio es una auditoría de catálogo antes de cualquier '
         'inversión en procesos o tecnología.'),
        ('El <b>modelo operativo actual "comprar por proyecto"</b> es funcional para proyectos '
         'esporádicos pero genera riesgo cuando hay demanda urgente en campo sin stock disponible.'),
        ('La <b>concentración del 72% de movimientos en transferencias internas</b> de MTY '
         'es la señal más clara de ineficiencia en el proceso de despacho interno.'),
        ('Con <b>352 ubicaciones en 15 ciudades</b> la infraestructura de control regional '
         'es suficiente. El problema no es falta de estructura sino falta de estandarización '
         'y disciplina de registro.'),
        ('La <b>mayor ganancia a corto plazo</b> es activar el scanner QR ya disponible '
         'en el portal Antigravity — elimina errores de captura manual sin inversión adicional.'),
        ('Con las tres fases del plan de mejora, el objetivo es llegar a <b>menos del 10% '
         'de productos sin stock</b> no justificado y a <b>100% de SKUs con código interno</b> '
         'en un horizonte de 6 meses.'),
    ]

    for i, text in enumerate(conclusiones):
        c_row = Table([[
            Paragraph(str(i+1), ParagraphStyle(f'ci_{i}', fontSize=9, fontName='Helvetica-Bold',
                         textColor=WHITE, alignment=TA_CENTER)),
            P(text, 'body'),
        ]], colWidths=[0.3*inch, PW - 0.3*inch])
        c_row.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (0,-1),  BLACK),
            ('VALIGN',        (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING',    (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING',   (0,0), (-1,-1), 0),
            ('RIGHTPADDING',  (0,0), (0,-1),  0),
            ('LEFTPADDING',   (1,0), (1,-1),  10),
            ('LINEBELOW',     (0,0), (-1,-1), 0.3, RULE),
        ]))
        story += [c_row, sp(2)]

    story.append(sp(20))
    story.append(rule(0.5))
    story.append(sp(4))
    story.append(P(
        f'Reporte generado por Antigravity Portal · XCIEN 2026 · {DATE} · '
        'Fuente: Odoo wispi17 (producción) · Confidencial — solo para uso interno',
        'footer'))

    # Build
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f'✅ PDF generado: {os.path.abspath(OUTPUT)}')

if __name__ == '__main__':
    make_report()
