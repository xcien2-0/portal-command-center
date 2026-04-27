#!/usr/bin/env python3
"""
XCIEN 2.0 — Generador de Reporte PDF Plaza Monterrey
Usa datos reales extraídos de Odoo wispi17
"""
import json
import os
from datetime import datetime

# ─── Cargar datos ─────────────────────────────────────────────────────────────
with open("db/reporte_mty_raw.json", "r", encoding="utf-8") as f:
    raw = json.load(f)

tickets = raw["tickets"]
tareas = raw["tareas"]
ventas = raw["ventas"]
leads = raw["leads"]
empleados = raw["empleados"]
hoy = datetime.now().strftime("%d de abril de %Y")
hora = datetime.now().strftime("%H:%M")

# ─── Análisis de datos ────────────────────────────────────────────────────────
# Tickets por etapa
ticket_stages = {}
for t in tickets:
    stage = t.get("stage_id", [None, "Sin etapa"])
    stage_name = stage[1] if isinstance(stage, list) else str(stage)
    ticket_stages[stage_name] = ticket_stages.get(stage_name, 0) + 1

# Tickets por prioridad
ticket_priority = {"0": 0, "1": 0, "2": 0, "3": 0}
for t in tickets:
    p = str(t.get("priority", "0"))
    ticket_priority[p] = ticket_priority.get(p, 0) + 1
priority_labels = {"0": "Normal", "1": "Baja", "2": "Alta", "3": "Urgente"}

# Leads por tipo
lead_types = {}
for l in leads:
    lt = l.get("type", "lead")
    lead_types[lt] = lead_types.get(lt, 0) + 1

# Ventas por estado
sales_states = {}
total_revenue = 0
for s in ventas:
    st = s.get("state", "draft")
    sales_states[st] = sales_states.get(st, 0) + 1
    total_revenue += s.get("amount_total", 0)

state_labels = {"draft": "Borrador", "sent": "Enviada", "sale": "Confirmada", "done": "Cerrada", "cancel": "Cancelada"}

# ─── Generar HTML para PDF ────────────────────────────────────────────────────
html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Inter', -apple-system, sans-serif; background: #fff; color: #1a1a1a; padding: 40px 50px; font-size: 11px; }}
  
  .header {{ display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #00A859; padding-bottom: 20px; margin-bottom: 30px; }}
  .header h1 {{ font-size: 22px; font-weight: 800; color: #1a1a1a; }}
  .header .sub {{ color: #666; font-size: 12px; margin-top: 4px; }}
  .header .meta {{ text-align: right; font-size: 10px; color: #888; }}
  .header .meta .badge {{ background: #00A859; color: white; padding: 3px 10px; border-radius: 4px; font-weight: 700; font-size: 9px; display: inline-block; margin-bottom: 4px; }}
  
  .kpi-row {{ display: flex; gap: 16px; margin-bottom: 30px; }}
  .kpi {{ flex: 1; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; padding: 16px; text-align: center; }}
  .kpi .num {{ font-size: 28px; font-weight: 800; color: #00A859; }}
  .kpi .label {{ font-size: 10px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }}
  
  h2 {{ font-size: 14px; font-weight: 800; color: #1a1a1a; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #eee; }}
  h2 .icon {{ margin-right: 6px; }}
  
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }}
  th {{ background: #f1f3f5; color: #495057; padding: 8px 10px; text-align: left; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }}
  td {{ padding: 8px 10px; border-bottom: 1px solid #f1f3f5; }}
  tr:hover td {{ background: #f8fff8; }}
  
  .tag {{ display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; }}
  .tag-green {{ background: #d4edda; color: #155724; }}
  .tag-yellow {{ background: #fff3cd; color: #856404; }}
  .tag-red {{ background: #f8d7da; color: #721c24; }}
  .tag-blue {{ background: #d1ecf1; color: #0c5460; }}
  .tag-gray {{ background: #e9ecef; color: #495057; }}
  
  .two-col {{ display: flex; gap: 20px; }}
  .two-col > div {{ flex: 1; }}
  
  .bar-row {{ display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }}
  .bar-label {{ width: 120px; font-size: 10px; color: #666; }}
  .bar-track {{ flex: 1; height: 8px; background: #f1f3f5; border-radius: 4px; overflow: hidden; }}
  .bar-fill {{ height: 100%; border-radius: 4px; }}
  .bar-val {{ width: 35px; text-align: right; font-size: 10px; font-weight: 700; }}
  
  .footer {{ margin-top: 40px; padding-top: 16px; border-top: 2px solid #00A859; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; }}
  
  .section {{ page-break-inside: avoid; }}
  
  @media print {{
    body {{ padding: 20px 30px; }}
    .kpi-row {{ gap: 10px; }}
  }}
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>REPORTE OPERATIVO — PLAZA MONTERREY</h1>
    <div class="sub">Fuente: Odoo wispi17 · Datos en tiempo real · {hoy}</div>
  </div>
  <div class="meta">
    <div class="badge">XCIEN 2.0</div><br>
    Generado: {hoy} a las {hora}<br>
    Sistema: Director General AI<br>
    Clasificación: INTERNO
  </div>
</div>

<!-- KPIs -->
<div class="kpi-row">
  <div class="kpi">
    <div class="num">{len(tickets)}</div>
    <div class="label">Tickets Helpdesk</div>
  </div>
  <div class="kpi">
    <div class="num">{len(leads)}</div>
    <div class="label">Leads CRM</div>
  </div>
  <div class="kpi">
    <div class="num">{len(ventas)}</div>
    <div class="label">Órdenes de Venta</div>
  </div>
  <div class="kpi">
    <div class="num" style="color:#f39c12;">${total_revenue:,.2f}</div>
    <div class="label">Revenue Total</div>
  </div>
  <div class="kpi">
    <div class="num">{len(empleados)}</div>
    <div class="label">Personal en Plaza</div>
  </div>
</div>

<!-- TICKETS -->
<div class="section">
<h2><span class="icon">🎫</span> Tickets Helpdesk ({len(tickets)})</h2>
<div class="two-col">
  <div>
    <h3 style="font-size:11px; margin-bottom:8px; color:#666;">Distribución por Etapa</h3>
"""

# Barras de etapas
max_stage = max(ticket_stages.values()) if ticket_stages else 1
for stage, count in sorted(ticket_stages.items(), key=lambda x: -x[1]):
    pct = int((count / max_stage) * 100)
    html += f"""    <div class="bar-row">
      <div class="bar-label">{stage[:25]}</div>
      <div class="bar-track"><div class="bar-fill" style="width:{pct}%; background:#00A859;"></div></div>
      <div class="bar-val">{count}</div>
    </div>\n"""

html += """  </div>
  <div>
    <h3 style="font-size:11px; margin-bottom:8px; color:#666;">Por Prioridad</h3>
"""
for p_key, p_count in ticket_priority.items():
    label = priority_labels.get(p_key, p_key)
    color = "#00A859" if p_key == "0" else "#f39c12" if p_key in ["1","2"] else "#e74c3c"
    pct = int((p_count / max(sum(ticket_priority.values()), 1)) * 100)
    html += f"""    <div class="bar-row">
      <div class="bar-label">{label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:{pct}%; background:{color};"></div></div>
      <div class="bar-val">{p_count}</div>
    </div>\n"""

html += """  </div>
</div>

<table>
<thead><tr><th>#</th><th>Ticket</th><th>Etapa</th><th>Responsable</th><th>Prioridad</th><th>Fecha</th></tr></thead>
<tbody>
"""

for i, t in enumerate(tickets[:20]):
    stage = t.get("stage_id", [None, "-"])
    stage_name = stage[1] if isinstance(stage, list) else str(stage)
    user = t.get("user_id", [None, "Sin asignar"])
    user_name = user[1] if isinstance(user, list) else str(user)
    prio = str(t.get("priority", "0"))
    prio_label = priority_labels.get(prio, prio)
    prio_class = "tag-green" if prio == "0" else "tag-yellow" if prio in ["1","2"] else "tag-red"
    created = str(t.get("create_date", ""))[:10]
    html += f"""<tr>
  <td>{i+1}</td>
  <td><strong>{t.get('name','N/A')[:50]}</strong></td>
  <td><span class="tag tag-blue">{stage_name[:20]}</span></td>
  <td>{user_name[:25]}</td>
  <td><span class="tag {prio_class}">{prio_label}</span></td>
  <td>{created}</td>
</tr>\n"""

if len(tickets) > 20:
    html += f'<tr><td colspan="6" style="text-align:center; color:#888; font-style:italic;">... y {len(tickets)-20} tickets más</td></tr>\n'

html += """</tbody></table>
</div>

<!-- LEADS CRM -->
<div class="section">
"""
html += f'<h2><span class="icon">🎯</span> Pipeline CRM ({len(leads)})</h2>\n'

html += """<table>
<thead><tr><th>#</th><th>Lead / Oportunidad</th><th>Etapa</th><th>Responsable</th><th>Tipo</th><th>Revenue Esperado</th></tr></thead>
<tbody>
"""
for i, l in enumerate(leads[:20]):
    stage = l.get("stage_id", [None, "-"])
    stage_name = stage[1] if isinstance(stage, list) else str(stage)
    user = l.get("user_id", [None, "Sin asignar"])
    user_name = user[1] if isinstance(user, list) else str(user)
    ltype = "Oportunidad" if l.get("type") == "opportunity" else "Lead"
    type_class = "tag-green" if ltype == "Oportunidad" else "tag-gray"
    rev = l.get("expected_revenue", 0)
    html += f"""<tr>
  <td>{i+1}</td>
  <td><strong>{l.get('name','N/A')[:45]}</strong></td>
  <td><span class="tag tag-blue">{stage_name[:20]}</span></td>
  <td>{user_name[:25]}</td>
  <td><span class="tag {type_class}">{ltype}</span></td>
  <td>${rev:,.2f}</td>
</tr>\n"""

if len(leads) > 20:
    html += f'<tr><td colspan="6" style="text-align:center; color:#888; font-style:italic;">... y {len(leads)-20} leads más</td></tr>\n'

html += """</tbody></table>
</div>

<!-- VENTAS -->
<div class="section">
"""
html += f'<h2><span class="icon">💰</span> Órdenes de Venta ({len(ventas)}) — Total: ${total_revenue:,.2f} MXN</h2>\n'

html += """<table>
<thead><tr><th>#</th><th>Orden</th><th>Cliente</th><th>Estado</th><th>Monto</th><th>Fecha</th></tr></thead>
<tbody>
"""
for i, s in enumerate(ventas):
    partner = s.get("partner_id", [None, "-"])
    partner_name = partner[1] if isinstance(partner, list) else str(partner)
    state = s.get("state", "draft")
    state_label = state_labels.get(state, state)
    state_class = "tag-green" if state in ["sale","done"] else "tag-yellow" if state == "sent" else "tag-gray"
    amount = s.get("amount_total", 0)
    date_o = str(s.get("date_order", ""))[:10]
    html += f"""<tr>
  <td>{i+1}</td>
  <td><strong>{s.get('name','N/A')}</strong></td>
  <td>{partner_name[:30]}</td>
  <td><span class="tag {state_class}">{state_label}</span></td>
  <td><strong>${amount:,.2f}</strong></td>
  <td>{date_o}</td>
</tr>\n"""

html += """</tbody></table>
</div>

<!-- PERSONAL -->
<div class="section">
"""
html += f'<h2><span class="icon">👷</span> Personal en Plaza ({len(empleados)})</h2>\n'

html += """<table>
<thead><tr><th>#</th><th>Nombre</th><th>Puesto</th><th>Departamento</th><th>Email</th></tr></thead>
<tbody>
"""
for i, emp in enumerate(empleados):
    dept = emp.get("department_id", [None, "-"])
    dept_name = dept[1] if isinstance(dept, list) else str(dept)
    html += f"""<tr>
  <td>{i+1}</td>
  <td><strong>{emp.get('name','N/A')}</strong></td>
  <td>{emp.get('job_title','') or '-'}</td>
  <td>{dept_name[:25]}</td>
  <td>{emp.get('work_email','') or '-'}</td>
</tr>\n"""

html += f"""</tbody></table>
</div>

<div class="footer">
  <div>XCIEN 2.0 — Reporte generado automáticamente desde Odoo wispi17</div>
  <div>Clasificación: USO INTERNO · Plaza: Monterrey, NL · {hoy}</div>
</div>

</body></html>"""

# ─── Guardar HTML ──────────────────────────────────────────────────────────────
output_html = "db/reporte_monterrey_{}.html".format(datetime.now().strftime("%Y%m%d"))
with open(output_html, "w", encoding="utf-8") as f:
    f.write(html)
print(f"✅ HTML generado: {output_html}")

# ─── Convertir a PDF con weasyprint o wkhtmltopdf ─────────────────────────────
pdf_path = "db/Reporte_Monterrey_{}.pdf".format(datetime.now().strftime("%Y%m%d"))

# Intentar con weasyprint primero
try:
    from weasyprint import HTML
    HTML(string=html).write_pdf(pdf_path)
    print(f"✅ PDF generado con WeasyPrint: {pdf_path}")
except ImportError:
    # Intentar con pdfkit/wkhtmltopdf
    try:
        import subprocess
        result = subprocess.run(
            ["/usr/local/bin/wkhtmltopdf", "--quiet", "--page-size", "Letter",
             "--margin-top", "10mm", "--margin-bottom", "10mm",
             output_html, pdf_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            print(f"✅ PDF generado con wkhtmltopdf: {pdf_path}")
        else:
            # Último recurso: usar el comando de macOS
            subprocess.run(
                ["python3", "-c", f"""
import subprocess
subprocess.run(['/usr/sbin/cupsfilter', '{output_html}'], 
    stdout=open('{pdf_path}', 'wb'), stderr=subprocess.DEVNULL)
"""], timeout=30)
            if os.path.exists(pdf_path):
                print(f"✅ PDF generado: {pdf_path}")
            else:
                print(f"⚠️ No se pudo generar PDF automáticamente.")
                print(f"   Abre {output_html} en el navegador y usa Cmd+P > Guardar como PDF")
                print(f"   O instala: pip3 install weasyprint")
    except Exception as e:
        print(f"⚠️ No se pudo generar PDF: {e}")
        print(f"   Abre {output_html} en el navegador y usa Cmd+P > Guardar como PDF")

print(f"\n📊 RESUMEN PLAZA MONTERREY:")
print(f"   🎫 {len(tickets)} tickets helpdesk")
print(f"   🎯 {len(leads)} leads CRM")  
print(f"   💰 {len(ventas)} órdenes de venta (${total_revenue:,.2f} MXN)")
print(f"   👷 {len(empleados)} empleados")
