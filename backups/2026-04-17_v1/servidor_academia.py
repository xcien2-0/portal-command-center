import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

SKILLS_DB = "db/skills_2026.json"
BANCO_PREGUNTAS = "banco_preguntas.json"

app = FastAPI(title="Portal Academia Xcien API")

# Habilitar CORS para que el frontend pueda hablar con la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DOCS_DIR = "Xcien_Docs"

class QuizRequest(BaseModel):
    filename: str

class SkillResult(BaseModel):
    nombre_tecnico: str
    resultados: dict  # {pilar: score}

@app.get("/api/docs")
def list_docs():
    """Lista todos los manuales generados en la biblioteca."""
    if not os.path.exists(DOCS_DIR):
        return []
    files = [f for f in os.listdir(DOCS_DIR) if f.endswith(".md")]
    return sorted(files)

@app.get("/api/docs/{filename}")
def get_doc(filename: str):
    """Obtiene el contenido de un manual específico."""
    path = os.path.join(DOCS_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    with open(path, "r", encoding="utf-8") as f:
        return {"content": f.read()}

@app.get("/api/diagnostic_exam")
def get_diagnostic_exam():
    """Carga el banco de preguntas maestro para el examen de diagnóstico."""
    if not os.path.exists(BANCO_PREGUNTAS):
        raise HTTPException(status_code=404, detail="Banco de preguntas no encontrado")
    with open(BANCO_PREGUNTAS, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/save_skill_result")
def save_skill_result(result: SkillResult):
    """Guarda o actualiza la matriz de habilidades de un técnico."""
    data = {}
    if os.path.exists(SKILLS_DB):
        with open(SKILLS_DB, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except:
                data = {}
    
    data[result.nombre_tecnico] = {
        "last_update": "2026-04-17", # Podría ser dinámico
        "skills": result.resultados
    }
    
    with open(SKILLS_DB, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    
    return {"status": "success", "message": f"Matriz actualizada para {result.nombre_tecnico}"}

QUIZ_CACHE_DIR = "Xcien_Docs/quizzes"

@app.post("/api/generate_quiz")
def generate_quiz(request: QuizRequest):
    """Genera un examen interactivo basado en un documento de la biblioteca con caché."""
    # 1. Verificar si ya existe un examen cacheado para este archivo
    cache_path = os.path.join(QUIZ_CACHE_DIR, request.filename.replace(".md", ".json"))
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)

    # 2. Si no existe, leer el documento
    path = os.path.join(DOCS_DIR, request.filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Documento no encontrado")
        
    with open(path, "r", encoding="utf-8") as f:
        context = f.read()
        
    try:
        # Probamos con 1.5-flash que suele ser más estable en cuota gratis
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
Eres un Diseñador Instruccional Senior de Academia Xcien. 
Tu tarea es leer el siguiente Estándar y generar un examen de certificación técnica riguroso.

IMPORTANTE: Devuelve exclusivamente un objeto JSON válido.
ESTRUCTURA DEL JSON:
{{
  "titulo": "Nombre del Examen",
  "preguntas": [
    {{
      "id": 1,
      "pregunta": "¿Texto de la pregunta?",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuesta_correcta": 0,
      "explicacion": "Explicación técnica"
    }}
  ]
}}

Genera 10 preguntas basadas en este contenido:
{context}
"""
        response = model.generate_content(prompt)
        text = response.text
        
        # Extraer el bloque JSON usando regex
        import re
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            json_str = match.group()
            quiz_result = json.loads(json_str)
        else:
            content = text.replace("```json", "").replace("```", "").strip()
            quiz_result = json.loads(content)
        
        # 3. Guardar en caché antes de devolver
        if not os.path.exists(QUIZ_CACHE_DIR):
            os.makedirs(QUIZ_CACHE_DIR)
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(quiz_result, f, indent=2)
            
        return quiz_result
        
    except Exception as e:
        print(f"❌ Error crítico en la generación de la IA: {e}")
        raise HTTPException(status_code=500, detail=f"Error al generar el examen (Límite de cuota alcanzado). Intenta de nuevo en un momento.")

# Servir archivos estáticos del frontend
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
