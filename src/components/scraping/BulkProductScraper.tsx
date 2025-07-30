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

const SCRAPE_TARGETS: ScrapeTarget[] = [
  {
    name: 'Jumia Supermarket',
    url: 'https://www.jumia.co.ke/mlp-supermarket/',
    category: 'Food & Beverages',
    paths: ['/food-cupboard/', '/beverages/', '/household-cleaning/', '/personal-care/']
  },
  {
    name: 'Kilimall Groceries',
    url: 'https://www.kilimall.co.ke/groceries/',
    category: 'Groceries'
  },
  {
    name: 'Kilimall Household',
    url: 'https://www.kilimall.co.ke/household/',
    category: 'Household'
  },
  {
    name: 'Bidco Africa Products',
    url: 'https://www.bidcoafrica.com/products/',
    category: 'Consumer Goods'
  }
];

const INCLUDE_KEYWORDS = [
  'flour', 'sugar', 'rice', 'oil', 'soap', 'detergent', 'milk', 'bread', 'tea', 'coffee',
  'cooking', 'edible', 'food', 'beverage', 'drink', 'household', 'cleaning', 'personal care',
  'shampoo', 'toothpaste', 'salt', 'spices', 'cereal', 'juice', 'water', 'snack'
];

const EXCLUDE_KEYWORDS = [
  'phone', 'tv', 'television', 'laptop', 'computer', 'tablet', 'electronics', 'fashion',
  'clothing', 'shoes', 'furniture', 'car', 'vehicle', 'jewelry', 'watch', 'camera'
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
      formats: ['markdown', 'html'],
      limit: 100,
      maxDepth: 3,
      excludePaths: [
        '/admin/*', '/user/*', '/login*', '/register*', '/cart*', '/checkout*',
        '/account*', '/profile*', '/wish*', '/compare*'
      ],
      includePaths: target.paths ? target.paths : [
        '/products/*', '/product/*', '/shop/*', '/category/*', '/categories/*'
      ]
    };

    try {
      const result = await FirecrawlService.crawlWebsite(target.url, options);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to scrape website');
      }

      const extractedProducts = FirecrawlService.extractProductsFromCrawlData(result.data);
      
      // Filter and format products
      const filteredProducts: ScrapedProductData[] = extractedProducts
        .filter(product => filterProduct(product.name, product.category))
        .map(product => ({
          name: product.name,
          category: target.category,
          image_url: product.image_url || null,
          source_url: target.url
        }));

      return filteredProducts;
    } catch (error) {
      console.error(`Error scraping ${target.name}:`, error);
      throw error;
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
          const products = await scrapeTarget(target);
          allProducts.push(...products);
          
          toast({
            title: "Progress",
            description: `Scraped ${products.length} products from ${target.name}`,
            duration: 2000
          });
        } catch (error) {
          console.error(`Failed to scrape ${target.name}:`, error);
          toast({
            title: "Warning",
            description: `Failed to scrape ${target.name}`,
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
            Bulk Product Scraper for Kenyan E-commerce
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCRAPE_TARGETS.map((target, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <h4 className="font-medium">{target.name}</h4>
                <p className="text-sm text-muted-foreground">{target.category}</p>
                <p className="text-xs text-muted-foreground">{target.url}</p>
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