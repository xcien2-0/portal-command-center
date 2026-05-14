#!/usr/bin/env python3
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def main():
    pdf_filename = f"Reporte_Incubadora_Agentes_{datetime.now().strftime('%Y%m%d')}.pdf"
    doc = SimpleDocTemplate(pdf_filename, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    
    # Estilo personalizado para el título
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor("#00ff88"),
        alignment=1, # Centro
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.gray,
        alignment=1,
        spaceAfter=30
    )

    body_style = styles['Normal']
    
    # Encabezado
    elements.append(Paragraph("REPORTE ESTRATÉGICO DE INCUBACIÓN", title_style))
    elements.append(Paragraph("GABINETE DE AGENTES XCIEN 2.0 — EVALUACIÓN DE PROYECTOS", subtitle_style))
    
    elements.append(Paragraph("<b>Resumen Ejecutivo:</b> El siguiente reporte presenta la evaluación de factibilidad técnica, comercial y legal de los proyectos actualmente en la incubadora. Cada agente ha emitido un juicio basado en el estado actual del mercado y la infraestructura de XCIEN.", body_style))
    elements.append(Spacer(1, 20))
    
    # Datos de Evaluación
    data = [
        ["PROYECTO", "AGENTE EVALUADOR", "OPINIÓN CONCISA", "PROCEDE"],
        ["Marketplace Calvillo", "Comercial", "Demanda validada en USA. Logística lista.", "SÍ"],
        ["Marketplace Calvillo", "Legal", "Requiere certificaciones FDA y exportación.", "SÍ"],
        ["Ecosistema Utopía", "Preventa", "Alta complejidad técnica. Modelo Fintech social.", "SÍ*"],
        ["Ecosistema Utopía", "Legal", "Regulación bancaria estricta en MX necesaria.", "SÍ"],
        ["X-Token Economy", "Odoo/ERP", "Integración nativa con wispi17 avanzada.", "SÍ"],
        ["X-Token Economy", "Legal", "Alineado con Ley Fintech. Activo 1:1 MXN.", "SÍ"],
        ["Tokenización (Bio)", "Academia", "Incentivo disruptivo para cultura laboral.", "SÍ"],
        ["Network Capacity", "NOC", "Uso de excedentes de red para liquidez.", "SÍ"],
    ]
    
    # Crear Tabla
    t = Table(data, colWidths=[120, 100, 240, 60])
    
    # Estilo de la Tabla
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#030508")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        # Color condicional para "SÍ"
        ('TEXTCOLOR', (3, 1), (3, -1), colors.darkgreen),
    ]))
    
    elements.append(t)
    elements.append(Spacer(1, 30))
    
    # Opinión del Orquestador
    elements.append(Paragraph("<b>Dictamen del Orquestador (Antigravity):</b>", styles['Heading3']))
    elements.append(Paragraph("Los proyectos de mayor viabilidad inmediata son <b>Marketplace Calvillo</b> y <b>X-Token Economy</b> debido a que la infraestructura técnica en Odoo ya soporta las operaciones base. <b>Ecosistema Utopía</b> es el proyecto de mayor impacto pero requiere una fase de cumplimiento regulatorio más extensa.", body_style))
    
    elements.append(Spacer(1, 40))
    elements.append(Paragraph(f"Generado automáticamente el {datetime.now().strftime('%d/%m/%Y %H:%M')}", subtitle_style))
    
    doc.build(elements)
    print(f"PDF generado exitosamente: {pdf_filename}")

if __name__ == "__main__":
    main()
