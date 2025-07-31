import { supabase } from '@/integrations/supabase/client';

export interface CrawlResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  cached?: boolean;
}

export interface CrawlOptions {
  formats?: string[];
  limit?: number;
  excludePaths?: string[];
  includePaths?: string[];
  maxDepth?: number;
}

export interface ScrapedProduct {
  name: string;
  category: string;
  price?: string;
  image_url?: string;
  description?: string;
  source_url: string;
}

export class FirecrawlService {
  private static CACHE_PREFIX = 'firecrawl_cache_';
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static async crawlWebsite(
    url: string, 
    options: CrawlOptions = {},
    useCache: boolean = true
  ): Promise<CrawlResult> {
    try {
      console.log(`[FirecrawlService] Starting crawl for: ${url}`);
      
      // Check cache first if enabled
      if (useCache) {
        const cached = this.getCachedResult(url);
        if (cached) {
          console.log(`[FirecrawlService] Returning cached result for: ${url}`);
          return { ...cached, cached: true };
        }
      }

      // Check if online before making request
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please try again when online.');
      }

      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url, options }
      });

      if (error) {
        console.error('[FirecrawlService] Supabase function error:', error);
        throw new Error(error.message || 'Failed to crawl website');
      }

      const result: CrawlResult = data;
      
      if (result.success && useCache) {
        this.cacheResult(url, result);
      }

      return result;

    } catch (error) {
      console.error('[FirecrawlService] Error:', error);
      
      // Try to return cached result as fallback
      if (useCache) {
        const cached = this.getCachedResult(url, false); // Don't check expiry
        if (cached) {
          console.log(`[FirecrawlService] Returning stale cache due to error`);
          return { 
            ...cached, 
            cached: true,
            error: `Using cached data due to error: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  }

  static extractProductsFromCrawlData(crawlData: any): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    
    try {
      if (crawlData?.data) {
        // Handle different response formats
        const pages = Array.isArray(crawlData.data) ? crawlData.data : [crawlData.data];
        
        for (const page of pages) {
          if (page?.extracted?.products) {
            // LLM extracted products
            for (const product of page.extracted.products) {
              products.push({
                name: product.name || 'Unknown Product',
                category: product.category || 'General',
                price: product.price,
                image_url: product.image_url,
                description: product.description,
                source_url: page.url || page.source_url || ''
              });
            }
          } else if (page?.markdown || page?.html) {
            // Parse manually from content
            const parsedProducts = this.parseProductsFromContent(
              page.markdown || page.html, 
              page.url || ''
            );
            products.push(...parsedProducts);
          }
        }
      }
    } catch (error) {
      console.error('[FirecrawlService] Error extracting products:', error);
    }
    
    return products;
  }

  private static parseProductsFromContent(content: string, sourceUrl: string): ScrapedProduct[] {
    // Basic parsing for common e-commerce patterns
    const products: ScrapedProduct[] = [];
    
    // This is a simplified parser - in production, you'd want more sophisticated parsing
    const productPattern = /(?:product|item)[^]*?name[^]*?([^<>\n]+)/gi;
    const matches = content.match(productPattern);
    
    if (matches) {
      matches.forEach((match, index) => {
        products.push({
          name: `Product ${index + 1}`,
          category: 'General',
          source_url: sourceUrl
        });
      });
    }
    
    return products;
  }

  private static getCachedResult(url: string, checkExpiry: boolean = true): CrawlResult | null {
    try {
      const cacheKey = this.CACHE_PREFIX + btoa(url);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const result = JSON.parse(cached);
      
      if (checkExpiry) {
        const cacheTime = new Date(result.timestamp).getTime();
        const now = Date.now();
        
        if (now - cacheTime > this.CACHE_DURATION) {
          localStorage.removeItem(cacheKey);
          return null;
        }
      }
      
      return result;
    } catch (error) {
      console.error('[FirecrawlService] Cache read error:', error);
      return null;
    }
  }

  private static cacheResult(url: string, result: CrawlResult): void {
    try {
      const cacheKey = this.CACHE_PREFIX + btoa(url);
      localStorage.setItem(cacheKey, JSON.stringify(result));
      console.log(`[FirecrawlService] Cached result for: ${url}`);
    } catch (error) {
      console.error('[FirecrawlService] Cache write error:', error);
    }
  }

  static clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      cacheKeys.forEach(key => localStorage.removeItem(key));
      console.log(`[FirecrawlService] Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      console.error('[FirecrawlService] Cache clear error:', error);
    }
  }

  static getCacheStats(): { count: number; totalSize: number } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      let totalSize = 0;
      cacheKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) totalSize += value.length;
      });
      
      return { count: cacheKeys.length, totalSize };
    } catch (error) {
      console.error('[FirecrawlService] Cache stats error:', error);
      return { count: 0, totalSize: 0 };
    }
  }
}