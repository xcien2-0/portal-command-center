#!/usr/bin/env python3
"""Fusiona PAC 2026 + Propuesta Academia y los envía en un solo mensaje Telegram."""
import os, subprocess, requests, sys
from datetime import datetime
from pypdf import PdfWriter, PdfReader

BASE      = os.path.dirname(os.path.abspath(__file__))
CHROME    = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FECHA     = datetime.now().strftime("%d de julio de %Y")

env = {}
with open(os.path.join(BASE, ".env")) as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()

BOT_TOKEN = env.get("TELEGRAM_BOT_TOKEN", "")
CHAT_ID   = env.get("TELEGRAM_CHAT_ID", "")

# ── Regenerar PAC si no existe ────────────────────────────────────────────────
PAC_PDF = "/tmp/xcien_pac_2026.pdf"
if not os.path.exists(PAC_PDF) or os.path.getsize(PAC_PDF) < 1000:
    print("⚙️  Regenerando PAC 2026…")
    subprocess.run(["python3", os.path.join(BASE, "generar_pac_2026.py")], capture_output=True)

# ── Regenerar Propuesta si no existe ─────────────────────────────────────────
PROP_PDF = "/tmp/xcien_propuesta_academia.pdf"
if not os.path.exists(PROP_PDF) or os.path.getsize(PROP_PDF) < 1000:
    print("⚙️  Regenerando Propuesta…")
    subprocess.run(["python3", os.path.join(BASE, "generar_propuesta_academia.py")], capture_output=True)

# ── Verificar que existen ─────────────────────────────────────────────────────
for path, name in [(PAC_PDF, "PAC 2026"), (PROP_PDF, "Propuesta")]:
    if not os.path.exists(path) or os.path.getsize(path) < 1000:
        print(f"❌ No se encontró {name} en {path}"); sys.exit(1)

# ── Fusionar ──────────────────────────────────────────────────────────────────
MERGED = "/tmp/xcien_pac_y_propuesta.pdf"
writer = PdfWriter()

for path in [PAC_PDF, PROP_PDF]:
    reader = PdfReader(path)
    for page in reader.pages:
        writer.add_page(page)

with open(MERGED, "wb") as f:
    writer.write(f)

size_kb = os.path.getsize(MERGED) // 1024
print(f"✅ PDF fusionado: {size_kb} KB ({len(PdfReader(MERGED).pages)} páginas)")

# ── Enviar ────────────────────────────────────────────────────────────────────
if not BOT_TOKEN or not CHAT_ID:
    print("⚠️  Sin credenciales Telegram"); sys.exit(1)

caption = (
    f"📋 PAC 2026 + Propuesta Academia XCIEN\n"
    f"Plan Anual de Capacitación · 17 áreas · 12 meses\n"
    f"Propuesta Dirección General · 12 rutas · 76 cursos\n"
    f"{FECHA}"
)

with open(MERGED, "rb") as f:
    r = requests.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/sendDocument",
        data={"chat_id": CHAT_ID, "caption": caption},
        files={"document": (f"XCIEN_PAC_y_Propuesta_{datetime.now().strftime('%Y%m%d')}.pdf", f, "application/pdf")},
        timeout=30
    )

if r.status_code == 200:
    print("✅ Enviado a Telegram en un solo mensaje")
else:
    print(f"❌ Error Telegram: {r.text[:300]}")
