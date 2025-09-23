import type { Product } from '../types';

export interface SearchResponse {
  products: Product[];
  query: string;
  total: number;
  error?: string;
}

export class APIClient {
  private baseUrl: string;
  private siteId: string;

  constructor(baseUrl: string, siteId: string) {
    this.baseUrl = baseUrl;
    this.siteId = siteId;
  }

  async searchProducts(query: string, limit: number = 6): Promise<SearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/fashion-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          siteId: this.siteId,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        products: data.products || [],
        query,
        total: data.total || 0
      };
    } catch (error) {
      console.error('API search error:', error);
      return {
        products: [],
        query,
        total: 0,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/products/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Product fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API product fetch error:', error);
      return null;
    }
  }

  async trackEvent(event: string, data: any): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          data,
          siteId: this.siteId,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }
}
