#!/usr/bin/env python3
"""
Blackstone Memoria Técnica — Fibra Óptica XCIEN · PDN

Captura notas de juntas relacionadas con Fibra Óptica / Blackstone desde:
  1. Gmail (notas Gemini de Google Meet)
  2. Texto pegado manualmente (modo --manual)

Guarda en backend/data/blackstone_memoria.json (archivo vivo, solo crece)
Escribe resumen en XCIEN-Vault/Proyectos/Blackstone-FO/memoria-tecnica.md

Uso:
  python3 blackstone_memoria_sync.py            # Gmail últimos 7 días
  python3 blackstone_memoria_sync.py --dias 30  # Gmail últimos 30 días
  python3 blackstone_memoria_sync.py --manual   # Modo texto pegado
  python3 blackstone_memoria_sync.py --reporte  # Generar reporte de estado
"""

import os, json, sys, re, base64, hashlib, argparse
from pathlib import Path
from datetime import datetime, timedelta, date

# ── Paths ─────────────────────────────────────────────────────────────────────
HERE       = Path(__file__).parent
DATA       = HERE / "data"
DATA.mkdir(exist_ok=True)
MEMORIA    = DATA / "blackstone_memoria.json"
HUB_CREDS  = Path.home() / "Proyectos/personal/hub-personal/credentials.json"
HUB_TOKEN  = Path.home() / "Proyectos/personal/hub-personal/data/gmail_token.json"
XCIEN_VAULT = Path.home() / "Documents" / "XCIEN-Vault"
MD_OUT     = XCIEN_VAULT / "Proyectos" / "Blackstone-FO" / "memoria-tecnica.md"
ENV_FILE   = HERE / ".env"

# ── Keywords — filtro para identificar reuniones FO/Blackstone ─────────────
FO_KEYWORDS = [
    "fibra", "fo ", "fibra óptica", "fibra optica", "blackstone",
    "piedras negras", "pdn", "sidf", "x100", "cwdm", "otdr",
    "coahuila", "acuña", "acuna", "amistad", "lancermex",
    "cajas de empalme", "fusionadora", "splitter", "nap",
    "francisco alday", "guillermo", "elizabeth",
]

GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
GMAIL_SENDERS = [
    "meet-recordings-noreply@google.com",
    "workspace-noreply@google.com",
    "noreply@google.com",
]
GMAIL_SUBJECTS = [
    "notes from your meeting", "notas de tu reunión",
    "notas de la reunión", "meeting notes", "resumen de tu reunión",
    "action item", "gemini notes",
]


def load_env():
    env = {}
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    v = v.strip().strip('"').strip("'")
                    env[k.strip()] = v
    env.update(os.environ)
    return env


def load_memoria():
    if MEMORIA.exists():
        with open(MEMORIA) as f:
            return json.load(f)
    return {
        "proyecto": "Fibra Óptica XCIEN · Blackstone PDN",
        "creado": date.today().isoformat(),
        "version": 1,
        "reuniones": [],
        "hitos": [],
        "estado_actual": None,
    }


def save_memoria(data):
    with open(MEMORIA, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Memoria guardada: {MEMORIA}")


def meeting_id(text, fecha):
    digest = hashlib.md5(f"{fecha}:{text[:200]}".encode()).hexdigest()[:8]
    return f"fo_{fecha.replace('-', '')}_{digest}"


def is_fo_related(text):
    text_lower = text.lower()
    return any(kw in text_lower for kw in FO_KEYWORDS)


# ── Gmail ─────────────────────────────────────────────────────────────────────

def get_gmail_service():
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build
    except ImportError:
        print("ERROR: pip install google-api-python-client google-auth-oauthlib")
        sys.exit(1)

    if not HUB_CREDS.exists():
        print(f"ERROR: No se encontró credentials.json en {HUB_CREDS}")
        print("Ejecuta primero el hub-personal gmail_meeting_parser.py para configurar OAuth")
        sys.exit(1)

    creds = None
    if HUB_TOKEN.exists():
        creds = Credentials.from_authorized_user_file(str(HUB_TOKEN), GMAIL_SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(HUB_CREDS), GMAIL_SCOPES)
            creds = flow.run_local_server(port=0)
        with open(HUB_TOKEN, "w") as f:
            f.write(creds.to_json())

    return build("gmail", "v1", credentials=creds)


def extract_body(payload):
    body = ""
    if "body" in payload and payload["body"].get("data"):
        raw = payload["body"]["data"]
        body = base64.urlsafe_b64decode(raw + "==").decode("utf-8", errors="ignore")

    if "parts" in payload:
        for part in payload["parts"]:
            mime = part.get("mimeType", "")
            if mime == "text/plain" and part["body"].get("data"):
                raw = part["body"]["data"]
                body = base64.urlsafe_b64decode(raw + "==").decode("utf-8", errors="ignore")
                break
            elif mime == "text/html" and not body and part["body"].get("data"):
                raw = part["body"]["data"]
                html = base64.urlsafe_b64decode(raw + "==").decode("utf-8", errors="ignore")
                body = re.sub(r"<[^>]+>", " ", html)
                body = re.sub(r"\s+", " ", body).strip()
            elif mime.startswith("multipart/"):
                nested = extract_body(part)
                if nested:
                    body = nested
                    break
    return body[:10000]


def sync_from_gmail(dias=7):
    print(f"\nBuscando notas de reuniones FO/Blackstone en Gmail (últimos {dias} días)...")
    service = get_gmail_service()

    after = (date.today() - timedelta(days=dias)).strftime("%Y/%m/%d")
    sender_q = " OR ".join([f"from:{s}" for s in GMAIL_SENDERS])
    query = f"({sender_q}) after:{after}"

    result = service.users().messages().list(userId="me", q=query, maxResults=100).execute()
    msgs = result.get("messages", [])
    print(f"  Emails de meeting encontrados: {len(msgs)}")

    nuevas = []
    for m in msgs:
        msg = service.users().messages().get(userId="me", id=m["id"], format="full").execute()
        headers = {h["name"].lower(): h["value"] for h in msg["payload"]["headers"]}
        body = extract_body(msg["payload"])

        subject = headers.get("subject", "")
        fecha_raw = headers.get("date", "")

        # Filtrar solo las relacionadas con FO/Blackstone
        if not is_fo_related(f"{subject} {body}"):
            continue

        # Extraer fecha limpia
        try:
            from email.utils import parsedate_to_datetime
            dt = parsedate_to_datetime(fecha_raw)
            fecha = dt.strftime("%Y-%m-%d")
        except Exception:
            fecha = date.today().isoformat()

        nuevas.append({
            "gmail_id": m["id"],
            "subject": subject,
            "fecha": fecha,
            "body": body,
        })
        print(f"  ✓ FO relevante: {subject[:60]} ({fecha})")

    return nuevas


# ── Claude — parsing estructurado ─────────────────────────────────────────────

def parse_with_claude(raw_text, titulo_hint, fecha, env):
    api_key = env.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("  ADVERTENCIA: ANTHROPIC_API_KEY no configurada — guardando texto crudo")
        return parse_basico(raw_text, titulo_hint, fecha)

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        prompt = f"""Analiza estas notas de reunión del proyecto Fibra Óptica XCIEN (Blackstone PDN - Piedras Negras, Coahuila).

Texto de la reunión:
{raw_text[:6000]}

Devuelve ÚNICAMENTE JSON válido con esta estructura exacta:
{{
  "titulo": "título descriptivo de la junta",
  "participantes": ["nombre1", "nombre2"],
  "resumen": "resumen ejecutivo en 2-3 oraciones",
  "temas": ["tema 1", "tema 2"],
  "decisiones": ["decisión 1", "decisión 2"],
  "action_items": [
    {{"tarea": "descripción", "responsable": "nombre", "fecha_limite": "YYYY-MM-DD o null"}}
  ],
  "hallazgos_tecnicos": ["hallazgo técnico relevante"],
  "riesgos": ["riesgo identificado"],
  "estado_proyecto": "avanzando|bloqueado|en_revision|normal"
}}

Si no hay información suficiente para un campo, usa lista vacía [] o string vacío "".
Responde SOLO el JSON, sin texto adicional."""

        resp = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text.strip()
        # Limpiar posibles markdown fences
        if raw.startswith("```"):
            raw = re.sub(r"^```\w*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
        return json.loads(raw)

    except Exception as e:
        print(f"  Error Claude: {e} — usando parser básico")
        return parse_basico(raw_text, titulo_hint, fecha)


def parse_basico(raw_text, titulo_hint, fecha):
    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
    return {
        "titulo": titulo_hint or f"Junta FO Blackstone {fecha}",
        "participantes": [],
        "resumen": " ".join(lines[:3]),
        "temas": [],
        "decisiones": [],
        "action_items": [],
        "hallazgos_tecnicos": [],
        "riesgos": [],
        "estado_proyecto": "normal",
    }


# ── Generar estado actual del proyecto ─────────────────────────────────────────

def generar_estado(memoria, env):
    reuniones = memoria.get("reuniones", [])
    if not reuniones:
        return {"resumen": "Sin reuniones registradas aún.", "generado": datetime.now().isoformat()}

    api_key = env.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {"resumen": "ANTHROPIC_API_KEY no configurada.", "generado": datetime.now().isoformat()}

    # Preparar contexto de las últimas 10 reuniones
    ultimas = sorted(reuniones, key=lambda r: r.get("fecha", ""), reverse=True)[:10]
    contexto = []
    for r in ultimas:
        parsed = r.get("parsed", {})
        contexto.append(
            f"[{r.get('fecha', '?')}] {parsed.get('titulo', r.get('titulo', '?'))}\n"
            f"  Decisiones: {'; '.join(parsed.get('decisiones', []))}\n"
            f"  Action items: {'; '.join(t.get('tarea','') for t in parsed.get('action_items', []))}\n"
            f"  Estado: {parsed.get('estado_proyecto', 'normal')}"
        )

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        resp = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            messages=[{"role": "user", "content": f"""Genera un reporte de estado actual del proyecto Fibra Óptica XCIEN (Blackstone PDN) basado en estas reuniones recientes:

{chr(10).join(contexto)}

Devuelve JSON:
{{
  "resumen": "estado ejecutivo en 3-4 oraciones",
  "avance_pct": numero_estimado_0_100,
  "pendientes_criticos": ["pendiente 1", "pendiente 2"],
  "logros_recientes": ["logro 1", "logro 2"],
  "proximos_pasos": ["paso 1", "paso 2"],
  "semaforo": "verde|amarillo|rojo"
}}"""}],
        )
        raw = resp.content[0].text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```\w*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
        estado = json.loads(raw)
        estado["generado"] = datetime.now().isoformat()
        return estado
    except Exception as e:
        print(f"  Error generando estado: {e}")
        return {"resumen": "Error al generar estado.", "generado": datetime.now().isoformat()}


# ── Exportar a Obsidian ────────────────────────────────────────────────────────

def exportar_obsidian(memoria):
    if not XCIEN_VAULT.exists():
        print(f"  XCIEN-Vault no encontrado en {XCIEN_VAULT} — omitiendo exportación Obsidian")
        return

    MD_OUT.parent.mkdir(parents=True, exist_ok=True)
    reuniones = sorted(memoria.get("reuniones", []), key=lambda r: r.get("fecha", ""), reverse=True)
    estado = memoria.get("estado_actual") or {}

    lines = [
        "---",
        "tags: [xcien, blackstone, fibra-optica, PDN, memoria-tecnica]",
        f"actualizado: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"reuniones: {len(reuniones)}",
        "---",
        "",
        "# Memoria Técnica — Fibra Óptica XCIEN · Blackstone PDN",
        "",
        f"> Documento vivo · {len(reuniones)} juntas registradas · "
        f"Actualizado {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
    ]

    if estado:
        lines += [
            "## Estado Actual",
            "",
            f"**{estado.get('resumen', '')}**",
            "",
            f"- Avance estimado: {estado.get('avance_pct', '?')}%",
            f"- Semáforo: {estado.get('semaforo', '?')}",
            "",
        ]
        if estado.get("pendientes_criticos"):
            lines.append("### Pendientes críticos")
            for p in estado["pendientes_criticos"]:
                lines.append(f"- [ ] {p}")
            lines.append("")
        if estado.get("proximos_pasos"):
            lines.append("### Próximos pasos")
            for p in estado["proximos_pasos"]:
                lines.append(f"- {p}")
            lines.append("")

    lines += ["## Reuniones", ""]

    for r in reuniones:
        parsed = r.get("parsed", {})
        titulo = parsed.get("titulo") or r.get("titulo", "Junta")
        fecha = r.get("fecha", "?")
        lines += [f"### {fecha} — {titulo}", ""]

        if parsed.get("resumen"):
            lines += [parsed["resumen"], ""]

        if parsed.get("decisiones"):
            lines.append("**Decisiones:**")
            for d in parsed["decisiones"]:
                lines.append(f"- {d}")
            lines.append("")

        if parsed.get("action_items"):
            lines.append("**Action items:**")
            for ai in parsed["action_items"]:
                resp = ai.get("responsable", "")
                fl = ai.get("fecha_limite", "")
                suffix = f" — {resp}" if resp else ""
                suffix += f" · {fl}" if fl else ""
                lines.append(f"- [ ] {ai.get('tarea', '')}{suffix}")
            lines.append("")

        if parsed.get("hallazgos_tecnicos"):
            lines.append("**Hallazgos técnicos:**")
            for h in parsed["hallazgos_tecnicos"]:
                lines.append(f"- {h}")
            lines.append("")

        lines.append("---")
        lines.append("")

    with open(MD_OUT, "w") as f:
        f.write("\n".join(lines))
    print(f"  Obsidian actualizado: {MD_OUT}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Blackstone Memoria Técnica Sync")
    parser.add_argument("--dias", type=int, default=7, help="Días hacia atrás en Gmail")
    parser.add_argument("--manual", action="store_true", help="Entrada manual de texto")
    parser.add_argument("--reporte", action="store_true", help="Generar reporte de estado")
    parser.add_argument("--exportar", action="store_true", help="Solo exportar a Obsidian")
    args = parser.parse_args()

    env = load_env()
    memoria = load_memoria()
    existing_ids = {r.get("id") for r in memoria["reuniones"]}
    nuevas = 0

    if args.exportar:
        exportar_obsidian(memoria)
        return

    if args.reporte:
        print("\nGenerando reporte de estado actual...")
        memoria["estado_actual"] = generar_estado(memoria, env)
        save_memoria(memoria)
        exportar_obsidian(memoria)
        print(f"\nEstado: {memoria['estado_actual'].get('resumen', '')}")
        return

    if args.manual:
        print("\nModo manual — pega las notas de la reunión (Ctrl+D cuando termines):")
        print("-" * 60)
        try:
            raw_text = sys.stdin.read()
        except KeyboardInterrupt:
            print("\nCancelado.")
            return

        if not raw_text.strip():
            print("Sin texto. Saliendo.")
            return

        fecha = date.today().isoformat()
        rid = meeting_id(raw_text, fecha)

        if rid in existing_ids:
            print("Esta reunión ya está registrada.")
            return

        print("\nProcesando con Claude...")
        parsed = parse_with_claude(raw_text, "", fecha, env)

        reunion = {
            "id": rid,
            "fecha": fecha,
            "titulo": parsed.get("titulo", f"Junta FO {fecha}"),
            "fuente": "manual",
            "raw": raw_text[:3000],
            "parsed": parsed,
            "procesado": datetime.now().isoformat(),
        }
        memoria["reuniones"].append(reunion)
        nuevas += 1
        print(f"  ✓ Reunión agregada: {parsed.get('titulo')}")

    else:
        # Modo Gmail
        emails = sync_from_gmail(dias=args.dias)
        for e in emails:
            rid = meeting_id(e["body"], e["fecha"])
            if rid in existing_ids:
                print(f"  (ya registrado) {e['subject'][:50]}")
                continue

            print(f"  Procesando: {e['subject'][:60]}...")
            parsed = parse_with_claude(e["body"], e["subject"], e["fecha"], env)

            reunion = {
                "id": rid,
                "fecha": e["fecha"],
                "titulo": parsed.get("titulo", e["subject"]),
                "fuente": "gmail",
                "gmail_id": e.get("gmail_id"),
                "raw": e["body"][:3000],
                "parsed": parsed,
                "procesado": datetime.now().isoformat(),
            }
            memoria["reuniones"].append(reunion)
            nuevas += 1

    if nuevas > 0 or args.reporte:
        # Regenerar estado si hay reuniones nuevas
        if nuevas > 0:
            print(f"\nNuevas reuniones: {nuevas}. Actualizando estado del proyecto...")
            memoria["estado_actual"] = generar_estado(memoria, env)

        save_memoria(memoria)
        exportar_obsidian(memoria)
        print(f"\n✓ Memoria actualizada: {len(memoria['reuniones'])} reuniones totales")
    else:
        print("\nSin nuevas reuniones FO/Blackstone.")


if __name__ == "__main__":
    main()
