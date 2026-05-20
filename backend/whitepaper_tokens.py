"""
whitepaper_tokens.py
====================
White Paper: Sistema de Tokenización de Operaciones — XCIEN / Mesquite
Genera PDF profesional con ReportLab.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import Flowable
from datetime import datetime

# ─── Paleta ───────────────────────────────────────────────────────────────────

NAVY    = colors.HexColor('#0D1B2A')
BLUE    = colors.HexColor('#1565C0')
BLUE2   = colors.HexColor('#1976D2')
TEAL    = colors.HexColor('#00796B')
ORANGE  = colors.HexColor('#E65100')
GREEN   = colors.HexColor('#2E7D32')
PURPLE  = colors.HexColor('#6A1B9A')
GRAY    = colors.HexColor('#546E7A')
LGRAY   = colors.HexColor('#ECEFF1')
WHITE   = colors.white
BLACK   = colors.HexColor('#0D1B2A')
ACCENT  = colors.HexColor('#1565C0')

WH_COLORS = {
    'CDMX': colors.HexColor('#1976D2'),
    'QRO':  colors.HexColor('#2E7D32'),
    'GDL':  colors.HexColor('#E65100'),
    'MTY':  colors.HexColor('#6A1B9A'),
}

OUTPUT = '/Users/mesquite/Antigravity/whitepaper_tokens_xcien_2026.pdf'
_today_raw = datetime.now().strftime('%d de %B de %Y')
_months = {'January':'enero','February':'febrero','March':'marzo','April':'abril',
           'May':'mayo','June':'junio','July':'julio','August':'agosto',
           'September':'septiembre','October':'octubre','November':'noviembre','December':'diciembre'}
TODAY = _today_raw
for en, es in _months.items():
    TODAY = TODAY.replace(en, es)

# ─── Estilos ──────────────────────────────────────────────────────────────────

def make_styles():
    s = {}

    s['cover_title'] = ParagraphStyle('cover_title',
        fontName='Helvetica-Bold', fontSize=28, textColor=WHITE,
        leading=34, spaceAfter=12, alignment=TA_LEFT)

    s['cover_sub'] = ParagraphStyle('cover_sub',
        fontName='Helvetica', fontSize=14, textColor=colors.HexColor('#90CAF9'),
        leading=20, spaceAfter=6, alignment=TA_LEFT)

    s['cover_meta'] = ParagraphStyle('cover_meta',
        fontName='Helvetica', fontSize=10, textColor=colors.HexColor('#B0BEC5'),
        leading=14, alignment=TA_LEFT)

    s['h1'] = ParagraphStyle('h1',
        fontName='Helvetica-Bold', fontSize=16, textColor=NAVY,
        spaceBefore=18, spaceAfter=8, leading=20,
        borderPadding=(0,0,4,0))

    s['h2'] = ParagraphStyle('h2',
        fontName='Helvetica-Bold', fontSize=13, textColor=BLUE,
        spaceBefore=14, spaceAfter=6, leading=17)

    s['h3'] = ParagraphStyle('h3',
        fontName='Helvetica-Bold', fontSize=11, textColor=GRAY,
        spaceBefore=10, spaceAfter=4, leading=15)

    s['body'] = ParagraphStyle('body',
        fontName='Helvetica', fontSize=10, textColor=BLACK,
        leading=15, spaceAfter=6, alignment=TA_JUSTIFY)

    s['body_left'] = ParagraphStyle('body_left',
        fontName='Helvetica', fontSize=10, textColor=BLACK,
        leading=15, spaceAfter=4, alignment=TA_LEFT)

    s['bullet'] = ParagraphStyle('bullet',
        fontName='Helvetica', fontSize=10, textColor=BLACK,
        leading=14, spaceAfter=3, leftIndent=16, bulletIndent=0)

    s['mono'] = ParagraphStyle('mono',
        fontName='Courier', fontSize=9, textColor=colors.HexColor('#1A237E'),
        leading=13, spaceAfter=3, leftIndent=20,
        backColor=colors.HexColor('#F5F5F5'))

    s['caption'] = ParagraphStyle('caption',
        fontName='Helvetica-Oblique', fontSize=8, textColor=GRAY,
        leading=11, spaceAfter=4, alignment=TA_CENTER)

    s['callout'] = ParagraphStyle('callout',
        fontName='Helvetica-Bold', fontSize=10, textColor=BLUE,
        leading=14, spaceAfter=0, leftIndent=8)

    s['small'] = ParagraphStyle('small',
        fontName='Helvetica', fontSize=8, textColor=GRAY,
        leading=11, spaceAfter=2)

    s['toc_entry'] = ParagraphStyle('toc_entry',
        fontName='Helvetica', fontSize=10, textColor=BLACK,
        leading=16, leftIndent=12)

    s['toc_num'] = ParagraphStyle('toc_num',
        fontName='Helvetica-Bold', fontSize=10, textColor=BLUE,
        leading=16)

    return s

# ─── Componentes ──────────────────────────────────────────────────────────────

class ColorBar(Flowable):
    def __init__(self, color, width, height=3):
        super().__init__()
        self.color = color
        self.width = width
        self.bar_height = height
        self._width = width
        self._height = height

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, self.width, self.bar_height, stroke=0, fill=1)

    def wrap(self, *args):
        return self._width, self._height


def callout_box(text, color=BLUE, bg=None, s=None):
    bg = bg or colors.HexColor('#E3F2FD')
    items = [
        Spacer(1, 4),
        Paragraph(text, s['callout']),
        Spacer(1, 4),
    ]
    t = Table([[items]], colWidths=[6.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('LINEBEFORE',  (0,0), (0,-1), 3, color),
        ('TOPPADDING',  (0,0), (-1,-1), 6),
        ('BOTTOMPADDING',(0,0),(-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING',(0,0), (-1,-1), 10),
    ]))
    return t


def section_header(num, title, s):
    bar = ColorBar(BLUE, 7.5*inch, 2)
    heading = Paragraph(f'<font color="#1565C0">{num}.</font>  {title}', s['h1'])
    return [bar, Spacer(1,4), heading]


def two_col_table(rows, col_w=(2.2*inch, 4.8*inch), header=None, s=None):
    data = []
    if header:
        data.append(header)
    data.extend(rows)

    style = [
        ('FONTNAME',  (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE',  (0,0), (-1,-1), 9),
        ('LEADING',   (0,0), (-1,-1), 13),
        ('VALIGN',    (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING',   (0,0), (-1,-1), 6),
        ('BOTTOMPADDING',(0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS',(0,0),(-1,-1), [WHITE, LGRAY]),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#CFD8DC')),
    ]
    if header:
        style += [
            ('BACKGROUND', (0,0), (-1,0), NAVY),
            ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
            ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE',   (0,0), (-1,0), 9),
        ]

    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle(style))
    return t


# ─── Cover Page ───────────────────────────────────────────────────────────────

def build_cover(s):
    elements = []

    # Fondo navy simulado con tabla de ancho completo
    cover_bg = Table(
        [[Paragraph('', s['body'])]],
        colWidths=[7.5*inch],
        rowHeights=[3.2*inch]
    )
    cover_bg.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), NAVY),
        ('LEFTPADDING',  (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING',   (0,0), (-1,-1), 0),
        ('BOTTOMPADDING',(0,0), (-1,-1), 0),
    ]))

    title_block = Table([[
        Table([
            [Paragraph('WHITE PAPER', s['cover_meta'])],
            [Spacer(1,6)],
            [Paragraph('Sistema de Tokenización de\nOperaciones XCIEN', s['cover_title'])],
            [Paragraph('Trazabilidad, Auditoría e Integración Odoo-Ready\npara Transferencias de Inventario y Movimientos Operativos', s['cover_sub'])],
            [Spacer(1,12)],
            [Paragraph(f'Versión 1.0  ·  {TODAY}  ·  Confidencial', s['cover_meta'])],
            [Paragraph('Mesquite / Next Ventures  ·  XCIEN', s['cover_meta'])],
        ], colWidths=[6.8*inch])
    ]], colWidths=[7.5*inch], rowHeights=[3.2*inch])

    title_block.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), NAVY),
        ('LEFTPADDING',  (0,0), (-1,-1), 40),
        ('RIGHTPADDING', (0,0), (-1,-1), 20),
        ('TOPPADDING',   (0,0), (-1,-1), 36),
        ('BOTTOMPADDING',(0,0), (-1,-1), 20),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))

    elements.append(title_block)
    elements.append(Spacer(1, 10))

    # Banda de color
    band_data = [[
        Paragraph('CDMX', ParagraphStyle('wh', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
        Paragraph('QRO', ParagraphStyle('wh', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
        Paragraph('GDL', ParagraphStyle('wh', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
        Paragraph('MTY', ParagraphStyle('wh', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
        Paragraph('ODOO READY', ParagraphStyle('wh', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
    ]]
    band = Table(band_data, colWidths=[1.5*inch]*5)
    band.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), WH_COLORS['CDMX']),
        ('BACKGROUND', (1,0), (1,-1), WH_COLORS['QRO']),
        ('BACKGROUND', (2,0), (2,-1), WH_COLORS['GDL']),
        ('BACKGROUND', (3,0), (3,-1), WH_COLORS['MTY']),
        ('BACKGROUND', (4,0), (4,-1), TEAL),
        ('TOPPADDING',   (0,0), (-1,-1), 7),
        ('BOTTOMPADDING',(0,0), (-1,-1), 7),
    ]))
    elements.append(band)
    elements.append(Spacer(1, 20))

    return elements


# ─── Tabla de contenido ───────────────────────────────────────────────────────

def build_toc(s):
    elements = []
    elements += section_header('', 'Tabla de Contenido', s)
    elements.append(Spacer(1, 8))

    sections = [
        ('1', 'Resumen Ejecutivo', '3'),
        ('2', 'El Problema: Inventario sin Trazabilidad', '4'),
        ('3', 'Qué es un Token de Operación XCIEN', '5'),
        ('4', 'Arquitectura Técnica', '6'),
        ('5', 'Ciclo de Vida del Token', '7'),
        ('6', 'Dominios de Tokenización 2026', '8'),
        ('7', 'Integración con Odoo (stock.quant)', '9'),
        ('8', 'Seguridad y Auditoría', '10'),
        ('9', 'Roadmap de Implementación', '11'),
        ('10', 'Conclusiones', '12'),
    ]

    toc_data = []
    for num, title, page in sections:
        dots = '.' * (60 - len(title))
        toc_data.append([
            Paragraph(f'<font color="#1565C0"><b>{num}.</b></font>', s['toc_num']),
            Paragraph(title, s['toc_entry']),
            Paragraph(page, ParagraphStyle('pg', fontName='Helvetica', fontSize=10, textColor=GRAY, alignment=TA_RIGHT)),
        ])

    t = Table(toc_data, colWidths=[0.4*inch, 6.1*inch, 0.8*inch])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LINEBELOW', (0,0), (-1,-2), 0.3, colors.HexColor('#CFD8DC')),
    ]))
    elements.append(t)
    elements.append(PageBreak())
    return elements


# ─── Secciones ────────────────────────────────────────────────────────────────

def sec_resumen(s):
    e = []
    e += section_header('1', 'Resumen Ejecutivo', s)
    e.append(Spacer(1, 6))

    e.append(Paragraph(
        'XCIEN opera cuatro almacenes de inventario — Ciudad de México, Querétaro, '
        'Guadalajara y Monterrey — con una red de infraestructura que representa más '
        'de <b>$23.7 millones MXN</b> en activos físicos. Sin embargo, los movimientos '
        'de materiales entre ciudades carecen de trazabilidad formal: se registran de '
        'forma manual, fuera de Odoo, y sin mecanismo de verificación criptográfica.',
        s['body']))

    e.append(Paragraph(
        'Este documento describe el <b>Sistema de Tokenización de Operaciones XCIEN</b>, '
        'una capa de trazabilidad basada en tokens que registra cada transferencia de '
        'inventario como un evento inmutable, auditable y preparado para sincronizarse '
        'con Odoo <font face="Courier" size="9">stock.quant</font> cuando la organización '
        'esté lista.',
        s['body']))

    e.append(Spacer(1, 6))

    # KPI summary boxes
    kpis = [
        ('$23.7M', 'MXN en inventario\nactivo XCIEN'),
        ('4', 'Almacenes\noperando'),
        ('0', 'Transferencias con\ntrazabilidad formal hoy'),
        ('100%', 'Tokens listos para\nsincronizar con Odoo'),
    ]
    kpi_data = [[
        Table([[
            Paragraph(v, ParagraphStyle('kv', fontName='Helvetica-Bold', fontSize=20, textColor=BLUE, alignment=TA_CENTER)),
            Paragraph(l, ParagraphStyle('kl', fontName='Helvetica', fontSize=8, textColor=GRAY, alignment=TA_CENTER, leading=11)),
        ]], colWidths=[1.7*inch])
        for v, l in kpis
    ]]
    kpi_table = Table(kpi_data, colWidths=[1.7*inch]*4)
    kpi_table.setStyle(TableStyle([
        ('BOX',        (0,0), (-1,-1), 0.5, colors.HexColor('#CFD8DC')),
        ('INNERGRID',  (0,0), (-1,-1), 0.5, colors.HexColor('#CFD8DC')),
        ('BACKGROUND', (0,0), (-1,-1), LGRAY),
        ('TOPPADDING',   (0,0), (-1,-1), 10),
        ('BOTTOMPADDING',(0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    e.append(kpi_table)
    e.append(Spacer(1, 10))

    e.append(callout_box(
        '🎯  Objetivo central: que cada movimiento de material entre almacenes '
        'quede registrado, firmado, trazado y sincronizable — sin depender de '
        'hojas de cálculo ni procesos manuales.',
        color=BLUE, bg=colors.HexColor('#E3F2FD'), s=s))

    return e


def sec_problema(s):
    e = []
    e.append(PageBreak())
    e += section_header('2', 'El Problema: Inventario sin Trazabilidad', s)
    e.append(Spacer(1, 6))

    e.append(Paragraph('2.1  Estado Actual', s['h2']))
    e.append(Paragraph(
        'El inventario de XCIEN se gestiona principalmente desde Odoo (instancia wispi17). '
        'Sin embargo, se identificaron las siguientes brechas críticas durante el análisis '
        'de mayo 2026:',
        s['body']))

    problems = [
        ('Guadalajara fuera de Odoo',
         'El almacén de GDL existe físicamente y en Google Sheets, pero no tiene registros '
         'de stock.location con usage=internal en Odoo. Su inventario es invisible al sistema.'),
        ('Inflación de valorización',
         'product.product.qty_available incluye ubicaciones virtuales, de tránsito y de clientes. '
         'La valorización real calculada via stock.quant (internal) es $23.7M MXN vs $66.5M '
         'reportado inicialmente — diferencia de 2.8×.'),
        ('Transferencias sin registro',
         'Los movimientos entre ciudades se coordinan por WhatsApp/correo y se registran '
         'retroactivamente en Odoo, si es que se registran.'),
        ('Cero auditoría',
         'No existe log inmutable de quién autorizó una transferencia, cuándo salió el '
         'material, ni cuándo fue recibido en destino.'),
        ('Dependencia de hojas de cálculo',
         'El inventario real de Guadalajara y parte del de Querétaro vive en Google Sheets, '
         'desconectado de cualquier sistema transaccional.'),
    ]

    rows = [[Paragraph(f'<b>{t}</b>', s['body_left']), Paragraph(d, s['body_left'])]
            for t, d in problems]
    e.append(two_col_table(rows,
        col_w=(2.0*inch, 4.5*inch),
        header=[
            Paragraph('Brecha', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
            Paragraph('Descripción', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
        ], s=s))

    e.append(Spacer(1, 10))
    e.append(Paragraph('2.2  Impacto Operativo', s['h2']))

    impacts = [
        '• Retrasos en instalaciones por desconocimiento del stock real disponible en cada ciudad.',
        '• Riesgo de compras duplicadas al no tener visibilidad de materiales en tránsito.',
        '• Imposibilidad de auditar responsabilidades: ¿quién tomó qué, cuándo y para qué?',
        '• Reportes de valorización incorrectos que afectan decisiones de gerencia.',
        '• Guadalajara opera completamente fuera del ecosistema digital — sin dato, sin control.',
    ]
    for imp in impacts:
        e.append(Paragraph(imp, s['bullet']))

    e.append(Spacer(1, 10))
    e.append(callout_box(
        '⚠️  Sin trazabilidad, cada transferencia es una caja negra. El token '
        'convierte cada movimiento en un evento verificable, con autor, timestamp '
        'y cadena de custodia.',
        color=ORANGE, bg=colors.HexColor('#FFF3E0'), s=s))

    return e


def sec_que_es(s):
    e = []
    e.append(PageBreak())
    e += section_header('3', 'Qué es un Token de Operación XCIEN', s)
    e.append(Spacer(1, 6))

    e.append(Paragraph(
        'Un <b>Token de Operación</b> es un registro digital inmutable que certifica que '
        'un evento operativo ocurrió — quién lo inició, qué involucra, cuándo sucedió '
        'y cuál es su estado actual.',
        s['body']))

    e.append(Paragraph(
        'A diferencia de un registro en base de datos convencional (que puede editarse sin '
        'rastro), el token tiene un <b>ID criptográfico</b> generado como hash SHA-256 de '
        'origen + destino + secuencia + timestamp. Esto hace que dos tokens idénticos sean '
        'imposibles de generar accidentalmente.',
        s['body']))

    e.append(Spacer(1, 8))
    e.append(Paragraph('3.1  Anatomía de un Token de Transferencia', s['h2']))

    fields = [
        ('token_id', 'ID único: SHA-256 truncado a 16 chars. Ej: 31DB3C973BF5C9BF'),
        ('token_name', 'Nombre legible: INV/CDMX→MTY/20260519/0001'),
        ('origin_warehouse', 'Almacén origen: CDMX | QRO | GDL | MTY'),
        ('dest_warehouse', 'Almacén destino: CDMX | QRO | GDL | MTY'),
        ('state', 'Estado: draft → confirmed → in_transit → received | cancelled'),
        ('lines[]', 'Líneas de producto: ref, nombre, cantidad, UoM, lote/serie'),
        ('created_by', 'Email o nombre del emisor del token'),
        ('priority', 'normal | urgent — afecta prioridad en Odoo al sincronizar'),
        ('created_at', 'Timestamp ISO 8601 UTC de creación'),
        ('confirmed_at', 'Timestamp de confirmación (quien autoriza el envío)'),
        ('shipped_at', 'Timestamp de salida del almacén origen'),
        ('received_at', 'Timestamp de recepción en destino'),
        ('odoo_picking_id', 'ID de stock.picking en Odoo (vacío hasta sincronizar)'),
        ('odoo_picking_name', 'Nombre del picking Odoo: WH/INT/XXXXX'),
    ]

    rows = [[
        Paragraph(f'<font face="Courier" size="8" color="#1565C0">{f}</font>', s['body_left']),
        Paragraph(d, s['small']),
    ] for f, d in fields]

    e.append(two_col_table(rows, col_w=(2.0*inch, 4.5*inch),
        header=[
            Paragraph('Campo', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
            Paragraph('Descripción', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
        ], s=s))

    e.append(Spacer(1, 10))
    e.append(Paragraph('3.2  Tipos de Tokens en el Ecosistema XCIEN', s['h2']))

    token_types = [
        ('🏷️  Transferencia de Inventario', 'CDMX→MTY', 'Movimiento de materiales entre almacenes. Objeto de este white paper.', BLUE),
        ('👤  Movimiento de Personal (RRHH)', 'XCIEN', 'Altas, bajas, promociones, cambios de área. Ya operando en xcien2.', GREEN),
        ('🔄  Transacción Inter-empresa', 'Grupo', 'Flujos financieros entre xcien, luminet, wispi, huus. Ya operando.', PURPLE),
        ('📡  Incidente de Red', 'NOC', 'Eventos de degradación, corte, resolución. Trazabilidad de SLA.', TEAL),
        ('🎓  Certificación Academia', 'XCIEN', 'Emisión de constancias de aprobación de cursos.', ORANGE),
    ]

    tt_data = [[
        Paragraph(f'<b>{icon}</b>', s['body_left']),
        Paragraph(scope, ParagraphStyle('sc', fontName='Helvetica-Bold', fontSize=9, textColor=color, alignment=TA_CENTER)),
        Paragraph(desc, s['small']),
    ] for icon, scope, desc, color in token_types]

    tt = Table(tt_data, colWidths=[2.5*inch, 0.8*inch, 3.7*inch])
    tt.setStyle(TableStyle([
        ('VALIGN',    (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [WHITE, LGRAY]),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#CFD8DC')),
        ('TOPPADDING',   (0,0), (-1,-1), 6),
        ('BOTTOMPADDING',(0,0), (-1,-1), 6),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    e.append(tt)
    return e


def sec_arquitectura(s):
    e = []
    e.append(PageBreak())
    e += section_header('4', 'Arquitectura Técnica', s)
    e.append(Spacer(1, 6))

    e.append(Paragraph(
        'El sistema está implementado como una capa de middleware en Python, '
        'completamente independiente de Odoo, pero con el schema de datos diseñado '
        'para mapeo 1:1 a los modelos de inventario de Odoo 17.',
        s['body']))

    e.append(Spacer(1, 6))
    e.append(Paragraph('4.1  Componentes del Sistema', s['h2']))

    components = [
        ('inventario_tokens.py', 'Core', 'Modelos Pydantic, base SQLite, CRUD de tokens, cálculo de stock virtual, generación de IDs criptográficos.'),
        ('odoo_adapter.py', 'Adaptador', 'Funciones XML-RPC para crear stock.picking, stock.move y validar pickings en Odoo. Desactivado por flag hasta que se conecte.'),
        ('inventario_tokens_api.py', 'API REST', 'FastAPI con endpoints para crear, transicionar y consultar tokens. Integrado en servidor principal (puerto 8002).'),
        ('InventarioTransfersSection.tsx', 'Frontend', 'Módulo XCIEN 2.0: formulario, tarjetas de estado, barra de progreso, panel de stock virtual. Accesible en /xcien2 → Operaciones.'),
        ('inventario_tokens.db', 'Storage', 'SQLite local en backend/db/. Sin dependencias externas. Migración a PostgreSQL trivial cuando escale.'),
    ]

    rows = [[
        Paragraph(f'<font face="Courier" size="8">{name}</font>', s['body_left']),
        Paragraph(f'<font color="#1565C0"><b>{role}</b></font>', s['body_left']),
        Paragraph(desc, s['small']),
    ] for name, role, desc in components]

    ct = Table(rows, colWidths=[2.0*inch, 0.7*inch, 3.8*inch])
    ct.setStyle(TableStyle([
        ('VALIGN',    (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [WHITE, LGRAY]),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#CFD8DC')),
        ('TOPPADDING',   (0,0), (-1,-1), 7),
        ('BOTTOMPADDING',(0,0), (-1,-1), 7),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    e.append(ct)

    e.append(Spacer(1, 10))
    e.append(Paragraph('4.2  Diagrama de Flujo', s['h2']))

    # Diagrama textual con tabla de flujo
    flow_steps = [
        ('1', 'Almacén Origen\n(CDMX/QRO/GDL/MTY)', 'Operador crea token en XCIEN 2.0\nEspecifica productos, cantidades y destino', WH_COLORS['CDMX']),
        ('2', 'Token: draft', 'ID criptográfico generado\nRegistrado en SQLite local', GRAY),
        ('3', 'Token: confirmed', 'Supervisor autoriza la transferencia\ntimestamp confirmed_at', BLUE2),
        ('4', 'Token: in_transit', 'Material sale del almacén origen\ntimestamp shipped_at', ORANGE),
        ('5', 'Token: received', 'Almacén destino confirma recepción\ntimestamp received_at', GREEN),
        ('6', 'Odoo (futuro)', 'sync_token_to_odoo() crea stock.picking\nOdoo actualiza stock.quant automáticamente', TEAL),
    ]

    for step in flow_steps:
        num, title, desc, color = step
        row = Table([[
            Table([[Paragraph(f'<b>{num}</b>',
                ParagraphStyle('sn', fontName='Helvetica-Bold', fontSize=14, textColor=WHITE, alignment=TA_CENTER))]],
                colWidths=[0.35*inch], rowHeights=[0.35*inch]),
            Table([[
                Paragraph(f'<b>{title}</b>', ParagraphStyle('st', fontName='Helvetica-Bold', fontSize=9, textColor=color)),
                Paragraph(desc, s['small']),
            ]], colWidths=[6.8*inch]),
        ]], colWidths=[0.45*inch, 6.8*inch])

        row.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), color),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING',   (0,0), (-1,-1), 4),
            ('BOTTOMPADDING',(0,0), (-1,-1), 4),
            ('LEFTPADDING',  (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        e.append(row)
        e.append(Spacer(1, 2))

    return e


def sec_ciclo(s):
    e = []
    e.append(PageBreak())
    e += section_header('5', 'Ciclo de Vida del Token', s)
    e.append(Spacer(1, 6))

    e.append(Paragraph(
        'El ciclo de vida del token está diseñado como espejo exacto del ciclo de '
        'stock.picking en Odoo 17, facilitando la sincronización futura.',
        s['body']))

    states = [
        ('draft', 'Borrador', 'Token creado, pendiente de autorización.\nEquivalente Odoo: picking en estado draft.',
         GRAY, 'create_token()'),
        ('confirmed', 'Confirmado', 'Transferencia autorizada. El material debe prepararse.\nEquivalente Odoo: action_confirm()',
         BLUE2, 'confirm_token()'),
        ('in_transit', 'En Tránsito', 'Material salió del almacén origen.\nEquivalente Odoo: action_assign() + validate parcial',
         ORANGE, 'ship_token()'),
        ('received', 'Recibido', 'Destino confirmó recepción. Stock actualizado.\nEquivalente Odoo: button_validate() → stock.quant',
         GREEN, 'receive_token()'),
        ('cancelled', 'Cancelado', 'Transferencia cancelada desde draft o confirmed.\nEquivalente Odoo: action_cancel()',
         colors.HexColor('#EF4444'), 'cancel_token()'),
    ]

    state_data = [[
        Paragraph(f'<font face="Courier" size="9" color="#1565C0">{state}</font>', s['body_left']),
        Paragraph(f'<b>{label}</b>', s['body_left']),
        Paragraph(desc, s['small']),
        Paragraph(f'<font face="Courier" size="8">{func}</font>', s['small']),
    ] for state, label, desc, color, func in states]

    st = Table(state_data, colWidths=[0.9*inch, 0.9*inch, 3.5*inch, 1.7*inch])
    st.setStyle(TableStyle([
        ('VALIGN',    (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [WHITE, LGRAY]),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#CFD8DC')),
        ('TOPPADDING',   (0,0), (-1,-1), 7),
        ('BOTTOMPADDING',(0,0), (-1,-1), 7),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TEXTCOLOR', (0,0), (0,-1), BLUE),
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ]))
    # Header manual
    header_row = [
        Paragraph('Estado', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
        Paragraph('Etiqueta', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
        Paragraph('Descripción / Equivalente Odoo', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
        Paragraph('Función Python', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
    ]
    full_data = [header_row] + state_data
    st2 = Table(full_data, colWidths=[0.9*inch, 0.9*inch, 3.5*inch, 1.7*inch])
    st2.setStyle(TableStyle([
        ('VALIGN',    (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LGRAY]),
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#CFD8DC')),
        ('TOPPADDING',   (0,0), (-1,-1), 7),
        ('BOTTOMPADDING',(0,0), (-1,-1), 7),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    e.append(st2)

    e.append(Spacer(1, 10))
    e.append(callout_box(
        '🔒  Reglas de transición: draft→confirmed→in_transit→received. '
        'No se puede saltar estados. No se puede cancelar un token ya recibido. '
        'Cada transición registra un timestamp inmutable.',
        color=GREEN, bg=colors.HexColor('#E8F5E9'), s=s))
    return e


def sec_dominios(s):
    e = []
    e.append(PageBreak())
    e += section_header('6', 'Dominios de Tokenización 2026', s)
    e.append(Spacer(1, 6))

    e.append(Paragraph(
        'El sistema de tokens no se limita al inventario. A continuación se describen '
        'todos los dominios operativos de XCIEN que se pueden — y deben — tokenizar '
        'en 2026, con su estado actual y su impacto esperado.',
        s['body']))

    e.append(Spacer(1, 8))

    dominios = [
        (
            '🏷️  Transferencias de Inventario',
            GREEN, '✅ Operando',
            [
                'Token por cada movimiento de material entre CDMX, QRO, GDL y MTY.',
                'Ciclo completo: draft → confirmed → in_transit → received.',
                'Stock virtual calculado en tiempo real desde tokens recibidos.',
                'Preparado para sincronizar con Odoo stock.picking / stock.quant.',
                'Almacenes: $23.7M MXN en activos trazables.',
            ],
            'Elimina las "cajas negras" entre ciudades. Guadalajara entra al sistema digital.'
        ),
        (
            '👤  Movimientos de Personal (RRHH)',
            BLUE2, '✅ Operando',
            [
                'Token por cada alta, baja, promoción, cambio de área o movimiento lateral.',
                'Firmado criptográficamente con timestamp y autor.',
                'Visible en XCIEN 2.0 → Transacciones & Tokens.',
                'Abarca todas las empresas del grupo: xcien, luminet, wispi, huus.',
            ],
            'Registro inmutable del historial laboral de cada colaborador.'
        ),
        (
            '🔄  Transacciones Inter-empresa',
            PURPLE, '✅ Operando',
            [
                'Flujos financieros y de recursos entre entidades del grupo.',
                'Trazabilidad de préstamos de equipos, servicios cruzados, asignaciones.',
                'Resumen ejecutivo disponible en sección Finanzas de XCIEN 2.0.',
            ],
            'Transparencia financiera entre xcien, luminet, wispi y huus.'
        ),
        (
            '🎓  Certificaciones Academia',
            ORANGE, '🔜 Próximo',
            [
                'Token de aprobación emitido al completar cada módulo del programa de academia.',
                'Incluye: score obtenido, fecha, versión del examen, instructor.',
                'Puede ser verificado externamente como credencial digital.',
            ],
            'Certificaciones verificables y portables para el equipo XCIEN.'
        ),
        (
            '📡  Incidentes de Red (NOC)',
            TEAL, '🔜 Próximo',
            [
                'Token por cada incidente: apertura, escalada, resolución.',
                'Cadena de custodia: quién lo abrió, quién lo atendió, tiempo de resolución.',
                'SLA embebido en el token para auditoría automática.',
            ],
            'Trazabilidad de SLAs en tiempo real. Evidencia para clientes empresariales.'
        ),
        (
            '🔧  Órdenes de Trabajo (Field Service)',
            GRAY, '📋 Planeado',
            [
                'Token por cada visita técnica: instalación, mantenimiento, falla.',
                'Vinculado al técnico, cliente, equipo intervenido y resultado.',
                'Evidencia fotográfica referenciada en el token.',
            ],
            'Historial inmutable de intervenciones por sitio y por técnico.'
        ),
    ]

    for title, color, status, bullets, impact in dominios:
        e.append(Spacer(1, 6))

        title_row = Table([[
            Paragraph(title, ParagraphStyle('dt', fontName='Helvetica-Bold', fontSize=11, textColor=color)),
            Paragraph(status, ParagraphStyle('st', fontName='Helvetica-Bold', fontSize=9,
                textColor=WHITE if status.startswith('✅') else GRAY,
                alignment=TA_RIGHT)),
        ]], colWidths=[5.5*inch, 1.5*inch])
        title_row.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), LGRAY),
            ('LINEBELOW', (0,0), (-1,-1), 1.5, color),
            ('TOPPADDING',   (0,0), (-1,-1), 6),
            ('BOTTOMPADDING',(0,0), (-1,-1), 6),
            ('LEFTPADDING',  (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('BACKGROUND', (1,0), (1,-1), color),
        ]))
        e.append(title_row)

        for b in bullets:
            e.append(Paragraph(f'   • {b}', s['bullet']))

        e.append(Paragraph(
            f'   <b>Impacto:</b> {impact}',
            ParagraphStyle('imp', fontName='Helvetica-Oblique', fontSize=9,
                textColor=color, leading=13, leftIndent=16, spaceAfter=2)))

    return e


def sec_odoo(s):
    e = []
    e.append(PageBreak())
    e += section_header('7', 'Integración con Odoo (stock.quant)', s)
    e.append(Spacer(1, 6))

    e.append(Paragraph(
        'El diseño del sistema garantiza que cuando XCIEN decida conectar Odoo, '
        'la integración sea plug-and-play. No se requiere reescribir nada — solo '
        'llenar los IDs de ubicación y activar el flag de sincronización.',
        s['body']))

    e.append(Paragraph('7.1  Mapeo de Modelos', s['h2']))

    mapping = [
        ('InventoryToken', 'stock.picking', 'Token completo = un picking de transferencia interna'),
        ('TokenLine', 'stock.move + stock.move.line', 'Cada línea de producto = un movimiento de stock'),
        ('origin_warehouse', 'location_id (stock.location)', 'Almacén origen con usage=internal'),
        ('dest_warehouse', 'location_dest_id', 'Almacén destino con usage=internal'),
        ('state=confirmed', 'action_confirm()', 'Picking pasa de draft a confirmed en Odoo'),
        ('state=in_transit', 'action_assign()', 'Odoo reserva el stock para el picking'),
        ('state=received', 'button_validate()', 'Odoo valida el picking → actualiza stock.quant'),
        ('token_name', 'picking.origin', 'Referencia cruzada: ej. INV/CDMX→MTY/20260519/0001'),
        ('priority=urgent', 'priority=1', 'Picking urgente en Odoo'),
    ]

    rows = [[
        Paragraph(f'<font face="Courier" size="8" color="#1565C0">{t}</font>', s['body_left']),
        Paragraph(f'<font face="Courier" size="8" color="#2E7D32">{o}</font>', s['body_left']),
        Paragraph(d, s['small']),
    ] for t, o, d in mapping]

    full = [[
        Paragraph('Token XCIEN', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
        Paragraph('Odoo Model / Field', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
        Paragraph('Descripción', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
    ]] + rows

    mt = Table(full, colWidths=[1.8*inch, 2.2*inch, 3.0*inch])
    mt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LGRAY]),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#CFD8DC')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING',   (0,0), (-1,-1), 6),
        ('BOTTOMPADDING',(0,0), (-1,-1), 6),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    e.append(mt)

    e.append(Spacer(1, 10))
    e.append(Paragraph('7.2  Pasos para Conectar Odoo', s['h2']))

    steps = [
        ('1', 'Obtener IDs de stock.location',
         'En Odoo: Inventario → Configuración → Ubicaciones → filtrar por usage=internal. '
         'Anotar el ID de cada almacén (CDMX, QRO, GDL, MTY).'),
        ('2', 'Obtener ID de tipo de operación',
         'Inventario → Configuración → Tipos de Operación → "Transferencia Interna". '
         'Anotar stock.picking.type.id.'),
        ('3', 'Llenar ODOO_LOCATION_MAP',
         'Editar odoo_adapter.py con los IDs obtenidos en pasos 1 y 2.'),
        ('4', 'Activar sync',
         'Llamar enable_odoo_sync() desde el servidor. A partir de ese momento, '
         'sync_token_to_odoo(token_id) crea el picking real en Odoo.'),
        ('5', 'Validar en producción',
         'Crear un token de prueba CDMX→MTY con 1 producto, confirmar, enviar, '
         'recibir. Verificar que stock.quant se actualiza en Odoo.'),
    ]

    for num, title, desc in steps:
        e.append(Paragraph(
            f'<b>Paso {num}:  {title}</b>',
            ParagraphStyle('step', fontName='Helvetica-Bold', fontSize=10, textColor=BLUE,
                spaceBefore=6, spaceAfter=2)))
        e.append(Paragraph(desc, s['body_left']))

    e.append(Spacer(1, 8))
    e.append(callout_box(
        '✅  El sistema ya tiene el 90% del trabajo hecho. Conectar Odoo es '
        'rellenar 5 IDs de ubicación y llamar una función.',
        color=GREEN, bg=colors.HexColor('#E8F5E9'), s=s))

    return e


def sec_seguridad(s):
    e = []
    e.append(PageBreak())
    e += section_header('8', 'Seguridad y Auditoría', s)
    e.append(Spacer(1, 6))

    e.append(Paragraph('8.1  Identidad Criptográfica del Token', s['h2']))
    e.append(Paragraph(
        'Cada token recibe un ID generado con SHA-256 sobre la concatenación de '
        'origen, destino, número de secuencia y timestamp UTC. Esto garantiza:',
        s['body']))
    for item in [
        '• Unicidad: probabilidad de colisión ≈ 0 para el volumen de operaciones de XCIEN.',
        '• No predictibilidad: no es posible adivinar el ID del siguiente token.',
        '• Verificabilidad: cualquier sistema externo puede recalcular el hash para verificar autenticidad.',
    ]:
        e.append(Paragraph(item, s['bullet']))

    e.append(Paragraph('8.2  Log de Auditoría', s['h2']))
    audit = [
        ('Quién', 'created_by registrado en cada token. No modificable post-creación.'),
        ('Qué', 'lines[] con product_ref, product_name, quantity, uom, lot_serial.'),
        ('Cuándo', 'Cuatro timestamps independientes: created, confirmed, shipped, received.'),
        ('Dónde', 'origin_warehouse y dest_warehouse fijos al momento de creación.'),
        ('Cómo', 'state machine con validaciones: no se puede saltar estados ni retroceder.'),
    ]
    e.append(two_col_table(
        [[Paragraph(f'<b>{q}</b>', s['body_left']), Paragraph(d, s['body_left'])] for q, d in audit],
        col_w=(0.7*inch, 6.3*inch), s=s))

    e.append(Paragraph('8.3  Principios de Diseño', s['h2']))
    for item in [
        '• <b>Separación de concerns:</b> el sistema de tokens no modifica Odoo bajo ninguna circunstancia sin activación explícita.',
        '• <b>Fail-safe:</b> si el sync a Odoo falla, el token conserva su estado y el error queda registrado en odoo_sync_error.',
        '• <b>Storage local:</b> SQLite con backup automático. Sin dependencia de servicios en nube para operación básica.',
        '• <b>API stateless:</b> todos los endpoints son idempotentes. Re-intentar una llamada no crea duplicados.',
    ]:
        e.append(Paragraph(item, s['bullet']))

    return e


def sec_roadmap(s):
    e = []
    e.append(PageBreak())
    e += section_header('9', 'Roadmap de Implementación', s)
    e.append(Spacer(1, 6))

    phases = [
        (
            'Fase 1 — Fundación',
            'Mayo 2026 — COMPLETADA',
            GREEN,
            [
                'Sistema de tokens de inventario operando en XCIEN 2.0',
                'API REST integrada en servidor principal (puerto 8002)',
                'Base de datos SQLite con ciclo de vida completo',
                'Odoo adapter implementado pero desactivado (sin riesgo)',
                'White paper técnico y documentación de integración',
            ]
        ),
        (
            'Fase 2 — Datos y Validación',
            'Junio 2026',
            BLUE2,
            [
                'Migrar inventario de Google Sheets (Guadalajara, Querétaro) al sistema de tokens',
                'Crear tokens históricos para transferencias ya realizadas en 2026',
                'Validar mapeo de product_ref con códigos reales de Odoo',
                'Capacitación del equipo de almacén en creación y tránsito de tokens',
            ]
        ),
        (
            'Fase 3 — Conexión Odoo',
            'Julio–Agosto 2026',
            ORANGE,
            [
                'Levantar IDs de stock.location para los 4 almacenes en Odoo',
                'Activar enable_odoo_sync() en ambiente de pruebas',
                'Pruebas end-to-end: token → stock.picking → stock.quant',
                'Reconciliación de stock: tokens vs. Odoo real',
                'Go-live: todos los movimientos nuevos crean picking en Odoo automáticamente',
            ]
        ),
        (
            'Fase 4 — Expansión de Dominios',
            'Sep–Dic 2026',
            PURPLE,
            [
                'Tokens de incidentes NOC con trazabilidad de SLA',
                'Tokens de certificación Academia XCIEN',
                'Tokens de órdenes de trabajo Field Service',
                'Dashboard unificado de todos los dominios tokenizados',
                'Exportación a reportes automáticos para gerencia',
            ]
        ),
    ]

    for phase_title, timeline, color, items in phases:
        e.append(Spacer(1, 4))
        phase_header = Table([[
            Paragraph(f'<b>{phase_title}</b>',
                ParagraphStyle('ph', fontName='Helvetica-Bold', fontSize=11, textColor=WHITE)),
            Paragraph(timeline,
                ParagraphStyle('tl', fontName='Helvetica', fontSize=9, textColor=WHITE, alignment=TA_RIGHT)),
        ]], colWidths=[4.5*inch, 2.5*inch])
        phase_header.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), color),
            ('TOPPADDING',   (0,0), (-1,-1), 8),
            ('BOTTOMPADDING',(0,0), (-1,-1), 8),
            ('LEFTPADDING',  (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        e.append(phase_header)
        for item in items:
            e.append(Paragraph(f'   ✓  {item}', s['bullet']))
        e.append(Spacer(1, 2))

    return e


def sec_conclusiones(s):
    e = []
    e.append(PageBreak())
    e += section_header('10', 'Conclusiones', s)
    e.append(Spacer(1, 6))

    e.append(Paragraph(
        'El Sistema de Tokenización de Operaciones XCIEN resuelve un problema '
        'fundamental: la invisibilidad de los movimientos operativos entre ciudades. '
        'Hoy, $23.7 millones MXN en materiales se mueven entre almacenes sin dejar '
        'rastro digital verificable. A partir de este sistema, cada movimiento es un '
        'evento inmutable con autor, timestamps y cadena de custodia completa.',
        s['body']))

    e.append(Spacer(1, 6))

    key_points = [
        ('Independencia de Odoo', 'El sistema opera completamente sin Odoo. No existe riesgo de afectar el ERP durante la implementación.'),
        ('Preparado para Odoo', 'El schema está diseñado como espejo 1:1 de stock.picking. Conectar Odoo es rellenar 5 IDs y activar un flag.'),
        ('Extensible a todos los dominios', 'El mismo patrón de token se aplica a RRHH, finanzas inter-empresa, NOC, Academia y Field Service.'),
        ('Vivo en producción', 'La Fase 1 ya está operando en XCIEN 2.0. Los primeros tokens se pueden crear hoy.'),
        ('Trazabilidad real, no burocracia', 'El flujo es simple: crear → confirmar → enviar → recibir. 4 clics para registrar una transferencia completa.'),
    ]

    for title, desc in key_points:
        e.append(Paragraph(
            f'<b>{title}:</b>  {desc}',
            ParagraphStyle('kp', fontName='Helvetica', fontSize=10, textColor=BLACK,
                leading=14, spaceAfter=5, leftIndent=8,
                borderPadding=(0,0,0,6))))
        e.append(HRFlowable(width='100%', thickness=0.3, color=colors.HexColor('#CFD8DC')))

    e.append(Spacer(1, 12))
    e.append(callout_box(
        '📦  Cada token emitido es un compromiso verificable. '
        'Cada transición de estado es evidencia auditada. '
        'Cada almacén — incluyendo Guadalajara — es ahora parte del ecosistema digital XCIEN.',
        color=NAVY, bg=colors.HexColor('#E8EAF6'), s=s))

    e.append(Spacer(1, 20))

    # Footer firma
    sig = Table([[
        Paragraph('Sistema de Tokenización XCIEN', ParagraphStyle('sf', fontName='Helvetica-Bold', fontSize=10, textColor=NAVY)),
        Paragraph(f'Versión 1.0  ·  {TODAY}\nMesquite / Next Ventures', ParagraphStyle('sm', fontName='Helvetica', fontSize=9, textColor=GRAY, leading=13, alignment=TA_RIGHT)),
    ]], colWidths=[4*inch, 3.5*inch])
    sig.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,0), 1, BLUE),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    e.append(sig)

    return e


# ─── Page template ────────────────────────────────────────────────────────────

def on_page(canvas, doc):
    canvas.saveState()
    W, H = letter
    # Header line
    canvas.setStrokeColor(BLUE)
    canvas.setLineWidth(0.5)
    canvas.line(0.5*inch, H - 0.5*inch, W - 0.5*inch, H - 0.5*inch)
    # Header text
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(GRAY)
    canvas.drawString(0.5*inch, H - 0.4*inch, 'XCIEN — Sistema de Tokenización de Operaciones')
    canvas.drawRightString(W - 0.5*inch, H - 0.4*inch, 'CONFIDENCIAL')
    # Footer
    canvas.setStrokeColor(colors.HexColor('#CFD8DC'))
    canvas.setLineWidth(0.3)
    canvas.line(0.5*inch, 0.5*inch, W - 0.5*inch, 0.5*inch)
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(GRAY)
    canvas.drawString(0.5*inch, 0.35*inch, f'White Paper v1.0  ·  {TODAY}  ·  Mesquite / Next Ventures')
    canvas.drawCentredString(W / 2, 0.35*inch, f'Página {doc.page}')
    canvas.drawRightString(W - 0.5*inch, 0.35*inch, 'whitepaper_tokens_xcien_2026.pdf')
    canvas.restoreState()


# ─── Build ────────────────────────────────────────────────────────────────────

def build():
    s = make_styles()

    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=letter,
        leftMargin=0.5*inch, rightMargin=0.5*inch,
        topMargin=0.7*inch, bottomMargin=0.7*inch,
        title='White Paper — Sistema de Tokenización XCIEN',
        author='Mesquite / Next Ventures',
        subject='Tokenización de Operaciones XCIEN 2026',
    )

    story = []
    story += build_cover(s)
    story += build_toc(s)
    story += sec_resumen(s)
    story += sec_problema(s)
    story += sec_que_es(s)
    story += sec_arquitectura(s)
    story += sec_ciclo(s)
    story += sec_dominios(s)
    story += sec_odoo(s)
    story += sec_seguridad(s)
    story += sec_roadmap(s)
    story += sec_conclusiones(s)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f'✅  White Paper generado: {OUTPUT}')


if __name__ == '__main__':
    build()
