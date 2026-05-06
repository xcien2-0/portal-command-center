#!/usr/bin/env python3
import os
import subprocess
import markdown
from datetime import datetime

# Rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MD_FILE = "/Users/mesquite/Proyectos/XCIEN2.0/PROYECTO_BIDRILLAS_2026.md"
OUTPUT_PDF = os.path.join(BASE_DIR, "db", "PROYECTO_BIDRILLAS_2026.pdf")
TEMP_HTML = os.path.join(BASE_DIR, "db", "bidrillas_temp.html")

def generate_pdf():
    if not os.path.exists(MD_FILE):
        print(f"❌ Error: No se encontró el archivo {MD_FILE}")
        return

    # Leer el contenido de Markdown
    with open(MD_FILE, "r", encoding="utf-8") as f:
        md_content = f.read()

    # Convertir a HTML
    html_body = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])

    # Estilo CSS premium
    css = """
    <style>
        @page { margin: 2cm; }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #1a1a1a; 
            max-width: 800px; 
            margin: 0 auto;
            background-color: #ffffff;
        }
        h1 { 
            color: #000000; 
            border-bottom: 4px solid #00A859; 
            padding-bottom: 10px; 
            font-size: 32px;
            font-weight: 800;
            text-transform: uppercase;
        }
        h2 { 
            color: #00A859; 
            border-bottom: 1px solid #eeeeee; 
            padding-top: 20px;
            font-size: 24px;
            font-weight: 700;
        }
        h3 { 
            color: #333333; 
            font-size: 18px; 
            font-weight: 700;
            margin-top: 25px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            font-size: 14px;
        }
        th { 
            background-color: #00A859; 
            color: white; 
            padding: 12px; 
            text-align: left;
            border: 1px solid #008f4c;
        }
        td { 
            padding: 10px; 
            border: 1px solid #dddddd; 
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        blockquote { 
            border-left: 5px solid #00A859; 
            background: #f0fff4; 
            margin: 20px 0; 
            padding: 15px; 
            font-style: italic;
            color: #2d5a27;
        }
        hr { border: 0; border-top: 1px solid #eeeeee; margin: 30px 0; }
        .footer { 
            margin-top: 50px; 
            font-size: 10px; 
            color: #999999; 
            text-align: center; 
            border-top: 1px solid #eeeeee;
            padding-top: 20px;
        }
        .header-logo { text-align: right; margin-bottom: 20px; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 8px; overflow-x: auto; }
    </style>
    """

    full_html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        {css}
    </head>
    <body>
        <div class="header-logo">
            <span style="font-weight: 900; font-size: 24px; color: #000;">XCIEN</span>
            <span style="color: #00A859; font-weight: 900; font-size: 24px;">2.0</span>
        </div>
        {html_body}
        <div class="footer">
            © 2026 XCIEN · Documento Estratégico de Operaciones · Generado por Director General AI
        </div>
    </body>
    </html>
    """

    # Guardar HTML temporal
    with open(TEMP_HTML, "w", encoding="utf-8") as f:
        f.write(full_html)

    # Generar PDF con cupsfilter
    try:
        with open(OUTPUT_PDF, "wb") as f_pdf:
            result = subprocess.run(["/usr/sbin/cupsfilter", TEMP_HTML], stdout=f_pdf, stderr=subprocess.PIPE)
        
        if os.path.exists(OUTPUT_PDF) and os.path.getsize(OUTPUT_PDF) > 0:
            print(f"✅ PDF generado exitosamente: {OUTPUT_PDF}")
            os.remove(TEMP_HTML)
        else:
            print("❌ Error: Falló la generación del PDF.")
            print(f"DEBUG STDERR: {result.stderr.decode()}")
    except Exception as e:
        print(f"❌ Error durante la conversión: {e}")

if __name__ == "__main__":
    # Asegurar que el directorio db existe
    os.makedirs(os.path.dirname(OUTPUT_PDF), exist_ok=True)
    generate_pdf()
