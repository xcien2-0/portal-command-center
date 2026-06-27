#!/usr/bin/env python3
"""
Solicitud formal de acceso — Depuración ERP Odoo
Formato institucional XCIEN Networks
"""
import os, datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Table, TableStyle, Paragraph,
                                 Spacer, HRFlowable, KeepTogether)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

VERDE     = colors.HexColor("#00A859")
NEGRO     = colors.HexColor("#111111")
GRIS_OSC  = colors.HexColor("#333333")
GRIS_MED  = colors.HexColor("#555555")
GRIS_CLAR = colors.HexColor("#F5F5F5")
GRIS_LIN  = colors.HexColor("#DDDDDD")
BLANCO    = colors.white
AZUL      = colors.HexColor("#1D4ED8")

NOW    = datetime.datetime.now()
FECHA  = NOW.strftime("%d de %B de %Y")
FOLIO  = f"SOL-TI-{NOW.strftime('%Y%m%d')}-001"


def generar_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=22*mm, rightMargin=22*mm,
        topMargin=22*mm, bottomMargin=22*mm,
    )
    W, H = letter
    story = []

    # ── Estilos ───────────────────────────────────────────────────────────
    def st(name, **kw):
        base = dict(fontName="Helvetica", fontSize=10, textColor=NEGRO,
                    alignment=TA_LEFT, spaceAfter=0, spaceBefore=0, leading=14)
        base.update(kw)
        return ParagraphStyle(name, **base)

    s_org      = st("org",   fontSize=13, fontName="Helvetica-Bold", textColor=VERDE, alignment=TA_CENTER)
    s_doc      = st("doc",   fontSize=10, textColor=GRIS_MED, alignment=TA_CENTER)
    s_title    = st("ttl",   fontSize=15, fontName="Helvetica-Bold", textColor=NEGRO, alignment=TA_CENTER, spaceAfter=2)
    s_sub      = st("sub",   fontSize=9,  textColor=GRIS_MED, alignment=TA_CENTER)
    s_body     = st("body",  fontSize=9.5, textColor=NEGRO, alignment=TA_JUSTIFY, leading=15)
    s_bold     = st("bld",   fontSize=9.5, fontName="Helvetica-Bold", textColor=NEGRO, alignment=TA_LEFT)
    s_th       = st("th",    fontSize=8.5, fontName="Helvetica-Bold", textColor=BLANCO, alignment=TA_CENTER)
    s_td       = st("td",    fontSize=8.5, textColor=NEGRO, alignment=TA_LEFT, leading=12)
    s_tdc      = st("tdc",   fontSize=8.5, textColor=NEGRO, alignment=TA_CENTER, leading=12)
    s_sec      = st("sec",   fontSize=10,  fontName="Helvetica-Bold", textColor=VERDE, alignment=TA_LEFT, spaceAfter=4)
    s_firma    = st("frm",   fontSize=9,   textColor=NEGRO, alignment=TA_CENTER, leading=13)
    s_folio    = st("fol",   fontSize=8,   textColor=GRIS_MED, alignment=TA_RIGHT)

    # ── Encabezado ────────────────────────────────────────────────────────
    story.append(Paragraph("XCIEN Networks", s_org))
    story.append(Paragraph("Dirección de Tecnologías de la Información", s_doc))
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="100%", thickness=2, color=VERDE, spaceAfter=3*mm))

    story.append(Paragraph("SOLICITUD FORMAL DE ACCESO", s_title))
    story.append(Paragraph("Depuración y Saneamiento del ERP Odoo (wispi17)", s_sub))
    story.append(Spacer(1, 5*mm))

    # Bloque de datos del documento
    meta = [
        [Paragraph("Folio:", s_bold),    Paragraph(FOLIO, s_td),
         Paragraph("Fecha:", s_bold),    Paragraph(FECHA, s_td)],
        [Paragraph("Solicitante:", s_bold), Paragraph("José Miguel Macías Contreras", s_td),
         Paragraph("Área:", s_bold),     Paragraph("Dirección de Operaciones / Field Service", s_td)],
        [Paragraph("Dirigido a:", s_bold),  Paragraph("Área de Tecnologías de la Información — XCIEN Networks", s_td),
         Paragraph("Prioridad:", s_bold), Paragraph("Alta", st("pri", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#E53935"), alignment=TA_LEFT))],
    ]
    meta_t = Table(meta, colWidths=[28*mm, 62*mm, 24*mm, 55*mm])
    meta_t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), GRIS_CLAR),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING",  (0,0),(-1,-1), 5),
        ("LINEBELOW",    (0,0),(-1,-1), 0.4, GRIS_LIN),
        ("BOX",          (0,0),(-1,-1), 0.8, VERDE),
    ]))
    story.append(meta_t)
    story.append(Spacer(1, 6*mm))

    # ── 1. Antecedentes ───────────────────────────────────────────────────
    story.append(Paragraph("1. Antecedentes", s_sec))
    story.append(HRFlowable(width="100%", thickness=0.6, color=VERDE, spaceAfter=3*mm))
    story.append(Paragraph(
        "En el marco del proyecto de transformación digital <b>XCIEN 2.0</b>, se realizó un diagnóstico "
        "técnico del estado actual del ERP Odoo (instancia <b>wispi17</b>). El análisis, ejecutado "
        "mediante consultas directas a la API de Odoo, reveló una acumulación significativa de datos "
        "obsoletos que impactan negativamente el rendimiento del sistema, la calidad de los reportes "
        "operativos y la experiencia de los usuarios.", s_body))
    story.append(Spacer(1, 4*mm))

    # ── 2. Hallazgos ──────────────────────────────────────────────────────
    story.append(Paragraph("2. Hallazgos del Diagnóstico", s_sec))
    story.append(HRFlowable(width="100%", thickness=0.6, color=VERDE, spaceAfter=3*mm))

    hallazgos = [
        [Paragraph("Módulo", s_th), Paragraph("Hallazgo", s_th),
         Paragraph("Cantidad", s_th), Paragraph("Impacto", s_th)],
        [Paragraph("Helpdesk", s_td),
         Paragraph("Tickets abiertos sin actividad (zombie)", s_td),
         Paragraph("45,406", st("num", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#E53935"), alignment=TA_CENTER)),
         Paragraph("Alto", st("imp", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#E53935"), alignment=TA_CENTER))],
        [Paragraph("Helpdesk", s_td),
         Paragraph("Tickets con más de 1 año sin cerrar", s_td),
         Paragraph("15,331", st("num", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#F59E0B"), alignment=TA_CENTER)),
         Paragraph("Alto", st("imp", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#E53935"), alignment=TA_CENTER))],
        [Paragraph("Project", s_td),
         Paragraph("Tareas abiertas sin actividad (zombie)", s_td),
         Paragraph("44,468", st("num", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#E53935"), alignment=TA_CENTER)),
         Paragraph("Alto", st("imp", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#E53935"), alignment=TA_CENTER))],
        [Paragraph("Project", s_td),
         Paragraph("Tareas con más de 1 año sin cerrar", s_td),
         Paragraph("7,853", st("num", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#F59E0B"), alignment=TA_CENTER)),
         Paragraph("Alto", st("imp", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#E53935"), alignment=TA_CENTER))],
        [Paragraph("RRHH", s_td),
         Paragraph("Empleados activos sin correo electrónico", s_td),
         Paragraph("110 de 242", s_tdc),
         Paragraph("Medio", st("imp2", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#F59E0B"), alignment=TA_CENTER))],
        [Paragraph("RRHH", s_td),
         Paragraph("Empleados activos sin cuenta de usuario Odoo", s_td),
         Paragraph("133 de 242", s_tdc),
         Paragraph("Medio", st("imp2", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#F59E0B"), alignment=TA_CENTER))],
        [Paragraph("eLearning", s_td),
         Paragraph("Usuarios externos inscritos en Academia (no empleados)", s_td),
         Paragraph("~498", s_tdc),
         Paragraph("Medio", st("imp2", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#F59E0B"), alignment=TA_CENTER))],
        [Paragraph("Etapas", s_td),
         Paragraph("Etapas duplicadas en Helpdesk (ej. 5 etapas 'New')", s_td),
         Paragraph("Multiple", s_tdc),
         Paragraph("Medio", st("imp2", fontSize=8.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#F59E0B"), alignment=TA_CENTER))],
    ]
    hall_t = Table(hallazgos, colWidths=[28*mm, 88*mm, 24*mm, 20*mm], repeatRows=1)
    hall_t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,0), NEGRO),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[BLANCO, GRIS_CLAR]),
        ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING",  (0,0),(-1,-1), 5),
        ("LINEBELOW",    (0,0),(-1,-1), 0.3, GRIS_LIN),
        ("BOX",          (0,0),(-1,-1), 0.5, GRIS_LIN),
    ]))
    story.append(hall_t)
    story.append(Spacer(1, 6*mm))

    # ── 3. Accesos solicitados ─────────────────────────────────────────────
    story.append(Paragraph("3. Accesos y Permisos Solicitados", s_sec))
    story.append(HRFlowable(width="100%", thickness=0.6, color=VERDE, spaceAfter=3*mm))

    accesos = [
        [Paragraph("Módulo / Recurso", s_th), Paragraph("Nivel de acceso", s_th),
         Paragraph("Justificación", s_th)],
        [Paragraph("Helpdesk", s_td),
         Paragraph("Administrador de equipo", st("acc", fontSize=8.5, fontName="Helvetica-Bold", textColor=AZUL, alignment=TA_LEFT)),
         Paragraph("Cerrar y archivar tickets obsoletos masivamente", s_td)],
        [Paragraph("Project", s_td),
         Paragraph("Administrador de proyectos", st("acc", fontSize=8.5, fontName="Helvetica-Bold", textColor=AZUL, alignment=TA_LEFT)),
         Paragraph("Cancelar y archivar tareas zombie por proyecto", s_td)],
        [Paragraph("RRHH / Empleados", s_td),
         Paragraph("Administrador de RRHH", st("acc", fontSize=8.5, fontName="Helvetica-Bold", textColor=AZUL, alignment=TA_LEFT)),
         Paragraph("Completar datos faltantes: correos, usuarios, jefes directos", s_td)],
        [Paragraph("eLearning / Academia", s_td),
         Paragraph("Administrador eLearning", st("acc", fontSize=8.5, fontName="Helvetica-Bold", textColor=AZUL, alignment=TA_LEFT)),
         Paragraph("Depurar inscripciones de usuarios externos no empleados", s_td)],
        [Paragraph("Contactos / Partners", s_td),
         Paragraph("Administrador", st("acc", fontSize=8.5, fontName="Helvetica-Bold", textColor=AZUL, alignment=TA_LEFT)),
         Paragraph("Archivar partners duplicados o sin relación activa", s_td)],
        [Paragraph("API XML-RPC", s_td),
         Paragraph("Usuario con permisos de escritura", st("acc", fontSize=8.5, fontName="Helvetica-Bold", textColor=AZUL, alignment=TA_LEFT)),
         Paragraph("Ejecutar scripts de limpieza masiva controlada por lotes", s_td)],
        [Paragraph("Modo Desarrollador", s_td),
         Paragraph("Activado en sesión de usuario", st("acc", fontSize=8.5, fontName="Helvetica-Bold", textColor=AZUL, alignment=TA_LEFT)),
         Paragraph("Acceso al menú Técnico para gestión directa desde la UI", s_td)],
    ]
    acc_t = Table(accesos, colWidths=[35*mm, 45*mm, 79*mm], repeatRows=1)
    acc_t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,0), NEGRO),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[BLANCO, GRIS_CLAR]),
        ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING",  (0,0),(-1,-1), 5),
        ("LINEBELOW",    (0,0),(-1,-1), 0.3, GRIS_LIN),
        ("BOX",          (0,0),(-1,-1), 0.5, GRIS_LIN),
    ]))
    story.append(acc_t)
    story.append(Spacer(1, 6*mm))

    # ── 4. Plan de trabajo ────────────────────────────────────────────────
    story.append(Paragraph("4. Plan de Trabajo Propuesto", s_sec))
    story.append(HRFlowable(width="100%", thickness=0.6, color=VERDE, spaceAfter=3*mm))

    plan = [
        [Paragraph("Fase", s_th), Paragraph("Actividad", s_th),
         Paragraph("Responsable", s_th), Paragraph("Plazo est.", s_th)],
        [Paragraph("1", s_tdc), Paragraph("Respaldo completo de base de datos Odoo antes de cualquier acción", s_td),
         Paragraph("TI", s_tdc), Paragraph("Día 1", s_tdc)],
        [Paragraph("2", s_tdc), Paragraph("Cierre masivo de tickets Helpdesk zombie (+1 año sin actividad)", s_td),
         Paragraph("Operaciones / TI", s_tdc), Paragraph("Días 2-3", s_tdc)],
        [Paragraph("3", s_tdc), Paragraph("Cancelación de tareas Project zombie (+1 año sin actividad)", s_td),
         Paragraph("Operaciones / TI", s_tdc), Paragraph("Días 3-4", s_tdc)],
        [Paragraph("4", s_tdc), Paragraph("Completar datos RRHH: correos, usuarios Odoo y jefes directos", s_td),
         Paragraph("RRHH / TI", s_tdc), Paragraph("Días 5-10", s_tdc)],
        [Paragraph("5", s_tdc), Paragraph("Depuración de inscripciones externas en Academia eLearning", s_td),
         Paragraph("Academia / TI", s_tdc), Paragraph("Días 6-7", s_tdc)],
        [Paragraph("6", s_tdc), Paragraph("Fusión de etapas duplicadas en Helpdesk y normalización", s_td),
         Paragraph("TI", s_tdc), Paragraph("Día 8", s_tdc)],
        [Paragraph("7", s_tdc), Paragraph("Configuración de regla de auto-cierre para tickets resueltos +7 días", s_td),
         Paragraph("TI", s_tdc), Paragraph("Día 9", s_tdc)],
        [Paragraph("8", s_tdc), Paragraph("Validación final y reporte de resultados", s_td),
         Paragraph("Operaciones / TI", s_tdc), Paragraph("Día 10", s_tdc)],
    ]
    plan_t = Table(plan, colWidths=[10*mm, 95*mm, 32*mm, 22*mm], repeatRows=1)
    plan_t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,0), NEGRO),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[BLANCO, GRIS_CLAR]),
        ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING",  (0,0),(-1,-1), 5),
        ("LINEBELOW",    (0,0),(-1,-1), 0.3, GRIS_LIN),
        ("BOX",          (0,0),(-1,-1), 0.5, GRIS_LIN),
    ]))
    story.append(plan_t)
    story.append(Spacer(1, 5*mm))

    # ── 5. Compromisos ────────────────────────────────────────────────────
    story.append(Paragraph("5. Compromisos del Solicitante", s_sec))
    story.append(HRFlowable(width="100%", thickness=0.6, color=VERDE, spaceAfter=3*mm))
    compromisos = [
        "No se eliminará ningún registro de forma permanente — únicamente se archivarán o cerrarán.",
        "Toda acción masiva será ejecutada por lotes pequeños con validación previa.",
        "Se generará un reporte de cada acción ejecutada para trazabilidad completa.",
        "El acceso solicitado será utilizado exclusivamente para las actividades descritas en este documento.",
        "Se solicitará la revocación de los permisos elevados una vez concluido el proceso de saneamiento.",
    ]
    for i, c in enumerate(compromisos, 1):
        story.append(Paragraph(f"{'  '}{'▸'} {c}", s_body))
        story.append(Spacer(1, 1.5*mm))

    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width="100%", thickness=0.4, color=GRIS_LIN, spaceAfter=6*mm))

    # ── Firmas ────────────────────────────────────────────────────────────
    firmas = [
        [Paragraph("_" * 38, s_firma), Paragraph("", s_firma), Paragraph("_" * 38, s_firma)],
        [Paragraph("José Miguel Macías Contreras", s_firma), Paragraph("", s_firma),
         Paragraph("Responsable de TI / Autorizante", s_firma)],
        [Paragraph("Solicitante · Operaciones", st("sf2", fontSize=8, textColor=GRIS_MED, alignment=TA_CENTER)), Paragraph("", s_firma),
         Paragraph("Área de Tecnologías de la Información", st("sf2", fontSize=8, textColor=GRIS_MED, alignment=TA_CENTER))],
        [Paragraph(f"Fecha: {FECHA}", st("sf3", fontSize=8, textColor=GRIS_MED, alignment=TA_CENTER)), Paragraph("", s_firma),
         Paragraph("Fecha de autorización: _______________", st("sf3", fontSize=8, textColor=GRIS_MED, alignment=TA_CENTER))],
    ]
    firma_t = Table(firmas, colWidths=[75*mm, 15*mm, 75*mm])
    firma_t.setStyle(TableStyle([
        ("VALIGN",  (0,0),(-1,-1), "MIDDLE"),
        ("TOPPADDING",   (0,0),(-1,-1), 3),
        ("BOTTOMPADDING",(0,0),(-1,-1), 3),
    ]))
    story.append(firma_t)

    # ── Footer ────────────────────────────────────────────────────────────
    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 6.5)
        canvas.setFillColor(GRIS_MED)
        canvas.drawString(22*mm, 14*mm, f"Folio: {FOLIO}")
        canvas.drawCentredString(W/2, 14*mm, "XCIEN Networks · Solicitud Formal de Acceso — ERP Odoo")
        canvas.drawRightString(W - 22*mm, 14*mm, f"Página {doc.page}")
        canvas.setStrokeColor(VERDE)
        canvas.setLineWidth(1)
        canvas.line(22*mm, 17*mm, W - 22*mm, 17*mm)
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"✓ PDF generado: {output_path}")


if __name__ == "__main__":
    out = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..",
                     f"solicitud_acceso_odoo_{NOW.strftime('%Y%m%d')}.pdf"))
    generar_pdf(out)

    try:
        import requests, pathlib
        TOKEN   = os.environ.get("TELEGRAM_BOT_TOKEN", "")
        CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
        if TOKEN and CHAT_ID:
            cap = (f"📄 Solicitud Formal de Acceso — ERP Odoo\n"
                   f"Folio: {FOLIO}\n"
                   f"Solicitante: José Miguel Macías Contreras\n"
                   f"Dirigido a: Área de TI · XCIEN Networks")
            with open(out, "rb") as f:
                r = requests.post(f"https://api.telegram.org/bot{TOKEN}/sendDocument",
                    data={"chat_id": CHAT_ID, "caption": cap},
                    files={"document": (pathlib.Path(out).name, f, "application/pdf")}, timeout=30)
            print("✓ Telegram OK" if r.status_code == 200 else f"  Telegram: {r.text[:80]}")
    except Exception as ex:
        print(f"  Telegram skip: {ex}")

    os.system(f'open "{out}"')
