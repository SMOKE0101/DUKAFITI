
const CACHE_NAME = 'dukafiti-offline-v3';
const RUNTIME_CACHE = 'dukafiti-runtime-v3';
const DATA_CACHE = 'dukafiti-data-v3';

// Cache-first resources (shell)
const SHELL_RESOURCES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Network-first with fallback resources (data APIs)
const API_PATTERNS = [
  /\/rest\/v1\//,
  /\/auth\/v1\//,
  /supabase\.co/
];

// Performance metrics
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  syncOperations: 0
};

// Install event - cache shell resources
self.addEventListener('install', event => {
  console.log('[SW] Installing enhanced service worker v3...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching shell resources');
        return cache.addAll(SHELL_RESOURCES);
      })
      .then(() => {
        console.log('[SW] Shell resources cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache shell resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating enhanced service worker v3...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes('dukafiti-offline-v3') && 
                !cacheName.includes('dukafiti-runtime-v3') && 
                !cacheName.includes('dukafiti-data-v3')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Cache cleanup complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Handle different caching strategies
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // API requests - network first with fallback
    if (API_PATTERNS.some(pattern => pattern.test(url.href))) {
      return await networkFirstWithFallback(request);
    }
    
    // Static assets - cache first
    if (url.pathname.includes('/static/') || url.pathname.includes('/assets/')) {
      return await cacheFirst(request);
    }
    
    // HTML pages - network first with cache fallback
    if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
      return await networkFirstWithFallback(request);
    }
    
    // Default to network first
    return await networkFirstWithFallback(request);
    
  } catch (error) {
    console.error('[SW] Request handling failed:', error);
    return new Response('Service Unavailable', { status: 503 });
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    performanceMetrics.cacheHits++;
    console.log('[SW] Cache hit:', request.url);
    
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Ignore network errors in background update
    });
    
    return cached;
  }
  
  performanceMetrics.cacheMisses++;
  performanceMetrics.networkRequests++;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed for:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy with fallback
async function networkFirstWithFallback(request) {
  const cache = await caches.open(DATA_CACHE);
  
  try {
    performanceMetrics.networkRequests++;
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      performanceMetrics.cacheHits++;
      return cached;
    }
    
    performanceMetrics.cacheMisses++;
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match('/');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when back online
async function syncOfflineActions() {
  try {
    performanceMetrics.syncOperations++;
    console.log('[SW] Starting background sync...');
    
    // Notify clients about sync start
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED'
      });
    });
    
    // Simulate sync process (actual implementation would use IndexedDB)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Notify clients about sync completion
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncedCount: 0
      });
    });
    
    console.log('[SW] Background sync completed');
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Message handling
self.addEventListener('message', event => {
  const { type } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'SYNC_NOW':
      syncOfflineActions();
      break;
      
    case 'CACHE_STATS':
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          type: 'CACHE_STATS_RESPONSE',
          stats: performanceMetrics
        });
      }
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
  }
});

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Reset metrics
    performanceMetrics = {
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
      syncOperations: 0
    };
    
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

// Error handling
self.addEventListener('error', event => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Enhanced offline service worker v3 loaded');
