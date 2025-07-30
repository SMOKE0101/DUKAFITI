import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CrawlRequest {
  url: string;
  options?: {
    formats?: string[];
    limit?: number;
    excludePaths?: string[];
    includePaths?: string[];
    maxDepth?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, options = {} }: CrawlRequest = await req.json();
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    if (!url) {
      throw new Error('URL is required');
    }

    console.log(`[Firecrawl] Starting crawl for: ${url}`);

    // Simplified options for v1 API format
    const crawlOptions = {
      limit: options.limit || 10, // Reduced for rate limits
      excludePaths: options.excludePaths || [
        '/admin/*', 
        '/user/*', 
        '/login*', 
        '/register*',
        '/cart*',
        '/checkout*'
      ],
      includePaths: options.includePaths || [
        '/products/*',
        '/categories/*',
        '/catalog/*'
      ],
      maxDepth: options.maxDepth || 2, // Reduced depth
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 1000
      }
    };

    // Start the crawl
    const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        ...crawlOptions
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Firecrawl] API Error: ${response.status} - ${errorText}`);
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if crawl was initiated successfully
    if (data.success && data.id) {
      console.log(`[Firecrawl] Crawl initiated with ID: ${data.id}`);
      
      // For async crawls, we need to poll for status
      let crawlStatus = data;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      while (crawlStatus.status === 'scraping' && attempts < maxAttempts) {
        console.log(`[Firecrawl] Checking crawl status, attempt ${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${data.id}`, {
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
          },
        });
        
        if (statusResponse.ok) {
          crawlStatus = await statusResponse.json();
        }
        attempts++;
      }
      
      console.log(`[Firecrawl] Crawl completed with status: ${crawlStatus.status}`);
      
      return new Response(JSON.stringify({
        success: true,
        data: crawlStatus,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log(`[Firecrawl] Crawl completed immediately`);
      return new Response(JSON.stringify({
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('[Firecrawl] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});