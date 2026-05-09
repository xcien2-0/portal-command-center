import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.units import inch

# Rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
MD_FILE = os.path.join(PROJECT_ROOT, "ENTREGA_RECEPCION_XCIEN.md")
OUTPUT_PDF = os.path.join(BASE_DIR, "db", "ACTA_ENTREGA_RECEPCION_XCIEN_2026.pdf")

def create_handover_pdf():
    if not os.path.exists(MD_FILE):
        print(f"Error: {MD_FILE} not found")
        return

    doc = SimpleDocTemplate(OUTPUT_PDF, pagesize=letter, rightMargin=0.75*inch, leftMargin=0.75*inch, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    
    # Estilos Ejecutivos
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#002B5B'),
        spaceAfter=20,
        alignment=1, # Center
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#00A859'),
        spaceAfter=15,
        alignment=1,
        fontName='Helvetica-Bold'
    )

    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.white,
        backColor=colors.HexColor('#002B5B'),
        spaceBefore=15,
        spaceAfter=10,
        leftIndent=5,
        rightIndent=5,
        fontName='Helvetica-Bold',
        textTransform='uppercase'
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        spaceAfter=6
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=body_style,
        fontSize=9,
        textColor=colors.whitesmoke,
        fontName='Helvetica-Bold'
    )

    elements = []

    # Header con metadatos
    elements.append(Paragraph("XCIEN 2.0 - ECOSISTEMA DE INTELIGENCIA OPERATIVA", 
                             ParagraphStyle('HeaderLine', fontSize=8, textColor=colors.grey, alignment=2)))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceAfter=20))

    with open(MD_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    current_table_data = []
    in_table = False

    for line in lines:
        line = line.strip()
        if not line:
            if in_table:
                # Build table
                t = Table(current_table_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 1.5*inch])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#002B5B')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
                ]))
                elements.append(t)
                elements.append(Spacer(1, 10))
                current_table_data = []
                in_table = False
            continue

        if line.startswith("# "):
            elements.append(Paragraph(line[2:], title_style))
        elif line.startswith("## "):
            elements.append(Paragraph(line[3:], subtitle_style))
        elif line.startswith("### "):
            elements.append(Paragraph(line[4:], section_style))
        elif "|" in line:
            if "---" in line: continue
            parts = [p.strip() for p in line.split("|") if p.strip()]
            current_table_data.append(parts)
            in_table = True
        elif line.startswith("- "):
            elements.append(Paragraph(f"• {line[2:]}", body_style))
        elif "**" in line:
            # Simple conversion for bold
            clean = line.replace("**", "<b>", 1).replace("**", "</b>", 1)
            elements.append(Paragraph(clean, body_style))
        else:
            elements.append(Paragraph(line, body_style))

    # Footer
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceBefore=20, spaceAfter=5))
    elements.append(Paragraph(f"Acta Generada Automáticamente por Antigravity IA | {datetime.now().strftime('%d/%m/%Y %H:%M')}", 
                             ParagraphStyle('Footer', fontSize=8, textColor=colors.grey, alignment=1)))

    doc.build(elements)
    print(f"✅ Acta PDF generada: {OUTPUT_PDF}")

if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_PDF), exist_ok=True)
    create_handover_pdf()
