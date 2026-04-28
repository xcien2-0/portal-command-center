#!/usr/bin/env python3
import os
import subprocess
from datetime import datetime

# Datos del FODA Real (War Room)
hoy = datetime.now().strftime("%d de abril de %Y")
nombre_reporte = "ANÁLISIS ESTRATÉGICO FODA — XCIEN 2.0"
autor = "Miguel Macías (Dirección General)"

# HTML simplificado para máxima compatibilidad con cupsfilter (sin CSS avanzado)
html_content = f"""
<html>
<head>
<meta charset="UTF-8">
<style>
  body {{ font-family: sans-serif; padding: 50px; color: #333; }}
  .header {{ border-bottom: 5px solid #00C896; padding-bottom: 20px; margin-bottom: 30px; }}
  h1 {{ font-size: 28px; margin: 0; color: #000; }}
  .meta {{ font-size: 14px; color: #666; margin-top: 10px; }}
  
  table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
  th {{ background: #f0f0f0; padding: 15px; text-align: left; font-size: 18px; border: 1px solid #ddd; }}
  td {{ padding: 20px; border: 1px solid #ddd; vertical-align: top; width: 50%; }}
  
  .label-f {{ color: #2f855a; }}
  .label-o {{ color: #2b6cb0; }}
  .label-d {{ color: #c05621; }}
  .label-a {{ color: #c53030; }}
  
  ul {{ padding-left: 20px; }}
  li {{ margin-bottom: 10px; font-size: 14px; }}
  
  .footer {{ margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }}
</style>
</head>
<body>

<div class="header">
  <h1>{nombre_reporte}</h1>
  <div class="meta">
    <b>Preparado para:</b> {autor}<br>
    <b>Fecha:</b> {hoy} | <b>Clasificación:</b> CONFIDENCIAL
  </div>
</div>

<table>
  <tr>
    <th><span class="label-f">💪 FORTALEZAS</span></th>
    <th><span class="label-o">🚀 OPORTUNIDADES</span></th>
  </tr>
  <tr>
    <td>
      <ul>
        <li><b>Motor Antigravity:</b> Operación 100% offline con IA local.</li>
        <li><b>Estándares Xcien:</b> Manuales técnicos integrados en la Academia.</li>
        <li><b>Red en Vivo:</b> Monitoreo de 153 nodos en tiempo real.</li>
        <li><b>Tokenización:</b> Trazabilidad criptográfica de RH.</li>
      </ul>
    </td>
    <td>
      <ul>
        <li><b>Migración a Fibra:</b> Up-selling de microondas a FO.</li>
        <li><b>IA Predictiva:</b> Detección de fallas antes del reporte.</li>
        <li><b>Expansión:</b> Escalabilidad del modelo a nuevas plazas.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <th><span class="label-d">⚠️ DEBILIDADES</span></th>
    <th><span class="label-a">🔥 AMENAZAS</span></th>
  </tr>
  <tr>
    <td>
      <ul>
        <li><b>Integración Odoo:</b> Dependencia de sync manual temporal.</li>
        <li><b>Brecha Técnica:</b> Necesidad de recertificación del 30% del personal.</li>
        <li><b>Latencia Rural:</b> Infraestructura antigua en zonas remotas.</li>
      </ul>
    </td>
    <td>
      <ul>
        <li><b>Starlink:</b> Competencia en sectores rurales/residenciales.</li>
        <li><b>Rotación:</b> Fuga de técnicos certificados a la competencia.</li>
        <li><b>Costos Energía:</b> Incremento en tarifas eléctricas de nodos.</li>
      </ul>
    </td>
  </tr>
</table>

<div class="footer">
  XCIEN 2.0 — Reporte de Inteligencia Corporativa | Generado por Director General AI
</div>

</body>
</html>
"""

temp_html = os.path.abspath("backend/db/foda_temp.html")
output_pdf = os.path.abspath("backend/db/FODA_XCIEN_2026.pdf")

with open(temp_html, "w", encoding="utf-8") as f:
    f.write(html_content)

try:
    # Usar cupsfilter con ruta absoluta
    with open(output_pdf, "wb") as f_pdf:
        subprocess.run(["/usr/sbin/cupsfilter", temp_html], stdout=f_pdf, stderr=subprocess.PIPE)
    
    if os.path.exists(output_pdf) and os.path.getsize(output_pdf) > 0:
        print(f"✅ PDF generado exitosamente ({os.path.getsize(output_pdf)} bytes)")
        os.remove(temp_html)
    else:
        print("❌ Error: El PDF se generó vacío o no se creó.")
except Exception as e:
    print(f"❌ Error: {e}")
