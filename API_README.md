## Tailord API Contract

### Overview
- The widget communicates with the application exclusively through REST endpoints served from this repository.
- Default base URL: same origin as the hosting site (e.g. `https://tailord.chat`). When testing locally, use `http://localhost:3000` unless configured otherwise.
- All endpoints are unauthenticated for now; add an auth layer before exposing publicly.
- Responses are JSON encoded and include CORS headers so the embeddable widget can call them from any domain.

### Primary Endpoint: Fashion Search
- **Method**: `GET`
- **Path**: `/api/fashion-search`
- **Query Parameters**:
  - `q` *(string, required)* – user’s natural language prompt.
  - `site` *(string, optional)* – hostname of the page where the widget runs. Used for logging/analytics only.
  - `siteId` *(string, optional but recommended)* – identifier for the integration/tenant.
- **Success Response** (`200`):
  - `results` *(array)* – list of product objects.
    - `id`, `title`, `brand`, `price`, `currency`, `url`, `image`, `altText`, `available`, `tags[]`.
  - `query` *(string)* – echo of the original prompt.
  - `facets` *(object)* – heuristic breakdown of the prompt (garment, era, fit, price, color[], size[], brand[], style[]).
  - `total` *(number)* – number of results after filtering.
  - `source` *(string)* – `"shopify"` if results originated from the Shopify Storefront API, otherwise `"fallback"` for the local catalog.
- **Error Responses**:
  - `400` missing `q`: `{ "results": [] }`.
  - `500` unexpected failure: `{ "results": [], "error": "<message>" }`.
- **Implementation Notes**:
  - Handler defined in `src/app/api/fashion-search/route.ts`.
  - Pipeline: parse prompt ➜ build facets ➜ attempt Shopify GraphQL ➜ fallback to local catalog.
  - Adds permissive CORS headers (`*`) and handles `OPTIONS` preflight automatically.

#### Example Request
```bash
curl "http://localhost:3000/api/fashion-search?q=vintage+90s+baggy+jeans&site=demo.tailord.chat&siteId=test-site"
```

#### Example Response (truncated)
```json
{
  "results": [
    {
      "id": "gid://shopify/Product/1234567890",
      "title": "Vintage 90s Baggy Jeans",
      "brand": "Rogue Garms",
      "price": 68,
      "currency": "USD",
      "url": "https://example.com/products/1234567890",
      "image": "https://cdn.example.com/products/1234567890.jpg",
      "altText": "Vintage 90s baggy jeans",
      "available": true,
      "tags": ["90s", "baggy", "denim"]
    }
  ],
  "query": "vintage 90s baggy jeans",
  "facets": {
    "garment": "jeans",
    "era": "90s",
    "fit": "baggy",
    "price": { "max": 80 }
  },
  "total": 1,
  "source": "fallback"
}
```

### Optional Endpoints

| Method | Path                       | Purpose                                |
|--------|---------------------------|----------------------------------------|
| `GET`  | `/api/products/:productId` | Fetch product details on demand.       |
| `POST` | `/api/analytics`          | Record widget events (search, clicks). |

- Implementations live in `src/widget demo/src/lib/api.ts`; stub handlers can be created under `src/app/api` mirroring the fashion search pattern.
- Analytics payload shape: `{ event, data, siteId, timestamp }`.

### Adapting to a Local LLM
1. Run your LLM behind a lightweight service (Express/Fastify/Koa/etc.).
2. In the `/api/fashion-search` handler, forward `q` to the local LLM with a system prompt instructing it to emit the `results` structure shown above.
3. Validate the JSON (zod/yup/custom) before returning it to the widget to avoid UI crashes.
4. On failure/timeouts fall back to an empty list or cached data; the widget already shows a friendly error state.
5. Optionally capture the `facets` field using the existing `lightRules` helper so analytics stay consistent.

### Testing & Tooling
- `npm run dev` (Next.js) exposes the endpoints at `http://localhost:3000`.
- `curl` or your REST client of choice can exercise the handlers.
- Logs are printed in the server console (`console.log` statements inside the route file).
- To mock Shopify responses, configure `SHOPIFY_DOMAIN` and `SHOPIFY_STOREFRONT_TOKEN` in `.env.local`.




