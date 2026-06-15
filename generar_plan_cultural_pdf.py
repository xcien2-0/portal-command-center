#!/usr/bin/env python3
"""Generador de PDF — Plan de Transformación Cultural XCIEN 2026"""
import os
import re
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Configuración de Archivos
INPUT_FILE = "/Users/mesquite/Antigravity/PLAN_TRANSFORMACION_CULTURAL_XCIEN.md"
OUTPUT_FILE = "/Users/mesquite/Antigravity/PLAN_TRANSFORMACION_CULTURAL_XCIEN_2026.pdf"

# Colores Premium
NEGRO      = colors.HexColor("#030508")
VERDE      = colors.HexColor("#00ff88")
AZUL       = colors.HexColor("#00cfff")
GRIS_OSC   = colors.HexColor("#1a1a2e")
GRIS_MED   = colors.HexColor("#2d2d44")
GRIS_CLAR  = colors.HexColor("#e8e8f0")
BLANCO     = colors.white

# Estilos
styles = getSampleStyleSheet()

def estilo(nombre, **kw):
    return ParagraphStyle(nombre, parent=styles["Normal"], **kw)

titulo_style = estilo("titulo", fontSize=24, textColor=VERDE, alignment=TA_CENTER, fontName="Helvetica-Bold", spaceAfter=12, leading=28)
sub_style = estilo("sub", fontSize=11, textColor=AZUL, alignment=TA_CENTER, fontName="Helvetica", spaceAfter=20)
h1_style = estilo("h1", fontSize=16, textColor=VERDE, fontName="Helvetica-Bold", spaceBefore=18, spaceAfter=10, leading=20)
h2_style = estilo("h2", fontSize=13, textColor=AZUL, fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=8, leading=16)
body_style = estilo("body", fontSize=10, textColor=colors.black, fontName="Helvetica", spaceBefore=4, spaceAfter=6, leading=14)
quote_style = estilo("quote", fontSize=10, textColor=GRIS_MED, fontName="Helvetica-Oblique", leftIndent=20, rightIndent=20, spaceBefore=8, spaceAfter=8, leading=14, backColor=colors.HexColor("#f0fff0"), borderPadding=10)
table_header_style = estilo("table_header", fontSize=9, textColor=BLANCO, fontName="Helvetica-Bold", alignment=TA_CENTER)
table_body_style = estilo("table_body", fontSize=9, textColor=colors.black, fontName="Helvetica")

def build_pdf():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: No se encuentra el archivo {INPUT_FILE}")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    doc = SimpleDocTemplate(
        OUTPUT_FILE, pagesize=letter,
        leftMargin=0.8*inch, rightMargin=0.8*inch,
        topMargin=0.8*inch, bottomMargin=0.8*inch,
        title="Plan de Transformación Cultural XCIEN 2026"
    )

    story = []
    
    # Portada
    story.append(Spacer(1, 1*inch))
    story.append(Paragraph("🏗️ PLAN DE TRANSFORMACIÓN CULTURAL", titulo_style))
    story.append(Paragraph("XCIEN 2026 — SISTEMA OPERATIVO CULTURAL", sub_style))
    story.append(HRFlowable(width="100%", thickness=2, color=VERDE, spaceAfter=20))
    story.append(Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y')} · Emitido por Antigravity", estilo("meta", alignment=TA_CENTER, fontSize=9, textColor=colors.gray)))
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("<b>Clasificación:</b> Documento Ejecutivo Estratégico", body_style))
    story.append(Paragraph("<b>Objetivo:</b> Erradicación de toxicidad y profesionalización de la comunicación interna.", body_style))
    
    story.append(PageBreak())

    current_table = []
    in_table = False

    for line in lines:
        line = line.strip()
        if not line and not in_table:
            continue

        # Headings
        if line.startswith("# "):
            story.append(Paragraph(line[2:].upper(), titulo_style))
        elif line.startswith("## "):
            story.append(Paragraph(line[3:], h1_style))
        elif line.startswith("### "):
            story.append(Paragraph(line[4:], h2_style))
        
        # Blockquotes
        elif line.startswith("> "):
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line[2:])
            story.append(Paragraph(text, quote_style))
        
        # Tables
        elif "|" in line:
            if "---" in line or ":---" in line:
                continue
            cells = [c.strip() for c in line.split("|") if c.strip() or line.startswith("|")]
            if not cells: continue
            if not in_table:
                in_table = True
                current_table = [cells]
            else:
                current_table.append(cells)
        
        # Regular text
        else:
            if in_table:
                # Build table
                if current_table:
                    # Calculate widths
                    num_cols = len(current_table[0])
                    col_width = (doc.width) / num_cols
                    t_data = []
                    for row in current_table:
                        t_row = [Paragraph(re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', cell), table_body_style) for cell in row]
                        t_data.append(t_row)
                    
                    t = Table(t_data, colWidths=[col_width]*num_cols)
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), GRIS_OSC),
                        ('TEXTCOLOR', (0, 0), (-1, 0), VERDE),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                        ('TOPPADDING', (0, 0), (-1, -1), 6),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ]))
                    story.append(Spacer(1, 10))
                    story.append(t)
                    story.append(Spacer(1, 10))
                in_table = False
                current_table = []
            
            if line:
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line).replace("✅", "✔️")
                story.append(Paragraph(text, body_style))

    # Add last table if exists
    if in_table and current_table:
        num_cols = len(current_table[0])
        col_width = (doc.width) / num_cols
        t_data = [[Paragraph(c, table_body_style) for c in row] for row in current_table]
        t = Table(t_data, colWidths=[col_width]*num_cols)
        t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), GRIS_OSC), ('GRID', (0,0), (-1,-1), 0.5, colors.grey)]))
        story.append(t)

    doc.build(story)
    print(f"✅ PDF generado con éxito: {OUTPUT_FILE}")

if __name__ == "__main__":
    build_pdf()
