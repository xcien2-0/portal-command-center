import anthropic
import os
from dotenv import load_dotenv

# load_dotenv() buscará .env en el directorio actual (backend/)
load_dotenv()
key = os.environ.get("ANTHROPIC_API_KEY")
print(f"Key found: {key[:10]}...")

client = anthropic.Anthropic(api_key=key)

models = [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-haiku-20240307",
    "claude-3-opus-20240229",
    "claude-2.1"
]

for m in models:
    try:
        client.messages.create(
            model=m,
            max_tokens=10,
            messages=[{"role": "user", "content": "hi"}]
        )
        print(f"✅ SUCCESS: {m}")
    except Exception as e:
        print(f"❌ FAILED: {m} - {e}")
