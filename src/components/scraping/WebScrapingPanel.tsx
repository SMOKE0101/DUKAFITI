import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { FirecrawlService, CrawlResult, ScrapedProduct } from '@/services/firecrawlService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Globe, Package, Database, Wifi, WifiOff, Trash2, BarChart3 } from 'lucide-react';

const KENYAN_ECOMMERCE_SITES = [
  { name: 'Jumia Kenya', url: 'https://www.jumia.co.ke' },
  { name: 'Kilimall Kenya', url: 'https://www.kilimall.co.ke' },
  { name: 'Jiji Kenya', url: 'https://jiji.co.ke' },
  { name: 'Pigiame', url: 'https://www.pigiame.co.ke' },
  { name: 'Cheki Kenya', url: 'https://www.cheki.co.ke' }
];

export const WebScrapingPanel: React.FC = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [extractedProducts, setExtractedProducts] = useState<ScrapedProduct[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');

  const handleQuickSelect = (siteUrl: string) => {
    setUrl(siteUrl);
    setSelectedSite(siteUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    if (!isOnline) {
      // Check cache for offline access
      const cached = await FirecrawlService.crawlWebsite(url, {}, true);
      if (cached.cached) {
        setCrawlResult(cached);
        const products = FirecrawlService.extractProductsFromCrawlData(cached.data);
        setExtractedProducts(products);
        toast({
          title: "Cached Data Loaded",
          description: "Showing previously scraped data (offline mode)"
        });
        return;
      }
      
      toast({
        title: "Offline",
        description: "No cached data available. Please connect to the internet to scrape new data.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);
    setExtractedProducts([]);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);
    
    try {
      console.log('Starting crawl for URL:', url);
      
      const options = {
        formats: ['markdown', 'html'],
        limit: 20,
        maxDepth: 2,
        excludePaths: ['/admin/*', '/user/*', '/login*', '/register*'],
        includePaths: ['/products/*', '/shop/*', '/category/*', '/categories/*']
      };
      
      const result = await FirecrawlService.crawlWebsite(url, options);
      
      setProgress(100);
      setCrawlResult(result);
      
      if (result.success) {
        const products = FirecrawlService.extractProductsFromCrawlData(result.data);
        setExtractedProducts(products);
        
        toast({
          title: "Success",
          description: `Scraped ${products.length} products from website ${result.cached ? '(from cache)' : ''}`,
          duration: 5000
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to scrape website",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error crawling website:', error);
      toast({
        title: "Error",
        description: "Failed to scrape website. Please try again.",
        variant: "destructive"
      });
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
      setProgress(100);
    }
  };

  const handleClearCache = () => {
    FirecrawlService.clearCache();
    toast({
      title: "Cache Cleared",
      description: "All cached scraping data has been removed"
    });
  };

  const cacheStats = FirecrawlService.getCacheStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Web Scraping for Product Data
            <div className="ml-auto flex items-center gap-2">
              {isOnline ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  Online
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Select for Kenyan E-commerce Sites */}
          <div className="space-y-3">
            <Label>Quick Select - Kenyan E-commerce Sites</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {KENYAN_ECOMMERCE_SITES.map((site) => (
                <Button
                  key={site.url}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(site.url)}
                  className="justify-start"
                >
                  {site.name}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Manual URL Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>

            {isLoading && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Scraping website... {progress}%
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isLoading || (!isOnline && !url)}
                className="flex-1"
              >
                {isLoading ? "Scraping..." : isOnline ? "Scrape Website" : "Check Cache"}
              </Button>
              
              {cacheStats.count > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearCache}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cache
                </Button>
              )}
            </div>
          </form>

          {/* Cache Stats */}
          {cacheStats.count > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="w-4 h-4" />
              <span>
                {cacheStats.count} cached results ({Math.round(cacheStats.totalSize / 1024)}KB)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {crawlResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Scraped Products ({extractedProducts.length})
              {crawlResult.cached && (
                <Badge variant="secondary">Cached</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {extractedProducts.length > 0 ? (
              <ScrollArea className="h-96 w-full">
                <div className="space-y-3">
                  {extractedProducts.map((product, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Category: {product.category}
                          </p>
                          {product.price && (
                            <p className="text-sm font-medium text-green-600">
                              Price: {product.price}
                            </p>
                          )}
                          {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>
                          )}
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No products found in the scraped data</p>
                <p className="text-sm">Try a different URL or check the website structure</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};