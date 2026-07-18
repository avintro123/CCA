"""
main.py — FastAPI AI Service for Cricket Commentary
====================================================
This is your Python AI microservice. It:
1. Receives ball event data from the NestJS backend via HTTP
2. Sends that data to Google Gemini (an LLM) with a crafted prompt
3. Returns the AI-generated commentary

KEY GENAI CONCEPTS IN THIS FILE:
- Initializing an LLM client (google.genai)
- Configuring model parameters (temperature, max_tokens)
- Making API calls to a Large Language Model
- Handling AI responses and errors gracefully
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types

from prompts import COMMENTARY_SYSTEM_PROMPT, build_commentary_prompt

# Load environment variables from .env file
load_dotenv()

# =====================================================
# STEP 1: Initialize the Gemini AI Client
# =====================================================
# This is how you connect to Google's Gemini LLM.
# The API key authenticates your requests.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("[WARNING] GEMINI_API_KEY not found in .env file!")
    print("   The AI service will start but commentary generation will fail.")
    print("   Get your free key at: https://aistudio.google.com/apikey")

# =====================================================
# STEP 2: Create the Gemini Client
# =====================================================
# The new google-genai SDK uses a Client pattern.
# 'gemini-2.0-flash' is Google's fastest model — great for
# real-time commentary where speed matters more than depth.
client = genai.Client(api_key=GEMINI_API_KEY)

# Model name to use
MODEL_NAME = "gemini-flash-lite-latest"


# =====================================================
# STEP 3: Define the FastAPI Application
# =====================================================
app = FastAPI(
    title="CricketApp AI Service",
    description="Generative AI-powered cricket commentary using Google Gemini",
    version="1.0.0",
)

# Allow requests from your NestJS backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# STEP 4: Define Request/Response Models (Pydantic)
# =====================================================
# Pydantic models validate incoming data automatically.
# If the NestJS backend sends bad data, FastAPI returns
# a helpful error instead of crashing.

class BallEvent(BaseModel):
    """Represents a single ball delivery in a cricket match."""
    batsmanName: str
    bowlerName: str
    runs: int = 0
    extras: int = 0
    extraType: Optional[str] = None
    isWicket: bool = False
    wicketType: Optional[str] = None
    dismissedPlayer: Optional[str] = None


class MatchContext(BaseModel):
    """Current match situation — used as context for the AI."""
    score: int = 0
    wickets: int = 0
    overs: int = 0
    ballsInCurrentOver: int = 0
    currentInnings: int = 1
    target: Optional[int] = None  # Target score (2nd innings only)
    status: str = "LIVE"


class CommentaryRequest(BaseModel):
    """The full request body sent by NestJS after each ball."""
    ball_event: BallEvent
    match_context: MatchContext


class CommentaryResponse(BaseModel):
    """What we send back to NestJS."""
    commentary: str
    success: bool = True


# =====================================================
# STEP 5: API Endpoints
# =====================================================

@app.get("/health")
async def health_check():
    """Health check — NestJS can ping this to verify the AI service is running."""
    return {
        "status": "healthy",
        "service": "CricketApp AI Commentary",
        "model": MODEL_NAME,
    }


@app.post("/commentary", response_model=CommentaryResponse)
async def generate_commentary(request: CommentaryRequest):
    """
    Generate AI commentary for a ball delivery.

    THIS IS THE CORE GENAI FUNCTION:
    1. Takes the ball event + match context
    2. Builds a prompt using our prompt engineering module
    3. Sends it to Gemini
    4. Returns the AI-generated commentary
    """
    try:
        # Build the prompt using our prompt engineering module
        prompt = build_commentary_prompt(
            ball_event=request.ball_event.model_dump(),
            match_context=request.match_context.model_dump(),
        )

        # =============================================
        # THIS IS THE ACTUAL AI CALL
        # =============================================
        # We send our crafted prompt to Gemini and get back
        # generated text. Under the hood, the model:
        # 1. Tokenizes our prompt into numbers
        # 2. Runs it through billions of neural network parameters
        # 3. Predicts the most likely next tokens
        # 4. Returns the generated text
        #
        # GENERATION CONFIG explained:
        # - temperature: Controls randomness (0.0 = deterministic, 1.0 = creative)
        #   We use 0.9 for exciting, varied commentary
        # - max_output_tokens: Limits response length (short, punchy lines)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=COMMENTARY_SYSTEM_PROMPT,
                temperature=0.9,        # High creativity for exciting commentary
            ),
        )

        # Extract the generated text safely
        commentary = (response.text or "").strip()

        # Remove any quotes or markdown the AI might wrap around its response
        commentary = commentary.strip('"').strip("'").strip("*").strip()

        print(f"[AI Commentary] {commentary}")

        return CommentaryResponse(commentary=commentary, success=True)

    except Exception as e:
        print(f"[AI Error] {str(e)}")
        # Return a fallback instead of crashing
        # This is important — your app should NEVER break because AI fails
        return CommentaryResponse(
            commentary=_generate_fallback_commentary(request.ball_event),
            success=False,
        )


def _generate_fallback_commentary(ball: BallEvent) -> str:
    """
    Simple rule-based fallback when the AI is unavailable.
    This ensures the app still shows something useful even
    if Gemini is down or the API key is invalid.
    """
    if ball.isWicket:
        return f"WICKET! {ball.dismissedPlayer or ball.batsmanName} has been dismissed!"
    elif ball.runs == 6:
        return f"SIX! {ball.batsmanName} sends it into the crowd!"
    elif ball.runs == 4:
        return f"FOUR! {ball.batsmanName} finds the boundary!"
    elif ball.runs == 0:
        return f"Dot ball. Tight bowling from {ball.bowlerName}."
    else:
        return f"{ball.runs} run(s) taken by {ball.batsmanName}."


# =====================================================
# STEP 6: Run the server
# =====================================================
# In production you'd use: uvicorn main:app --host 0.0.0.0 --port 8000
# For development: uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
