import os
import sys

# Este es un wrapper para asegurar que se ejecute la versión robusta del backend
# La lógica real reside en backend/servidor_academia.py

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
BACKEND_SCRIPT = os.path.join(BACKEND_DIR, "servidor_academia.py")

if __name__ == "__main__":
    print("🔄 Redirigiendo ejecución al Backend Robusto v2.0...")
    os.chdir(BACKEND_DIR)
    sys.path.insert(0, BACKEND_DIR)
    
    # Ejecutar el script real
    with open(BACKEND_SCRIPT, "rb") as f:
        code = compile(f.read(), BACKEND_SCRIPT, 'exec')
        exec(code, {"__name__": "__main__", "__file__": BACKEND_SCRIPT})
