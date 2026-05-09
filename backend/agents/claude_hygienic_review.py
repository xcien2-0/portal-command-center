import os
from agente_claude import AgenteClaude
from dotenv import load_dotenv

load_dotenv()

def operacion_higiene_total():
    print("🧼 [Antigravity] Iniciando 'Operación Higiene' con el Agente Claude...")
    
    claude = AgenteClaude()
    
    # Leer el Informe Técnico actual (ubicado en la raíz del proyecto)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    archivo_ruta = os.path.join(base_dir, "INFORME_TECNICO_OPERACIONES_XCIEN.md")
    try:
        with open(archivo_ruta, "r", encoding="utf-8") as f:
            contenido_original = f.read()
    except Exception as e:
        print(f"❌ Error al leer el archivo: {e}")
        return

    # Instrucción específica para la estética del usuario
    instruccion = """
    Refina este documento técnico siguiendo estrictamente estos principios:
    1. MINIMALISMO: Elimina cualquier palabra redundante. Ve directo al grano.
    2. HIGIENE VISUAL: Usa listas cortas, mucho espacio en blanco y una estructura muy limpia.
    3. TONO EJECUTIVO: Que parezca redactado por una consultoría de clase mundial.
    4. FOCO: No menciones agentes de IA, enfócate en la REALIDAD OPERATIVA y los 5 PILARES MAESTROS.
    
    Mantén los datos técnicos (niveles de RF, estados de cobertura, etc.) intactos pero presentados con elegancia.
    """

    print("🧠 [Claude] Procesando documento... esto tomará unos segundos.")
    resultado = claude.analizar_documento(contenido_original, instruccion)
    
    # Guardar la versión Higiénica
    nuevo_archivo = "INFORME_TECNICO_XCIEN_HIGIENICO.md"
    with open(nuevo_archivo, "w", encoding="utf-8") as f:
        f.write(resultado)
    
    print(f"✨ [Éxito] Informe Higiénico generado en: {nuevo_archivo}")
    print("\n--- RESUMEN DE CLAUDE ---")
    print(resultado[:500] + "...")

if __name__ == "__main__":
    operacion_higiene_total()
