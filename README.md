Requirements

Python 3.9+

Docker

Docker Compose

Python packages (install via pip install -r requirements.txt):

pymilvus

openai or sentence-transformers (for embeddings)

tqdm, json, etc.

🚀 1. Start Milvus Server

Milvus provides a standalone container setup. From the repo root:

docker compose -f standalone-docker-compose.yml up -d


Check the container is running:

docker ps


Milvus listens on 127.0.0.1:19530 by default.

📂 2. Transform Products JSON

We start with raw Shopify-like product JSON.
Example input snippet:

{
  "id": 8660869513428,
  "title": "Vintage Brazil Athletic Sweatshirt 🇧🇷",
  "handle": "vintage-brazil-athletic-sweatshirt",
  "product_type": "Sweatshirt",
  "body_html": "<p>Super vintage and fire Brazil Sweater...</p>",
  "tags": ["men's", "Women's Top"],
  "features": ["vintage"],
  "variants": [
    {
      "id": 45738489184468,
      "title": "Default Title",
      "price": "25.00",
      "img_src": "https://cdn..."
    }
  ]
}


We convert each product into a flattened searchable record:

title, handle, body_html, tags, features

sizes_in_stock: derived from variants. If all variants are "Default Title", this is [].

in_stock: false if only "Default Title" is present, otherwise true.

embedding: generated from title/description text (using OpenAI or Sentence Transformers).

Script:

python3 transform_products.py --in products.json --out products_transformed.json

🧭 3. Upload to Milvus

Upload embeddings + metadata into Milvus:

python3 db_upload.py


This script:

Connects to Milvus (127.0.0.1:19530)

Creates a collection products_rogue_v1 if it doesn’t exist

Defines fields:

id (int64, primary key)

title (string)

product_type (string)

in_stock (bool)

sizes_in_stock (array<string>)

embedding (float vector)

Flushes inserts

Creates a vector index (IVF_FLAT / COSINE by default)

Loads the collection into memory