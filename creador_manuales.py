import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

def generar_documento_xcien(tema, tipo_documento, ruta_archivo_base=""):
    print(f"⏳ INICIANDO: El Agente Documentador está redactando '{tema}' como un '{tipo_documento}'...")

    contexto_extra = ""
    if ruta_archivo_base and os.path.exists(ruta_archivo_base):
        try:
            if ruta_archivo_base.lower().endswith('.pdf'):
                from pypdf import PdfReader
                reader = PdfReader(ruta_archivo_base)
                content_base = "\n".join([p.extract_text() or "" for p in reader.pages])
                print(f"📎 PDF '{ruta_archivo_base}' leído ({len(reader.pages)} páginas).")
            else:
                with open(ruta_archivo_base, "r", encoding="utf-8") as f:
                    content_base = f.read()
                print(f"📎 Archivo '{ruta_archivo_base}' anexado.")
            contexto_extra = f"\n\nDOCUMENTO BASE (USA ESTO COMO FUENTE PRINCIPAL):\n{content_base}"
        except Exception as e:
            print(f"⚠️ Error al leer archivo base: {e}")

    output_dir = "Xcien_Docs"
    os.makedirs(output_dir, exist_ok=True)

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    prompt = f"""Eres el "Agente Documentador Senior" de Xcien, empresa ISP mexicana que opera XCIEN, Wispi, Luminet WAN, Huus y Sandur.
Tu objetivo es profesionalizar y estandarizar las operaciones antes del 31 de mayo de 2026.

Crea un documento exhaustivo y profesional en formato Markdown para:

TIPO DE DOCUMENTO: {tipo_documento}
TEMA: {tema}{contexto_extra}

REGLAS:
1. Tono corporativo, claro y mandatorio.
2. Usa Headings de Markdown (#, ##, ###).
3. Secciones obligatorias:
   - Objetivo del Documento
   - Alcance
   - Glosario (si aplica)
   - Desarrollo del Proceso paso a paso
   - Reglas de Seguridad / Tolerancia Cero (obligatorio para campo)
4. Incluye tablas Markdown cuando sea útil.
5. Devuelve ÚNICAMENTE el Markdown, sin explicaciones ni saludos.

¡Inicia la redacción ahora!"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )

        content = message.content[0].text.strip()
        if content.startswith("```markdown"):
            content = content[11:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        nombre_limpio = tema.replace(" ", "_").replace("/", "-").lower()[:30]
        filepath = os.path.join(output_dir, f"{tipo_documento.replace(' ', '_')}_{nombre_limpio}.md")

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content.strip())

        print(f"✅ ¡ÉXITO! Documento guardado en: {filepath}")
        return filepath

    except Exception as e:
        print(f"⚠️ Error al generar el documento: {e}")
        return None


if __name__ == "__main__":
    print("=" * 50)
    print("    FÁBRICA DE DOCUMENTOS XCIEN (Claude AI)    ")
    print("=" * 50)
    print("Escribe 'salir' para terminar.\n")

    while True:
        tipo = input("1. Tipo de documento (Ej: Manual de Operaciones, Estándar de Instalación): ")
        if tipo.lower() == 'salir':
            break
        tema = input("2. ¿De qué trata el documento?: ")
        if tema.lower() == 'salir':
            break
        archivo = input("3. (Opcional) Archivo base con notas o texto (Enter para saltar): ").strip()

        generar_documento_xcien(tema, tipo, archivo)
        print("\n" + "-" * 50 + "\n")
