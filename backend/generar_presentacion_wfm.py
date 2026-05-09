"""
Presentación ejecutiva WFM — XCIEN Field Services
Para presentación a Dirección — Mayo 2026
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Rutas de logos ────────────────────────────────────────────────────────────
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT   = os.path.dirname(_SCRIPT_DIR)
LOGO_H       = os.path.join(_REPO_ROOT, "public",          "xcien.png")   # 205×119 horizontal
LOGO_SQ      = os.path.join(_REPO_ROOT, "static", "assets", "logo.png")   # 1024×1024 cuadrado

# Pre-carga ImageReader para reutilizar en todas las slides
try:
    _LOGO_H_IMG  = ImageReader(LOGO_H)
except Exception:
    _LOGO_H_IMG  = None

try:
    _LOGO_SQ_IMG = ImageReader(LOGO_SQ)
except Exception:
    _LOGO_SQ_IMG = None

# ── Dimensiones 16:9 ──────────────────────────────────────────────────────────
W, H = 842, 474
OUT = os.path.expanduser("~/Downloads/XCIEN_WFM_Presentacion_Direccion.pdf")

# ── Paleta ────────────────────────────────────────────────────────────────────
BG        = HexColor("#0A0F0A")
BG2       = HexColor("#0F1A0F")
CARD      = HexColor("#111811")
GREEN     = HexColor("#00A859")
GREEN2    = HexColor("#00C896")
CYAN      = HexColor("#00B4D8")
AMBER     = HexColor("#FFB703")
RED       = HexColor("#FF4757")
PURPLE    = HexColor("#A855F7")
ORANGE    = HexColor("#F97316")
DIM       = HexColor("#607060")
BORDER    = HexColor("#1A2A1A")
TEXT      = HexColor("#E8F0E8")
SUBTEXT   = HexColor("#8AA08A")

def slide_base(c, numero, total=11):
    """Fondo y elementos comunes de cada slide."""
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Línea superior decorativa
    c.setFillColor(GREEN)
    c.rect(0, H-3, W, 3, fill=1, stroke=0)

    # Número de slide
    c.setFillColor(DIM)
    c.setFont("Helvetica", 8)
    c.drawRightString(W-20, 12, f"{numero} / {total}")

    # Logo horizontal en footer (esquina inferior izquierda)
    if _LOGO_H_IMG:
        # Logo horizontal: ancho fijo 72 pts, alto proporcional (205:119 ≈ 1.72)
        lw, lh = 72, 42
        c.drawImage(_LOGO_H_IMG, 16, 4, width=lw, height=lh,
                    preserveAspectRatio=True, mask='auto')
    else:
        # Fallback texto
        c.setFillColor(GREEN)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(20, 12, "XCIEN")

    c.setFillColor(DIM)
    c.setFont("Helvetica", 9)
    c.drawString(94, 12, "Field Services — WFM")

def card(c, x, y, w, h, color=None, alpha_fill=True):
    """Dibuja una tarjeta con borde."""
    c.setFillColor(CARD)
    c.setStrokeColor(BORDER)
    c.roundRect(x, y, w, h, 6, fill=1, stroke=1)
    if color:
        c.setFillColor(color)
        c.rect(x, y+h-3, w, 3, fill=1, stroke=0)

def pill(c, x, y, text, bg_color, text_color=None):
    """Badge/pill pequeño."""
    tc = text_color or white
    c.setFont("Helvetica-Bold", 7)
    tw = c.stringWidth(text, "Helvetica-Bold", 7)
    pad = 6
    c.setFillColor(bg_color)
    c.roundRect(x, y, tw + pad*2, 14, 4, fill=1, stroke=0)
    c.setFillColor(tc)
    c.drawString(x + pad, y + 4, text)
    return tw + pad*2

def h1(c, text, x, y, color=None, size=28):
    c.setFillColor(color or TEXT)
    c.setFont("Helvetica-Bold", size)
    c.drawString(x, y, text)

def h2(c, text, x, y, color=None, size=16):
    c.setFillColor(color or TEXT)
    c.setFont("Helvetica-Bold", size)
    c.drawString(x, y, text)

def body(c, text, x, y, color=None, size=10):
    c.setFillColor(color or SUBTEXT)
    c.setFont("Helvetica", size)
    c.drawString(x, y, text)

def line(c, x1, y1, x2, y2, color=None, width=1):
    c.setStrokeColor(color or BORDER)
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)

def bar(c, x, y, w_total, pct, color, height=8):
    c.setFillColor(HexColor("#1A2A1A"))
    c.roundRect(x, y, w_total, height, height//2, fill=1, stroke=0)
    if pct > 0:
        c.setFillColor(color)
        c.roundRect(x, y, max(height, w_total*pct/100), height, height//2, fill=1, stroke=0)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 1 — PORTADA
# ─────────────────────────────────────────────────────────────────────────────
def slide_portada(c):
    slide_base(c, 1)

    # Fondo degradado simulado con rectángulos
    for i in range(20):
        alpha = 0.03 - i * 0.001
        c.setFillColor(HexColor("#00A859"))
        c.setFillAlpha(max(0, alpha))
        c.rect(W//2, 0, W//2 + i*10, H + i*5, fill=1, stroke=0)
    c.setFillAlpha(1)

    # Línea vertical decorativa
    c.setStrokeColor(GREEN)
    c.setLineWidth(1)
    c.setDash([4, 6])
    c.line(W*0.52, 40, W*0.52, H-40)
    c.setDash([])

    # Logo XCIEN grande en portada
    # Logo horizontal 205×119 → escalar a 190pts ancho (mantiene proporción: 110pts alto)
    LOGO_W, LOGO_HT = 190, 110
    LOGO_Y = H - 50 - LOGO_HT   # top margin 50 → y_bottom = H-50-110 = 314
    if _LOGO_H_IMG:
        c.drawImage(_LOGO_H_IMG, 48, LOGO_Y, width=LOGO_W, height=LOGO_HT,
                    preserveAspectRatio=True, mask='auto')
    else:
        c.setFillColor(GREEN)
        c.setFont("Helvetica-Bold", 52)
        c.drawString(48, LOGO_Y + 30, "XCIEN")

    # Textos debajo del logo
    c.setFillColor(GREEN2)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(48, LOGO_Y - 30, "Sistema WFM")
    c.setFillColor(SUBTEXT)
    c.setFont("Helvetica", 11)
    c.drawString(48, LOGO_Y - 48, "Workforce & Field Management")

    # Separador (justo bajo los textos del logo)
    SEP_Y = LOGO_Y - 68
    c.setStrokeColor(GREEN)
    c.setLineWidth(2)
    c.line(48, SEP_Y, 300, SEP_Y)

    # Subtítulo
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(48, SEP_Y - 20, "Presentación a Dirección")
    c.setFillColor(SUBTEXT)
    c.setFont("Helvetica", 11)
    c.drawString(48, SEP_Y - 36, "Mayo 2026 — José Miguel Macías")

    # Badges derecha
    right_x = W*0.57
    badges = [
        ("100 Órdenes activas", GREEN),
        ("8 Roles operativos",  CYAN),
        ("Conectado a Odoo",    AMBER),
        ("Datos en tiempo real",PURPLE),
    ]
    for i, (txt, col) in enumerate(badges):
        by = H - 120 - i*48
        card(c, right_x, by-26, 250, 40, col)
        c.setFillColor(col)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(right_x+14, by-10, txt)

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 2 — PROBLEMA ACTUAL
# ─────────────────────────────────────────────────────────────────────────────
def slide_problema(c):
    slide_base(c, 2)

    h2(c, "El problema hoy", 40, H-60, GREEN2, 20)
    body(c, "¿Cómo se gestiona actualmente el ciclo venta → instalación → facturación?", 40, H-80, SUBTEXT, 11)

    line(c, 40, H-90, W-40, H-90, BORDER)

    problemas = [
        ("📱", "WhatsApp",       "Coordinación por grupos sin trazabilidad ni historial",    RED),
        ("📊", "Excel manual",   "Seguimiento en hojas de cálculo que se desactualizan",    AMBER),
        ("📧", "Correo / Teams", "Aprobaciones perdidas en bandejas de entrada",             AMBER),
        ("❓", "Sin evidencia",  "No hay foto antes/después ni prueba de velocidad formal",  RED),
        ("⏱️", "Sin KPIs",       "No se mide tiempo en cada etapa ni cumplimiento de SLA",  RED),
        ("🔀", "Datos dispersos","Odoo CRM no refleja el estado real de la instalación",    AMBER),
    ]

    cols = [40, W//2+10]
    for i, (icon, titulo, desc, color) in enumerate(problemas):
        col = cols[i % 2]
        row = i // 2
        y = H - 145 - row * 90
        card(c, col, y-60, W//2-60, 76, color)
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(col+14, y-20, icon)
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(col+48, y-16, titulo)
        c.setFillColor(SUBTEXT)
        c.setFont("Helvetica", 9)
        # Wrap texto largo
        words = desc.split()
        line1 = ' '.join(words[:6])
        line2 = ' '.join(words[6:])
        c.drawString(col+48, y-30, line1)
        if line2:
            c.drawString(col+48, y-42, line2)

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 3 — LA SOLUCIÓN
# ─────────────────────────────────────────────────────────────────────────────
def slide_solucion(c):
    slide_base(c, 3)

    h2(c, "La solución — WFM integrado con Odoo", 40, H-60, GREEN2, 20)
    body(c, "Un solo sistema que conecta ventas, operaciones, campo y facturación", 40, H-80, SUBTEXT, 11)
    line(c, 40, H-90, W-40, H-90, BORDER)

    # Diagrama de flujo
    etapas = [
        ("CRM\nOdoo", GREEN,  "Venta ganada"),
        ("Almacén",   AMBER,  "Equipos"),
        ("Apro.",     PURPLE, "Configuración"),
        ("Campo",     CYAN,   "Instalación"),
        ("NOC",       ORANGE, "Monitoreo"),
        ("Factura",   GREEN2, "Cierre"),
    ]

    box_w = 110
    box_h = 64
    gap = (W - 80 - len(etapas) * box_w) // (len(etapas) - 1)
    start_x = 40
    y_box = H - 210

    for i, (nombre, color, sub) in enumerate(etapas):
        x = start_x + i * (box_w + gap)
        card(c, x, y_box, box_w, box_h, color)
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 13)
        lines = nombre.split('\n')
        for li, ln in enumerate(lines):
            c.drawCentredString(x + box_w//2, y_box + box_h - 22 - li*14, ln)
        c.setFillColor(SUBTEXT)
        c.setFont("Helvetica", 8)
        c.drawCentredString(x + box_w//2, y_box + 10, sub)

        if i < len(etapas) - 1:
            ax = x + box_w + 2
            ay = y_box + box_h//2
            c.setStrokeColor(GREEN)
            c.setLineWidth(1.5)
            c.line(ax, ay, ax + gap - 4, ay)
            c.setFillColor(GREEN)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(ax + gap - 8, ay - 4, "▶")

    # Ventajas abajo
    ventajas = [
        ("✅", "Datos reales",    "100 órdenes\ndesde Odoo"),
        ("📋", "Trazabilidad",    "Checklist + fotos\npor instalación"),
        ("📡", "Velocidad",       "Pruebas iPerf3\nautomáticas"),
        ("📊", "KPIs en vivo",    "Tiempo por etapa\nvs SLA"),
        ("🔔", "NOC conectado",   "Alta en monitoreo\nal instalar"),
    ]

    vw = (W - 80) // len(ventajas)
    vy = y_box - 110
    for i, (icon, titulo, desc) in enumerate(ventajas):
        vx = 40 + i * vw
        card(c, vx+4, vy, vw-8, 90)
        c.setFillColor(GREEN)
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(vx + vw//2, vy+66, icon)
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(vx + vw//2, vy+50, titulo)
        c.setFillColor(SUBTEXT)
        c.setFont("Helvetica", 8)
        for li, ln in enumerate(desc.split('\n')):
            c.drawCentredString(vx + vw//2, vy+34 - li*12, ln)

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 4 — DÍA A DÍA: ROLES
# ─────────────────────────────────────────────────────────────────────────────
def slide_roles(c):
    slide_base(c, 4)

    h2(c, "Uso día a día — por rol", 40, H-60, GREEN2, 20)
    body(c, "Cada área ve exactamente lo que necesita, sin información de más", 40, H-80, SUBTEXT, 11)
    line(c, 40, H-90, W-40, H-90, BORDER)

    roles = [
        ("🤝", "Comercial",         GREEN,  "Crea solicitud desde CRM\nVe pipeline por cliente\nEmite token al ganar"),
        ("🔍", "Preventa",          CYAN,   "Captura factibilidad técnica\nSube anteproyecto\nAprueba tecnología"),
        ("📦", "Almacén",           AMBER,  "Responde disponibilidad\nAsigna equipo con S/N\nFecha estimada si no hay stock"),
        ("⚙️",  "Aprovisionamiento", PURPLE, "Registra VLAN, IP, BW\nCaptura firmware y MAC\nEnvía a revisión PM"),
        ("📋", "PM / Operaciones",  RED,    "Audita documento único\nAprueba o genera backlog\nVisibilidad total del flujo"),
        ("🚛", "Dispatch / Campo",  HexColor("#00ff88"), "Checklist 15 puntos\nFotos antes y después\nPrueba de velocidad real"),
        ("📡", "NOC",               ORANGE, "Valida conectividad (ping)\nDa alta en Zabbix/PRTG\nAprueba → Facturación"),
        ("📊", "Gerencia",          HexColor("#F97316"), "KPIs por etapa vs SLA\nPipeline en tiempo real\n100 órdenes Odoo"),
    ]

    cols = 4
    rw = (W - 80) // cols
    rh = 90

    for i, (icon, nombre, color, desc) in enumerate(roles):
        col = i % cols
        row = i // cols
        rx = 40 + col * rw
        ry = H - 160 - row * (rh + 12)
        card(c, rx+3, ry, rw-6, rh, color)

        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(rx+12, ry+66, icon)

        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(rx+38, ry+70, nombre)

        c.setFillColor(SUBTEXT)
        c.setFont("Helvetica", 8)
        for li, ln in enumerate(desc.split('\n')):
            c.drawString(rx+12, ry+50 - li*13, ln)

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 5 — FLUJO DE UN DÍA TÍPICO
# ─────────────────────────────────────────────────────────────────────────────
def slide_dia_tipico(c):
    slide_base(c, 5)

    h2(c, "Un día típico de operación", 40, H-60, GREEN2, 20)
    body(c, "Ejemplo: Contrato firmado → instalación en 4 días → cliente facturado", 40, H-80, SUBTEXT, 11)
    line(c, 40, H-90, W-40, H-90, BORDER)

    pasos = [
        ("08:00", "Comercial",    GREEN,  "📧 Llega orden\nfirmada desde Odoo"),
        ("08:15", "Almacén",      AMBER,  "📦 Confirma equipo\nMikrotik CCR2004 S/N"),
        ("09:00", "Aprovision.",  PURPLE, "⚙️ Configura VLAN 4022\nBW 1GB MAC registrada"),
        ("10:00", "PM",           RED,    "✅ Audita documento\nAprueba instalación"),
        ("Día 2", "Dispatch",     CYAN,   "🚛 Técnico en sitio\nChecklist + 8 fotos"),
        ("Día 2", "Técnico",      HexColor("#00ff88"), "📡 iPerf3: 945/932 Mbps\nLatencia: 12ms ✅"),
        ("Día 3", "NOC",          ORANGE, "📡 Alta en Zabbix\nAlertas configuradas"),
        ("Día 3", "Facturación",  GREEN2, "💰 Orden lista\nOdoo actualizado"),
    ]

    # Timeline horizontal
    tw = (W - 80) / len(pasos)
    ty = H // 2 + 10

    # Línea central
    c.setStrokeColor(BORDER)
    c.setLineWidth(2)
    c.line(40, ty, W-40, ty)

    for i, (hora, rol, color, desc) in enumerate(pasos):
        tx = 40 + i * tw + tw/2

        # Círculo
        c.setFillColor(color)
        c.circle(tx, ty, 10, fill=1, stroke=0)
        c.setFillColor(BG)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(tx, ty-3, str(i+1))

        # Hora arriba o abajo alternado
        if i % 2 == 0:
            c.setFillColor(color)
            c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(tx, ty+26, hora)
            c.setFillColor(TEXT)
            c.setFont("Helvetica-Bold", 8)
            c.drawCentredString(tx, ty+38, rol)
            c.setFillColor(SUBTEXT)
            c.setFont("Helvetica", 7.5)
            for li, ln in enumerate(desc.split('\n')):
                c.drawCentredString(tx, ty+52 + li*11, ln)
        else:
            c.setFillColor(color)
            c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(tx, ty-30, hora)
            c.setFillColor(TEXT)
            c.setFont("Helvetica-Bold", 8)
            c.drawCentredString(tx, ty-42, rol)
            c.setFillColor(SUBTEXT)
            c.setFont("Helvetica", 7.5)
            for li, ln in enumerate(desc.split('\n')):
                c.drawCentredString(tx, ty-56 - li*11, ln)

    # Resultado final
    card(c, W//2 - 160, 28, 320, 38, GREEN2)
    c.setFillColor(GREEN2)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(W//2, 54, "✅  Contrato → Facturación en < 3 días  |  Trazabilidad 100%  |  Sin llamadas de seguimiento")

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 6 — DATOS ACTUALES (pipeline real)
# ─────────────────────────────────────────────────────────────────────────────
def slide_datos(c):
    slide_base(c, 6)

    h2(c, "Pipeline real XCIEN — Odoo CRM Mayo 2026", 40, H-60, GREEN2, 20)
    body(c, "200 oportunidades activas · Datos en tiempo real · wispi17.odoo.wispi.mx", 40, H-80, SUBTEXT, 11)
    line(c, 40, H-90, W-40, H-90, BORDER)

    # Pipeline real de Odoo
    pipeline = [
        ("Negociación",          96, GREEN,  "Mayor volumen — requiere seguimiento activo"),
        ("Concretado / Cerrado", 27, GREEN2, "Instalaciones completadas"),
        ("Habilitación",         27, PURPLE, "En configuración de red y equipos"),
        ("Contratación",         13, AMBER,  "Contratos firmados — en validación almacén"),
        ("Calificación",         10, CYAN,   "En evaluación técnica inicial"),
        ("Borrador",             12, DIM,    "Oportunidades nuevas sin asignar"),
        ("Facturación",           6, ORANGE, "Listas para facturar al cliente"),
    ]

    total = sum(p[1] for p in pipeline)
    bx, by, bw, bh = 40, H-345, 390, 235
    card(c, bx, by, bw, bh, GREEN)
    h2(c, "Etapas del pipeline", bx+16, by+bh-26, TEXT, 11)

    bar_x = bx + 16
    bar_y = by + bh - 46
    bar_w = bw - 120

    for nombre, n, color, _ in pipeline:
        pct = n / total * 100
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(bar_x, bar_y + 3, nombre)
        bar(c, bar_x, bar_y - 9, bar_w, pct, color, 7)
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(bar_x + bar_w + 8, bar_y - 7, str(n))
        c.setFillColor(SUBTEXT)
        c.setFont("Helvetica", 7)
        c.drawString(bar_x + bar_w + 28, bar_y - 7, f"{pct:.0f}%")
        bar_y -= 30

    # Top oportunidades reales
    top_x = bx + bw + 20
    top_w = W - top_x - 40
    card(c, top_x, by, top_w, bh, AMBER)
    h2(c, "Top oportunidades", top_x+12, by+bh-26, TEXT, 11)

    top = [
        ("CX CONTACT CENTER",          "$4,589,255", GREEN,  "Negociación"),
        ("SEÑAL INTERACTIVA",           "$45,000",    CYAN,   "Borrador"),
        ("W-SPORTS",                    "$44,990",    CYAN,   "Negociación"),
        ("J.A. RIVERA HERNANDEZ",       "$40,000",    AMBER,  "Negociación"),
        ("CUBIC 33 MEXICO",             "$36,700",    AMBER,  "Negociación"),
        ("OFEM MEDIA GROUP",            "$35,000",    AMBER,  "Negociación"),
        ("UNIV. DE LA COMUNICACION",    "$32,800",    GREEN2, "Negociación"),
    ]
    ty2 = by + bh - 46
    for cliente, rev, color, etapa in top:
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(top_x+12, ty2, cliente[:26])
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 9)
        c.drawRightString(top_x + top_w - 10, ty2, rev)
        c.setFillColor(DIM)
        c.setFont("Helvetica", 7)
        c.drawString(top_x+12, ty2-10, etapa)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.3)
        c.line(top_x+12, ty2-14, top_x+top_w-12, ty2-14)
        ty2 -= 28

    # KPI strip abajo
    kpis = [
        ("200",     "Oportunidades totales", GREEN),
        ("$4.5M",   "Mayor oportunidad",     AMBER),
        ("5",       "Comerciales activos",   CYAN),
        ("27",      "En habilitación",       PURPLE),
        ("33",      "Cerradas + Facturación",GREEN2),
    ]
    kw2 = (W - 80) // len(kpis)
    for i, (val, label, color) in enumerate(kpis):
        kx2 = 40 + i * kw2
        card(c, kx2+3, 28, kw2-6, 44, color)
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(kx2 + kw2//2, 56, val)
        c.setFillColor(SUBTEXT)
        c.setFont("Helvetica", 7)
        c.drawCentredString(kx2 + kw2//2, 40, label)

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 7 — VENTAJAS DE IMPLEMENTAR EN ODOO
# ─────────────────────────────────────────────────────────────────────────────
def slide_ventajas_odoo(c):
    slide_base(c, 7)

    h2(c, "¿Por qué integrar con Odoo?", 40, H-60, GREEN2, 20)
    body(c, "Odoo como fuente única de verdad — sin sistemas paralelos", 40, H-80, SUBTEXT, 11)
    line(c, 40, H-90, W-40, H-90, BORDER)

    # Tabla comparativa
    lx, rx = 40, W//2 + 10
    ty = H - 115

    # Headers
    card(c, lx, ty-26, W//2-60, 30, RED)
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(lx + (W//2-60)//2, ty-8, "❌  Sin integración")

    card(c, rx, ty-26, W//2-60, 30, GREEN)
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(rx + (W//2-60)//2, ty-8, "✅  Con WFM + Odoo")

    filas = [
        ("Actualización manual de etapas",        "Sync automático bidireccional"),
        ("Técnico reporta por WhatsApp",           "Checklist digital con timestamp"),
        ("Sin evidencia fotográfica",              "Fotos geolocalizadas en la orden"),
        ("Prueba de velocidad verbal",             "iPerf3 registrado con pass/fail automático"),
        ("NOC sin saber cuándo dar de alta",       "Notificación automática al cerrar campo"),
        ("Facturación depende de llamadas",        "Orden pasa a Facturación sola al aprobar NOC"),
        ("KPIs en Excel al final del mes",         "KPIs por etapa en tiempo real"),
        ("Nadie sabe dónde está la orden",         "Historial completo con quién hizo qué y cuándo"),
    ]

    fy = ty - 48
    for sin, con in filas:
        c.setFillColor(HexColor("#1A0808"))
        c.setStrokeColor(HexColor("#3A1010"))
        c.roundRect(lx, fy-14, W//2-60, 22, 3, fill=1, stroke=1)
        c.setFillColor(RED)
        c.setFont("Helvetica", 8)
        c.drawString(lx+8, fy-7, sin)

        c.setFillColor(HexColor("#081A0A"))
        c.setStrokeColor(HexColor("#103A10"))
        c.roundRect(rx, fy-14, W//2-60, 22, 3, fill=1, stroke=1)
        c.setFillColor(GREEN2)
        c.setFont("Helvetica", 8)
        c.drawString(rx+8, fy-7, con)

        fy -= 28

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 8 — FUNCIONALIDADES CLAVE (demo)
# ─────────────────────────────────────────────────────────────────────────────
def slide_funcionalidades(c):
    slide_base(c, 8)

    h2(c, "Funcionalidades clave — listas hoy", 40, H-60, GREEN2, 20)
    body(c, "Implementadas, probadas y con datos reales de XCIEN", 40, H-80, SUBTEXT, 11)
    line(c, 40, H-90, W-40, H-90, BORDER)

    features = [
        (CYAN,   "📋", "Checklist de instalación",
         "15 puntos en 7 categorías\n(Sitio · Cableado · Equipo · Conectividad\nNOC · Cliente · Limpieza)\nRegistra quién y cuándo por ítem"),
        (AMBER,  "📸", "Reporte fotográfico US-041A",
         "Mínimo 1 foto ANTES + 1 DESPUÉS\nBloquea cierre si faltan\nMiniaturas en la orden\nEvidencia para el cliente"),
        (GREEN,  "📡", "Prueba de velocidad",
         "Registra descarga, subida, latencia\nCriterio automático: ≥90% BW, <50ms\nHistorial de pruebas por orden\niPerf3 · Speedtest · Manual"),
        (PURPLE, "🔒", "Flujo NOC — 3 pasos",
         "1. Ping de validación con IP real\n2. Alta en Zabbix/PRTG + alertas\n3. Aprobación → pasa a Facturación\nDesbloqueo secuencial"),
        (ORANGE, "📊", "KPIs en tiempo real",
         "Tiempo en preventa, almacén, apro.\ninstalación, NOC y total vs SLA\nVista global + por orden\nTop órdenes más lentas"),
        (RED,    "📦", "Almacén 3 respuestas",
         "Disponible → asigna y avanza\nNo disponible → Backlog\nDisponible en fecha → Espera\nFecha estimada de llegada"),
    ]

    fw = (W - 80) // 3
    fh = 140
    for i, (color, icon, titulo, desc) in enumerate(features):
        col = i % 3
        row = i // 3
        fx = 40 + col * fw
        fy = H - 135 - row * (fh + 10)
        card(c, fx+4, fy-fh+10, fw-8, fh, color)
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(fx+14, fy-16, icon)
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(fx+44, fy-14, titulo)
        c.setFillColor(SUBTEXT)
        c.setFont("Helvetica", 8)
        for li, ln in enumerate(desc.split('\n')):
            c.drawString(fx+14, fy-32 - li*12, ln)

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 9 — ROADMAP
# ─────────────────────────────────────────────────────────────────────────────
def slide_roadmap(c):
    slide_base(c, 9)

    h2(c, "Roadmap de implementación", 40, H-60, GREEN2, 20)
    body(c, "De prototipo funcional a sistema productivo en Odoo", 40, H-80, SUBTEXT, 11)
    line(c, 40, H-90, W-40, H-90, BORDER)

    fases = [
        ("FASE 1", "Mayo 2026",   GREEN2, "Completada ✅",
         ["100 órdenes Odoo en tiempo real",
          "8 roles operativos",
          "Checklist · Fotos · Velocidad · NOC",
          "KPIs por etapa",
          "Reportes PDF automáticos"]),
        ("FASE 2", "Jun–Jul 2026", CYAN, "Write-back a Odoo",
         ["Cambios WFM actualizan Odoo stage",
          "Técnico usa app desde celular",
          "Firma digital del cliente",
          "Notificaciones automáticas",
          "Alertas por SLA incumplido"]),
        ("FASE 3", "Ago 2026",   AMBER, "App móvil campo",
         ["PWA para técnicos en sitio",
          "Cámara integrada → foto directa",
          "GPS del técnico en mapa",
          "Modo offline con sync posterior",
          "Speedtest automático integrado"]),
        ("FASE 4", "Sep 2026",   PURPLE, "BI y automatización",
         ["Dashboard ejecutivo Odoo nativo",
          "Facturación automática al cerrar NOC",
          "Predicción de cuellos de botella (IA)",
          "Integración Zabbix/PRTG bidireccional",
          "Reportes automáticos por cliente"]),
    ]

    fw = (W - 80) // 4
    for i, (fase, fecha, color, estado, items) in enumerate(fases):
        fx = 40 + i * fw
        fy = H - 105

        # Header fase
        c.setFillColor(color)
        c.roundRect(fx+4, fy-30, fw-8, 34, 5, fill=1, stroke=0)
        c.setFillColor(BG)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(fx + fw//2, fy-10, fase)
        c.setFont("Helvetica", 8)
        c.drawCentredString(fx + fw//2, fy-22, fecha)

        # Estado badge
        badge_y = fy - 46
        pill(c, fx+4, badge_y, estado, color if i==0 else BORDER, color if i==0 else DIM)

        # Items
        card(c, fx+4, fy-270, fw-8, 218)
        for li, item in enumerate(items):
            iy = fy - 70 - li * 32
            c.setFillColor(color)
            c.circle(fx+16, iy+4, 3, fill=1, stroke=0)
            c.setFillColor(TEXT if i == 0 else SUBTEXT)
            c.setFont("Helvetica", 8.5)
            # Wrap
            words = item.split()
            l1 = ' '.join(words[:5])
            l2 = ' '.join(words[5:])
            c.drawString(fx+24, iy+3, l1)
            if l2:
                c.drawString(fx+24, iy-8, l2)

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 10 — CIERRE / LLAMADA A ACCIÓN
# ─────────────────────────────────────────────────────────────────────────────
def slide_cierre(c):
    slide_base(c, 10)

    # Fondo especial
    c.setFillColor(BG2)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.rect(0, H-3, W, 3, fill=1, stroke=0)

    # Título central
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(W//2, H-100, "¿Qué necesitamos para avanzar?")

    line(c, W//2-200, H-115, W//2+200, H-115, GREEN, 2)

    acciones = [
        ("01", "Validar flujo",    GREEN,  "Revisar los 8 roles con los\njefes de cada área esta semana"),
        ("02", "Definir usuarios", CYAN,   "Asignar cuentas Odoo por rol\npara acceso al sistema"),
        ("03", "Piloto 2 semanas", AMBER,  "Correr 5–10 órdenes reales\ncon datos 100% en el sistema"),
        ("04", "Fase 2 → Odoo",   PURPLE, "Aprobar write-back para que\nWFM actualice Odoo automáticamente"),
    ]

    aw = (W - 80) // 4
    ay = H - 160

    for i, (num, titulo, color, desc) in enumerate(acciones):
        ax = 40 + i * aw
        card(c, ax+4, ay-120, aw-8, 130, color)
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(ax + aw//2, ay-34, num)
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(ax + aw//2, ay-56, titulo)
        c.setFillColor(SUBTEXT)
        c.setFont("Helvetica", 8)
        for li, ln in enumerate(desc.split('\n')):
            c.drawCentredString(ax + aw//2, ay-74 - li*13, ln)

    # Footer
    card(c, 40, 26, W-80, 36, GREEN)
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(W//2, 48, "Sistema en producción · localhost:8080  →  github.com/jmmcmx/live-status-hub")
    c.setFillColor(SUBTEXT)
    c.setFont("Helvetica", 9)
    c.drawCentredString(W//2, 34, "José Miguel Macías Contreras · XCIEN Field Services · Mayo 2026")

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE EXTRA — CASO EJEMPLO: CX Contact Center (orden real de Odoo)
# ─────────────────────────────────────────────────────────────────────────────
def slide_caso_ejemplo(c, slide_num, total):
    slide_base(c, slide_num, total)

    # Header con cliente real
    c.setFillColor(HexColor("#0A1A0F"))
    c.rect(0, H-95, W, 60, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(40, H-58, "CASO DE USO — ORDEN REAL")
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(40, H-82, "CX Contact Center  ·  Enlace Dedicado")
    c.setFillColor(AMBER)
    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(W-40, H-70, "$4,589,255")
    c.setFillColor(SUBTEXT)
    c.setFont("Helvetica", 9)
    c.drawRightString(W-40, H-84, "Ingreso esperado · Estado: Negociación")

    line(c, 40, H-97, W-40, H-97, BORDER)

    # Pasos del flujo con estado actual y siguiente acción
    pasos = [
        # (rol, icono, estado_actual, siguiente_accion, color, completado)
        ("Comercial",        "🤝", "Oportunidad en Odoo\nNegociación activa",           "Cerrar contrato y\ngenerar OI en WFM",         GREEN,  True),
        ("Almacén",          "📦", "Pendiente de\nconfirmación de equipos",             "Responder disponibilidad\nde switches y routers",   AMBER,  False),
        ("Aprovisionamiento","⚙️",  "En espera de\nrespuesta almacén",                  "Registrar VLAN, IP WAN\nfirmware y MAC del equipo", PURPLE, False),
        ("PM / Ops",         "📋", "Pendiente de\naprobación de documentos",            "Auditar documento único\ny aprobar instalación",     RED,    False),
        ("Campo / Técnico",  "🚛", "Sin asignar",                                       "Checklist 15 puntos\nFotos antes y después",        CYAN,   False),
        ("NOC",              "📡", "Sin dar de alta",                                   "Alta en Zabbix\nAlertas + aprobación",              ORANGE, False),
        ("Facturación",      "💰", "Bloqueada hasta\naprobación NOC",                   "Odoo genera factura\nautomáticamente",              GREEN2, False),
    ]

    pw = (W - 80) // len(pasos)
    py_top = H - 120

    for i, (rol, icono, actual, siguiente, color, done) in enumerate(pasos):
        px = 40 + i * pw

        # Flecha entre pasos
        if i > 0:
            ay = py_top - 70
            c.setStrokeColor(GREEN if done else BORDER)
            c.setLineWidth(1.5)
            c.line(px-2, ay, px+4, ay)

        # Caja del paso
        bg = HexColor("#0A1A0A") if done else CARD
        c.setFillColor(bg)
        c.setStrokeColor(color if done else BORDER)
        c.setLineWidth(1.5 if done else 0.5)
        c.roundRect(px+3, py_top-148, pw-6, 152, 5, fill=1, stroke=1)

        # Número + ícono
        c.setFillColor(color)
        c.circle(px + pw//2, py_top-12, 14, fill=1, stroke=0)
        c.setFillColor(BG)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(px + pw//2, py_top-16, str(i+1))

        # Ícono
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(px + pw//2, py_top-38, icono)

        # Rol
        c.setFillColor(TEXT if done else SUBTEXT)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(px + pw//2, py_top-54, rol)

        # Separador
        c.setStrokeColor(color if done else BORDER)
        c.setLineWidth(0.5)
        c.line(px+8, py_top-60, px+pw-8, py_top-60)

        # Estado actual
        c.setFillColor(SUBTEXT)
        c.setFont("Helvetica", 7)
        for li, ln in enumerate(actual.split('\n')):
            c.drawCentredString(px + pw//2, py_top-73 - li*10, ln)

        # Siguiente acción
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(px + pw//2, py_top-100, "→ Siguiente:")
        c.setFillColor(TEXT if done else DIM)
        c.setFont("Helvetica", 7)
        for li, ln in enumerate(siguiente.split('\n')):
            c.drawCentredString(px + pw//2, py_top-112 - li*10, ln)

        # Badge completado / pendiente
        badge_color = GREEN2 if done else DIM
        badge_text = "LISTO" if done else "PENDIENTE"
        bw2 = pw - 20
        bx2 = px + 10
        c.setFillColor(badge_color)
        c.roundRect(bx2, py_top-156, bw2, 12, 3, fill=1, stroke=0)
        c.setFillColor(BG if done else CARD)
        c.setFont("Helvetica-Bold", 6)
        c.drawCentredString(px + pw//2, py_top-148, badge_text)

    # Footer con insight
    card(c, 40, 22, W-80, 40, GREEN)
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(54, 50, "Con WFM:")
    c.setFillColor(GREEN2)
    c.setFont("Helvetica", 10)
    c.drawString(110, 50, "El comercial cierra en Odoo → almacén recibe notificación → técnico llega con checklist y cámara → NOC valida → Odoo factura solo.")
    c.setFillColor(AMBER)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(54, 34, "Sin WFM:")
    c.setFillColor(SUBTEXT)
    c.setFont("Helvetica", 10)
    c.drawString(110, 34, "Llamadas · WhatsApp · Excel · Fotos en Drive · \"¿Ya instalaron?\" · \"¿Ya diste de alta en el NOC?\"")

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# RENDER
# ─────────────────────────────────────────────────────────────────────────────
def main():
    TOTAL = 11
    c = canvas.Canvas(OUT, pagesize=(W, H))
    c.setTitle("XCIEN WFM — Presentación a Dirección")
    c.setAuthor("José Miguel Macías Contreras")
    c.setSubject("Sistema de Workforce Management Field Services")

    slide_portada(c)
    slide_problema(c)
    slide_solucion(c)
    slide_roles(c)
    slide_caso_ejemplo(c, 5, TOTAL)   # caso real CX Contact Center
    slide_dia_tipico(c)
    slide_datos(c)
    slide_ventajas_odoo(c)
    slide_funcionalidades(c)
    slide_roadmap(c)
    slide_cierre(c)

    c.save()
    print(f"✅ Presentación generada: {OUT}")
    import os
    size = os.path.getsize(OUT)
    print(f"   Tamaño: {size/1024:.1f} KB · {TOTAL} slides")

if __name__ == "__main__":
    main()
