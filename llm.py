import json
import os
from typing import Any, Dict, List
import uuid
import asyncio
from agent_utils import DISPATCH, TOOLS
import openai
from dotenv import load_dotenv

# ----- CONFIG -----
load_dotenv()
api_key = os.getenv('OPENAI_KEY')
client = openai.OpenAI(api_key=api_key)

# ----- INIT -----
def run_agent_turn(
    messages: List[Dict[str, Any]],
    model: str = "gpt-4o-mini",
    max_tool_iterations: int = 4,
) -> str:
    """
    Executes a single assistant turn:
      - Calls the model with current history
      - Executes any tool_calls it returns (loop)
      - Appends tool outputs to history
      - Returns the final assistant message content
    Side effect: mutates `messages` by appending assistant/tool messages.
    """
    for _ in range(max_tool_iterations + 1):
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
        )
        msg = resp.choices[0].message
        tool_calls = getattr(msg, "tool_calls", None)

        if tool_calls:
            # Record the assistant "tool request" message
            messages.append(
                {
                    "role": "assistant",
                    "content": msg.content or None,
                    "tool_calls": [tc.model_dump() for tc in tool_calls],
                }
            )

            # Execute tools and append their outputs
            for tc in tool_calls:
                name = tc.function.name
                raw_args = tc.function.arguments or "{}"
                try:
                    args = json.loads(raw_args)
                except json.JSONDecodeError:
                    args = {}

                fn = DISPATCH.get(name)
                if not fn:
                    tool_output = {"error": f"unknown_tool:{name}", "args": args}
                else:
                    try:
                        tool_output = fn(**args)
                    except Exception as e:
                        tool_output = {"error": str(e), "args": args}

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "name": name,
                        "content": json.dumps(tool_output, ensure_ascii=False),
                    }
                )
            # Loop so the model can read tool outputs and produce a final answer
            continue

        # Final assistant message for this turn
        final = msg.content or ""
        messages.append({"role": "assistant", "content": final})
        return final

    # Safety net
    fallback = "I hit a tool-call loop limit—try rephrasing or /reset."
    messages.append({"role": "assistant", "content": fallback})
    return fallback


if __name__ == "__main__":
    system_prompt = (
        "You help users find outfits from the store’s catalog.\n\n"
        "If the user mentions pop-culture fashion slang (e.g., 'opium-coded', 'blokette'), first call "
        "`glossary_lookup` with the phrase to obtain canonical tags.\n"
        "Assemble a normalized search query by calling the `query_to_search_str` tool, passing "
        "raw user query and the response from the glossary lookup tool.\n"
        "Next, call `catalog_search` with that JSON.\n\n"
        "Finally, present a grounded, neutral recommendation based ONLY on the returned products. "
        "Keep it concise, warm, and fashion-aware. Suggest how the items fit the vibe. \n"
        "Do not imply the user chose any item; avoid phrases like 'nice choice'. "
        "Cite details strictly from the product JSON (name, brand, price, color, material). "
        "If no results are suitable, ask a brief, specific follow-up (e.g., price or color)."
    )

    messages: List[Dict[str, Any]] = [{"role": "system", "content": system_prompt}]
    print("Tailord is ready. Type your request. Commands: /reset, /exit")

    try:
        while True:
            user_text = input("> ").strip()
            if not user_text:
                continue
            if user_text.lower() in {"/exit", "/quit"}:
                print("Goodbye!")
                break
            if user_text.lower() == "/reset":
                messages = [{"role": "system", "content": system_prompt}]
                print("(history cleared)")
                continue

            # Add user message to history
            messages.append({"role": "user", "content": user_text})

            # Run one conversational turn (with tool-calling loop)
            reply = run_agent_turn(messages)
            print(f"\nAssistant: {reply}\n")

            # Loop continues, preserving `messages` as context
    except (KeyboardInterrupt, EOFError):
        print("\nGoodbye!")




