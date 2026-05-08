import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Check if there is a GOOGLE_API_KEY
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    # Try using the ANTHROPIC_API_KEY as a placeholder for Gemini? (sometimes users mix them up)
    # No, that's unlikely. 
    print("No GOOGLE_API_KEY found.")
else:
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hi")
        print(f"✅ Gemini 1.5 Flash is available! Response: {response.text}")
    except Exception as e:
        print(f"❌ Gemini failed: {e}")
