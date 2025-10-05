from __future__ import annotations
from collections import deque
from typing import Any, Deque, Dict, Optional, Literal

import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# ---- your agent code ----
from agent import run_agent_turn

# ---------- config ----------
MAX_TURNS = 60
BASE_SYSTEM_PROMPT = (
        "You help users find outfits from the store’s catalog.\n\n"
        "When the user mentions pop-culture fashion slang (e.g., 'indie', 'blokette', 'goth'), first call "
        "`glossary_lookup` with the phrase to obtain canonical tags.\n"
        "Assemble a normalized search query by calling the `query_to_search_str` tool, passing "
        "raw user query and the response from the glossary lookup tool. "
        "You must wait for the glossary lookup tool to return before calling the query_to_search_str tool\n"
        "Next, call `catalog_search` with search string and wait for it to return a list of products.\n\n"
        "Finally, present a grounded, neutral recommendation based ONLY on the returned products. "
        "Keep it concise, warm, and fashion-aware. Briefly mention how the items fit the vibe. \n"
        "Do not imply the user chose any item; avoid phrases like 'nice choice'. "
        "Cite details strictly from the product JSON (name, brand, price, color, material). "
        "If no results are suitable, ask a brief, specific follow-up (e.g., price or color)."
    )

# ---------- single active session state ----------
_messages: Deque[Dict[str, Any]] = deque(maxlen=MAX_TURNS)
_lock = asyncio.Lock()  # avoid races under concurrent requests
_ctx = {"gender": "Male", "age": 30}  # static context for this example
# ---------- models ----------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    reset: bool = False


class ChatResponse(BaseModel):
    reply: str
    turns: int


# ---------- app ----------
app = FastAPI(title="Tailord Chat API (single-session)")

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    async with _lock:
        global _messages, _ctx

        # optional reset of the single session
        if req.reset:
            _messages.clear()

        # add user turn
        _messages.append({"role": "user", "content": req.message})

        # run one assistant turn; pass a copy of messages
        try:
            reply = run_agent_turn(
                messages=list(_messages),
                base_system_prompt=BASE_SYSTEM_PROMPT,
                ctx=_ctx,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"agent_error: {e!s}")

        # persist the assistant turn in our single history
        _messages.append({"role": "assistant", "content": reply})
        print(_messages)
        
        return ChatResponse(
            reply=reply,
            turns=sum(1 for m in _messages if m["role"] in ("user", "assistant")),
        )
        
