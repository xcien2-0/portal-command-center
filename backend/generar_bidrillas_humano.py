import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable
from reportlab.lib.units import inch

# Rutas
MD_FILE = "/Users/mesquite/Proyectos/XCIEN2.0/PROYECTO_BIDRILLAS_2026.md"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PDF = os.path.join(BASE_DIR, "db", "PROYECTO_BIDRILLAS_2026_EJECUTIVO.pdf")

def create_human_pdf():
    if not os.path.exists(MD_FILE):
        print(f"Error: {MD_FILE} not found")
        return

    doc = SimpleDocTemplate(OUTPUT_PDF, pagesize=letter, rightMargin=inch, leftMargin=inch, topMargin=inch, bottomMargin=inch)
    styles = getSampleStyleSheet()
    
    # Estilos de "Higiene Documental"
    main_title = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.black,
        spaceAfter=10,
        alignment=0, # Left
        fontName='Helvetica-Bold'
    )
    
    sub_title = ParagraphStyle(
        'SubTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#00A859'),
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )

    section_header = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=colors.black,
        spaceBefore=15,
        spaceAfter=10,
        fontName='Helvetica-Bold',
        textTransform='uppercase'
    )

    profile_title = ParagraphStyle(
        'ProfileTitle',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#00A859'),
        spaceBefore=10,
        spaceAfter=5,
        fontName='Helvetica-Bold'
    )

    body_text = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=10.5,
        leading=13,
        alignment=4, # Justified
        spaceAfter=8
    )

    bullet_text = ParagraphStyle(
        'BulletText',
        parent=body_text,
        leftIndent=15,
        spaceAfter=4
    )

    meta_text = ParagraphStyle(
        'Meta',
        parent=body_text,
        fontSize=9,
        textColor=colors.grey
    )

    elements = []

    # Logo/Header
    elements.append(Paragraph("XCIEN OPERACIONES ESTRATÉGICAS 2026", meta_text))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceBefore=2, spaceAfter=20))

    with open(MD_FILE, "r", encoding="utf-8") as f:
        content = f.read().split('\n')

    # Procesamiento inteligente (sin markdown noise)
    for i, line in enumerate(content):
        line = line.strip()
        if not line:
            continue
            
        # Primera línea es el título
        if i == 0:
            elements.append(Paragraph(line, main_title))
        # Segunda línea es el subtítulo
        elif i == 1:
            elements.append(Paragraph(line, sub_title))
        # Metadatos iniciales
        elif ":" in line and i < 8:
            elements.append(Paragraph(line, meta_text))
        # Encabezados de sección (INTRODUCCIÓN, COMPOSICIÓN, etc.)
        elif line.isupper() and len(line) > 3:
            elements.append(Spacer(1, 0.1 * inch))
            elements.append(Paragraph(line, section_header))
        # Títulos de Perfiles (1. AUXILIAR TÉCNICO, etc.)
        elif line[0:1].isdigit() and "." in line[0:3]:
            elements.append(Paragraph(line, profile_title))
        # Etiquetas internas de perfiles (Objetivo:, Responsabilidades:, etc.)
        elif line.endswith(":") or "Objetivo:" in line:
            elements.append(Paragraph(f"<b>{line}</b>", body_text))
        # Balazos/Listas (vienen con "- ")
        elif line.startswith("- "):
            elements.append(Paragraph(f"• {line[2:]}", bullet_text))
        # Párrafos normales
        else:
            elements.append(Paragraph(line, body_text))

    # Footer
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceBefore=20, spaceAfter=5))
    elements.append(Paragraph(f"Documento de Uso Interno Confidencial | Generado por XCIEN AI el {datetime.now().strftime('%d/%m/%Y')}", 
                             ParagraphStyle('Footer', parent=meta_text, alignment=1)))

    doc.build(elements)
    print(f"✅ PDF Humano generado exitosamente: {OUTPUT_PDF}")

if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_PDF), exist_ok=True)
    create_human_pdf()
