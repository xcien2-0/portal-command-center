#!/usr/bin/env python3
"""Convierte HTML → PDF (Chrome headless) y envía V1 + V2 por Telegram."""
import os, subprocess, requests, sys, time

# Configuración
BASE = os.path.dirname(os.path.abspath(__file__))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Leer .env
env = {}
env_file = os.path.join(BASE, ".env")
with open(env_file) as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()

BOT_TOKEN = env.get("TELEGRAM_BOT_TOKEN", "")
CHAT_ID   = env.get("TELEGRAM_CHAT_ID", "")

if not BOT_TOKEN or not CHAT_ID:
    print("❌ TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados en .env")
    sys.exit(1)

# Rutas
HTML_V2  = os.path.join(BASE, "acta_v2_actualizada.html")
PDF_V1   = os.path.join(BASE, "db", "ACTA_ENTREGA_RECEPCION_XCIEN_2026.pdf")
PDF_V2   = os.path.join(BASE, "db", "ACTA_ENTREGA_RECEPCION_XCIEN_V2_JUNIO2026.pdf")

# ── 1. Generar PDF V2 con Chrome headless ────────────────────────────────────
print("🔄 Generando PDF V2 con Chrome headless…")
os.makedirs(os.path.dirname(PDF_V2), exist_ok=True)

result = subprocess.run([
    CHROME,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=5000",
    f"--print-to-pdf={PDF_V2}",
    "--print-to-pdf-no-header",
    f"file://{HTML_V2}",
], capture_output=True, text=True, timeout=60)

if result.returncode != 0:
    print(f"⚠ Chrome stderr: {result.stderr[:300]}")

if os.path.exists(PDF_V2) and os.path.getsize(PDF_V2) > 5000:
    print(f"✅ PDF V2 generado: {PDF_V2} ({os.path.getsize(PDF_V2)//1024} KB)")
else:
    print(f"❌ PDF V2 no generado o muy pequeño. Intento alternativo…")
    result2 = subprocess.run([
        CHROME,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        f"--print-to-pdf={PDF_V2}",
        f"file://{HTML_V2}",
    ], capture_output=True, text=True, timeout=60)
    if os.path.exists(PDF_V2) and os.path.getsize(PDF_V2) > 5000:
        print(f"✅ PDF V2 generado (alt): {os.path.getsize(PDF_V2)//1024} KB")
    else:
        print("❌ No se pudo generar PDF V2")
        sys.exit(1)

# ── 2. Enviar por Telegram ───────────────────────────────────────────────────
BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

def send_doc(path: str, caption: str):
    with open(path, "rb") as f:
        r = requests.post(
            f"{BASE_URL}/sendDocument",
            data={"chat_id": CHAT_ID, "caption": caption, "parse_mode": "HTML"},
            files={"document": (os.path.basename(path), f, "application/pdf")},
            timeout=60,
        )
    if r.ok:
        print(f"✅ Enviado: {os.path.basename(path)}")
    else:
        print(f"❌ Error {r.status_code}: {r.text[:200]}")

def send_msg(text: str):
    requests.post(f"{BASE_URL}/sendMessage",
        json={"chat_id": CHAT_ID, "text": text, "parse_mode": "HTML"}, timeout=30)

print("\n📤 Enviando a Telegram…")
send_msg("📋 <b>Actas de Entrega-Recepción XCIEN</b>\nComparativo: versión original (Abril 2026) vs actualizada (Junio 2026)")
time.sleep(1)

if os.path.exists(PDF_V1):
    send_doc(PDF_V1, "📄 <b>V1 — Acta Original</b> | 22 de Abril de 2026\nEstado inicial de los 4 pilares")
    time.sleep(2)
else:
    print("⚠ PDF V1 no encontrado, saltando")

send_doc(PDF_V2, "📄 <b>V2 — Acta Actualizada</b> | 30 de Junio de 2026\nAvance real: Pilar III 60%→90% · 10 módulos activos · Supabase eliminado")

print("\n✅ Listo — ambas actas enviadas a Telegram")
