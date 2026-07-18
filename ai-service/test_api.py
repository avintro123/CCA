import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("Testing gemini-flash-latest...")
try:
    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents="Generate exciting cricket commentary for this delivery:\n\nBALL EVENT: SIX! Arjun launches bowler for a massive six!\nOVER: 1.1\nCURRENT SCORE: 10/0\nINNINGS: 1st\nBATSMAN: Arjun\nBOWLER: Bowler\nRespond with ONLY the commentary line (1-2 sentences). Make it vivid and exciting.",
        config=types.GenerateContentConfig(
            temperature=0.9,
        ),
    )
    print("Response:", response.text)
except Exception as e:
    print("Error Type:", type(e))
    print("Error Detail:", repr(e))
