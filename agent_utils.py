import json
from typing import Any, Dict, List, Optional
from agents import Agent, Runner, ModelSettings, SQLiteSession
from agents.tool import function_tool, ToolContext
from db_upload import search_catalog
from glossary_service import search_glossary
import openai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('OPENAI_KEY')
client = openai.OpenAI(api_key=api_key)

def json_to_str(query: dict):
    # Turn JSON into a search string
    texts = []
    if "item" in query:
        texts.extend(query["item"])
    if "materials" in query:
        texts.extend(query["materials"])
    if "cuts" in query:
        texts.extend(query["cuts"])
    if "colors" in query:
        texts.extend(query["colors"])
    if "details" in query:
        texts.extend(query["details"])
    if "occasion" in query:
        texts.append(query["occasion"])
    if "season" in query:
        texts.append(query["season"])
    if "price" in query:
        texts.append(str(query["price"]))
    if "vibe_definition" in query:
        texts.append(query["vibe_definition"])

    search_str = " ".join(texts)
    return search_str

def llm_expand_query(user_query: str, vibe_info: str) -> dict:
    """
    Use an LLM to translate a user query and optional vibe_info into
    a structured JSON search query for the vector DB. Only include
    fields that are relevant; omit unknowns.
    
    Possible fields: item, price, materials, sizes, vibe_definition, cuts, colors, details, occasion, season.
    """

    system_prompt = """You are a fashion search query generator.
                    Convert the user query and vibe definition into a structured JSON object
                    with the following optional fields:
                    - "item": specific clothing items mentioned in user query
                    - "price": string or range (e.g., "budget", "under 150", "$50-100")
                    - "materials": list of materials
                    - "sizes": list of sizes
                    - "vibe_definition": short description of the vibe
                    - "cuts": list of fits/cuts
                    - "colors": list of colors
                    - "details": list of style details
                    - "occasion": string (e.g., "night out", "office", "festival")
                    - "season": string (spring/summer/fall/winter)

                    Only include fields you can infer. If a field is not present in the user query
                    or vibe definition, omit it completely. If a user query mentions specific clothing items, 
                    include only those items in the JSON object. Otherwise, rely on the items mentioned in the vibe definition. 
                    Output *only* valid JSON.
                    """

    user_prompt = f"""User query: {user_query} Vibe definition: {vibe_info}"""

    resp = client.chat.completions.create(
        model="gpt-5-nano",  # or whichever model you're using
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        max_completion_tokens=5000
    )
    raw = resp.choices[0].message.content

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # fallback: return empty dict if LLM outputs non-JSON
        parsed = {}

    return parsed



TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "catalog_search_tool",
            "description": "Search the fashion catalog with structured filters and return top matches.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Normalized query with optional fields; string formatted from JSON", "additionalProperties": False},
                    "top_k": {"type": "integer", "default": 5},    
                },
                "required": ["item"],
                "additionalProperties": False
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "glossary_lookup_tool",
            "description": "Look up a fashion term and return a concise definition and examples.",
            "parameters": {
                "type": "object",
                "properties": {
                    "term": {"type": "string", "description": "The fashion term to define, e.g. 'selvedge denim'."}
                },
                "required": ["term"],
                "additionalProperties": False
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_to_search_str_tool",
            "description": "Turn a freeform user query into a compact catalog search string.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Raw user query"},
                    "vibe_info": {"type": "array", "items": {"type": "string"}, "description": "List of vibe info strings"},
                },
                "required": ["user_query"],
                "additionalProperties": False
            },
        },
    },
]



def _catalog_search_tool(*, query: str,
                         top_k: int = 10) -> Dict[str, Any]:
   
    hits = search_catalog(query, top_k)
    return hits


def _glossary_lookup_tool(*, term: str) -> Dict[str, Any]:
    vibe_info = []
    glossary_lookup = search_glossary(term)[0]
    if glossary_lookup['score'] > 0.5:
        vibe_info = [glossary_lookup['text']]
    return vibe_info


def _query_to_search_str_tool(*, query: str, vibe_info: List[str]) -> Dict[str, Any]:
    json_search_obj = llm_expand_query(query, vibe_info)
    print(json_search_obj)
    str_search_obj = json_to_str(json_search_obj)
    return str_search_obj


DISPATCH = {
    "catalog_search_tool": _catalog_search_tool,
    "glossary_lookup_tool": _glossary_lookup_tool,
    "query_to_search_str_tool": _query_to_search_str_tool,
}