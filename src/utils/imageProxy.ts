/**
 * Image proxy utilities for handling CORS-blocked external images
 */

// List of public CORS proxy services (use with caution in production)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://cors.bridged.cc/',
  'https://corsproxy.io/?',
];

// Check if URL needs proxy (based on known blocked domains)
const BLOCKED_DOMAINS = [
  'cdn.quickmart.co.ke',
  // Add other blocked CDNs here
];

export const needsProxy = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return BLOCKED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

export const getProxiedUrl = (originalUrl: string, proxyIndex = 0): string => {
  if (!needsProxy(originalUrl)) return originalUrl;
  
  const proxy = CORS_PROXIES[proxyIndex % CORS_PROXIES.length];
  return proxy + encodeURIComponent(originalUrl);
};

export const getAllProxiedUrls = (originalUrl: string): string[] => {
  if (!needsProxy(originalUrl)) return [originalUrl];
  
  return CORS_PROXIES.map(proxy => proxy + encodeURIComponent(originalUrl));
};

/**
 * Try to load an image through multiple proxy services
 */
export const loadImageWithProxy = async (originalUrl: string): Promise<string> => {
  if (!needsProxy(originalUrl)) {
    // Test direct load first
    try {
      await testImageLoad(originalUrl);
      return originalUrl;
    } catch {
      // Direct load failed, try proxies even for non-blocked domains
    }
  }

  const proxiedUrls = getAllProxiedUrls(originalUrl);
  
  for (const proxiedUrl of proxiedUrls) {
    try {
      await testImageLoad(proxiedUrl);
      console.log(`✅ Proxy successful for ${originalUrl} via ${proxiedUrl}`);
      return proxiedUrl;
    } catch (error) {
      console.log(`❌ Proxy failed for ${proxiedUrl}:`, error);
    }
  }
  
  throw new Error(`All proxy attempts failed for ${originalUrl}`);
};

/**
 * Test if an image URL can be loaded
 */
const testImageLoad = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Shorter timeout for better performance with many images
    const timeout = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error('Timeout'));
    }, 3000);
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Load failed'));
    };
    
    // Set crossOrigin after assigning handlers but before src
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.src = url;
  });
};