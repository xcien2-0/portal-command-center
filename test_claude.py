import os
import anthropic
from dotenv import load_dotenv

# Cargar la API Key desde el archivo .env
load_dotenv()
api_key = os.environ.get("ANTHROPIC_API_KEY")

if not api_key or "tu_clave" in api_key:
    print("❌ Error: No se encontró la ANTHROPIC_API_KEY en el archivo .env")
else:
    client = anthropic.Anthropic(api_key=api_key)

    try:
        # Usamos el modelo más potente disponible actualmente
        message = client.messages.create(
          model="claude-haiku-4-5-20251001", 
          max_tokens=1024,
          messages=[{
            "role": "user",
            "content": "Hola Claude, soy el Director de Xcien. Estamos documentando nuestra operación 2026. ¿Estás listo para ayudarnos?"
          }]
        )
        print("\n🤖 [Respuesta de Claude]:")
        print(message.content[0].text)
    except Exception as e:
        print(f"❌ Ocurrió un error al conectar con Claude: {e}")
