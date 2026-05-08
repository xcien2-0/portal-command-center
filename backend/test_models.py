import os
import anthropic
from dotenv import load_dotenv

# Path to the .env file that has the key
env_path = "/Users/mesquite/Antigravity/backend/.env"
load_dotenv(env_path)

api_key = os.environ.get("ANTHROPIC_API_KEY")
print(f"API Key loaded (first 10 chars): {api_key[:10] if api_key else 'None'}")

client = anthropic.Anthropic(api_key=api_key)

models = ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307", "claude-2.1"]

for model in models:
    try:
        print(f"Testing {model}...")
        message = client.messages.create(
            model=model,
            max_tokens=10,
            messages=[{"role": "user", "content": "Hi"}]
        )
        print(f"✅ {model} is available!")
        break
    except Exception as e:
        print(f"❌ {model} failed: {e}")
