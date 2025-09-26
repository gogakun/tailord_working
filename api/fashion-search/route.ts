import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type Facets = {
  garment?: "jeans"|"pants"|"shorts"|"jacket"|"tee"|"dress"|"skirt"|"sweater"|"hoodie"|"vest";
  era?: "70s"|"80s"|"90s"|"Y2K"|"2000s"|"2010s";
  fit?: "baggy"|"slim"|"flare"|"bootcut"|"low-rise"|"high-rise"|"oversized"|"fitted";
  color?: string[];
  size?: string[];
  price?: { max?: number; min?: number };
  brand?: string[];
  style?: string[];
};

// Lightweight rule-based parser for fashion queries
function lightRules(q: string): Facets {
  const s = q.toLowerCase();
  const has = (w: string) => s.includes(w);
  const f: Facets = {};

  // Garment detection
  if (/jean|denim/.test(s)) f.garment = "jeans";
  else if (/cargo|pant/.test(s)) f.garment = "pants";
  else if (/short/.test(s)) f.garment = "shorts";
  else if (/jacket|blazer/.test(s)) f.garment = "jacket";
  else if (/tee|t-shirt|shirt/.test(s)) f.garment = "tee";
  else if (/dress/.test(s)) f.garment = "dress";
  else if (/skirt/.test(s)) f.garment = "skirt";
  else if (/sweater|pullover/.test(s)) f.garment = "sweater";
  else if (/hoodie/.test(s)) f.garment = "hoodie";
  else if (/vest/.test(s)) f.garment = "vest";

  // Era/decade detection
  if (/y2k|2000s?/.test(s)) f.era = "Y2K";
  else if (/90s|199\d/.test(s)) f.era = "90s";
  else if (/80s|198\d/.test(s)) f.era = "80s";
  else if (/70s|197\d/.test(s)) f.era = "70s";
  else if (/2010s/.test(s)) f.era = "2010s";

  // Fit detection
  if (/baggy|loose|oversized/.test(s)) f.fit = "baggy";
  else if (/slim|fitted|tight/.test(s)) f.fit = "slim";
  else if (/flare/.test(s)) f.fit = "flare";
  else if (/bootcut/.test(s)) f.fit = "bootcut";
  else if (/low.?rise/.test(s)) f.fit = "low-rise";
  else if (/high.?rise/.test(s)) f.fit = "high-rise";

  // Color detection
  const colors = ['black', 'white', 'blue', 'red', 'green', 'pink', 'purple', 'yellow', 'orange', 'brown', 'gray', 'grey', 'navy', 'olive', 'cream', 'beige'];
  f.color = colors.filter(color => has(color));

  // Size detection
  const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large'];
  f.size = sizes.filter(size => has(size));

  // Price detection
  const priceMatch = s.match(/under ?\$(\d+)/) || s.match(/\$(\d+)\s*max/) || s.match(/under ?(\d+)/);
  if (priceMatch) f.price = { max: Number(priceMatch[1]) };

  const minPriceMatch = s.match(/over ?\$(\d+)/) || s.match(/\$(\d+)\s*min/) || s.match(/over ?(\d+)/);
  if (minPriceMatch) f.price = { ...f.price, min: Number(minPriceMatch[1]) };

  // Brand detection (common vintage brands)
  const brands = ['juicy couture', 'fubu', 'akademiks', 'diesel', 'carhartt', 'affliction', 'tripp nyc', 'xoxo'];
  f.brand = brands.filter(brand => has(brand));

  // Style detection
  const styles = ['vintage', 'punk', 'gothic', 'grunge', 'hip-hop', 'metal', 'racing', 'tribal', 'floral', 'lace', 'mesh', 'velour'];
  f.style = styles.filter(style => has(style));

  return f;
}

// Build Shopify GraphQL query from facets
function buildShopifyQuery(f: Facets, raw: string): string {
  const parts: string[] = [];

  // Core garment matching
  if (f.garment === "jeans") {
    parts.push(`(title:jeans OR product_type:Jeans OR tag:jeans)`);
  } else if (f.garment === "pants") {
    parts.push(`(title:pants OR product_type:Pants OR tag:pants)`);
  } else if (f.garment === "tee") {
    parts.push(`(title:tee OR title:"t-shirt" OR product_type:"T-Shirts" OR tag:tee)`);
  } else if (f.garment === "jacket") {
    parts.push(`(title:jacket OR product_type:Jackets OR tag:jacket)`);
  } else if (f.garment === "dress") {
    parts.push(`(title:dress OR product_type:Dresses OR tag:dress)`);
  } else if (f.garment === "skirt") {
    parts.push(`(title:skirt OR product_type:Skirts OR tag:skirt)`);
  }

  // Era/decade -> tags (common on Shopify for vintage)
  if (f.era) {
    parts.push(`tag:"${f.era}"`);
  }

  // Fit matching
  if (f.fit === "baggy") {
    parts.push(`(title:baggy OR tag:baggy OR tag:loose)`);
  } else if (f.fit === "flare") {
    parts.push(`(title:flare OR tag:flare)`);
  } else if (f.fit === "bootcut") {
    parts.push(`(title:bootcut OR tag:bootcut)`);
  } else if (f.fit === "low-rise") {
    parts.push(`(title:"low rise" OR tag:"low-rise")`);
  } else if (f.fit === "high-rise") {
    parts.push(`(title:"high rise" OR tag:"high-rise")`);
  }

  // Price filtering
  if (f.price?.max) {
    parts.push(`price:<${f.price.max}`);
  }
  if (f.price?.min) {
    parts.push(`price:>${f.price.min}`);
  }

  // Brand matching
  if (f.brand && f.brand.length > 0) {
    const brandQuery = f.brand.map(brand => `vendor:"${brand}" OR tag:"${brand}"`).join(' OR ');
    parts.push(`(${brandQuery})`);
  }

  // Style matching
  if (f.style && f.style.length > 0) {
    const styleQuery = f.style.map(style => `tag:"${style}"`).join(' OR ');
    parts.push(`(${styleQuery})`);
  }

  // Color matching
  if (f.color && f.color.length > 0) {
    const colorQuery = f.color.map(color => `tag:"${color}"`).join(' OR ');
    parts.push(`(${colorQuery})`);
  }

  // Fall back to raw text search
  parts.push(`(${raw})`);

  // Prefer in-stock items
  parts.push(`-tag:"sold out"`);

  return parts.join(" AND ");
}

// Search Shopify Storefront API
async function searchShopify(query: string, shopDomain: string): Promise<any[]> {
  const url = `https://${shopDomain}/api/2024-01/graphql.json`;
  
  const body = JSON.stringify({
    query: `
      query Search($q: String!, $first: Int!) {
        products(first: $first, query: $q) {
          edges {
            node {
              id
              handle
              title
              vendor
              tags
              availableForSale
              featuredImage {
                url
                altText
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }`,
    variables: { q: query, first: 12 }
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": process.env.SHOPIFY_STOREFRONT_TOKEN as string
      },
      body
    });

    if (!response.ok) {
      console.error(`Shopify API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('Shopify GraphQL errors:', data.errors);
      return [];
    }

    const items = (data.data?.products?.edges || []).map((edge: any) => {
      const product = edge.node;
      return {
        id: product.id,
        title: product.title,
        brand: product.vendor,
        price: Number(product.priceRange.minVariantPrice.amount),
        currency: product.priceRange.minVariantPrice.currencyCode,
        url: `https://${shopDomain}/products/${product.handle}`,
        image: product.featuredImage?.url || "",
        altText: product.featuredImage?.altText || product.title,
        available: product.availableForSale,
        tags: product.tags
      };
    });

    return items;
  } catch (error) {
    console.error('Shopify search error:', error);
    return [];
  }
}

// Fallback search using our catalog (for testing)
async function searchFallback(facets: Facets, rawQuery: string): Promise<any[]> {
  // Import our catalog data
  const catalog = await import('@/data/catalog.json');
  
  let results = catalog.default || [];
  
  // Apply basic filtering
  if (facets.garment) {
    results = results.filter(item => 
      item.title.toLowerCase().includes(facets.garment!) ||
      item.category.toLowerCase().includes(facets.garment!)
    );
  }
  
  if (facets.price?.max) {
    results = results.filter(item => item.price <= facets.price!.max!);
  }
  
  if (facets.color && facets.color.length > 0) {
    results = results.filter(item => 
      facets.color!.some(color => 
        item.title.toLowerCase().includes(color) ||
        item.color?.toLowerCase().includes(color)
      )
    );
  }
  
  // Add mock URLs for testing
  return results.slice(0, 12).map(item => ({
    id: item.id,
    title: item.title,
    brand: item.brand,
    price: item.price,
    currency: 'USD',
    url: `https://example.com/products/${item.id}`,
    image: item.image || '/placeholder.jpg',
    altText: item.title,
    available: true,
    tags: item.tags || []
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const site = searchParams.get("site") || "";
  const siteId = searchParams.get("siteId") || "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] }, { 
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }

  console.log(`🔍 Fashion search: "${q}" on site: ${site}`);

  // Parse query into facets
  const facets = lightRules(q);
  console.log('📋 Parsed facets:', facets);

  let results: any[] = [];

  // Try Shopify first if we have credentials
  const SHOP_DOMAIN = process.env.SHOPIFY_DOMAIN; // e.g., "roguegarms.com"
  const SHOP_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

  if (SHOP_TOKEN && SHOP_DOMAIN) {
    try {
      const query = buildShopifyQuery(facets, q);
      console.log('🛍️ Shopify query:', query);
      
      results = await searchShopify(query, SHOP_DOMAIN);
      console.log(`✅ Found ${results.length} Shopify results`);
    } catch (error) {
      console.error('❌ Shopify search failed:', error);
    }
  }

  // Fallback to our catalog if no Shopify results
  if (results.length === 0) {
    console.log('🔄 Using fallback search');
    results = await searchFallback(facets, q);
    console.log(`✅ Found ${results.length} fallback results`);
  }

  // Add search metadata
  const response = {
    results,
    query: q,
    facets,
    total: results.length,
    source: results.length > 0 && results[0].url.includes('roguegarms.com') ? 'shopify' : 'fallback'
  };

  return NextResponse.json(response, { 
    headers: { 
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}








