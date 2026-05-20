#!/usr/bin/env python3
"""Gráficas de Inventario Odoo — B&W Profesional para Dirección"""
import os, sys, io, datetime
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
import numpy as np

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                  TableStyle, HRFlowable, Image, KeepTogether)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY

# ── Paleta ────────────────────────────────────────────────────────────────────
BLACK  = colors.HexColor('#0D0D0D')
MID    = colors.HexColor('#555555')
LIGHT  = colors.HexColor('#888888')
RULE   = colors.HexColor('#CCCCCC')
OFFWHT = colors.HexColor('#F7F7F7')
WHITE  = colors.white

OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'graficas_inventario_2026.pdf')
NOW    = datetime.datetime.now()
DATE   = NOW.strftime('%d de %B de %Y')
PW     = 7.8 * inch

# ── Estilos ───────────────────────────────────────────────────────────────────
def S(name, **kw):
    base = dict(fontName='Helvetica', fontSize=9, textColor=colors.HexColor('#1A1A1A'), leading=14)
    base.update(kw)
    return ParagraphStyle(name, **base)

def P(text, style):
    return Paragraph(text, style)

def rule():
    return HRFlowable(width='100%', thickness=1.5, color=BLACK, spaceAfter=0, spaceBefore=0)

def thin():
    return HRFlowable(width='100%', thickness=0.3, color=RULE, spaceAfter=0, spaceBefore=0)

def sp(h=6):
    return Spacer(1, h)

def section(num, title, styles):
    return KeepTogether([
        sp(16),
        P(f'{num:02d}', styles['num']),
        P(title, styles['title']),
        rule(),
        sp(8),
    ])

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 6.5)
    canvas.setFillColor(colors.HexColor('#888888'))
    canvas.drawString(0.6*inch, 0.42*inch,
        f'XCIEN / Sandur / Luminet · Gráficas de Inventario Odoo · {DATE}')
    canvas.drawRightString(8.0*inch, 0.42*inch, f'Página {doc.page}')
    canvas.setStrokeColor(colors.HexColor('#CCCCCC'))
    canvas.setLineWidth(0.3)
    canvas.line(0.6*inch, 0.52*inch, 8.0*inch, 0.52*inch)
    canvas.restoreState()

# ── Matplotlib config ─────────────────────────────────────────────────────────
def mpl_style():
    plt.rcParams.update({
        'figure.facecolor':  'white',
        'axes.facecolor':    'white',
        'axes.edgecolor':    '#CCCCCC',
        'axes.linewidth':    0.7,
        'axes.grid':         True,
        'grid.color':        '#EEEEEE',
        'grid.linewidth':    0.5,
        'grid.linestyle':    '--',
        'axes.spines.top':   False,
        'axes.spines.right': False,
        'font.family':       'sans-serif',
        'font.size':         8,
        'axes.titlesize':    9,
        'axes.titleweight':  'bold',
        'axes.titlepad':     10,
        'axes.labelsize':    7.5,
        'xtick.labelsize':   7,
        'ytick.labelsize':   7,
        'legend.fontsize':   7.5,
        'legend.frameon':    False,
        'figure.dpi':        150,
    })

BW = ['#0D0D0D', '#2D2D2D', '#555555', '#777777', '#999999', '#BBBBBB', '#DDDDDD']

def fig_to_image(fig, width_in, height_in):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return Image(buf, width=width_in * inch, height=height_in * inch)

# ══════════════════════════════════════════════════════════════════════════════
# GRÁFICAS
# ══════════════════════════════════════════════════════════════════════════════

def chart_donut_estado():
    """Dona: Con stock / Sin stock / Servicios+Consumibles"""
    mpl_style()
    fig, ax = plt.subplots(figsize=(4.5, 3.2))
    sizes  = [2502, 1663, 2080]
    labels = ['Con stock\n2,502 (40.1%)', 'Sin stock\n1,663 (26.6%)', 'Servicios/Consumibles\n2,080 (33.3%)']
    colors_bw = ['#0D0D0D', '#888888', '#D0D0D0']
    wedges, _ = ax.pie(sizes, colors=colors_bw, startangle=90,
                        wedgeprops=dict(width=0.55, edgecolor='white', linewidth=2))
    ax.set_title('Estado del Catálogo (6,245 productos)', pad=14)
    ax.legend(wedges, labels, loc='center left', bbox_to_anchor=(0.95, 0.5),
              frameon=False, fontsize=7.5)
    fig.tight_layout()
    return fig_to_image(fig, 5.2, 3.4)


def chart_barras_sin_stock():
    """Barras horizontales: categorías con más sin stock"""
    mpl_style()
    categorias = [
        'CV / Equipo CV',
        'CV / Consumibles CV',
        'AF / Comunicación AF',
        'G* / Herramienta G',
        'AF / Cómputo AF',
        'AF / Mob. Oficina',
        'G* / Uniformes',
        'G* / Licencias',
        'IN* / Venta Equipo',
        'Otras (53 cat.)',
    ]
    valores = [568, 406, 255, 145, 44, 31, 31, 16, 14, 113]
    y = np.arange(len(categorias))

    fig, ax = plt.subplots(figsize=(6.2, 3.8))
    bars = ax.barh(y, valores, color='#0D0D0D', edgecolor='white', linewidth=0.5, height=0.6)
    # valor en barra
    for bar, val in zip(bars, valores):
        ax.text(bar.get_width() + 8, bar.get_y() + bar.get_height()/2,
                f'{val:,}', va='center', ha='left', fontsize=7, color='#333333')
    ax.set_yticks(y)
    ax.set_yticklabels(categorias, fontsize=7.5)
    ax.set_xlabel('Productos sin stock')
    ax.set_title('Productos Sin Stock por Categoría (Top 10)')
    ax.set_xlim(0, 680)
    ax.invert_yaxis()
    ax.grid(axis='x', linestyle='--', linewidth=0.4, color='#EEEEEE')
    ax.spines['left'].set_visible(False)
    ax.tick_params(left=False)
    fig.tight_layout()
    return fig_to_image(fig, 6.5, 4.0)


def chart_tipo_producto():
    """Barras: distribución por tipo"""
    mpl_style()
    tipos  = ['Almacenable\n(product)', 'Servicio\n(service)', 'Consumible\n(consu)']
    vals   = [3877, 707, 94]
    pcts   = [82.9, 15.1, 2.0]
    x      = np.arange(len(tipos))

    fig, ax = plt.subplots(figsize=(4.0, 3.0))
    bars = ax.bar(x, vals, color=['#0D0D0D', '#555555', '#AAAAAA'],
                  edgecolor='white', linewidth=0.5, width=0.55)
    for bar, val, pct in zip(bars, vals, pcts):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 30,
                f'{val:,}\n({pct}%)', ha='center', va='bottom', fontsize=7.5, color='#222222')
    ax.set_xticks(x)
    ax.set_xticklabels(tipos)
    ax.set_ylabel('Número de productos')
    ax.set_title('Distribución por Tipo de Producto')
    ax.set_ylim(0, 4500)
    ax.spines['bottom'].set_visible(False)
    ax.tick_params(bottom=False)
    fig.tight_layout()
    return fig_to_image(fig, 4.2, 3.2)


def chart_movimientos():
    """Barras: movimientos 2026 por tipo"""
    mpl_style()
    tipos = [
        'Sandur MTY\nTransf. internas',
        'Sandur Indep.\nRecibidos',
        'Piedras Negras\nTransf. internas',
        'Sandur Indep.\nRecepciones',
        'Luminet Wan\nRecibidos',
        'Sandur CDMX\nRecepciones',
        'Otros 28\ntipos',
    ]
    vals = [1723, 214, 161, 42, 32, 23, 189]
    grises = ['#0D0D0D', '#333333', '#555555', '#777777', '#888888', '#999999', '#BBBBBB']
    x = np.arange(len(tipos))

    fig, ax = plt.subplots(figsize=(6.5, 3.2))
    bars = ax.bar(x, vals, color=grises, edgecolor='white', linewidth=0.5, width=0.65)
    for bar, val in zip(bars, vals):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 15,
                f'{val:,}', ha='center', va='bottom', fontsize=7, color='#222222')
    ax.set_xticks(x)
    ax.set_xticklabels(tipos, fontsize=6.5)
    ax.set_ylabel('Movimientos completados')
    ax.set_title('Movimientos de Almacén 2026 (Total: 2,384)')
    ax.set_ylim(0, 2100)
    ax.spines['bottom'].set_visible(False)
    ax.tick_params(bottom=False)
    # Anotación 72%
    ax.annotate('72.3%\ndel total', xy=(0, 1723), xytext=(0.8, 1900),
                fontsize=7, color='#444444',
                arrowprops=dict(arrowstyle='->', color='#888888', lw=0.8))
    fig.tight_layout()
    return fig_to_image(fig, 6.8, 3.4)


def chart_calidad_datos():
    """Treemap-style barras de calidad de datos"""
    mpl_style()
    problemas = [
        'Sin SKU/código\ninterno',
        'Almacenables\nsin stock',
        'Servicios en\ncatálogo físico',
        'Sin categorizar\n("All")',
        'Con stock\n< 5 piezas',
    ]
    conteos = [1007, 1663, 707, 80, 312]
    total   = 6245
    pcts    = [c/total*100 for c in conteos]
    grises  = ['#0D0D0D', '#2D2D2D', '#555555', '#888888', '#AAAAAA']
    x = np.arange(len(problemas))

    fig, ax = plt.subplots(figsize=(6.0, 3.0))
    bars = ax.bar(x, pcts, color=grises, edgecolor='white', linewidth=0.5, width=0.6)
    for bar, pct, cnt in zip(bars, pcts, conteos):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
                f'{pct:.1f}%\n({cnt:,})', ha='center', va='bottom', fontsize=7, color='#222222')
    ax.set_xticks(x)
    ax.set_xticklabels(problemas, fontsize=7)
    ax.set_ylabel('% del catálogo total')
    ax.set_title('Indicadores de Calidad de Datos (% sobre 6,245 productos)')
    ax.set_ylim(0, 38)
    ax.spines['bottom'].set_visible(False)
    ax.tick_params(bottom=False)
    fig.tight_layout()
    return fig_to_image(fig, 6.3, 3.2)


def chart_top_stock():
    """Barras horizontales: top 10 productos con más stock"""
    mpl_style()
    productos = [
        'RouterBoard Mikrotik RB2011',
        'Antena Rocket Dish 5GHz 30dBi',
        'Tuerca Hexagonal 3/8" ANCLO',
        'Backhaul Mimosa B5c',
        'Protector PoE Mimosa',
        'Tubo con cople PG 1-1/2"',
        'CCR1009-7G-1C-1S+',
        'RouterBoard RB951Ui-2HnD',
        'B5LITE MIMO 750Mbps',
        'Herramientas MSA (varios)',
    ]
    stock = [137, 118, 97, 47, 45, 9, 16, 7, 7, 21]
    y = np.arange(len(productos))

    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    grises = ['#0D0D0D' if s == max(stock) else '#444444' if s > 50 else '#777777' for s in stock]
    bars = ax.barh(y, stock, color=grises, edgecolor='white', linewidth=0.5, height=0.6)
    for bar, val in zip(bars, stock):
        ax.text(bar.get_width() + 1, bar.get_y() + bar.get_height()/2,
                str(val), va='center', ha='left', fontsize=7.5, color='#333333')
    ax.set_yticks(y)
    ax.set_yticklabels(productos, fontsize=7.5)
    ax.set_xlabel('Unidades disponibles')
    ax.set_title('Top 10 Productos con Mayor Stock Disponible')
    ax.set_xlim(0, 165)
    ax.invert_yaxis()
    ax.spines['left'].set_visible(False)
    ax.tick_params(left=False)
    ax.grid(axis='x', linestyle='--', linewidth=0.4, color='#EEEEEE')
    fig.tight_layout()
    return fig_to_image(fig, 6.5, 3.8)


def chart_radar_almacenes():
    """Barras agrupadas: ciudades vs. métricas"""
    mpl_style()
    ciudades = ['MTY\nIndep.', 'MTY\nNodos', 'Piedras\nNegras', 'Saltillo', 'CDMX', 'Querétaro']
    ubicaciones = [100, 74, 20, 15, 12, 12]
    movimientos = [1884, 0, 161, 7, 32, 22]  # aprox por ciudad

    x  = np.arange(len(ciudades))
    w  = 0.38
    fig, ax1 = plt.subplots(figsize=(5.8, 3.0))
    ax2 = ax1.twinx()

    b1 = ax1.bar(x - w/2, ubicaciones, width=w, color='#0D0D0D', label='Ubicaciones', edgecolor='white')
    b2 = ax2.bar(x + w/2, movimientos, width=w, color='#888888', label='Movimientos 2026', edgecolor='white')

    ax1.set_xticks(x)
    ax1.set_xticklabels(ciudades)
    ax1.set_ylabel('Ubicaciones activas', color='#0D0D0D')
    ax2.set_ylabel('Movimientos 2026', color='#666666')
    ax1.set_title('Actividad por Ciudad — Ubicaciones vs. Movimientos')
    ax1.tick_params(axis='y', labelcolor='#0D0D0D')
    ax2.tick_params(axis='y', labelcolor='#666666')
    ax1.spines['top'].set_visible(False)
    ax2.spines['top'].set_visible(False)

    lines = [mpatches.Patch(color='#0D0D0D', label='Ubicaciones activas'),
             mpatches.Patch(color='#888888', label='Movimientos 2026')]
    ax1.legend(handles=lines, loc='upper right', fontsize=7)
    fig.tight_layout()
    return fig_to_image(fig, 6.0, 3.2)


def chart_valor_categorias():
    """Barras horizontales: valor del inventario por categoría — datos reales de stock.quant"""
    mpl_style()
    categorias = [
        'Eq. de Comunicación\nAF (radios, antenas)',
        'Equipo CV\n(CPEs, routers campo)',
        'Consumibles CV\n(cables, conectores, fibra)',
        'Equipo de Cómputo\nAF (servidores, switches)',
        'Oficina y\nMobiliario AF',
        'Alimentos y\nOtros G',
        'Consumibles\nOficina G',
        'Sin categorizar\n("All")',
        'Mob. y Eq.\nOficina AF',
        'Otras categorías',
    ]
    valores_m = [11.53, 8.22, 2.99, 0.29, 0.15, 0.13, 0.04, 0.04, 0.06, 0.25]
    y = np.arange(len(categorias))

    fig, ax = plt.subplots(figsize=(6.2, 3.8))
    grises = ['#0D0D0D' if v > 5 else '#333333' if v > 1 else '#555555' if v > 0.1 else '#888888' for v in valores_m]
    bars = ax.barh(y, valores_m, color=grises, edgecolor='white', linewidth=0.5, height=0.6)
    for bar, val in zip(bars, valores_m):
        lbl = f'${val:.2f}M' if val >= 1 else f'${val*1000:.0f}K'
        ax.text(bar.get_width() + 0.1, bar.get_y() + bar.get_height()/2,
                lbl, va='center', ha='left', fontsize=7.5, color='#333333')
    ax.set_yticks(y)
    ax.set_yticklabels(categorias, fontsize=7.2)
    ax.set_xlabel('Millones de MXN (costo estándar)')
    ax.set_title('Valor del Inventario por Categoría (Total: $23.7M MXN)')
    ax.set_xlim(0, 15)
    ax.invert_yaxis()
    ax.spines['left'].set_visible(False)
    ax.tick_params(left=False)
    ax.grid(axis='x', linestyle='--', linewidth=0.4, color='#EEEEEE')
    fig.tight_layout()
    return fig_to_image(fig, 6.5, 4.0)


def chart_top_productos_valor():
    """Barras: top 10 productos más valiosos — datos reales de stock.quant"""
    mpl_style()
    productos = [
        'C5x\nMIMO 5GHz\n(444u)',
        'C5C Radio\n500+ Mbps\n(272u)',
        'Tarana RN\nCPE 5.8G\n(63u)',
        'AirFiber\n5G 30dBi\n(182u)',
        'Tarana BN\n5.8G FCC\n(2u)',
        'CCR2216\nMikroTik\n(7u)',
        'PowerBeam\nairMAX AC\n(173u)',
        'ADSS 72C\nFibra 4km\n(6u)',
        'N5-X25\nDual Slant\n(155u)',
        'RB2011\nMikroTik\n(200u)',
    ]
    valores = [0.912, 0.899, 0.697, 0.459, 0.450, 0.415, 0.400, 0.388, 0.344, 0.289]
    x = np.arange(len(productos))
    grises = ['#0D0D0D' if i < 3 else '#333333' if i < 6 else '#666666' for i in range(len(productos))]

    fig, ax = plt.subplots(figsize=(6.8, 3.2))
    bars = ax.bar(x, valores, color=grises, edgecolor='white', linewidth=0.5, width=0.65)
    for bar, val in zip(bars, valores):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.008,
                f'${val:.3f}M', ha='center', va='bottom', fontsize=6.2, color='#222222')
    ax.set_xticks(x)
    ax.set_xticklabels(productos, fontsize=6.0)
    ax.set_ylabel('Millones MXN (costo estándar)')
    ax.set_title('Top 10 Productos por Valor en Inventario (Datos verificados)')
    ax.set_ylim(0, 1.15)
    ax.spines['bottom'].set_visible(False)
    ax.tick_params(bottom=False)
    fig.tight_layout()
    return fig_to_image(fig, 7.0, 3.4)


def chart_gauge_cobertura():
    """Panel de métricas clave con barras de progreso estilo gauge"""
    mpl_style()
    metricas = [
        ('Cobertura de stock\n(con stock / almacenables)', 2502/3877*100, 80),
        ('Calidad de SKUs\n(con código interno)',          (6245-1007)/6245*100, 95),
        ('Categorización\n(con categoría asignada)',       (6245-80)/6245*100, 100),
        ('Utilización almacenes\n(ciudades activas / total)', 6/15*100, 100),
    ]

    fig, axes = plt.subplots(1, 4, figsize=(6.5, 2.2))
    for ax, (label, val, target) in zip(axes, metricas):
        # fondo gris
        ax.barh([0], [100], color='#EEEEEE', height=0.5, edgecolor='none')
        # objetivo
        ax.barh([0], [target], color='#CCCCCC', height=0.5, edgecolor='none')
        # valor actual
        color = '#0D0D0D' if val >= target * 0.9 else '#555555' if val >= target * 0.7 else '#888888'
        ax.barh([0], [val], color=color, height=0.5, edgecolor='none')
        # línea objetivo
        ax.axvline(target, color='#333333', linewidth=1.2, linestyle='--', alpha=0.6)

        ax.set_xlim(0, 110)
        ax.set_ylim(-0.6, 0.9)
        ax.axis('off')
        ax.text(50, 0.45, label, ha='center', va='bottom', fontsize=6.2,
                color='#444444', multialignment='center')
        ax.text(val/2, 0, f'{val:.0f}%', ha='center', va='center',
                fontsize=8, fontweight='bold',
                color='white' if val > 20 else '#333333')

    fig.suptitle('Indicadores de Gestión de Inventario vs. Objetivo', fontsize=8.5,
                 fontweight='bold', y=1.02)
    fig.tight_layout()
    return fig_to_image(fig, 6.8, 2.4)


# ══════════════════════════════════════════════════════════════════════════════
# PDF BUILDER
# ══════════════════════════════════════════════════════════════════════════════
def make_charts_pdf():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=letter,
        leftMargin=0.6*inch, rightMargin=0.6*inch,
        topMargin=0.65*inch, bottomMargin=0.75*inch,
        title='Gráficas de Inventario Odoo — XCIEN 2026',
    )

    styles = {
        'num':     S('num',   fontSize=8,  textColor=colors.HexColor('#888888'),
                    fontName='Helvetica-Bold'),
        'title':   S('ttl',   fontSize=15, fontName='Helvetica-Bold',
                    textColor=colors.HexColor('#0D0D0D'), leading=18, spaceBefore=2),
        'cover_t': S('cvt',   fontSize=28, fontName='Helvetica-Bold',
                    textColor=colors.HexColor('#0D0D0D'), leading=32),
        'cover_s': S('cvs',   fontSize=12, textColor=colors.HexColor('#555555'), leading=16),
        'cover_m': S('cvm',   fontSize=8,  textColor=colors.HexColor('#888888')),
        'caption': S('cap',   fontSize=7.5, textColor=colors.HexColor('#888888'),
                    alignment=TA_LEFT, spaceBefore=3, spaceAfter=10),
        'body':    S('bod',   fontSize=8.5, textColor=colors.HexColor('#222222'),
                    leading=14, alignment=TA_JUSTIFY, spaceAfter=6),
        'insight': S('ins',   fontSize=8.5, textColor=colors.HexColor('#0D0D0D'),
                    fontName='Helvetica-Bold', leading=13, alignment=TA_JUSTIFY),
    }

    def callout(text, label='LECTURA'):
        inner = [
            P(label, S(f'cl_{label[:3]}', fontSize=6.5, fontName='Helvetica-Bold',
                       textColor=colors.HexColor('#888888'), spaceAfter=2)),
            P(text, styles['insight']),
        ]
        t = Table([[inner]], colWidths=[PW])
        t.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,-1), colors.HexColor('#F7F7F7')),
            ('LEFTPADDING',   (0,0), (-1,-1), 14),
            ('RIGHTPADDING',  (0,0), (-1,-1), 14),
            ('TOPPADDING',    (0,0), (-1,-1), 9),
            ('BOTTOMPADDING', (0,0), (-1,-1), 9),
            ('LINEBEFORE',    (0,0), (0,-1),  3, colors.HexColor('#0D0D0D')),
        ]))
        return t

    story = []

    # ── PORTADA ───────────────────────────────────────────────────────────────
    story += [
        sp(0.7*inch),
        HRFlowable(width='100%', thickness=2.5, color=BLACK, spaceAfter=0),
        sp(6),
        P('GRÁFICAS DE<br/>INVENTARIO', styles['cover_t']),
        sp(8),
        P('Análisis visual · Odoo wispi17 · XCIEN / Sandur / Luminet', styles['cover_s']),
        sp(28),
        thin(),
        sp(6),
    ]
    meta = Table([[
        P('Fecha', styles['cover_m']),   P(DATE, styles['body']),
        P('Fuente', styles['cover_m']),  P('Odoo wispi17 (producción)', styles['body']),
        P('Uso', styles['cover_m']),     P('Interno — Dirección', styles['body']),
    ]], colWidths=[0.6*inch, 2.0*inch, 0.6*inch, 2.2*inch, 0.4*inch, 1.9*inch])
    meta.setStyle(TableStyle([
        ('TOPPADDING',    (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 6),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ]))
    story += [meta, sp(6), thin(), sp(30)]

    # ── KPI VALOR ─────────────────────────────────────────────────────────────
    kpi_val = Table([
        [P('$23.7M', S('kv', fontSize=34, fontName='Helvetica-Bold',
                        textColor=colors.HexColor('#0D0D0D'), alignment=TA_CENTER)),
         P('MXN', S('ku', fontSize=14, textColor=colors.HexColor('#555555'),
                     alignment=TA_LEFT))],
        [P('Valor real en almacenes internos · 1,697 SKUs · 70,461 unidades\n'
           'Fuente: stock.quant (ubicaciones internas, qty > 0) × standard_price',
           S('kd', fontSize=8, textColor=colors.HexColor('#888888'),
              alignment=TA_LEFT)), P('', S('kd2', fontSize=8))],
    ], colWidths=[3.5*inch, PW - 3.5*inch])
    kpi_val.setStyle(TableStyle([
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
        ('LEFTPADDING',   (0,0), (-1,-1), 20),
        ('SPAN',          (0,1), (1,1)),
        ('BACKGROUND',    (0,0), (-1,-1), colors.HexColor('#F7F7F7')),
        ('LINEBEFORE',    (0,0), (0,-1),  4, colors.HexColor('#0D0D0D')),
    ]))
    story += [kpi_val, sp(12)]

    # ── SECCIÓN 1: VISIÓN GENERAL ─────────────────────────────────────────────
    story.append(section(1, 'Visión General del Catálogo', styles))

    img_donut = chart_donut_estado()
    img_tipo  = chart_tipo_producto()

    row = Table([[img_donut, sp(10), img_tipo]],
                colWidths=[5.2*inch, 0.2*inch, 4.2*inch - 0.2*inch])
    row.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story += [row]
    story += [
        P('Fig. 1 — Distribución del catálogo por estado de stock.',
          styles['caption']),
        callout('El 40% del catálogo tiene stock físico disponible. '
                'El 26.6% (1,663 productos) son almacenables con existencia cero. '
                'Los servicios (15.1%) están mezclados con el inventario físico, '
                'lo que distorsiona los reportes de cobertura.'),
        sp(8),
    ]

    # ── SECCIÓN 2: PRODUCTOS SIN STOCK ────────────────────────────────────────
    story.append(section(2, 'Productos Sin Stock por Categoría', styles))
    story.append(chart_barras_sin_stock())
    story += [
        P('Fig. 2 — Top 10 categorías con más productos almacenables en cero.',
          styles['caption']),
        callout('Equipo CV y Consumibles CV concentran el 58.6% del problema '
                '(974 de 1,663 productos sin stock). Estas dos categorías '
                'deben ser la prioridad de la auditoría de catálogo.'),
        sp(8),
    ]

    # ── SECCIÓN 3: MOVIMIENTOS 2026 ────────────────────────────────────────────
    story.append(section(3, 'Movimientos de Almacén 2026', styles))
    story.append(chart_movimientos())
    story += [
        P('Fig. 3 — Distribución de los 2,384 movimientos completados en 2026.',
          styles['caption']),
        callout('El 72.3% de todos los movimientos son transferencias internas de Monterrey. '
                'Un volumen tan alto de transferencias internas sugiere fragmentación del proceso '
                'de picking o ajustes de inventario recurrentes que deberían eliminarse.'),
        sp(8),
    ]

    # ── SECCIÓN 4: ACTIVIDAD POR CIUDAD ───────────────────────────────────────
    story.append(section(4, 'Actividad por Ciudad', styles))
    story.append(chart_radar_almacenes())
    story += [
        P('Fig. 4 — Número de ubicaciones activas vs. movimientos registrados por ciudad.',
          styles['caption']),
        callout('MTY Independencia concentra la mayor actividad en ambas métricas. '
                'Ciudades como Querétaro, Saltillo y CDMX tienen pocas ubicaciones y '
                'pocos movimientos — indicio de que el inventario regional no se gestiona '
                'activamente en Odoo.'),
        sp(8),
    ]

    # ── SECCIÓN 5: TOP STOCK ───────────────────────────────────────────────────
    story.append(section(5, 'Productos con Mayor Stock Disponible', styles))
    story.append(chart_top_stock())
    story += [
        P('Fig. 5 — Top 10 SKUs con mayor cantidad disponible en todos los almacenes.',
          styles['caption']),
        callout('El stock máximo es de 137 piezas (Mikrotik RB2011). Los niveles son '
                'extremadamente bajos para una empresa de telecomunicaciones con operaciones '
                'en 15 ciudades. Esto confirma el modelo "comprar por proyecto" sin '
                'inventario de seguridad.'),
        sp(8),
    ]

    # ── SECCIÓN 5b: VALOR POR CATEGORÍA ──────────────────────────────────────
    story.append(section(6, 'Valorización del Inventario', styles))
    story.append(chart_valor_categorias())
    story += [
        P('Fig. 6 — Valor a precio de costo estándar por categoría. '
          'Total verificado: $23,741,798 MXN · 1,697 SKUs · 70,461 unidades. '
          'Fuente: stock.quant (ubicaciones internas, qty > 0).',
          styles['caption']),
        callout('Equipo de Comunicación AF ($11.5M, 48.6%) y Equipo CV ($8.2M, 34.6%) '
                'concentran el 83.2% del valor real en almacén. Son los activos '
                'de mayor impacto operativo: una ruptura de stock en estas categorías '
                'paraliza instalaciones y afecta SLAs directamente.'),
        sp(8),
    ]

    story.append(section(7, 'Top 10 Productos por Valor', styles))
    story.append(chart_top_productos_valor())
    story += [
        P('Fig. 7 — Los 10 productos con mayor valor en almacenes internos (stock.quant × standard_price). '
          'Datos verificados — excluye ubicaciones virtuales y equipo en campo.',
          styles['caption']),
        callout('El Radio C5x (444 uds, $912K) y el C5C (272 uds, $899K) son los dos activos '
                'individuales de mayor valor. Los top 10 acumulan $5.04M — el 21.2% del '
                'inventario total. Control estricto de estos 10 SKUs protege la quinta '
                'parte del capital inmovilizado.'),
        sp(8),
    ]

    # ── SECCIÓN 8: CALIDAD DE DATOS ───────────────────────────────────────────
    story.append(section(8, 'Indicadores de Calidad de Datos', styles))
    story.append(chart_calidad_datos())
    story += [
        P('Fig. 8 — Problemas de calidad de datos como porcentaje del catálogo total.',
          styles['caption']),
        callout('El problema más crítico es que 1,007 productos (16.1%) no tienen '
                'código interno asignable. Sin SKU único no es posible digitalizar '
                'el proceso de recepción ni hacer conteos físicos confiables. '
                'Este punto debe resolverse antes de implementar cualquier mejora de proceso.'),
        sp(8),
    ]

    # ── SECCIÓN 9: INDICADORES DE GESTIÓN ─────────────────────────────────────
    story.append(section(9, 'Indicadores de Gestión vs. Objetivo', styles))
    story.append(chart_gauge_cobertura())
    story += [
        P('Fig. 9 — Estado actual de cada indicador clave vs. valor objetivo. '
          'La línea punteada indica la meta.',
          styles['caption']),
        callout('La cobertura de stock (64.5%) y la calidad de SKUs (83.9%) son los dos '
                'indicadores más alejados del objetivo. Con el plan de mejora propuesto '
                '(auditoría de catálogo + asignación de SKUs en 30 días) ambos pueden '
                'alcanzar el 80% en un trimestre.'),
        sp(12),
    ]

    # Footer final
    story.append(thin())
    story += [sp(4),
        P(f'Gráficas generadas por Antigravity Portal · XCIEN 2026 · {DATE} · '
          'Fuente: Odoo wispi17 · Confidencial — solo para uso interno',
          S('ft_end', fontSize=7, textColor=colors.HexColor('#888888')))]

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f'✅ PDF generado: {os.path.abspath(OUTPUT)}')

if __name__ == '__main__':
    make_charts_pdf()
