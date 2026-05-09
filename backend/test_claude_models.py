import anthropic
import os
from dotenv import load_dotenv

load_dotenv(".env")
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

try:
    # Just a dummy call to see what fails
    client.messages.create(
        model="claude-3-5-sonnet-20240620",
        max_tokens=10,
        messages=[{"role": "user", "content": "hi"}]
    )
    print("SUCCESS: claude-3-5-sonnet-20240620")
except Exception as e:
    print(f"FAILED: claude-3-5-sonnet-20240620 - {e}")

try:
    client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=10,
        messages=[{"role": "user", "content": "hi"}]
    )
    print("SUCCESS: claude-3-sonnet-20240229")
except Exception as e:
    print(f"FAILED: claude-3-sonnet-20240229 - {e}")
