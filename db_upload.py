import re 
import json
import html
from sentence_transformers import SentenceTransformer
from pymilvus import (
    connections, FieldSchema, CollectionSchema, DataType,
    Collection, utility
)
from typing import List, Dict
COLLECTION_NAME = "products_rogue_v1"
import numpy as np

def strip_html(html_text: str) -> str:
    # unescape & remove tags, collapse whitespace
    if not html_text:
        return ""
    text = html.unescape(html_text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def normalize_list(xs):
    # lowercased, trimmed, unique while preserving order
    out, seen = [], set()
    for x in xs or []:
        s = (x or "").strip()
        if not s:
            continue
        key = s.lower()
        if key not in seen:
            seen.add(key)
            out.append(s)
    return out

def transform_product(p: dict) -> dict:
    variants = p.get("variants") or []

    # sold-out rule
    sold_out = any((v.get("title") or "").strip() == "Default Title" for v in variants)
    if sold_out:
        sizes_in_stock = []
        in_stock = False
    else:
        # collect titles that aren't the Shopify Default
        sizes_in_stock = [ (v.get("title") or "").strip()
                           for v in variants
                           if (v.get("title") or "").strip() and (v.get("title") or "").strip() != "Default Title" ]
        sizes_in_stock = normalize_list(sizes_in_stock)
        in_stock = len(sizes_in_stock) > 0

    # build a clean search text
    body_text = strip_html(p.get("body_html", ""))
    tags = normalize_list(p.get("tags") or [])
    features = normalize_list(p.get("features") or [])


    # helpful, consistent synthesis of the record into a searchable paragraph
    search_text = " | ".join(filter(None, [
        p.get("title", "").strip(),
        p.get("product_type", "").strip(),
        f"Tags: {', '.join(tags)}" if tags else "",
        f"Features: {', '.join(features)}" if features else "",
        f"Sizes in stock: {', '.join(sizes_in_stock)}" if sizes_in_stock else "Sold out",
        body_text,
    ]))

    out = {
        "id": p.get("id"),
        "title": (p.get("title") or "").strip(),
        "handle": (p.get("handle") or "").strip(),
        "product_type": (p.get("product_type") or "").strip(),
        "tags": tags,
        "features": features,
        "img": (variants[0].get("img_src") if variants else None) or None,
        "sizes_in_stock": sizes_in_stock,
        "in_stock": in_stock,
        "price_min": min([float(v.get("price")) for v in variants if v.get("price")], default=None),
        "price_max": max([float(v.get("price")) for v in variants if v.get("price")], default=None),
        "search_text": search_text
    }
    print(search_text)
    return out




MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

def embed(texts: List[str]) -> np.ndarray:
    vecs = model.encode(texts, normalize_embeddings=True)  # cosine-ready
    return np.asarray(vecs, dtype="float32")

def ensure_collection(dim: int):
    if utility.has_collection(COLLECTION_NAME):
        return Collection(COLLECTION_NAME)

    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=False),
        FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=dim),
        FieldSchema(name="metadata", dtype=DataType.JSON)   # store the transformed record here
    ]
    schema = CollectionSchema(fields, description="Product catalog with vector + JSON metadata")
    col = Collection(name=COLLECTION_NAME, schema=schema)

    # Build an HNSW index (good for cosine/IP; we normalized vectors above)
    col.create_index(
        field_name="vector",
        index_params={
            "index_type": "HNSW",
            "metric_type": "IP",
            "params": {"M": 16, "efConstruction": 200}
        }
    )
    return col

def ingest(raw_products: List[Dict]):
    # 1) transform
    transformed = [transform_product(p) for p in raw_products]
    # 2) embed
    texts = [t["search_text"] for t in transformed]
    vectors = embed(texts)
    # 3) connect + create collection
    connections.connect(alias="default", host="127.0.0.1", port="19530")
    col = ensure_collection(dim=vectors.shape[1])
    # 4) insert
    ids = [int(t["id"]) for t in transformed]
    metas = transformed  # store whole object
    col.insert([ids, vectors, metas])
    col.flush()





def as_float32_list(vec):
    import numpy as np
    # Handle torch tensors
    try:
        import torch
        if isinstance(vec, torch.Tensor):
            vec = vec.detach().cpu().numpy()
    except Exception:
        pass

    arr = np.array(vec, dtype=np.float32)   # ensures numeric & float32
    if arr.ndim != 1:
        raise ValueError(f"Expected 1D vector, got shape {arr.shape}")
    if np.isnan(arr).any() or np.isinf(arr).any():
        arr = np.nan_to_num(arr, nan=0.0, posinf=1e6, neginf=-1e6)
    return arr.tolist()

def search(query: str, topk=5, only_in_stock=True):
    connections.connect(alias="default", host="127.0.0.1", port="19530")
    col = Collection(COLLECTION_NAME)

    emb = embed(query)
    qvec = as_float32_list(emb)
    # Optional filter on JSON field
    expr = None
    if only_in_stock:
        expr = 'metadata["in_stock"] == true'

    # search
    res = col.search(
        data=[qvec],
        anns_field="vector",
        param={"metric_type": "IP", "params": {"ef": 64}},
        limit=topk,
        expr=expr,
        output_fields=["metadata"]
    )
    # format results
    out = []
    for hit in res[0]:
        meta = hit.entity.get("metadata")
        out.append({
            "score": float(hit.distance),
            "id": meta["id"],
            "title": meta["title"],
            "product_type": meta["product_type"],
            "in_stock": meta["in_stock"],
            "sizes_in_stock": meta["sizes_in_stock"],
            "handle": meta["handle"]
        })
    return out

def get_vibe_info(query):
      
        data = []
        with open("glossary_normalized.jsonl", 'r', encoding='utf-8') as f:
            for line in f:
                # Strip whitespace (including the newline character) and parse each line
                try:
                    data.append(json.loads(line.strip()))
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON on line: {line.strip()} - {e}")
        search_queries = []
        vibe_items = []
        for d in data:
            if d["vibe"] == query:
                vibe = d["vibe"]
                vibe_items = d["items"]
                vibe_description = d["definition"]
            
        for item in vibe_items:
            search_text = f"{item} that fits the {vibe} vibe ({vibe_description})"
            search_queries.append(search_text)
        return search_queries
        
if __name__ == "__main__":
    
    query = "balkan rage"
    item_vibes = get_vibe_info(query)
    print(item_vibes)
    for search_query in item_vibes:
        print("________________________________________________")
        print(search(search_query, topk=5, only_in_stock=False))
