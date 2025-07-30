import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { FirecrawlService } from '@/services/firecrawlService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabase } from '@/integrations/supabase/client';
import { Store, Package, Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ScrapeTarget {
  name: string;
  url: string;
  category: string;
  paths?: string[];
}

interface ScrapedProductData {
  name: string;
  category: string;
  image_url: string | null;
  source_url: string;
  isDuplicate?: boolean;
}

// Reduced to only Jumia to respect rate limits
const SCRAPE_TARGETS: ScrapeTarget[] = [
  {
    name: 'Jumia Supermarket',
    url: 'https://www.jumia.co.ke/supermarket/',
    category: 'Food & Beverages',
    paths: ['/food-cupboard/', '/beverages/', '/household-cleaning/', '/personal-care/']
  }
];

const INCLUDE_KEYWORDS = [
  'flour', 'rice', 'sugar', 'oil', 'soap', 'detergent', 'toothpaste', 'shampoo', 
  'biscuits', 'soda', 'water', 'toilet paper', 'matches', 'milk', 'bread', 'tea', 
  'coffee', 'cooking', 'edible', 'food', 'beverage', 'drink', 'household', 'cleaning', 
  'personal care', 'salt', 'spices', 'cereal', 'juice', 'snack', 'grains', 'cereals',
  'soft drinks', 'maize', 'wheat', 'beans', 'cooking oil', 'body lotion', 'washing powder'
];

const EXCLUDE_KEYWORDS = [
  'phone', 'laptop', 'tv', 'television', 'computer', 'tablet', 'electronics', 
  'fashion', 'dress', 'shoes', 'clothing', 'furniture', 'car', 'vehicle', 
  'jewelry', 'watch', 'camera', 'home appliances', 'refrigerator', 'microwave'
];

export const BulkProductScraper: React.FC = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [scrapedProducts, setScrapedProducts] = useState<ScrapedProductData[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const filterProduct = (productName: string, category: string): boolean => {
    const nameAndCategory = `${productName} ${category}`.toLowerCase();
    
    // Check for include keywords
    const hasIncludeKeyword = INCLUDE_KEYWORDS.some(keyword => 
      nameAndCategory.includes(keyword.toLowerCase())
    );
    
    // Check for exclude keywords
    const hasExcludeKeyword = EXCLUDE_KEYWORDS.some(keyword => 
      nameAndCategory.includes(keyword.toLowerCase())
    );
    
    return hasIncludeKeyword && !hasExcludeKeyword;
  };

  const checkDuplicate = async (productName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('duka_products')
        .select('id')
        .ilike('name', productName.trim())
        .limit(1);
      
      if (error) {
        console.error('Error checking duplicate:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  };

  const saveProductsToSupabase = async (products: ScrapedProductData[]): Promise<void> => {
    let saved = 0;
    let duplicates = 0;
    let errors = 0;

    for (const product of products) {
      try {
        // Check for duplicates
        const isDuplicate = await checkDuplicate(product.name);
        if (isDuplicate) {
          duplicates++;
          continue;
        }

        // Save to Supabase
        const { error } = await supabase
          .from('duka_products')
          .insert({
            name: product.name.trim(),
            category: product.category.trim(),
            image_url: product.image_url
          });

        if (error) {
          console.error('Error saving product:', error);
          errors++;
        } else {
          saved++;
        }
      } catch (error) {
        console.error('Error processing product:', error);
        errors++;
      }
    }

    setSavedCount(saved);
    setDuplicateCount(duplicates);
    setErrorCount(errors);
  };

  const scrapeTarget = async (target: ScrapeTarget): Promise<ScrapedProductData[]> => {
    const options = {
      limit: 10, // Very small limit to respect rate limits
      maxDepth: 1, // Minimal depth
      excludePaths: [
        '/admin/*', '/user/*', '/login*', '/register*', '/cart*', '/checkout*',
        '/account*', '/profile*', '/wish*', '/compare*'
      ],
      includePaths: ['/supermarket/*', '/food-cupboard/*', '/beverages/*']
    };

    try {
      console.log(`[BulkProductScraper] Starting to scrape ${target.name}...`);
      
      // Add longer delay to respect rate limits (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const result = await FirecrawlService.crawlWebsite(target.url, options);
      
      if (!result.success) {
        console.error(`[BulkProductScraper] Failed to scrape ${target.name}:`, result.error);
        throw new Error(result.error || 'Failed to scrape website');
      }

      const extractedProducts = FirecrawlService.extractProductsFromCrawlData(result.data);
      console.log(`[BulkProductScraper] Extracted ${extractedProducts.length} raw products from ${target.name}`);
      
      // Filter and format products
      const filteredProducts: ScrapedProductData[] = extractedProducts
        .filter(product => filterProduct(product.name, product.category))
        .map(product => ({
          name: product.name.trim(),
          category: target.category,
          image_url: product.image_url || null,
          source_url: target.url
        }))
        .slice(0, 10); // Limit to max 10 products

      console.log(`[BulkProductScraper] Found ${filteredProducts.length} relevant products from ${target.name}`);
      return filteredProducts;
    } catch (error) {
      console.error(`[BulkProductScraper] Error scraping ${target.name}:`, error);
      
      // Don't throw error, just return empty array to continue with other targets
      toast({
        title: "Scraping Error",
        description: `Failed to scrape ${target.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 3000
      });
      return [];
    }
  };

  const handleScrapeAll = async () => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Internet connection required for bulk scraping",
        variant: "destructive"
      });
      return;
    }

    setIsScrapingAll(true);
    setProgress(0);
    setScrapedProducts([]);
    setSavedCount(0);
    setDuplicateCount(0);
    setErrorCount(0);

    const allProducts: ScrapedProductData[] = [];
    
    try {
      for (let i = 0; i < SCRAPE_TARGETS.length; i++) {
        const target = SCRAPE_TARGETS[i];
        setCurrentTarget(target.name);
        setProgress((i / SCRAPE_TARGETS.length) * 80);

        try {
          console.log(`[BulkProductScraper] Processing target ${i + 1}/${SCRAPE_TARGETS.length}: ${target.name}`);
          const products = await scrapeTarget(target);
          allProducts.push(...products);
          
          if (products.length > 0) {
            toast({
              title: "Progress",
              description: `Found ${products.length} products from ${target.name}`,
              duration: 2000
            });
          } else {
            toast({
              title: "Info",
              description: `No products found from ${target.name}`,
              duration: 2000
            });
          }
        } catch (error) {
          console.error(`[BulkProductScraper] Failed to scrape ${target.name}:`, error);
          toast({
            title: "Warning",
            description: `Skipped ${target.name} due to errors`,
            variant: "destructive",
            duration: 3000
          });
        }
      }

      setProgress(85);
      setScrapedProducts(allProducts);
      
      // Save to Supabase
      setCurrentTarget('Saving to database...');
      await saveProductsToSupabase(allProducts);
      
      setProgress(100);
      setCurrentTarget('');

      toast({
        title: "Scraping Complete!",
        description: `${savedCount} products saved, ${duplicateCount} duplicates skipped, ${errorCount} errors`,
        duration: 5000
      });

    } catch (error) {
      console.error('Bulk scraping error:', error);
      toast({
        title: "Error",
        description: "Bulk scraping failed. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsScrapingAll(false);
      setCurrentTarget('');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Bulk Product Scraper - Jumia Only (Rate Limited)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Reduced to Jumia only with minimal limits to respect Firecrawl API rate limits
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {SCRAPE_TARGETS.map((target, index) => (
              <div key={index} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                <h4 className="font-medium text-green-800 dark:text-green-200">{target.name}</h4>
                <p className="text-sm text-green-600 dark:text-green-300">{target.category}</p>
                <p className="text-xs text-green-500 dark:text-green-400">{target.url}</p>
                <p className="text-xs text-green-600 dark:text-green-300 mt-1">✓ Optimized for rate limits</p>
              </div>
            ))}
          </div>

          {isScrapingAll && (
            <div className="space-y-3">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {currentTarget ? `Processing: ${currentTarget}` : `Progress: ${Math.round(progress)}%`}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleScrapeAll}
              disabled={isScrapingAll || !isOnline}
              className="flex-1"
            >
              {isScrapingAll ? "Scraping..." : "Start Bulk Scraping"}
            </Button>
          </div>

          {/* Stats */}
          {(savedCount > 0 || duplicateCount > 0 || errorCount > 0) && (
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div className="text-sm">
                  <div className="font-medium">{savedCount}</div>
                  <div className="text-muted-foreground">Saved</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <div className="text-sm">
                  <div className="font-medium">{duplicateCount}</div>
                  <div className="text-muted-foreground">Duplicates</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded">
                <XCircle className="w-4 h-4 text-red-600" />
                <div className="text-sm">
                  <div className="font-medium">{errorCount}</div>
                  <div className="text-muted-foreground">Errors</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {scrapedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Scraped Products ({scrapedProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full">
              <div className="space-y-3">
                {scrapedProducts.map((product, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Source: {product.source_url}
                        </p>
                      </div>
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded ml-3"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};