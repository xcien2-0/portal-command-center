#!/usr/bin/env python3
"""
Módulo de Integridad Comercial — detección de anomalías en ventas y retenciones.
Expone: GET /api/integridad/comercial
"""

import re, os, calendar
import xmlrpc.client
from datetime import datetime, timedelta
from fastapi import APIRouter

router = APIRouter(prefix="/api/integridad", tags=["integridad"])

SCORE_MAP = {"CRITICO": 4, "ALTO": 3, "MEDIO": 2, "INFO": 1}


def _odoo():
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)
    URL  = os.getenv("ODOO_URL",      "https://odoo.wispi.mx")
    DB   = os.getenv("ODOO_DB",       "wispi17")
    USER = os.getenv("ODOO_USER",     "")
    PASS = os.getenv("ODOO_PASSWORD", "")
    uid  = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/common").authenticate(DB, USER, PASS, {})
    mdl  = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/object")
    return mdl, DB, uid, PASS


def _strip(html: str) -> str:
    txt = re.sub(r"<[^>]+>", " ", html or "")
    return re.sub(r"\s+", " ", txt).strip()


def _score(flags):
    return sum(SCORE_MAP.get(f["tipo"], 0) for f in flags)


def _riesgo(score):
    if score >= 7: return "CRITICO"
    if score >= 4: return "ALTO"
    if score >= 2: return "MEDIO"
    return "BAJO"


# ── Anomalías para sale.order ────────────────────────────────────────────────
def _flags_order(o, dias, sin_entrega, sin_factura, actores, chatter_texts):
    flags = []
    state = o.get("state", "")
    en_venta   = state in ("sale", "done")
    cancelada  = state == "cancel"

    # Fin de mes — confirmada en los últimos 3 días del mes
    fin_de_mes = False
    try:
        fd = datetime.fromisoformat(o.get("date_order", "").replace(" ", "T"))
        last_day = calendar.monthrange(fd.year, fd.month)[1]
        fin_de_mes = fd.day >= last_day - 2
    except Exception:
        pass

    # Pausa explícita en chatter
    pausa_en_chatter = any(
        "pausa" in t.lower() or "no se libera" in t.lower()
        for t in chatter_texts
    )

    if en_venta and sin_entrega and sin_factura:
        if dias > 60:
            flags.append({"tipo": "CRITICO", "label": f"Sin entrega ni factura — {dias} días"})
        elif dias > 30:
            flags.append({"tipo": "ALTO",    "label": f"Sin entrega ni factura — {dias} días"})
        elif fin_de_mes:
            flags.append({"tipo": "MEDIO",   "label": "Confirmada fin de mes sin entrega"})

    if cancelada and sin_entrega:
        flags.append({"tipo": "ALTO", "label": "Cancelada sin entrega registrada"})

    if pausa_en_chatter and sin_entrega and dias > 15:
        flags.append({"tipo": "ALTO", "label": "En pausa manualmente — sin entrega"})

    if len(actores) <= 1 and en_venta and dias > 15:
        flags.append({"tipo": "MEDIO", "label": "Un solo actor en todo el historial"})

    if fin_de_mes and en_venta and sin_factura and not (sin_entrega and dias <= 30):
        flags.append({"tipo": "MEDIO", "label": "Creada fin de mes — sin facturar"})

    return flags


@router.get("/comercial")
def get_integridad_comercial(dias_ventana: int = 180):
    try:
        return _get_integridad(dias_ventana)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail=f"Odoo no disponible: {str(e)}")


def _get_integridad(dias_ventana: int):
    mdl, DB, uid, PASS = _odoo()
    now   = datetime.now()
    desde = (now - timedelta(days=dias_ventana)).strftime("%Y-%m-%d")

    # ── 1. Órdenes de venta ──────────────────────────────────────────────────
    orders = mdl.execute_kw(DB, uid, PASS, "sale.order", "search_read",
        [[["date_order", ">=", desde]]],
        {"fields": ["id", "name", "partner_id", "user_id", "team_id", "state",
                    "date_order", "amount_total", "invoice_ids"],
         "order": "date_order desc", "limit": 300})

    order_ids = [o["id"] for o in orders]

    # ── 2. Líneas → entrega ──────────────────────────────────────────────────
    lines = mdl.execute_kw(DB, uid, PASS, "sale.order.line", "search_read",
        [[["order_id", "in", order_ids], ["product_id.type", "!=", "service"]]],
        {"fields": ["order_id", "qty_delivered", "product_uom_qty"]})

    delivery = {}
    for l in lines:
        oid = l["order_id"][0]
        d   = delivery.setdefault(oid, {"ordered": 0, "delivered": 0})
        d["ordered"]   += l.get("product_uom_qty", 0) or 0
        d["delivered"] += l.get("qty_delivered",   0) or 0

    # ── 3. Chatter ───────────────────────────────────────────────────────────
    msgs = mdl.execute_kw(DB, uid, PASS, "mail.message", "search_read",
        [[["res_id", "in", order_ids], ["model", "=", "sale.order"]]],
        {"fields": ["res_id", "author_id", "date", "body", "message_type"],
         "order": "date desc", "limit": 2000})

    chatter_actors = {}   # order_id → set(autor)
    chatter_notes  = {}   # order_id → [{autor, fecha, texto}]
    chatter_texts  = {}   # order_id → [texto plano]
    for m in msgs:
        oid    = m["res_id"]
        autor  = (m.get("author_id") or ["", "?"])[1]
        body   = _strip(m.get("body", "") or "")
        fecha  = (m.get("date") or "")[:10]
        if m.get("message_type") not in ("notification", "auto_comment"):
            chatter_actors.setdefault(oid, set()).add(autor)
        if body:
            chatter_notes.setdefault(oid, []).append(
                {"autor": autor, "fecha": fecha, "texto": body[:250]})
            chatter_texts.setdefault(oid, []).append(body.lower())

    # ── 4. Analizar cada orden ───────────────────────────────────────────────
    alertas = []
    for o in orders:
        oid   = o["id"]
        state = o.get("state", "")
        try:
            fd   = datetime.fromisoformat(o["date_order"].replace(" ", "T"))
            dias = (now - fd).days
        except Exception:
            dias = 0

        dl          = delivery.get(oid, {"ordered": 0, "delivered": 0})
        sin_entrega = dl["delivered"] == 0 and dl["ordered"] > 0
        sin_factura = len(o.get("invoice_ids") or []) == 0
        actores     = chatter_actors.get(oid, set())
        textos      = chatter_texts.get(oid, [])
        notas       = (chatter_notes.get(oid) or [])[-4:]

        flags = _flags_order(o, dias, sin_entrega, sin_factura, actores, textos)
        if not flags:
            continue

        sc = _score(flags)
        alertas.append({
            "id":           oid,
            "nombre":       o.get("name", ""),
            "cliente":      (o.get("partner_id")  or ["", "?"])[1],
            "vendedor":     (o.get("user_id")      or ["", "Sin asignar"])[1],
            "equipo":       (o.get("team_id")      or ["", ""])[1],
            "estado":       state,
            "fecha":        (o.get("date_order") or "")[:10],
            "dias":         dias,
            "monto":        o.get("amount_total", 0) or 0,
            "sin_entrega":  sin_entrega,
            "sin_factura":  sin_factura,
            "actores":      sorted(actores),
            "flags":        flags,
            "riesgo":       _riesgo(sc),
            "score":        sc,
            "notas":        notas,
        })

    alertas.sort(key=lambda x: x["score"], reverse=True)

    # ── 5. Resumen por vendedor ──────────────────────────────────────────────
    vendedor_stats: dict = {}
    for a in alertas:
        v = a["vendedor"]
        s = vendedor_stats.setdefault(v, {"alertas": 0, "monto": 0, "criticos": 0, "score": 0})
        s["alertas"]  += 1
        s["monto"]    += a["monto"]
        s["score"]    += a["score"]
        if a["riesgo"] == "CRITICO":
            s["criticos"] += 1

    ranking_vendedores = sorted(
        [{"vendedor": k, **v} for k, v in vendedor_stats.items()],
        key=lambda x: x["score"], reverse=True)

    criticos = sum(1 for a in alertas if a["riesgo"] == "CRITICO")
    altos    = sum(1 for a in alertas if a["riesgo"] == "ALTO")
    medios   = sum(1 for a in alertas if a["riesgo"] == "MEDIO")

    return {
        "ordenes":            alertas,
        "ranking_vendedores": ranking_vendedores,
        "resumen": {
            "total_analizadas": len(orders),
            "total_alertas":    len(alertas),
            "criticos":         criticos,
            "altos":            altos,
            "medios":           medios,
            "monto_en_riesgo":  sum(a["monto"] for a in alertas),
        },
        "generado": now.isoformat(),
    }
