import os
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

class AgenteClaude:
    def __init__(self):
        self.api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key or "tu_clave" in self.api_key:
            self.client = None
            print("⚠️ [Agente Claude] API Key no configurada. Por favor, agrégala al archivo .env")
        else:
            self.client = Anthropic(api_key=self.api_key)
            print("🎭 [Agente Claude] Conectado. Listo para tareas de alta estrategia y redacción.")

    def analizar_documento(self, contenido, instruccion="Refina este documento para que sea profesional y claro."):
        if not self.client:
            return "Error: Claude no está configurado."
        
        prompt = f"""
        Eres un experto en Consultoría de Operaciones y Redacción Corporativa para XCIEN.
        Tu objetivo es: {instruccion}
        
        DOCUMENTO:
        {contenido}
        """
        
        message = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text

if __name__ == "__main__":
    claude = AgenteClaude()
    # Ejemplo de uso:
    # print(claude.analizar_documento("Manual de antenas v1", "Mejora el tono ejecutivo."))
