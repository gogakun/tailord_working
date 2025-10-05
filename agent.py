import json
import os
from typing import Any, Deque, Dict, List
import uuid
import asyncio
from agent_utils import DISPATCH, TOOLS
import openai
from dotenv import load_dotenv

# ----- CONFIG -----
load_dotenv()
api_key = os.getenv('OPENAI_KEY')
client = openai.OpenAI(api_key=api_key)

def _context_system_text(ctx) -> str:
    parts = []
    if getattr(ctx, "age", None) is not None:
        parts.append(f"age={ctx.age}")
    if getattr(ctx, "gender", None) is not None:
        parts.append(f"gender={ctx.gender}")
    profile = "; ".join(parts) if parts else "none provided"
    return (
        "User profile context: "
        f"{profile}. Use this ONLY to tailor style, sizing hints, or tone. "
        "Do not infer attributes, stereotype, or ask for unnecessary details."
    )

# ----- INIT -----
def run_agent_turn(
    messages: Deque[Dict[str, Any]],   # persistent history: user/assistant only
    base_system_prompt: str,           # e.g., "You are Tailord, ..."
    ctx,                               # UserContext (with age/gender)
    model: str = "gpt-4o",
    max_tool_iterations: int = 4,
) -> str:
   
    # Build working transcript seen by the model this turn
    working: List[Dict[str, Any]] = [
        {"role": "system", "content": base_system_prompt},
        {"role": "system", "content": _context_system_text(ctx)},
        *list(messages),
    ]

    for _ in range(max_tool_iterations + 1):
        resp = client.chat.completions.create(
            model=model,
            messages=working,
            tools=TOOLS,
            tool_choice="auto",
        )
        msg = resp.choices[0].message
        tool_calls = getattr(msg, "tool_calls", None)

        if tool_calls:
            # Record assistant request (with tool_calls) in the working transcript
            working.append({
                "role": "assistant",
                "content": msg.content or None,
                "tool_calls": [tc.model_dump() for tc in tool_calls],
            })

            # Execute tools and append outputs to the working transcript
            for tc in tool_calls:
                name = tc.function.name
                raw_args = tc.function.arguments or "{}"
                print(name, raw_args)
                try:
                    args = json.loads(raw_args)
                except json.JSONDecodeError:
                    args = {}

                fn = DISPATCH.get(name)
                if not fn:
                    tool_output = {"error": f"unknown_tool:{name}", "args": args}
                else:
                    try:
                        tool_output = fn(**args)  # <- if tools need ctx, see notes below
                    except Exception as e:
                        tool_output = {"error": str(e), "args": args}

                working.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": name,
                    "content": json.dumps(tool_output, ensure_ascii=False),
                })
            continue

        # Final assistant message → persist to your real history and return
        final = msg.content or ""
        #messages.append({"role": "assistant", "content": final})
        return final

    fallback = "I hit a tool-call loop limit—try rephrasing or /reset."
    messages.append({"role": "assistant", "content": fallback})
    return fallback




