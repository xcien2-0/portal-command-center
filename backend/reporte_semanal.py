"""
Reporte Semanal XCIEN 2.0
Genera PDF con KPIs de la semana y lo envía por Telegram.
Corre cada sábado via PM2 cron.
"""

import os
import io
import xmlrpc.client
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ── Credenciales ──────────────────────────────────────────────────────────────
ODOO_URL      = os.environ.get("ODOO_URL",      "https://odoo.wispi.mx")
ODOO_DB       = os.environ.get("ODOO_DB",       "wispi17")
ODOO_USER     = os.environ.get("ODOO_USER",     "miguel.macias@xcien.com")
ODOO_PASSWORD = os.environ.get("ODOO_PASSWORD", "Malpa501@")
TG_TOKEN      = os.environ.get("TELEGRAM_BOT_TOKEN")
TG_CHAT_ID    = os.environ.get("TELEGRAM_CHAT_ID")

CAST_TEAM_IDS = [6, 39, 60, 41, 44, 48, 67]

# ── Colores XCIEN ─────────────────────────────────────────────────────────────
C_DARK    = colors.HexColor("#0A0F1E")
C_BLUE    = colors.HexColor("#00B4D8")
C_GREEN   = colors.HexColor("#00ff88")
C_ORANGE  = colors.HexColor("#FF6B35")
C_YELLOW  = colors.HexColor("#FFB703")
C_LIGHT   = colors.HexColor("#E0E0E0")
C_MID     = colors.HexColor("#1A2035")
C_WHITE   = colors.white


def odoo_connect():
    common = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/common")
    uid    = common.authenticate(ODOO_DB, ODOO_USER, ODOO_PASSWORD, {})
    models = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/object")
    return uid, models


def get_week_range():
    today = datetime.now()
    start = today - timedelta(days=today.weekday() + 1)  # Lunes anterior (semana pasada)
    # Si hoy es sábado, la semana que queremos revisar es Mon-Fri de esta semana
    if today.weekday() == 5:  # sábado
        start = today - timedelta(days=5)
    end = start + timedelta(days=6)
    return start.replace(hour=0, minute=0, second=0), end.replace(hour=23, minute=59, second=59)


def fetch_field_service(uid, models, start, end):
    """Tareas Field Service de la semana."""
    start_str = start.strftime("%Y-%m-%d %H:%M:%S")
    end_str   = end.strftime("%Y-%m-%d %H:%M:%S")

    tasks = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, "project.task", "search_read",
        [[["project_id.name", "ilike", "field"],
          ["create_date", ">=", start_str],
          ["create_date", "<=", end_str]]],
        {"fields": ["id","name","stage_id","user_ids","create_date","date_last_stage_update"],
         "limit": 500})

    total     = len(tasks)
    cerradas  = sum(1 for t in tasks if t["stage_id"] and "done" in (t["stage_id"][1] or "").lower())
    abiertas  = total - cerradas
    tasa      = round(cerradas / total * 100, 1) if total else 0

    # Técnicos con más tareas
    tec_count: dict = {}
    for t in tasks:
        for uid_val in t.get("user_ids", []):
            tec_count[uid_val] = tec_count.get(uid_val, 0) + 1

    top_tec_id = max(tec_count, key=tec_count.get) if tec_count else None
    top_tec_name = "—"
    top_tec_tasks = 0
    if top_tec_id:
        top_tec_tasks = tec_count[top_tec_id]
        users = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, "res.users", "search_read",
            [[["id","=",top_tec_id]]], {"fields":["name"],"limit":1})
        top_tec_name = users[0]["name"] if users else str(top_tec_id)

    return {
        "total": total, "cerradas": cerradas, "abiertas": abiertas,
        "tasa": tasa, "top_tec": top_tec_name, "top_tec_tasks": top_tec_tasks,
        "tecnicos_activos": len(tec_count)
    }


def fetch_helpdesk(uid, models, start, end):
    """Tickets CAST (habilitaciones & fallas) de la semana."""
    start_str = start.strftime("%Y-%m-%d %H:%M:%S")
    end_str   = end.strftime("%Y-%m-%d %H:%M:%S")

    tickets = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, "helpdesk.ticket", "search_read",
        [[["team_id","in", CAST_TEAM_IDS],
          ["create_date",">=", start_str],
          ["create_date","<=", end_str]]],
        {"fields":["id","name","stage_id","ticket_type_id","priority","create_date","team_id"],
         "limit": 1000})

    total    = len(tickets)
    cerrados = sum(1 for t in tickets if t["stage_id"] and
                   any(k in (t["stage_id"][1] or "").lower() for k in ["done","cerr","resuel","close"]))
    abiertos = total - cerrados
    tasa     = round(cerrados / total * 100, 1) if total else 0

    # Split tipo
    habilitaciones = sum(1 for t in tickets if t.get("ticket_type_id") and
                         any(k in (t["ticket_type_id"][1] or "").lower() for k in ["habil","instal","alta"]))
    fallas = total - habilitaciones

    # Urgentes/críticos
    criticos = sum(1 for t in tickets if t.get("priority","0") in ["2","3"])

    return {
        "total": total, "cerrados": cerrados, "abiertos": abiertos,
        "tasa": tasa, "habilitaciones": habilitaciones, "fallas": fallas,
        "criticos": criticos
    }


def fetch_desempeno_top3(uid, models, start, end):
    """Top 3 técnicos por score en la semana."""
    start_str = start.strftime("%Y-%m-%d %H:%M:%S")

    tasks = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, "project.task", "search_read",
        [[["project_id.name","ilike","field"],
          ["create_date",">=", start_str]]],
        {"fields":["id","stage_id","user_ids","create_date"], "limit":500})

    if not tasks:
        return []

    all_user_ids = list({u for t in tasks for u in t.get("user_ids",[])})
    if not all_user_ids:
        return []

    users = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, "res.users", "search_read",
        [[["id","in",all_user_ids]]], {"fields":["id","name"],"limit":200})
    user_map = {u["id"]: u["name"] for u in users}

    stats: dict = {}
    for t in tasks:
        cerrada = t["stage_id"] and "done" in (t["stage_id"][1] or "").lower()
        for u in t.get("user_ids",[]):
            if u not in stats:
                stats[u] = {"nombre": user_map.get(u, str(u)), "total":0, "cerradas":0}
            stats[u]["total"] += 1
            if cerrada:
                stats[u]["cerradas"] += 1

    # Mensajes en chatter esta semana
    if stats:
        msgs = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, "mail.message", "search_read",
            [[["model","=","project.task"],
              ["message_type","=","comment"],
              ["date",">=", start_str]]],
            {"fields":["author_id","res_id"], "limit":2000})
        msg_by_name: dict = {}
        for m in msgs:
            name = m["author_id"][1] if m.get("author_id") else ""
            msg_by_name[name] = msg_by_name.get(name, 0) + 1

    max_vol = max((s["total"] for s in stats.values()), default=1)
    max_msgs = max(msg_by_name.values(), default=1) if stats else 1

    ranking = []
    for uid_val, s in stats.items():
        pct_res = (s["cerradas"] / s["total"] * 100) if s["total"] else 0
        pct_vol = (s["total"] / max_vol * 100)
        msgs_c  = msg_by_name.get(s["nombre"], 0)
        pct_doc = (msgs_c / max_msgs * 100)
        score   = round(pct_res * 0.35 + pct_doc * 0.35 + pct_vol * 0.30, 1)
        ranking.append({"nombre": s["nombre"], "score": score,
                        "total": s["total"], "cerradas": s["cerradas"],
                        "tasa": round(pct_res,1)})

    ranking.sort(key=lambda x: x["score"], reverse=True)
    return ranking[:3]


# ── PDF Builder ───────────────────────────────────────────────────────────────

def build_pdf(fs: dict, hd: dict, top3: list, start: datetime, end: datetime) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter,
                            leftMargin=0.75*inch, rightMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)

    styles = getSampleStyleSheet()
    S = lambda name, **kw: ParagraphStyle(name, **kw)

    sTitle   = S("sTitle",   fontSize=22, textColor=C_BLUE,  alignment=TA_CENTER, spaceAfter=4,
                              fontName="Helvetica-Bold")
    sSub     = S("sSub",     fontSize=10, textColor=C_LIGHT, alignment=TA_CENTER, spaceAfter=2,
                              fontName="Helvetica")
    sSection = S("sSection", fontSize=13, textColor=C_BLUE,  spaceAfter=6, spaceBefore=14,
                              fontName="Helvetica-Bold")
    sBody    = S("sBody",    fontSize=9,  textColor=C_LIGHT, spaceAfter=3, fontName="Helvetica")
    sKPI     = S("sKPI",     fontSize=28, textColor=C_GREEN, alignment=TA_CENTER, fontName="Helvetica-Bold")
    sKPIlbl  = S("sKPIlbl",  fontSize=8,  textColor=C_LIGHT, alignment=TA_CENTER, fontName="Helvetica")
    sRank    = S("sRank",    fontSize=10, textColor=C_WHITE, fontName="Helvetica-Bold")
    sRankSub = S("sRankSub", fontSize=8,  textColor=C_LIGHT, fontName="Helvetica")
    sFooter  = S("sFooter",  fontSize=7,  textColor=colors.grey, alignment=TA_CENTER)

    week_label = f"Semana del {start.strftime('%d %b')} al {end.strftime('%d %b %Y')}"
    num_semana = start.isocalendar()[1]

    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    story.append(Paragraph("⚡ XCIEN 2.0", sTitle))
    story.append(Paragraph(f"REPORTE SEMANAL — Semana {num_semana}", sSub))
    story.append(Paragraph(week_label, sSub))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1, color=C_BLUE))
    story.append(Spacer(1, 12))

    # ── KPIs Field Service ────────────────────────────────────────────────────
    story.append(Paragraph("🔧 FIELD SERVICE — Cuadrillas", sSection))

    kpi_data = [
        [Paragraph(str(fs["total"]),    sKPI), Paragraph(str(fs["cerradas"]), sKPI),
         Paragraph(str(fs["abiertas"]), sKPI), Paragraph(f"{fs['tasa']}%",    sKPI)],
        [Paragraph("Tareas Total",      sKPIlbl), Paragraph("Cerradas",       sKPIlbl),
         Paragraph("Abiertas",          sKPIlbl), Paragraph("Tasa Resolución", sKPIlbl)],
    ]
    kpi_table = Table(kpi_data, colWidths=[1.5*inch]*4)
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_MID),
        ("ROWBACKGROUNDS",(0,0), (-1,-1), [C_MID]),
        ("BOX",           (0,0), (-1,-1), 0.5, C_BLUE),
        ("INNERGRID",     (0,0), (-1,-1), 0.25, colors.HexColor("#2A3050")),
        ("ALIGN",         (0,0), (-1,-1), "CENTER"),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 8))

    fs_detail = [
        [Paragraph("Técnicos activos", sBody), Paragraph(str(fs["tecnicos_activos"]), sBody)],
        [Paragraph("Top técnico",      sBody), Paragraph(f"{fs['top_tec']} ({fs['top_tec_tasks']} tareas)", sBody)],
    ]
    fs_dt = Table(fs_detail, colWidths=[2.5*inch, 4*inch])
    fs_dt.setStyle(TableStyle([
        ("TEXTCOLOR",    (0,0), (-1,-1), C_LIGHT),
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("TOPPADDING",   (0,0), (-1,-1), 3),
        ("BOTTOMPADDING",(0,0), (-1,-1), 3),
        ("LINEBELOW",    (0,0), (-1,-1), 0.25, colors.HexColor("#2A3050")),
    ]))
    story.append(fs_dt)
    story.append(Spacer(1, 14))

    # ── KPIs Helpdesk ─────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#2A3050")))
    story.append(Paragraph("⚡ HABILITACIONES & FALLAS — CAST", sSection))

    hd_kpi = [
        [Paragraph(str(hd["total"]),    sKPI), Paragraph(str(hd["cerrados"]), sKPI),
         Paragraph(str(hd["abiertos"]), sKPI), Paragraph(f"{hd['tasa']}%",    sKPI)],
        [Paragraph("Tickets Total",     sKPIlbl), Paragraph("Cerrados",       sKPIlbl),
         Paragraph("Pendientes",        sKPIlbl), Paragraph("Tasa Resolución", sKPIlbl)],
    ]
    hd_table = Table(hd_kpi, colWidths=[1.5*inch]*4)
    hd_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_MID),
        ("BOX",           (0,0), (-1,-1), 0.5, C_ORANGE),
        ("INNERGRID",     (0,0), (-1,-1), 0.25, colors.HexColor("#2A3050")),
        ("ALIGN",         (0,0), (-1,-1), "CENTER"),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ]))
    story.append(hd_table)
    story.append(Spacer(1, 8))

    hd_detail = [
        [Paragraph("Habilitaciones", sBody), Paragraph(str(hd["habilitaciones"]), sBody)],
        [Paragraph("Fallas",         sBody), Paragraph(str(hd["fallas"]),         sBody)],
        [Paragraph("Críticos/Urgentes", sBody), Paragraph(str(hd["criticos"]),    sBody)],
    ]
    hd_dt = Table(hd_detail, colWidths=[2.5*inch, 4*inch])
    hd_dt.setStyle(TableStyle([
        ("TEXTCOLOR",    (0,0), (-1,-1), C_LIGHT),
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("TOPPADDING",   (0,0), (-1,-1), 3),
        ("BOTTOMPADDING",(0,0), (-1,-1), 3),
        ("LINEBELOW",    (0,0), (-1,-1), 0.25, colors.HexColor("#2A3050")),
    ]))
    story.append(hd_dt)
    story.append(Spacer(1, 14))

    # ── Top 3 Técnicos ────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#2A3050")))
    story.append(Paragraph("🏆 TOP TÉCNICOS DE LA SEMANA", sSection))

    medals = ["🥇", "🥈", "🥉"]
    rank_colors = [C_YELLOW, C_LIGHT, colors.HexColor("#CD7F32")]

    if top3:
        rank_rows = [[
            Paragraph(f"{medals[i]}  {t['nombre']}", sRank),
            Paragraph(f"Score: {t['score']}  |  {t['total']} tareas  |  {t['tasa']}% resolución", sRankSub)
        ] for i, t in enumerate(top3)]

        rank_table = Table(rank_rows, colWidths=[2.8*inch, 3.7*inch])
        rank_table.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), C_MID),
            ("ROWBACKGROUNDS",(0,0), (-1,-1), [C_MID]),
            ("BOX",           (0,0), (-1,-1), 0.5, C_YELLOW),
            ("INNERGRID",     (0,0), (-1,-1), 0.25, colors.HexColor("#2A3050")),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING",    (0,0), (-1,-1), 10),
            ("BOTTOMPADDING", (0,0), (-1,-1), 10),
            ("LEFTPADDING",   (0,0), (-1,-1), 12),
        ]))
        story.append(rank_table)
    else:
        story.append(Paragraph("Sin datos de técnicos esta semana.", sBody))

    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=C_BLUE))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"Generado automáticamente el {datetime.now().strftime('%d/%m/%Y %H:%M')} · XCIEN 2.0",
        sFooter))

    doc.build(story)
    return buf.getvalue()


# ── Telegram sender ───────────────────────────────────────────────────────────

def send_telegram(pdf_bytes: bytes, caption: str):
    url = f"https://api.telegram.org/bot{TG_TOKEN}/sendDocument"
    filename = f"reporte_xcien_semana_{datetime.now().isocalendar()[1]}.pdf"
    resp = requests.post(url, data={
        "chat_id": TG_CHAT_ID,
        "caption": caption,
        "parse_mode": "HTML"
    }, files={"document": (filename, pdf_bytes, "application/pdf")})
    resp.raise_for_status()
    return resp.json()


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"[{datetime.now()}] Iniciando reporte semanal...")

    uid, models = odoo_connect()
    start, end  = get_week_range()

    print(f"  Rango: {start.date()} → {end.date()}")

    print("  Obteniendo Field Service...")
    fs = fetch_field_service(uid, models, start, end)

    print("  Obteniendo Helpdesk CAST...")
    hd = fetch_helpdesk(uid, models, start, end)

    print("  Calculando desempeño...")
    top3 = fetch_desempeno_top3(uid, models, start, end)

    print("  Generando PDF...")
    pdf_bytes = build_pdf(fs, hd, top3, start, end)

    # Guardar copia local
    out_path = os.path.join(os.path.dirname(__file__), "static",
                            f"reporte_semana_{start.isocalendar()[1]}.pdf")
    with open(out_path, "wb") as f:
        f.write(pdf_bytes)
    print(f"  PDF guardado: {out_path} ({len(pdf_bytes)//1024} KB)")

    # Enviar Telegram
    semana = start.isocalendar()[1]
    caption = (
        f"📊 <b>Reporte Semanal XCIEN — Semana {semana}</b>\n"
        f"🗓 {start.strftime('%d %b')} – {end.strftime('%d %b %Y')}\n\n"
        f"🔧 Field Service: <b>{fs['total']}</b> tareas · <b>{fs['tasa']}%</b> resolución\n"
        f"⚡ CAST: <b>{hd['total']}</b> tickets · <b>{hd['tasa']}%</b> resolución\n"
        f"🏆 Top: <b>{top3[0]['nombre'] if top3 else '—'}</b>"
    )
    print("  Enviando Telegram...")
    send_telegram(pdf_bytes, caption)
    print("  ✅ Reporte enviado exitosamente.")


if __name__ == "__main__":
    main()
