#!/usr/bin/env python3
"""
Generador de PDF Premium — XCIEN Executive Edition
Diseño: Minimalista, Elegante, Corporativo.
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime

OUTPUT = "REPORTE_EJECUTIVO_XCIEN_PREMIUM.pdf"

# ── Paleta "Executive Midnight" ──────────────────────────────────────────────
NAVY_DEEP  = colors.HexColor("#0D1B2A") # Fondo/Encabezados
NAVY_LIGHT = colors.HexColor("#1B263B") # Acentos
GOLD       = colors.HexColor("#C5A059") # Detalles / Branding
SLATE      = colors.HexColor("#415A77") # Texto secundario
CREAM      = colors.HexColor("#E0E1DD") # Texto principal
WHITE      = colors.white

# ── Estilos Premium ──────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def estilo(nombre, **kw):
    return ParagraphStyle(nombre, parent=styles["Normal"], **kw)

titulo_premium = estilo("titulo_premium",
    fontSize=32, textColor=GOLD, alignment=TA_CENTER,
    fontName="Helvetica-Bold", spaceAfter=12, leading=38)

subtitulo_premium = estilo("subtitulo_premium",
    fontSize=14, textColor=CREAM, alignment=TA_CENTER,
    fontName="Helvetica", spaceAfter=20, letterSpacing=1)

h1_premium = estilo("h1_premium",
    fontSize=18, textColor=GOLD, fontName="Helvetica-Bold",
    spaceBefore=24, spaceAfter=12, leading=22)

body_premium = estilo("body_premium",
    fontSize=11, textColor=NAVY_DEEP, fontName="Helvetica",
    spaceBefore=6, spaceAfter=6, leading=16)

# ── Función para tablas elegantes ─────────────────────────────────────────────
def tabla_ejecutiva(data, col_widths):
    t = Table(data, colWidths=col_widths)
    style = [
        ('BACKGROUND', (0, 0), (-1, 0), NAVY_DEEP),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.1, SLATE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, colors.HexColor("#F8F9FA")]),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TEXTCOLOR', (0, 1), (-1, -1), NAVY_DEEP),
    ]
    t.setStyle(TableStyle(style))
    return t

def build_premium_pdf():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=letter,
        leftMargin=inch, rightMargin=inch,
        topMargin=inch, bottomMargin=inch
    )

    story = []

    # Portada Elegante
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("XCIEN", titulo_premium))
    story.append(Paragraph("ESTRATEGIA DE AGENTES 2026", subtitulo_premium))
    story.append(Spacer(1, 0.5*inch))
    story.append(HRFlowable(width="30%", thickness=2, color=GOLD))
    story.append(Spacer(1, 3*inch))
    story.append(Paragraph(f"CONFIDENCIAL  |  {datetime.now().strftime('%Y')}", estilo("meta", alignment=TA_CENTER, textColor=SLATE, fontSize=9)))

    story.append(PageBreak())

    # Contenido
    story.append(Paragraph("Resumen de Infraestructura", h1_premium))
    story.append(Paragraph("La siguiente tabla detalla el estado actual de los agentes operativos bajo el nuevo esquema de permisos y seguridad implementado.", body_premium))
    story.append(Spacer(1, 12))

    data = [
        ["AGENTE", "ESTATUS", "NIVEL DE ACCESO", "VALOR ESTRATÉGICO"],
        ["Director General", "ACTIVO", "Nivel 5 - Total", "Crítico"],
        ["Agente NOC", "STANDBY", "Nivel 3 - Red", "Alto"],
        ["Agente WFM", "ACTIVO", "Nivel 4 - Op", "Crítico"],
        ["Agente Odoo", "ACTIVO", "Nivel 4 - ERP", "Alto"],
    ]
    
    story.append(tabla_ejecutiva(data, [1.5*inch, 1.2*inch, 1.8*inch, 1.5*inch]))

    doc.build(story)
    print(f"✅ PDF Premium Generado: {OUTPUT}")

if __name__ == "__main__":
    build_premium_pdf()
