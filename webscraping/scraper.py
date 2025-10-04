#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Rogue Garms catalog scraper (tops & bottoms).
- Tries Shopify public JSON endpoints first:
  /collections/<handle>/products.json?limit=250&page=N
  /products/<handle>.json
- Falls back to HTML collection parsing -> product handles -> product JSON.
- Outputs:
  1) products_rogue.json (product-level, deduped)
  2) variants_rogue.csv (variant-level rows, ready for retrieval/filters)
"""

import csv
import json
import re
import time
import argparse
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

UA = "Mozilla/5.0 (compatible; RogueCatalogBot/1.0; +catalog-use-case)"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": UA, "Accept": "text/html,application/json"})

# ----- CONFIG -----
DEFAULT_BASE = "https://roguegarms.com"
DEFAULT_COLLECTIONS = [
    # Women
    {"handle": "tops", "gender": "Women", "category": "Tops"},
    {"handle": "womens-bottoms", "gender": "Women", "category": "Bottoms"},
    # Men
    {"handle": "tees", "gender": "Men", "category": "Tops"},
    {"handle": "mens-bottoms-1", "gender": "Men", "category": "Bottoms"},
]

SLEEP_SEC = 0.6  # be polite


# ----- UTILS -----
def get_json(url, params=None):
    r = SESSION.get(url, params=params, timeout=20)
    r.raise_for_status()
    try:
        return r.json()
    except Exception:
        return None


def get_html(url, params=None):
    r = SESSION.get(url, params=params, timeout=20)
    r.raise_for_status()
    return r.text


def clean_text(s):
    if s is None:
        return None
    return re.sub(r"\s+", " ", BeautifulSoup(s, "html.parser").get_text(" ", strip=True)).strip()


def infer_subcategory(title: str, product_type: str, tags: list, category: str) -> str:
    """Heuristic subcategory inference by keywords (extend as needed)."""
    hay = " ".join(filter(None, [title or "", product_type or "", " ".join(tags or [])])).lower()

    bottoms_map = [
        ("cargo", "Cargo Pants"),
        ("trouser", "Trousers"),
        ("jogger", "Joggers"),
        ("sweatpant", "Sweatpants"),
        ("flare", "Jeans - Flare"),
        ("bootcut", "Jeans - Bootcut"),
        ("straight", "Jeans - Straight"),
        ("baggy", "Jeans - Baggy"),
        ("jean", "Jeans"),
        ("denim", "Jeans"),
        ("short", "Shorts"),
    ]
    tops_map = [
        ("hoodie", "Hoodie"),
        ("zip hoodie", "Hoodie"),
        ("sweatshirt", "Sweatshirt"),
        ("crewneck", "Sweatshirt"),
        ("tee", "T-Shirt"),
        ("t-shirt", "T-Shirt"),
        ("2-fer", "Layered Tee"),
        ("thermal", "Thermal"),
        ("longsleeve", "Longsleeve Tee"),
        ("shirt", "Shirt"),
        ("blouse", "Blouse"),
        ("corset", "Corset"),
        ("sweater", "Sweater"),
        ("tank", "Tank"),
        ("top", "Top"),
    ]

    mapping = bottoms_map if category.lower() == "bottoms" else tops_map
    for kw, sub in mapping:
        if kw in hay:
            return sub
    return "Other"


def parse_measurements(text):
    """Pull simple measurement hints from description (best effort)."""
    if not text:
        return {}
    t = text.lower()
    out = {}
    m = re.search(r"waist[^0-9]{0,10}(\d{2})", t)
    if m: out["waist"] = m.group(1)
    m = re.search(r"inseam[^0-9]{0,10}(\d{2})", t)
    if m: out["inseam"] = m.group(1)
    m = re.search(r"rise[^0-9]{0,10}(\d{1,2})", t)
    if m: out["rise"] = m.group(1)
    return out


def collect_handles_from_collection_html(collection_url):
    """Parse a collection page (with pagination) to extract product handles."""
    handles = set()
    page = 1
    # Shopify often uses ?page=N or cursor params; try both.
    while True:
        try:
            html = get_html(collection_url, params={"page": page})
        except Exception:
            break
        soup = BeautifulSoup(html, "html.parser")
        found = 0
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/products/" in href:
                # normalize to path, then get handle
                path = urlparse(href).path
                handle = path.rsplit("/", 1)[-1]
                handles.add(handle)
                found += 1
        # stop if we didn't find any new items on this page
        if found == 0:
            break
        page += 1
        time.sleep(SLEEP_SEC)
    return sorted(handles)


def fetch_collection_products(base, handle):
    """Try collections/<handle>/products.json (paged). Return list of product dicts."""
    products = []
    page = 1
    while True:
        url = f"{base}/collections/{handle}/products.json"
        try:
            data = get_json(url, params={"limit": 250, "page": page})
        except Exception:
            data = None
        if not data or "products" not in data or len(data["products"]) == 0:
            break
        products.extend(data["products"])
        page += 1
        time.sleep(SLEEP_SEC)
    return products


def fetch_product_json(base, handle):
    url = f"{base}/products/{handle}.json"
    try:
        return get_json(url)
    except Exception:
        return None


# ----- MAIN HARVEST -----
def harvest(base, collections, out_products_json, out_variants_csv):
    all_products = {}  # handle -> product json (canonical)
    rows = []  # variant-level rows for CSV

    for col in collections:
        handle = col["handle"]
        gender = col["gender"]
        category = col["category"]
        collection_url = f"{base}/collections/{handle}"

        # 1) Try collection JSON
        products = fetch_collection_products(base, handle)

        # 2) Fallback: HTML -> handles -> per-product JSON
        if not products:
            handles = collect_handles_from_collection_html(collection_url)
            for h in handles:
                pj = fetch_product_json(base, h)
                if pj and "product" in pj:
                    products.append(pj["product"])
                time.sleep(SLEEP_SEC)

        # 3) Normalize each product
        for p in products:
            # products from collection JSON are in "products"; product JSON is in "product"
            product = p.get("product") if isinstance(p, dict) and "product" in p else p
            if not isinstance(product, dict):
                continue

            handle = product.get("handle")
            if not handle:
                continue

            # Skip duplicates (product can appear in multiple collections)
            if handle in all_products:
                # but still add variant rows for gender/category from this collection if new
                pass
            else:
                all_products[handle] = product

            title = product.get("title")
            vendor = product.get("vendor")
            product_type = product.get("product_type")
            tags = product.get("tags") or []
            body_html = product.get("body_html") or ""

            description = clean_text(body_html)
            measures = parse_measurements(description)

            # Subcategory inference
            subcat = infer_subcategory(title, product_type, tags, category)

            # images
            image_urls = [img.get("src") for img in (product.get("images") or []) if img.get("src")]

            # variants -> one CSV row per variant
            for v in (product.get("variants") or []):
                variant_title = v.get("title")
                sku = v.get("sku")
                price = v.get("price")
                compare_at = v.get("compare_at_price")
                available = v.get("available")
                option1 = v.get("option1")
                option2 = v.get("option2")
                option3 = v.get("option3")

                # crude color/size guess from options/tags
                size = None
                color = None
                for o in [option1, option2, option3]:
                    if not o:
                        continue
                    if re.search(r"^(xxs|xs|s|m|l|xl|xxl|xxxl|xs\-xl|one size)$", o, re.I):
                        size = o
                    elif re.search(r"(black|white|grey|gray|blue|light|dark|red|green|pink|brown|beige|denim)", o, re.I):
                        color = o

                rows.append({
                    "title": title,
                    "gender": gender,
                    "category": category,                   # Tops or Bottoms
                    "subcategory": subcat,                  # Hoodie, Jeans - Baggy, etc.
                    "brand": vendor,                        # vendor
                    "color": color,
                    "size": size or variant_title,
                    "size_notes": None,
                    "waist": measures.get("waist"),
                    "inseam": measures.get("inseam"),
                    "rise": measures.get("rise"),
                    "fit": None,                            # not exposed in JSON; leave None or infer from title
                    "material": None,                       # often in description; could parse further
                    "pattern": None,
                    "condition": None,                      # many are vintage; if needed, parse from description
                    "price_usd": price,
                    "compare_at_usd": compare_at,
                    "availability": "In stock" if available else "Sold out",
                    "era": None,                            # parse from title e.g., '90s, 2000s' if present
                    "description": description,
                    "model_info": None,
                    "care_instructions": None,
                    "sku": sku,
                    "product_url": urljoin(base, f"/products/{handle}"),
                    "image_urls": "|".join(image_urls) if image_urls else None,
                    "product_handle": handle,
                    "product_type": product_type,
                    "tags": ",".join(tags) if tags else None,
                })

        time.sleep(SLEEP_SEC)

    # Write product-level JSON (deduped)
    with open(out_products_json, "w", encoding="utf-8") as f:
        json.dump({"count": len(all_products), "products": list(all_products.values())}, f, ensure_ascii=False, indent=2)

    # Write variant-level CSV
    fieldnames = [
        "title","gender","category","subcategory","brand","color","size","size_notes",
        "waist","inseam","rise","fit","material","pattern","condition","price_usd","compare_at_usd",
        "availability","era","description","model_info","care_instructions","sku",
        "product_url","image_urls","product_handle","product_type","tags"
    ]
    with open(out_variants_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)

    return len(all_products), len(rows)


def main():
    ap = argparse.ArgumentParser(description="Scrape Rogue Garms tops & bottoms.")
    ap.add_argument("--base", default=DEFAULT_BASE, help="Base URL (default: https://roguegarms.com)")
    ap.add_argument("--collections", nargs="*", default=[c["handle"] for c in DEFAULT_COLLECTIONS],
                    help="Collection handles to scrape (space-separated)")
    ap.add_argument("--out-products-json", default="products_rogue.json")
    ap.add_argument("--out-variants-csv", default="variants_rogue.csv")
    args = ap.parse_args()

    # rebuild collection dicts to include gender/category for any custom list
    coll_dict = []
    for h in args.collections:
        # use our defaults if known, else assume gender/category unknown
        match = next((c for c in DEFAULT_COLLECTIONS if c["handle"] == h), None)
        if match:
            coll_dict.append(match)
        else:
            coll_dict.append({"handle": h, "gender": None, "category": None})

    count_products, count_rows = harvest(args.base, coll_dict, args.out_products_json, args.out_variants_csv)
    print(f"Done. Products: {count_products}, Variant rows: {count_rows}")
    print(f"Wrote: {args.out_products_json}, {args.out_variants_csv}")


if __name__ == "__main__":
    main()
