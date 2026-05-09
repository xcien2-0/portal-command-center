import anthropic
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

try:
    client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=10,
        messages=[{"role": "user", "content": "hi"}]
    )
    print("SUCCESS: claude-3-haiku-20240307")
except Exception as e:
    print(f"FAILED: claude-3-haiku-20240307 - {e}")
