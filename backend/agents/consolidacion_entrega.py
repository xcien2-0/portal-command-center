import os
from agente_claude import AgenteClaude
from dotenv import load_dotenv

load_dotenv()

def consolidacion_final_higienica():
    print("🧼 [Gabinete Xcien] Iniciando consolidación final de documentos...")
    claude = AgenteClaude()
    
    # Crear carpeta de entrega si no existe
    folder = "ENTREGA_VIERNES_24_ABRIL"
    if not os.path.exists(folder):
        os.makedirs(folder)
        print(f"📁 Carpeta '{folder}' creada.")

    archivos_a_limpiar = [
        ("LIBRO_MAESTRO_OPERACIONES_XCIEN_2026.md", "LIBRO_MAESTRO_HIGIENICO.md"),
        ("PRESENTACION_EJECUTIVA_ENTREGA_2026.md", "PRESENTACION_EJECUTIVA_HIGIENICA.md")
    ]

    for original, destino in archivos_a_limpiar:
        print(f"🧠 [Claude] Limpiando: {original}...")
        try:
            with open(original, "r", encoding="utf-8") as f:
                contenido = f.read()
            
            instruccion = f"""
            Eres el Auditor Senior de XCIEN. 
            Refina este documento ({original}) para que sea HIGIÉNICO, MINIMALISTA y PROFESIONAL.
            Usa listas, tablas y espaciado generoso.
            Ve directo al punto. Elimina redundancias.
            Mantén la estructura de los 5 PILARES MAESTROS de 2026.
            """
            
            resultado = claude.analizar_documento(contenido, instruccion)
            
            ruta_destino = os.path.join(folder, destino)
            with open(ruta_destino, "w", encoding="utf-8") as f:
                f.write(resultado)
            print(f"✨ Guardado en: {ruta_destino}")
        except Exception as e:
            print(f"❌ Error procesando {original}: {e}")

    # Copiar el Informe Técnico que ya limpiamos
    print("🚚 Moviendo Informe Técnico Higiénico a la carpeta de entrega...")
    try:
        with open("INFORME_TECNICO_XCIEN_HIGIENICO.md", "r", encoding="utf-8") as f:
            inf = f.read()
        with open(os.path.join(folder, "INFORME_TECNICO_HIGIENICO.md"), "w", encoding="utf-8") as f:
            f.write(inf)
    except:
        pass

    print("\n✅ [MISIÓN COMPLETA] Todos los documentos están listos en la carpeta de entrega.")

if __name__ == "__main__":
    consolidacion_final_higienica()
