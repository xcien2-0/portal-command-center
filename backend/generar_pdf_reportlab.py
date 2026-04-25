#!/usr/bin/env python3
import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def main():
    with open("db/reporte_mty_raw.json", "r", encoding="utf-8") as f:
        raw = json.load(f)

    tickets = raw["tickets"]
    tareas = raw["tareas"]
    ventas = raw["ventas"]
    leads = raw["leads"]
    empleados = raw["empleados"]
    hoy = raw["fecha"]

    pdf_filename = f"db/Reporte_Monterrey_Hoy_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    doc = SimpleDocTemplate(pdf_filename, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    subtitle_style = styles['Normal']
    subtitle_style.textColor = colors.gray
    
    elements.append(Paragraph("REPORTE OPERATIVO — PLAZA MONTERREY (HOY)", title_style))
    elements.append(Paragraph(f"Datos del día: {hoy}", subtitle_style))
    elements.append(Spacer(1, 20))
    
    # Resumen
    data_resumen = [
        ["Métrica", "Cantidad"],
        ["Tickets Helpdesk de Hoy", str(len(tickets))],
        ["Tareas de Hoy", str(len(tareas))],
        ["Ventas de Hoy", str(len(ventas))],
        ["Leads de Hoy", str(len(leads))],
        ["Empleados Registrados", str(len(empleados))]
    ]
    t = Table(data_resumen, colWidths=[200, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#00A859")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    # Helper para tablas
    def crear_tabla(titulo, headers, filas):
        elements.append(Paragraph(titulo, styles['Heading2']))
        if not filas:
            elements.append(Paragraph("No hay registros.", styles['Normal']))
            elements.append(Spacer(1, 10))
            return
            
        data = [headers] + filas
        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 15))

    # Tickets
    headers_tickets = ["Ticket", "Etapa", "Responsable", "Prioridad"]
    filas_tickets = []
    for t in tickets[:15]:
        stage = t.get("stage_id", [None, "-"])
        stage_name = stage[1] if isinstance(stage, list) else str(stage)
        user = t.get("user_id", [None, "-"])
        user_name = user[1] if isinstance(user, list) else str(user)
        filas_tickets.append([str(t.get('name', ''))[:30], stage_name[:15], user_name[:15], str(t.get('priority', ''))])
    crear_tabla(f"Tickets Helpdesk ({len(tickets)})", headers_tickets, filas_tickets)
    
    # Ventas
    headers_ventas = ["Orden", "Estado", "Monto"]
    filas_ventas = []
    for v in ventas[:15]:
        filas_ventas.append([str(v.get('name', '')), str(v.get('state', '')), f"${v.get('amount_total', 0):.2f}"])
    crear_tabla(f"Ventas de Hoy ({len(ventas)})", headers_ventas, filas_ventas)

    # Leads
    headers_leads = ["Lead", "Responsable", "Tipo"]
    filas_leads = []
    for l in leads[:15]:
        user = l.get("user_id", [None, "-"])
        user_name = user[1] if isinstance(user, list) else str(user)
        filas_leads.append([str(l.get('name', ''))[:30], user_name[:15], str(l.get('type', ''))])
    crear_tabla(f"Leads CRM ({len(leads)})", headers_leads, filas_leads)

    doc.build(elements)
    print(pdf_filename)

if __name__ == "__main__":
    main()
