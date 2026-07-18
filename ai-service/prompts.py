"""
prompts.py — Prompt Engineering for Cricket Commentary
=======================================================
This is where you learn PROMPT ENGINEERING — the art of telling an AI
exactly what you want it to do. A good prompt has:

1. SYSTEM PROMPT (persona) — WHO the AI should be
2. CONTEXT — WHAT data the AI needs to know
3. INSTRUCTIONS — HOW the AI should respond
4. CONSTRAINTS — Rules to keep the output focused
"""


# The SYSTEM PROMPT defines the AI's persona.
# Think of it as the AI's "character sheet" — it controls
# tone, style, knowledge boundaries, and behavior.
COMMENTARY_SYSTEM_PROMPT = """You are an electrifying cricket commentator known for your 
passionate and vivid ball-by-ball commentary. You bring every delivery to life with:

- Dramatic flair for boundaries and wickets
- Technical cricket knowledge (shot names, bowling variations)
- Awareness of match situations (pressure, run rates, chase dynamics)
- Short, punchy sentences that create excitement
- Occasional humor and cricket metaphors

CRITICAL RULES:
1. Do NOT hallucinate specific match events that are not in the prompt (e.g., do not make up fielding positions, shot directions, who caught the ball, or wild events like panicky throws) unless they are explicitly provided in the data.
2. Focus on describing the sheer impact of the runs scored or the wicket taken using the exact provided context.
3. You ONLY respond with the commentary line — no labels, no quotes, no prefixes.
4. Keep each commentary to 1-2 sentences maximum."""


def build_commentary_prompt(ball_event: dict, match_context: dict) -> str:
    """
    Builds a detailed prompt for the AI using the ball event and match context.
    
    This is RAG-LITE (Retrieval Augmented Generation) — we're "retrieving"
    the current match state and feeding it as context to the AI so it can
    generate informed, contextual responses instead of generic ones.
    
    Args:
        ball_event: The ball that was just bowled (runs, wicket, extras, etc.)
        match_context: Current match situation (score, overs, innings, etc.)
    """
    
    # Extract ball details
    batsman = ball_event.get("batsmanName", "Unknown")
    bowler = ball_event.get("bowlerName", "Unknown")
    runs = ball_event.get("runs", 0)
    is_wicket = ball_event.get("isWicket", False)
    wicket_type = ball_event.get("wicketType", "")
    extra_type = ball_event.get("extraType", "")
    dismissed_player = ball_event.get("dismissedPlayer", "")
    
    # Extract match situation
    current_score = match_context.get("score", 0)
    wickets = match_context.get("wickets", 0)
    overs = match_context.get("overs", 0)
    balls_in_over = match_context.get("ballsInCurrentOver", 0)
    current_innings = match_context.get("currentInnings", 1)
    target = match_context.get("target", None)  # Only for 2nd innings
    match_status = match_context.get("status", "LIVE")
    
    # Build the over notation (e.g., "12.3" means 12 overs and 3 balls)
    over_notation = f"{overs}.{balls_in_over}"
    
    # Describe what happened on this ball
    if is_wicket:
        ball_description = f"WICKET! {dismissed_player or batsman} is OUT — {wicket_type}."
    elif extra_type == "WIDE":
        ball_description = f"Wide ball bowled by {bowler}. {runs} extra run(s) added."
    elif extra_type == "NO_BALL":
        ball_description = f"No ball by {bowler}! Free hit coming up. {runs} run(s) scored."
    elif runs == 6:
        ball_description = f"SIX! {batsman} launches {bowler} for a massive six!"
    elif runs == 4:
        ball_description = f"FOUR! {batsman} finds the boundary off {bowler}."
    elif runs == 0:
        ball_description = f"Dot ball. {bowler} keeps it tight to {batsman}."
    else:
        ball_description = f"{batsman} takes {runs} run(s) off {bowler}."
    
    # Build the chase context for 2nd innings
    chase_context = ""
    if current_innings == 2 and target:
        runs_needed = target - current_score
        chase_context = f"\nCHASE SITUATION: Need {runs_needed} more runs to win."
    
    # Build match completion context
    completion_context = ""
    if match_status == "COMPLETED":
        completion_context = "\nTHIS BALL HAS ENDED THE MATCH! React to the match result dramatically."
    
    # The final prompt that gets sent to the AI
    prompt = f"""Generate exciting cricket commentary for this delivery:

BALL EVENT: {ball_description}
OVER: {over_notation}
CURRENT SCORE: {current_score}/{wickets}
INNINGS: {"1st" if current_innings == 1 else "2nd"}
BATSMAN: {batsman}
BOWLER: {bowler}{chase_context}{completion_context}

Respond with ONLY the commentary line (1-2 sentences). Make it vivid and exciting."""

    return prompt
