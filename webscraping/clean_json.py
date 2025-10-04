import argparse
import json
from typing import Any, Dict, List, Optional, Union
import re 

GENERIC_TYPES = {
    "shirts & tops", "tops", "top", "shirt", "shirts",
    "women's top", "womens top", "men's top", "mens top",
    "clothing", "apparel",
    "skirt", "trousers", "jacket", "vintage"   # <- add these as “unreliable”
}
RE_WxL          = re.compile(r"\b\d{2}x\d{2}\b")
RE_PANTS_WORDS  = re.compile(r"\b(pants?|trousers?|chinos?)\b")
RE_JEANS_WORD   = re.compile(r"\bjeans?\b")
RE_PANTS_FEATS  = re.compile(r"\b(5[\-\s]?pocket|coin pocket|zip fly|button fly|rivet(s)?|inseam|rise \d+|leg opening)\b")
RE_DENIM_WEIGHT = re.compile(r"\b\d{2}\s?oz\b")
RE_SELVEDGE     = re.compile(r"\bselv(e)?dge\b")
# add near the top with other regexes
RE_LACE   = re.compile(r"\blace(d)?\b")
RE_MESH   = re.compile(r"\bmesh\b")
RE_SHEER  = re.compile(r"\bsheer\b")
RE_RIBBED = re.compile(r"\bribbed?\b")
RE_GRAPHIC= re.compile(r"\bgraphic\b|\bprint(ed)?\b|\bscreen\s*print\b")
RE_SEQUIN = re.compile(r"\bsequin(ed|s)?\b|\brhinestone(s)?\b|\bfoil(ed)?\b")
RE_CROP   = re.compile(r"\b(crop|cropped)\b")
RE_VINTAGE= re.compile(r"\bvintage\b|y2k|90s|2000s")
RE_CREWNECK= re.compile(r"\bcrewneck\b")
SKIRT_PAT = r"(?:\bskirt\b|\bmini[-\s]?skirt\b|mini[-\s]?skirt)"
COAT_PAT = r"\b(puffer\s*coat|puffercoat|down\s*coat|trench|overcoat|parka|mac|duffle)\b|\bcoat\b"
TRACK_PANTS_PAT = r"\btrack\s*pant(s)?\b"

def _refine_coat_label(h1: str, h2: str, h3: str) -> str:
    hay = " ".join([h1, h2, h3])

    # broaden “puffer” detection: puffer, puffer coat/jacket, puffercoat, down, quilted, insulated
    is_puffer   = re.search(r"\bpuffer(\s*(coat|jacket))?\b|\bpuffercoat\b|\bdown\b|\bquilt(ed|ing)\b|\binsulat(ed|ion)\b", hay)
    is_parka    = re.search(r"\bparka\b", hay)
    is_trench   = re.search(r"\btrench\b", hay)
    is_overcoat = re.search(r"\bovercoat\b", hay)
    is_mac      = re.search(r"\bmac(kintosh)?\b", hay)
    is_ski      = re.search(r"\bski(i)?\b", hay)  # handles 'ski' and common 'skii' typo

    # precedence: puffer > parka > trench > overcoat > mac
    if is_puffer:
        # optional: call out ski-specific puffer if you like
        return "Puffer Coat"
    if is_parka:
        return "Parka"
    if is_trench:
        return "Trench Coat"
    if is_overcoat:
        return "Overcoat"
    if is_mac:
        return "Mac Coat"

    # ski without puffer/parka → generic “Ski Coat”
    if is_ski:
        return "Ski Coat"

    return "Coat"

def _extract_features(title, handle, tags, body_html) -> List[str]:
    # trust title+handle first, then tags, then body
    h1 = _norm_text(title, handle)
    h2 = _norm_text(tags)
    h3 = _norm_text(body_html)
    hay = " ".join([h1, h2, h3])

    feats = []
    if RE_LACE.search(hay):    feats.append("lace")
    if RE_MESH.search(hay):    feats.append("mesh")
    if RE_SHEER.search(hay):   feats.append("sheer")
    if RE_RIBBED.search(hay):  feats.append("ribbed")
    if RE_GRAPHIC.search(hay): feats.append("graphic")
    if RE_SEQUIN.search(hay):  feats.append("sequined")
    if RE_CROP.search(hay):    feats.append("cropped")
    if RE_VINTAGE.search(hay): feats.append("vintage")
    if RE_CREWNECK.search(hay): feats.append("crewneck")
    # de-dupe while preserving order
    seen = set(); out=[]
    for f in feats:
        if f not in seen:
            seen.add(f); out.append(f)
    return out


_CANON = {
    # unify tees/tanks/camis
    "cami": "camisole",
    "cami top": "camisole",
    "camisole": "camisole",
    "tank": "tank top",
    "tank top": "tank top",
    "t shirt": "t-shirt",
    "tee": "t-shirt",
    "longsleeve tee": "longsleeve tee",
    "long sleeve tee": "longsleeve tee",

    # shirts
    "button down": "button-up shirt",
    "button down shirt": "button-up shirt",
    "button up": "button-up shirt",
    "button up shirt": "button-up shirt",
    "dress shirt": "button-up shirt",
    "work shirt": "button-up shirt",
    "shirt": "shirt",

    # knits/outerwear
    "sweat shirt": "sweatshirt",
    "crew neck": "sweatshirt",
    "crewneck": "sweatshirt",
    "hooded": "hoodie",
    "hoodie": "hoodie",
    "sweater": "sweater",
    "jumper": "sweater",
    "cardigan": "cardigan",
    "jacket": "jacket",
    "coat": "coat",
    "puffercoat": "coat",
    "vest": "vest",
    "corset": "corset",
    "jersey": "jersey",   # NEW

    # bottoms
    "trouser": "trousers",
    "trousers": "trousers",
    "pants": "trousers",
    "jeans": "jeans",
    "cargo": "cargo pants",
    "cargo pants": "cargo pants",
    "joggers": "joggers",
    "sweatpants": "sweatpants",
    "shorts": "shorts",
    "skirt": "skirt",

    # one-piece
    "dress": "dress",
}

_CANON_TITLE = {
    # Only for nice casing in output
    "camisole": "Camisole",
    "tank top": "Tank Top",
    "t-shirt": "T-Shirt",
    "longsleeve tee": "Longsleeve Tee",
    "button-up shirt": "Button-Up Shirt",
    "sweatshirt": "Sweatshirt",
    "hoodie": "Hoodie",
    "sweater": "Sweater",
    "cardigan": "Cardigan",
    "jacket": "Jacket",
    "coat": "Coat",
    "jersey": "Jersey",
    "vest": "Vest",
    "corset": "Corset",
    "shirt": "Shirt",
    "jeans": "Jeans",
    "trousers": "Trousers",
    "cargo pants": "Cargo Pants",
    "joggers": "Joggers",
    "sweatpants": "Sweatpants",
    "shorts": "Shorts",
    "skirt": "Skirt",
    "dress": "Dress",
    "top": "Top",
}

def _canon_type(t: Optional[str]) -> Optional[str]:
    if not t:
        return t
    key = t.strip().lower()
    # collapse some common variants
    key = key.replace("tee shirt", "t-shirt").replace("t shirt", "t-shirt")
    key = key.replace("long sleeve tee", "longsleeve tee")
    key = key.replace("cami top", "cami")
    key = _CANON.get(key, key)
    return _CANON_TITLE.get(key, t.strip())


def _any(patterns: List[re.Pattern], text: str) -> bool:
    return any(p.search(text) for p in patterns)

def _as_products_list(data: Any) -> List[Dict[str, Any]]:
    # Normalize various input shapes to a list of product dicts
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        if "products" in data and isinstance(data["products"], list):
            return data["products"]
        if "product" in data and isinstance(data["product"], dict):
            return [data["product"]]
    raise ValueError("Unrecognized input JSON shape: expected a list or an object with 'products' or 'product'.")

def _first_nonempty(*vals):
    for v in vals:
        if v:
            return v
    return None

def _build_image_maps(product: Dict[str, Any]):
    images_by_id: Dict[str, str] = {}
    variant_to_img: Dict[str, str] = {}
    images = product.get("images") or []
    for img in images:
        img_id = img.get("id")
        src = img.get("src") or img.get("originalSrc") or img.get("url")
        if img_id is not None and src:
            images_by_id[str(img_id)] = src
        for vid in img.get("variant_ids") or []:
            k = str(vid)
            if k not in variant_to_img:
                variant_to_img[k] = src
    fallback = images[0].get("src") or images[0].get("originalSrc") or images[0].get("url") if images else None
    return images_by_id, variant_to_img, fallback

def _variant_img_src(variant, images_by_id, variant_to_img, fallback):
    fi = variant.get("featured_image")
    if isinstance(fi, dict):
        src = fi.get("src") or fi.get("url") or fi.get("originalSrc")
        if src: return src
    elif isinstance(fi, str):
        return fi

    image_id = variant.get("image_id") or variant.get("imageId")
    if image_id is not None:
        src = images_by_id.get(str(image_id))
        if src: return src

    vid = variant.get("id")
    if vid is not None:
        src = variant_to_img.get(str(vid))
        if src: return src

    return fallback

def _variant_price(variant: Dict[str, Any]) -> Optional[str]:
    # Prefer REST shape ("price"), fallback to Storefront shape (priceV2.amount)
    if "price" in variant and variant["price"] is not None:
        return str(variant["price"])
    price_v2 = variant.get("priceV2") or {}
    amount = price_v2.get("amount")
    if amount is not None:
        return str(amount)
    return None


def _is_blank(x: Optional[str]) -> bool:
    return (
        x is None
        or (isinstance(x, str) and x.strip() == "")
        or (isinstance(x, str) and x.strip().lower() in {"n/a", "none", "null", "unknown"})
    )

def _norm_text(*parts: Optional[Union[str, List[str]]]) -> str:
    """Join, strip HTML, normalize separators, split camelCase, then lowercase."""
    items: List[str] = []
    for p in parts:
        if p is None:
            continue
        s = " ".join([str(x) for x in p if x]) if isinstance(p, list) else str(p)

        # strip HTML (light), normalize dashes/slashes/underscores to spaces
        s = re.sub(r"<[^>]+>", " ", s)
        s = s.replace("-", " ")
        s = re.sub(r"[/_]", " ", s)

        # split camelCase BEFORE lowercasing
        s = re.sub(r"([a-z])([A-Z])", r"\1 \2", s)

        items.append(s)

    text = " ".join(items)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def infer_product_type(
    title: Optional[str],
    handle: Optional[str],
    tags: Optional[Union[List[str], str]] = None,
    body_html: Optional[str] = None,
) -> Optional[str]:
    """
    Normalized product_type from title/handle/tags/description.
    Canonical labels: 'Jacket','Sweater','Cardigan','Hoodie','Sweatshirt',
    'Longsleeve Tee','T-Shirt','Button-Up Shirt','Tank Top','Camisole','Vest',
    'Corset','Shirt','Jeans','Trousers','Joggers','Sweatpants','Cargo Pants',
    'Shorts','Skirt','Dress', or None.
    """
    # Normalize tags -> list
    if isinstance(tags, str):
        tags = [t.strip() for t in re.split(r"[;,]", tags) if t.strip()]

    # Build weighted haystacks (title/handle >> tags >> body)
    h1 = _norm_text(title, handle)              # most trusted
    h2 = _norm_text(tags)                       # medium
    h3 = _norm_text(body_html)                  # least trusted

    def has(hay: str, *patterns: str) -> bool:
        return any(re.search(p, hay) for p in patterns)

    # Quick hard-locks from the most trusted field (prevents noisy tags/body from hijacking)
    # These are intentionally conservative and only read H1.
    h1_locks = [
        (r"\bdress(es)?\b", "Dress"),
        (r"\bhood(ie|ed)\b", "Hoodie"),
        (r"\btank(\s*top)?\b|\bsleeveless\b", "Tank Top"),
        (r"\bcami(sole)?\b", "Camisole"),
        (r"\bt\s*shirt\b|\btee\b", "T-Shirt"),
        (r"\b(sweater|jumper)\b|\bcardigan\b", "Sweater"),
        (r"\bjacket\b", "Jacket"),
        (COAT_PAT, "Coat"),
        (r"\bjeans?\b|\bdenim\b", "Jeans"),
        (r"\bshorts?\b", "Shorts"),
        (SKIRT_PAT, "Skirt"),
        (r"\bvest\b|\bgilet\b", "Vest"),
        (r"\bcorset\b|\bbustier\b", "Corset"),
        (r"\bbutton\s*(up|down)|\boxford\b|\bflannel\b", "Button-Up Shirt"),
        (r"\blong\s*sleeves?\b|\blongsleeve(s)?\b", "Longsleeve Top"),
        (r"\bjersey\b", "Jersey"),
    ]
    for pat, label in h1_locks:
        if re.search(pat, h1):
            # Note: we still refine inside bucket later; locks just prevent mis-bucketing.
            locked = label
            break
    else:
        locked = None

    # Coarse scoring: Top vs Bottom vs Dress (H1*3, H2*2, H3*1)
    def score(hay: str, pats: List[str], w: int) -> int:
        return sum(1 for p in pats if re.search(p, hay)) * w

    dress_pats  = [r"\bdress(es)?\b"]
    top_pats = [r"\bhood(ie|ed)\b", r"\bsweatshirt\b", r"\b(cardigan|sweater|jumper)\b",
                r"\bt\s*shirt\b", r"\btee\b", r"\btank(\s*top)?\b", r"\bcami(sole)?\b",
                r"\bvest\b|\bgilet\b", r"\bcorset\b|\bbustier\b",
                r"\b(button\s*up|button\s*down|oxford|flannel)\b",
                r"\bjacket\b", COAT_PAT, r"\bjersey\b",  r"\bshirt\b", r"\blong\s*sleeves?\b|\blongsleeve(s)?\b"]
    bottom_pats = [r"\bjeans?\b|\bdenim\b", r"\bcargo\b|\bcargo\s*(pant|trouser)s?\b",
                   r"\bjogger(s)?\b", r"\bsweat\s*pant(s)?\b", r"\b(chino|trouser)s?\b",
                   r"\bpants?\b", r"\bshorts?\b", SKIRT_PAT]

    dress_score  = score(h1, dress_pats, 3)  + score(h2, dress_pats, 2)  + score(h3, dress_pats, 1)
    top_score    = score(h1, top_pats, 3)    + score(h2, top_pats, 2)    + score(h3, top_pats, 1)
    bottom_score = score(h1, bottom_pats, 3) + score(h2, bottom_pats, 2) + score(h3, bottom_pats, 1)

    dress_strong = has(h1, r"\bdress(es)?\b") or has(h2, r"\bdress(es)?\b")
    if dress_strong:
        return "Dress"

    # Decide coarse bucket (ties go to TOP; title/handle bias already helps)
    coarse = "Bottom" if bottom_score > top_score else "Top"

    # Jeans signals (keep your robust checks)
    hay_all = " ".join([h1, h2, h3])
    jeans_word     = RE_JEANS_WORD.search(hay_all) is not None
    bottoms_signal = _any([RE_WxL, RE_PANTS_WORDS, RE_PANTS_FEATS, RE_DENIM_WEIGHT, RE_SELVEDGE], hay_all)

    # Subtype classifiers
    if coarse == "Top":
        # Highest-precedence specials
        if has(h1 + " " + h2, r"\bhood(ie|ed)\b"):  # trust title+handle+tags before body
            return "Hoodie"
        if has(h1 + " " + h2, r"\b(sweatshirt|crew\s*neck|crewneck)\b"):
            return "Sweatshirt"

        if re.search(r"\bpuffer\b", h1) and not re.search(r"\bvest\b", " ".join([h1, h2, h3])):
            outerwear_tag = has(h2, r"\bouter\s*wear\b")
            body_mentions_coat = has(h3, r"\b(coat|jacket)\b")
            if outerwear_tag or body_mentions_coat:
                return "Puffer Coat"

        if has(h1, r"\bthermal\b") or (has(h2, r"\bthermal\b") and not has(h1, r"\bt\s*shirt\b|\btee\b")):
            return "Thermal"

        if has(h1 + " " + h2, r"\bjersey\b"):
            return "Jersey"

        if has(h1, r"\bcami(sole)?\b"):
            return "Camisole"
        if has(h1, r"\btank(\s*top)?\b|\bsleeveless\b|\bmuscle\s*(tank|tee|t\s*shirt)\b"):
            return "Tank Top"
        # If title/handle are neutral, allow tags to promote to Tank Top
        if has(h2, r"\btank(\s*top)?\b|\bsleeveless\b|\bmuscle\s*tank\b") and not has(h1, r"\b(button\s*up|button\s*down|oxford|flannel)\b"):
            return "Tank Top"

        # Knitwear / cardigans
        if has(h1 + " " + h2, r"\bcardigan\b"):
            return "Cardigan"
        if has(h1 + " " + h2, r"\b(sweater|jumper)\b") or has(h1, r"\bknit\b"):
            return "Sweater"

        # Longsleeve vs tee vs shirts
        long_sleeve = has(h1 + " " + h2, r"\blong\s*sleeves?\b", r"\blongsleeve(s)?\b")
        if long_sleeve and has(h1 + " " + h2, r"\bt\s*shirt\b|\btee\b"):
            return "Longsleeve Tee"

        # Button-ups
        if has(h1 + " " + h2, r"\b(button\s*up|button\s*down|buttondown|oxford|flannel|dress\s*shirt|work\s*shirt)\b"):
            return "Button-Up Shirt"

        # 2-fer (fix regex: case-insensitive & dashes/spaces)
        if has(h1 + " " + h2, r"\b2\s*[- ]?fer\b"):
            return "Longsleeve Tee" if long_sleeve else "T-Shirt"

        # Tees and basics
        if has(h1 + " " + h2, r"\bt\s*shirt\b|\btee\b"):
            return "T-Shirt"

        # Camis / tanks
        if has(h1 + " " + h2, r"\bcami(sole)?\b"):
            return "Camisole"
        if has(h2, r"\btank(\s*top)?\b|\bsleeveless\b|\bmuscle\s*(tank|tee|t\s*shirt)\b") \
            and not has(h1, r"\b(button\s*up|button\s*down|oxford|flannel)\b"):
                return "Tank Top"

        # Other specials
        if has(h1 + " " + h2, r"\b(corset|bustier)\b"):
            return "Corset"
        if has(h1 + " " + h2, r"\b(vest|gilet)\b"):
            return "Vest"

        # Outerwear (placed AFTER Hoodie/Sweatshirt to avoid collisions)
        if has(h1 + " " + h2 + " " + h3, COAT_PAT):
            return _refine_coat_label(h1, h2, h3)
        if has(h1 + " " + h2, r"\b(denim|jean)\s+jacket\b|\bvarsity\b.*\bjacket\b|\bwind ?breaker\b|\bcoach\s+jacket\b|\bjacket\b"):
            return "Jacket"

        # Generic shirts/longsleeves/top
        if long_sleeve:
            return "Longsleeve Top"
        if has(h1 + " " + h2, r"\bshirt\b"):
            return "Shirt"
        if has(h1 + " " + h2 + " " + h3, r"\btop\b"):
            return "Top"
        return "Top"  # safe fallback

    else:  # Bottom
        if jeans_word and bottoms_signal:
            return "Jeans"
        if has(h1 + " " + h2, r"\bcargo\s*shorts?\b"):
            return "Shorts"
        if has(h1 + " " + h2, r"\bcargo\s*(pant|trouser)s?\b|\bcargo\b(?!\s*shorts?)"):
            return "Cargo Pants"
        if has(h1 + " " + h2, r"\bjogger(s)?\b"):
            return "Joggers"
        if has(h1 + " " + h2, r"\bsweat\s*pant(s)?\b"):
            return "Sweatpants"
        if has(h1 + " " + h2, r"\b(chino|trouser)s?\b") or (has(h1 + " " + h2, r"\bpants?\b") and not jeans_word):
            return "Trousers"
        if has(h1 + " " + h2, r"\bshorts?\b"):
            return "Shorts"
        if has(h1 + " " + h2, SKIRT_PAT):
            return "Skirt"
        # If we got here, tags/handle/title didn’t confirm; body might help in rare cases:
        if jeans_word and bottoms_signal:
            return "Jeans"
        if has(h3, r"\bshorts?\b"):
            return "Shorts"
        if has(h3, SKIRT_PAT):
            return "Skirt"
        if has(h3, r"\bpants?\b"):
            return "Trousers"
        return None

def clean_products(raw_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    cleaned: List[Dict[str, Any]] = []
    for p in raw_products:
        pid    = p.get("id")
        title  = p.get("title")
        handle = p.get("handle")
        tags   = p.get("tags")
        product_type = p.get("product_type") or p.get("product type")
        body_html    = _first_nonempty(p.get("body_html"), p.get("descriptionHtml"), p.get("description"))
        features = _extract_features(title, handle, tags, body_html)
        inferred = infer_product_type(title, handle, tags, body_html)
        inferred = _canon_type(inferred)  # normalize inferred

        pt_norm = (product_type or "").strip().lower()
        if _is_blank(product_type) or pt_norm in GENERIC_TYPES:
            product_type = inferred or product_type
        else:
            def bucket(t: Optional[str]) -> Optional[str]:
                if not t: return None
                t = t.lower()
                if t in {"jeans","trousers","joggers","sweatpants","cargo pants","shorts","skirt"}: return "bottom"
                if t in {"dress"}: return "dress"
                return "top"

            if inferred:
                if bucket(inferred) != bucket(product_type):
                    product_type = inferred
                # NEW: if both are TOPs but different, prefer the inferred subtype
                elif bucket(inferred) == "top" and inferred != product_type:
                    product_type = inferred

        product_type = _canon_type(product_type)  # normalize final choice

        images_by_id, variant_to_img, fallback = _build_image_maps(p)

        variants_out = []
        for v in p.get("variants") or []:
            variants_out.append({
                "id": v.get("id"),
                "title": v.get("title"),
                "price": _variant_price(v),
                "img_src": _variant_img_src(v, images_by_id, variant_to_img, fallback),
            })

        cleaned.append({
            "id": pid,
            "title": title,
            "handle": handle,
            "product_type": product_type,
            "body_html": body_html,
            "tags": tags,
            "features": features,
            "variants": variants_out,
        })

    return cleaned




def main():
    ap = argparse.ArgumentParser(description="Create a cleaned products.json with minimal fields.")
    ap.add_argument("--in", dest="in_path", required=True, help="Input JSON file (raw Shopify export or products_rogue.json)")
    ap.add_argument("--out", dest="out_path", default="products.json", help="Output JSON file (default: products.json)")
    args = ap.parse_args()

    with open(args.in_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    raw_products = _as_products_list(data)
    cleaned = clean_products(raw_products)

    with open(args.out_path, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(cleaned)} products to {args.out_path}")

if __name__ == "__main__":
    main()





