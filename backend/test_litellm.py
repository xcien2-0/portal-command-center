import os
from litellm import completion
from dotenv import load_dotenv

env_path = "/Users/mesquite/Antigravity/backend/.env"
load_dotenv(env_path)

api_key = os.environ.get("ANTHROPIC_API_KEY")
os.environ["ANTHROPIC_API_KEY"] = api_key

models = ["anthropic/claude-3-5-sonnet-20240620", "anthropic/claude-3-opus-20240229", "anthropic/claude-3-haiku-20240307", "anthropic/claude-2.1"]

for model in models:
    try:
        print(f"Testing {model} via LiteLLM...")
        response = completion(
            model=model,
            messages=[{"role": "user", "content": "Hi"}],
            max_tokens=10
        )
        print(f"✅ {model} is available! Response: {response.choices[0].message.content}")
        break
    except Exception as e:
        print(f"❌ {model} failed: {e}")
