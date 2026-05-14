import os
import sys
import argparse
from agente_claude import AgenteClaude
from dotenv import load_dotenv

load_dotenv()

class AuditorCodigo:
    def __init__(self):
        self.claude = AgenteClaude()
        self.ignore_dirs = [".git", "node_modules", ".venv", "dist", "build"]
        self.valid_extensions = [".py", ".ts", ".tsx", ".js", ".jsx", ".css", ".md"]

    def audit_file(self, file_path):
        """Audita un archivo específico usando Claude."""
        if not os.path.exists(file_path):
            return f"❌ El archivo {file_path} no existe."
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            prompt = f"""
            Eres el AUDITOR TÉCNICO SENIOR de XCIEN.
            Tu misión es revisar este archivo de código buscando:
            1. HIGIENE: Código limpio, sin comentarios basura, indentación perfecta.
            2. SEGURIDAD: Llaves expuestas, vulnerabilidades lógicas.
            3. ARQUITECTURA: Uso correcto de variables CSS, modularidad, tipado (si aplica).
            
            ARCHIVO: {file_path}
            CONTENIDO:
            {content}
            
            Da un veredicto conciso: PASA (con observaciones) o REQUIERE REFACTOR.
            """
            
            print(f"🔍 Auditando {file_path}...")
            report = self.claude.analizar_documento(content, prompt)
            return report
        except Exception as e:
            return f"❌ Error al auditar {file_path}: {e}"

    def list_codebase(self, root_dir="."):
        """Genera un mapa de la estructura para que Claude sepa qué revisar."""
        structure = []
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
            for file in files:
                if any(file.endswith(ext) for ext in self.valid_extensions):
                    rel_path = os.path.relpath(os.path.join(root, file), root_dir)
                    structure.append(rel_path)
        return structure

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auditor de Código XCIEN")
    parser.add_argument("--file", type=str, help="Archivo específico a auditar")
    parser.add_argument("--list", action="store_true", help="Listar archivos auditables")
    parser.add_argument("--full", action="store_true", help="Realizar una auditoría rápida de la estructura")
    
    args = parser.parse_args()
    auditor = AuditorCodigo()
    
    if args.file:
        print(auditor.audit_file(args.file))
    elif args.list:
        files = auditor.list_codebase()
        print("\n📂 Estructura de código detectable:")
        for f in files:
            print(f"  - {f}")
    elif args.full:
        print("🚀 Iniciando Auditoría Global de Estructura...")
        files = auditor.list_codebase()
        summary = f"Se detectaron {len(files)} archivos de código en el proyecto."
        print(f"✅ {summary}")
        # Aquí podrías añadir más lógica para auditar los archivos clave automáticamente
    else:
        parser.print_help()
