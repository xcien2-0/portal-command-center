#!/usr/bin/env python3
"""Genera la versión actualizada del Acta de Entrega-Recepción XCIEN — Junio 2026"""
import os

STYLE = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 48px; font-size: 12px; line-height: 1.6; }

.header { border-bottom: 4px solid #00C896; padding-bottom: 20px; margin-bottom: 28px; }
.header h1 { font-size: 20px; font-weight: 800; color: #002B5B; }
.header .sub { font-size: 12px; color: #555; margin-top: 4px; }
.meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 14px; background: #f7f9fc; border-radius: 8px; padding: 14px; border: 1px solid #e2e8f0; }
.meta-item label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #666; display: block; margin-bottom: 3px; }
.meta-item span { font-size: 12px; font-weight: 600; color: #002B5B; }
.badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; }
.badge-conf { background: #002B5B; color: #fff; }
.badge-v2 { background: #00C896; color: #fff; }

.pilar { margin-bottom: 30px; }
.pilar-header { background: #002B5B; color: #fff; padding: 10px 16px; border-radius: 6px 6px 0 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center; }
.pilar-body { border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px; padding: 16px; }
.progress-bar-wrap { background: #e2e8f0; border-radius: 20px; height: 8px; width: 120px; display: inline-block; vertical-align: middle; margin-left: 8px; }
.progress-bar { background: #00C896; height: 8px; border-radius: 20px; }
.progress-label { font-size: 12px; font-weight: 800; color: #00C896; }

h4 { font-size: 12px; font-weight: 700; color: #002B5B; margin: 14px 0 8px; border-left: 3px solid #00C896; padding-left: 8px; }

table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
th { background: #002B5B; color: #fff; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
tr:nth-child(even) td { background: #f7f9fc; }

.estado { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
.activo { background: #f0fff8; color: #276749; border: 1px solid #9ae6b4; }
.pendiente { background: #fffbeb; color: #744210; border: 1px solid #f6d860; }
.deprecado { background: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }

ul { padding-left: 16px; margin: 6px 0; }
li { margin-bottom: 4px; font-size: 12px; }

.cambio-box { background: #f0fff8; border: 1px solid #9ae6b4; border-radius: 6px; padding: 10px 14px; margin: 10px 0; font-size: 11px; color: #276749; }
.cambio-label { font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }

.resumen-table { margin-top: 8px; }

.firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px; }
.firma-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; text-align: center; }
.firma-linea { border-bottom: 1px solid #333; margin: 28px 0 6px; }
.firma-rol { font-size: 10px; color: #666; }
.firma-nombre { font-size: 12px; font-weight: 700; color: #002B5B; margin-top: 2px; }

.footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 10px; color: #999; }
.page-break { page-break-before: always; padding-top: 32px; }

.nota-version { background: #fffbeb; border: 1px solid #f6d860; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #744210; margin-bottom: 20px; }
"""

html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Acta Entrega-Recepción XCIEN 2.0 — Versión Actualizada</title>
<style>{STYLE}</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <h1>ACTA DE ENTREGA-RECEPCIÓN — XCIEN 2.0 <span class="badge badge-v2" style="font-size:11px;vertical-align:middle;margin-left:8px;">VERSIÓN ACTUALIZADA</span></h1>
  <div class="sub">Estandarización Operativa y Profesionalización del Capital Humano</div>
  <div class="meta-grid">
    <div class="meta-item">
      <label>Versión original</label>
      <span>22 de Abril de 2026</span>
    </div>
    <div class="meta-item">
      <label>Esta versión</label>
      <span>30 de Junio de 2026</span>
    </div>
    <div class="meta-item">
      <label>Clasificación</label>
      <span><span class="badge badge-conf">CONFIDENCIAL</span></span>
    </div>
    <div class="meta-item">
      <label>Responsable de entrega</label>
      <span>Operaciones / Digital</span>
    </div>
    <div class="meta-item">
      <label>Destinatario</label>
      <span>Dirección General · Rodrigo Flores</span>
    </div>
    <div class="meta-item">
      <label>Estado</label>
      <span>En proceso — 2 meses de avance</span>
    </div>
  </div>
</div>

<div class="nota-version">
  <strong>⟳ Nota de actualización:</strong> Este documento sustituye la versión del 22 de abril de 2026. Refleja el estado real al 30 de junio de 2026. Se incorporan los sistemas que entraron en operación, se retiran referencias obsoletas (Supabase, live-status-hub) y se actualizan los porcentajes de avance con base en lo implementado.
</div>

<!-- PILAR I -->
<div class="pilar">
  <div class="pilar-header">
    Pilar I — Estándares Técnicos y de Campo
    <span>
      <span class="progress-label">85%</span>
      <span class="progress-bar-wrap"><span class="progress-bar" style="width:85%"></span></span>
    </span>
  </div>
  <div class="pilar-body">

    <h4>1.1 Estándares de Instalación</h4>
    <table>
      <tr><th>Tipo</th><th>Altura</th><th>Herrajes</th><th>Ángulo / Separación</th><th>Estado</th></tr>
      <tr><td>Empotrado</td><td>3m máx</td><td>2 herrajes V</td><td>Sep. 30cm, pija broca</td><td><span class="estado activo">Vigente</span></td></tr>
      <tr><td>Tensado</td><td>3m / 6m</td><td>Anclajes a 120°</td><td>Ángulo 45°</td><td><span class="estado activo">Vigente</span></td></tr>
      <tr><td>Telescópico</td><td>12m</td><td>4 niveles de retenidas</td><td>Anclajes a 5m base</td><td><span class="estado activo">Vigente</span></td></tr>
    </table>

    <h4>1.2 Niveles de RF — Tabla de Referencia</h4>
    <table>
      <tr><th>Rango (dBi)</th><th>Estado</th><th>Acción</th></tr>
      <tr><td>35 – 45</td><td>Excelente</td><td>Proceder con instalación</td></tr>
      <tr><td>46 – 60</td><td>Aceptable</td><td>Documentar y notificar</td></tr>
      <tr><td>61 – 74</td><td>Degradado</td><td>Escalar a Ingeniería</td></tr>
      <tr><td>≥ 75</td><td>Crítico</td><td>No instalar — dictaminar No Factible</td></tr>
    </table>

    <h4>1.3 Protocolo de Calidad "Cero Basura"</h4>
    <ul>
      <li>Evidencia fotográfica obligatoria al cierre de cada servicio.</li>
      <li>Registro de tarea completada en Odoo (wispi17) con foto de sitio limpio.</li>
      <li>Auditoría aleatoria diaria: 1 instalación verificada por Supervisor o LO.</li>
    </ul>

    <h4>1.4 Flujos Operativos (sin cambios)</h4>
    <table>
      <tr><th>Flujo</th><th>Cadena</th></tr>
      <tr><td><strong>Implementación</strong></td><td>Venta → Comercial → PMO → Almacén → Ops Campo → Ingeniería → NOC (Liberación)</td></tr>
      <tr><td><strong>Soporte / Fallas</strong></td><td>Cliente → ATC (Ticket) → NOC L1/L2 → PMO → Ops Campo → Infra → Cierre</td></tr>
    </table>

    <div class="cambio-box">
      <div class="cambio-label">✅ Avance vs versión anterior</div>
      Los flujos están documentados en el portal XCIEN 2.0. El WFM registra el ciclo completo de cada orden de trabajo en tiempo real. Pendiente: validación formal con supervisores de campo.
    </div>
  </div>
</div>

<!-- PILAR II -->
<div class="pilar">
  <div class="pilar-header">
    Pilar II — Protocolo de Escalafón Técnico
    <span>
      <span class="progress-label">90%</span>
      <span class="progress-bar-wrap"><span class="progress-bar" style="width:90%"></span></span>
    </span>
  </div>
  <div class="pilar-body">

    <h4>2.1 Ruta: Auxiliar → Técnico de Instalación</h4>
    <table>
      <tr><th>#</th><th>Requisito Academia</th><th>Criterio</th><th>Estado</th></tr>
      <tr><td>1</td><td>Examen Teórico (Academia Digital)</td><td>Puntaje ≥ 90%</td><td><span class="estado activo">Activo en Odoo</span></td></tr>
      <tr><td>2</td><td>Seguridad Industrial — EPP / Alturas</td><td>Dominio verificado en campo</td><td><span class="estado activo">Curso activo</span></td></tr>
      <tr><td>3</td><td>RF Básico — Tabla de decibeles</td><td>Identificar rangos sin apoyo</td><td><span class="estado activo">Incluido en evaluación</span></td></tr>
    </table>

    <h4>Evaluación de Campo</h4>
    <table>
      <tr><th>#</th><th>Requisito</th><th>Criterio</th></tr>
      <tr><td>1</td><td>Instalaciones asistidas con Técnico Senior</td><td>Mínimo 15 servicios</td></tr>
      <tr><td>2</td><td>Cierre de tareas en Odoo con evidencia fotográfica</td><td>100% de servicios</td></tr>
      <tr><td>3</td><td>Inventario personal de herramientas</td><td>Completo y verificado</td></tr>
    </table>

    <h4>2.2 Ruta: Técnico → Líder de Operaciones (LO)</h4>
    <table>
      <tr><th>#</th><th>Competencia</th><th>Descripción</th></tr>
      <tr><td>1</td><td>Factibilidad Avanzada</td><td>Dictaminar sitios No Factibles — postes 3m, 6m y 12m telescópico</td></tr>
      <tr><td>2</td><td>Gestión ERP (Odoo)</td><td>Viáticos, materiales especiales y tickets en wispi17</td></tr>
      <tr><td>3</td><td>Liderazgo de Seguridad</td><td>Responsable de integridad física de la cuadrilla</td></tr>
      <tr><td>4</td><td>Supervisión de Cuadrilla</td><td>Auditoría de calidad, puntualidad y uniformidad</td></tr>
    </table>

    <div class="cambio-box">
      <div class="cambio-label">✅ Avance vs versión anterior</div>
      La Academia Digital está operativa en Odoo con 6 cursos técnicos activos, evaluaciones calificadas automáticamente y seguimiento de progreso individual. El escalafón ya puede medirse con datos reales — antes era solo intención.
    </div>
  </div>
</div>

<!-- PAGE BREAK -->
<div class="page-break"></div>

<!-- PILAR III -->
<div class="pilar">
  <div class="pilar-header">
    Pilar III — Ecosistema Digital y ERP
    <span>
      <span class="progress-label">90%</span>
      <span class="progress-bar-wrap"><span class="progress-bar" style="width:90%"></span></span>
    </span>
  </div>
  <div class="pilar-body">

    <h4>3.1 Estado de Herramientas — Junio 2026</h4>
    <table>
      <tr><th>Herramienta</th><th>Versión</th><th>Estado</th><th>Cambio vs Abril 2026</th></tr>
      <tr><td><strong>Odoo (wispi17)</strong></td><td>17</td><td><span class="estado activo">Activo</span></td><td>Sin cambios. Fuente principal de datos.</td></tr>
      <tr><td><strong>XCIEN 2.0 Portal</strong></td><td>2.0</td><td><span class="estado activo">Activo</span></td><td>🆕 Reemplaza live-status-hub. 25+ módulos operativos.</td></tr>
      <tr><td><strong>NOCBoard</strong></td><td>v3.9.6</td><td><span class="estado activo">Activo</span></td><td>🆕 Monitoreo SNMP expandido. Alertas energía.</td></tr>
      <tr><td><strong>Academia XCIEN</strong></td><td>1.0</td><td><span class="estado activo">Activo</span></td><td>🆕 6 cursos técnicos con evaluaciones reales en Odoo.</td></tr>
      <tr><td><strong>XCIEN 2.0 macOS</strong></td><td>1.0</td><td><span class="estado activo">Activo</span></td><td>🆕 App nativa Mac del portal.</td></tr>
      <tr><td><strong>Bots Telegram</strong></td><td>—</td><td><span class="estado activo">Activo</span></td><td>🆕 Alertas NOC + reportes automáticos periódicos.</td></tr>
      <tr><td><strong>Agente IA (Claude)</strong></td><td>Sonnet 4.6</td><td><span class="estado activo">Activo</span></td><td>Actualizado a Claude Sonnet 4.6.</td></tr>
      <tr><td><strong>Supabase</strong></td><td>—</td><td><span class="estado deprecado">Eliminado</span></td><td>🗑 Reemplazado por Odoo como fuente de datos real.</td></tr>
      <tr><td><strong>live-status-hub</strong></td><td>—</td><td><span class="estado deprecado">Eliminado</span></td><td>🗑 Reemplazado por XCIEN 2.0 Portal.</td></tr>
    </table>

    <h4>3.2 Módulos del Portal — Estado Actual</h4>
    <table>
      <tr><th>Módulo</th><th>Fuente de Datos</th><th>Estado Abril</th><th>Estado Junio</th></tr>
      <tr><td>NOC Virtual</td><td>Observium + SNMP</td><td><span class="estado pendiente">En desarrollo</span></td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Mapa de Red</td><td>Odoo running.services</td><td><span class="estado pendiente">En desarrollo</span></td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>WFM / Campo</td><td>Odoo project.task</td><td><span class="estado pendiente">En desarrollo</span></td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Inventario QR</td><td>Odoo stock.quant</td><td><span class="estado pendiente">En desarrollo</span></td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Academia</td><td>Odoo slide.channel</td><td><span class="estado pendiente">En desarrollo</span></td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>RRHH / Directorio</td><td>Odoo hr.employee</td><td><span class="estado pendiente">En desarrollo</span></td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Infraestructura Energía</td><td>SNMP (Samlex)</td><td>No existía</td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Impacto Operacional</td><td>Multi-fuente</td><td>No existía</td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Gerencia / Ventas</td><td>Odoo sale.order</td><td><span class="estado pendiente">En desarrollo</span></td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Sala de Juntas</td><td>Odoo calendar</td><td>No existía</td><td><span class="estado activo">Activo</span></td></tr>
    </table>

    <h4>3.3 Operadores Activos en Plataforma (sin cambios)</h4>
    <table>
      <tr><th>Operador</th><th>Región</th><th>Estado</th></tr>
      <tr><td>XCIEN</td><td>Nuevo León / Jalisco</td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Wispi</td><td>Nuevo León / Jalisco</td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Luminet WAN</td><td>Coahuila</td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Huus</td><td>CDMX / Gto / Qro</td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Sandur</td><td>—</td><td><span class="estado activo">Activo</span></td></tr>
    </table>

    <div class="cambio-box">
      <div class="cambio-label">✅ Avance vs versión anterior — Pilar III</div>
      El Pilar III pasó de 60% a 90%. La diferencia: todos los módulos marcados "En desarrollo" en abril están operativos hoy. Se eliminaron las dependencias de Supabase y live-status-hub, reemplazadas por Odoo como única fuente de verdad.
    </div>
  </div>
</div>

<!-- PILAR IV -->
<div class="pilar">
  <div class="pilar-header">
    Pilar IV — Estructura Organizacional
    <span>
      <span class="progress-label">70%</span>
      <span class="progress-bar-wrap"><span class="progress-bar" style="width:70%"></span></span>
    </span>
  </div>
  <div class="pilar-body">

    <h4>4.1 Modelo de Gobernanza XCIEN 2.0</h4>
    <table>
      <tr><th>Área</th><th>Responsabilidad</th><th>Estado</th></tr>
      <tr><td>Dirección General</td><td>Orquestación estratégica y decisiones de escalafón</td><td><span class="estado activo">Activo</span></td></tr>
      <tr><td>Operaciones</td><td>Calidad técnica y seguridad en campo</td><td><span class="estado pendiente">En consolidación</span></td></tr>
      <tr><td>RRHH / Academia</td><td>Capacitación, evaluación y escalafón técnico</td><td><span class="estado pendiente">En consolidación</span></td></tr>
      <tr><td>Almacén</td><td>Control de entradas, salidas y transferencias</td><td><span class="estado pendiente">Requiere atención</span></td></tr>
      <tr><td>NOC / Dispatch</td><td>Monitoreo de red y gestión de incidentes</td><td><span class="estado activo">Activo</span></td></tr>
    </table>

    <h4>4.2 Cobertura Estratégica (sin cambios)</h4>
    <table>
      <tr><th>Región</th><th>Operador</th></tr>
      <tr><td>Nuevo León / Jalisco</td><td>XCIEN / Wispi</td></tr>
      <tr><td>Coahuila</td><td>Luminet WAN</td></tr>
      <tr><td>CDMX / Gto / Qro</td><td>Huus</td></tr>
    </table>
  </div>
</div>

<!-- RESUMEN DE AVANCE -->
<div class="pilar">
  <div class="pilar-header">Resumen de Avance — Comparativo</div>
  <div class="pilar-body">
    <table class="resumen-table">
      <tr><th>Pilar</th><th>Avance Abril 2026</th><th>Avance Junio 2026</th><th>Δ</th><th>Siguiente paso</th></tr>
      <tr>
        <td><strong>I — Estándares Técnicos</strong></td>
        <td>80%</td>
        <td><strong style="color:#276749">85%</strong></td>
        <td style="color:#276749">+5%</td>
        <td>Validar con supervisores en campo</td>
      </tr>
      <tr>
        <td><strong>II — Escalafón Técnico</strong></td>
        <td>90%</td>
        <td><strong style="color:#276749">90%</strong></td>
        <td style="color:#666">—</td>
        <td>Activar como criterio en evaluación de desempeño</td>
      </tr>
      <tr>
        <td><strong>III — Ecosistema Digital</strong></td>
        <td>60%</td>
        <td><strong style="color:#276749">90%</strong></td>
        <td style="color:#276749">+30%</td>
        <td>Autenticación y acceso diferenciado por rol</td>
      </tr>
      <tr>
        <td><strong>IV — Organización</strong></td>
        <td>70%</td>
        <td><strong style="color:#c05621">70%</strong></td>
        <td style="color:#c05621">0%</td>
        <td>Definir responsables con métricas por área</td>
      </tr>
    </table>

    <div style="background:#fff5f5;border:1px solid #fed7d7;border-radius:6px;padding:12px 16px;margin-top:14px;font-size:11px;">
      <strong style="color:#c53030;">⚠ Nota importante:</strong> El Pilar IV no avanzó porque requiere decisiones organizacionales que dependen de la dirección — no de tecnología. El sistema digital está listo para soportar la estructura; la estructura aún no se define con claridad suficiente para que el sistema la refleje.
    </div>
  </div>
</div>

<!-- FIRMAS -->
<div class="pilar">
  <div class="pilar-header">Firmas de Autorización — Versión Actualizada</div>
  <div class="pilar-body">
    <div class="firmas">
      <div class="firma-box">
        <div class="firma-linea"></div>
        <div class="firma-nombre">Director General</div>
        <div class="firma-rol">Orquestación estratégica</div>
      </div>
      <div class="firma-box">
        <div class="firma-linea"></div>
        <div class="firma-nombre">Rodrigo Flores</div>
        <div class="firma-rol">Gerente de Operaciones</div>
      </div>
      <div class="firma-box">
        <div class="firma-linea"></div>
        <div class="firma-nombre">Responsable de RRHH</div>
        <div class="firma-rol">Capacitación y escalafón</div>
      </div>
      <div class="firma-box">
        <div class="firma-linea"></div>
        <div class="firma-nombre">José Miguel Macías</div>
        <div class="firma-rol">Responsable Digital / Operaciones</div>
      </div>
    </div>
  </div>
</div>

<div class="footer">
  XCIEN Networks · Acta de Entrega-Recepción V2 · 30 de Junio de 2026 · Uso interno — Confidencial<br>
  Documento generado por XCIEN 2.0 · Única Fuente de Verdad
</div>

</body>
</html>"""

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "acta_v2_actualizada.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(html)
print(f"✅ HTML V2 generado: {out}")
