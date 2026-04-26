"""
Generador de etiquetas imprimibles para activos y comprobantes de transacciones.
Produce HTML (para hoja multi-etiqueta) y PNG (para etiqueta individual).
"""
import os
import json
import io
import base64
from datetime import datetime, timezone

try:
    import qrcode
    from PIL import Image, ImageDraw, ImageFont
    import barcode
    from barcode.writer import ImageWriter
    HAS_IMAGING = True
except ImportError:
    HAS_IMAGING = False

from agents.asset_service       import listar as listar_activos, obtener as obtener_activo
from agents.transacciones_service import _cargar as cargar_txs

LOGO_COLOR = "#00A859"


# ── QR helper ─────────────────────────────────────────────────────────────────
def _qr_img(data: str, size: int = 120) -> "Image.Image":
    qr = qrcode.QRCode(version=2, box_size=3, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    return img.resize((size, size))


def _barcode_img(code: str, width: int = 300, height: int = 80) -> "Image.Image":
    Code128 = barcode.get_barcode_class("code128")
    buf = io.BytesIO()
    Code128(code, writer=ImageWriter()).write(buf, options={
        "write_text": True, "quiet_zone": 2,
        "module_height": 8.0, "font_size": 7, "text_distance": 2,
    })
    buf.seek(0)
    img = Image.open(buf).convert("RGB")
    return img.resize((width, height))


def _img_to_b64(img: "Image.Image") -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


# ── Etiqueta individual de activo (PNG 600×300) ───────────────────────────────
def etiqueta_activo_png(activo_id: str) -> bytes:
    if not HAS_IMAGING:
        raise RuntimeError("Pillow/qrcode/python-barcode no instalados")
    a = obtener_activo(activo_id)
    if not a:
        raise ValueError(f"Activo no encontrado: {activo_id}")

    W, H = 600, 300
    img  = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W - 1, H - 1], outline="#cccccc", width=2)
    draw.rectangle([0, 0, W, 44], fill="#0A0A0A")
    draw.text((12, 8),  "XCIEN GROUP",               fill=LOGO_COLOR)
    draw.text((12, 24), f"{a['empresa'].upper()}  ·  {a['regimen']}", fill="#888888")
    draw.text((W - 110, 8), a.get("site", ""),        fill="#aaaaaa")

    draw.text((12, 54), a["nombre"][:46],              fill="#111111")
    draw.text((12, 74), f"{a.get('categoria_label','')}",  fill="#555555")
    if a.get("marca") or a.get("modelo"):
        draw.text((12, 90), f"{a.get('marca','')} {a.get('modelo','')}".strip(), fill="#888888")

    try:
        bc = _barcode_img(a["activo_id"], 340, 90)
        img.paste(bc, (12, 112))
    except Exception:
        pass

    try:
        qr_data = json.dumps({"id": a["activo_id"], "empresa": a["empresa"],
                               "regimen": a["regimen"], "site": a.get("site","")}, ensure_ascii=False)
        qr = _qr_img(qr_data, 140)
        img.paste(qr, (W - 155, 110))
    except Exception:
        pass

    draw.text((12, 265),     f"S/N: {a.get('numero_serie', activo_id)}", fill="#aaaaaa")
    draw.text((W - 190, 265), a.get("registrado_en","")[:10],             fill="#aaaaaa")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ── Comprobante de transacción (PNG 600×360) ──────────────────────────────────
def comprobante_tx_png(tx_id: str) -> bytes:
    if not HAS_IMAGING:
        raise RuntimeError("Pillow/qrcode/python-barcode no instalados")
    txs = cargar_txs()
    tx  = next((t for t in txs if t["tx_id"] == tx_id), None)
    if not tx:
        raise ValueError(f"Transacción no encontrada: {tx_id}")

    W, H = 600, 380
    img  = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W - 1, H - 1], outline="#cccccc", width=2)
    draw.rectangle([0, 0, W, 44], fill="#0A0A0A")
    draw.text((12, 8),  "XCIEN GROUP  ·  Transacción Intragrupo", fill=LOGO_COLOR)
    draw.text((12, 26), "Comprobante tokenizado — precio preferencial",  fill="#666666")

    y = 58
    draw.text((12, y), f"{tx['empresa_origen'].upper()}  →  {tx['empresa_destino'].upper()}", fill="#111111")
    y += 20
    draw.text((12, y), f"Área: {tx['area_origen']} → {tx['area_destino']}", fill="#555555")
    y += 22
    draw.text((12, y), tx["concepto"][:60], fill="#111111")

    y += 28
    draw.rectangle([12, y, W - 12, y + 1], fill="#eeeeee")
    y += 12

    draw.text((12, y),      "Precio mercado:",       fill="#888888")
    draw.text((220, y),     f"${tx['precio_mercado']:,.0f} MXN",  fill="#888888")
    y += 20
    draw.text((12, y),      "Precio preferencial:",  fill="#111111")
    draw.text((220, y),     f"${tx['precio_preferencial']:,.0f} MXN", fill=LOGO_COLOR)
    y += 20
    draw.text((12, y),      f"Descuento intragrupo:", fill="#888888")
    draw.text((220, y),     f"-{tx['descuento_pct']}%  (ahorro ${tx['ahorro']:,.0f})", fill="#FFB703")
    y += 20
    draw.text((12, y),      "Responsable:",          fill="#888888")
    draw.text((220, y),     tx.get("responsable","—"), fill="#555555")
    y += 20
    draw.text((12, y),      "Fecha:",                fill="#888888")
    draw.text((220, y),     tx.get("fecha","")[:19].replace("T"," "), fill="#555555")
    y += 20
    draw.text((12, y),      "Referencia:",           fill="#888888")
    draw.text((220, y),     tx.get("referencia","—"), fill="#555555")

    y += 16
    draw.rectangle([12, y, W - 12, y + 1], fill="#eeeeee")
    y += 12

    # Barcode del TX ID
    try:
        bc = _barcode_img(tx["tx_id"], 340, 80)
        img.paste(bc, (12, y))
    except Exception:
        pass

    # QR con datos completos
    try:
        qr_data = json.dumps({
            "tx_id":    tx["tx_id"],
            "origen":   tx["empresa_origen"],
            "destino":  tx["empresa_destino"],
            "concepto": tx["concepto"],
            "monto":    tx["precio_preferencial"],
            "firma":    tx.get("firma","")[:16],
        }, ensure_ascii=False)
        qr = _qr_img(qr_data, 130)
        img.paste(qr, (W - 148, y - 4))
    except Exception:
        pass

    draw.text((12, H - 22), f"TX-ID: {tx['tx_id']}  ·  Token verificable",  fill="#aaaaaa")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ── Hoja de etiquetas A4 (HTML imprimible, grid 2×4) ─────────────────────────
def hoja_etiquetas_html(empresa: str = None, site: str = None) -> str:
    activos = listar_activos(empresa=empresa, site=site)

    etiquetas_html = ""
    for a in activos:
        try:
            png  = etiqueta_activo_png(a["activo_id"])
            b64  = base64.b64encode(png).decode()
            etiquetas_html += f"""
            <div class="etiqueta">
              <img src="data:image/png;base64,{b64}" style="width:100%;height:auto;" />
            </div>"""
        except Exception as e:
            etiquetas_html += f'<div class="etiqueta error">Error: {e}</div>'

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Etiquetas XCIEN — {site or empresa or 'Todos'}</title>
  <style>
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{ font-family: Arial, sans-serif; background: #f5f5f5; }}
    .header {{
      background: #0A0A0A; color: {LOGO_COLOR}; padding: 16px 24px;
      display: flex; justify-content: space-between; align-items: center;
    }}
    .header h1 {{ font-size: 18px; }}
    .header p  {{ font-size: 12px; color: #666; margin-top: 2px; }}
    .header .meta {{ text-align: right; font-size: 11px; color: #666; }}
    .controles {{
      padding: 12px 24px; background: white; border-bottom: 1px solid #eee;
      display: flex; gap: 12px; align-items: center;
    }}
    .btn-print {{
      background: {LOGO_COLOR}; color: white; border: none;
      padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;
    }}
    .grid {{
      padding: 20px 24px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      max-width: 1100px;
      margin: 0 auto;
    }}
    .etiqueta {{
      background: white; border: 1px solid #ddd; border-radius: 8px;
      overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }}
    .etiqueta.error {{ padding: 20px; color: red; font-size: 12px; }}
    .stats {{
      padding: 12px 24px; background: white; border-bottom: 1px solid #eee;
      font-size: 12px; color: #666;
    }}
    @media print {{
      body {{ background: white; }}
      .header, .controles, .stats {{ display: none !important; }}
      .grid {{
        padding: 0; gap: 8px;
        grid-template-columns: repeat(2, 1fr);
      }}
      .etiqueta {{ box-shadow: none; border: 1px solid #ccc; page-break-inside: avoid; }}
      @page {{ size: A4; margin: 10mm; }}
    }}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>XCIEN GROUP — Etiquetas de Inventario</h1>
      <p>Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')} · {len(activos)} activos</p>
    </div>
    <div class="meta">
      {f'Site: {site}' if site else ''}{f'Empresa: {empresa}' if empresa else ''}<br/>
      Formato: A4 · 2 columnas
    </div>
  </div>
  <div class="controles">
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir hoja completa</button>
    <span style="font-size:12px;color:#666">{len(activos)} etiquetas · Código de barras Code128 + QR</span>
  </div>
  <div class="stats">
    Activos incluidos: {', '.join(set(a.get('categoria_label','') for a in activos))}
  </div>
  <div class="grid">
    {etiquetas_html}
  </div>
</body>
</html>"""
