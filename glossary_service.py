import json
from typing import Dict, List
from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection, utility
from db_upload import as_float32_list, embed

COLLECTION_NAME = "style_glossary"

GLOSSARY = {}
with open("glossary/glossary_normalized.jsonl") as f:
    for line in f:
            try:
                # Parse each line as a JSON object
                json_object = json.loads(line.strip())
                json_list = list(json_object.items())[1:]
                vibe = json_object.get("vibe", "").lower()
                GLOSSARY[vibe] = dict(json_list)
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON on line: {line.strip()}. Error: {e}")
                # You might choose to skip the faulty line or handle it differently
                continue

def build_glossary_texts(glossary: List[Dict]) -> List[str]:
    texts = []
    for vibe in glossary:
        definition = glossary[vibe].get("definition", "")
        items = glossary[vibe].get("items", [])
        cuts = glossary[vibe].get("cuts", [])
        materials = glossary[vibe].get("materials", [])
        text = f"Vibe: {vibe}. Definition: {definition} Items: {', '.join(items)}. Cuts: {', '.join(cuts)}. Materials: {', '.join(materials)}"
        texts.append(text)
    return texts

def ingest_glossary(glossary: List[Dict]):
    
    # 2) embed
    texts = build_glossary_texts(glossary)
    vectors = embed(texts)
    # 3) connect + create collection
    connections.connect(alias="default", host="127.0.0.1", port="19530")
    dim = len(vectors[0])
    if not utility.has_collection(COLLECTION_NAME):
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=512),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=dim),
        ]
        schema = CollectionSchema(fields, description="Glossary vibe embeddings")
        collection = Collection(name=COLLECTION_NAME, schema=schema)
    else:
        collection = Collection(name=COLLECTION_NAME)
    
    collection.create_index(
        field_name="embedding",
        index_params={
            "index_type": "HNSW",
            "metric_type": "IP",
            "params": {"M": 16, "efConstruction": 200}
        }
    )

    collection.insert([texts, vectors])
    collection.flush()
    
   
def search_glossary(query: str, top_k: int = 3) -> List[Dict]:
    """
    Search the glossary collection in Milvus for the closest vibes/items.
    Returns a list of dicts with text + score.
    """
    if not connections.has_connection("default"):
        connections.connect(alias="default", host="127.0.0.1", port="19530")
    collection = Collection(COLLECTION_NAME)
    collection.load()

    emb = embed(query)
    qvec = as_float32_list(emb)

    results = collection.search(
        data=[qvec],
        anns_field="embedding",
        param={"metric_type": "IP", "params": {"ef": 64}},
        limit=top_k,
        output_fields=["text"]
    )

    matches = []
    for hit in results[0]:
        matches.append({
            "text": hit.entity.get("text"),
            "score": hit.score
        })

    return matches



#ingest_glossary(GLOSSARY)

# drop index on the vector field
