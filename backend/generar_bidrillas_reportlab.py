import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import inch

# Rutas
MD_FILE = "/Users/mesquite/Proyectos/XCIEN2.0/PROYECTO_BIDRILLAS_2026.md"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PDF = os.path.join(BASE_DIR, "db", "PROYECTO_BIDRILLAS_2026.pdf")

def create_pdf():
    if not os.path.exists(MD_FILE):
        print(f"Error: {MD_FILE} not found")
        return

    doc = SimpleDocTemplate(OUTPUT_PDF, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    styles = getSampleStyleSheet()
    
    # Estilos personalizados
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#00A859'),
        spaceAfter=12,
        alignment=1, # Center
        fontName='Helvetica-Bold'
    )
    
    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor('#00A859'),
        spaceBefore=12,
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )

    body_style = styles['Normal']
    body_style.fontSize = 11
    body_style.leading = 14

    elements = []

    # Logo/Header simulation
    elements.append(Paragraph("<b>XCIEN 2.0 — OPERACIONES ESTRATÉGICAS</b>", ParagraphStyle('Sub', parent=body_style, alignment=1, textColor=colors.grey)))
    elements.append(Spacer(1, 0.2 * inch))

    with open(MD_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    current_table_data = []
    in_table = False

    for line in lines:
        line = line.strip()
        if not line:
            if in_table:
                # Terminar tabla
                t = Table(current_table_data, hAlign='LEFT')
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#00A859')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9f9f9')),
                    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                ]))
                elements.append(t)
                elements.append(Spacer(1, 0.2 * inch))
                current_table_data = []
                in_table = False
            continue

        if line.startswith("# "):
            elements.append(Paragraph(line[2:], title_style))
            elements.append(Spacer(1, 0.2 * inch))
        elif line.startswith("## "):
            elements.append(Paragraph(line[3:], h2_style))
        elif line.startswith("|") and "---" not in line:
            in_table = True
            cells = [c.strip() for c in line.split("|") if c.strip()]
            current_table_data.append(cells)
        elif line.startswith("- "):
            elements.append(Paragraph(f"• {line[2:]}", body_style))
        elif line.startswith("> "):
            elements.append(Paragraph(f"<i>{line[2:]}</i>", ParagraphStyle('Quote', parent=body_style, leftIndent=20, textColor=colors.darkgreen)))
        elif not in_table:
            elements.append(Paragraph(line, body_style))
            elements.append(Spacer(1, 0.05 * inch))

    # Footer
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(Paragraph(f"Generado el {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Dirección General XCIEN", 
                             ParagraphStyle('Footer', parent=body_style, fontSize=8, textColor=colors.grey, alignment=1)))

    doc.build(elements)
    print(f"✅ PDF generado exitosamente: {OUTPUT_PDF}")

if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_PDF), exist_ok=True)
    create_pdf()
