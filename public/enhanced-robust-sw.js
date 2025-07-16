
const CACHE_NAME = 'dukafiti-enhanced-v3';
const OFFLINE_URL = '/offline.html';

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/app',
  '/app/dashboard',
  '/app/inventory',
  '/app/customers',
  '/app/sales',
  '/app/reports',
  '/app/settings',
  '/offline.html',
  '/manifest.json'
];

// Enhanced network-first strategy with robust fallbacks
const NETWORK_FIRST_ROUTES = [
  '/app/',
  '/api/',
  '/_supabase/'
];

// Cache-first for static assets
const CACHE_FIRST_ROUTES = [
  '/static/',
  '/assets/',
  '/icons/',
  '/images/',
  '.js',
  '.css',
  '.woff',
  '.woff2',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg'
];

// Enhanced logging
function log(message, data = null) {
  console.log(`[Enhanced-Robust-SW] ${message}`, data || '');
}

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  log('Installing enhanced service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        log('Caching static resources');
        return cache.addAll(STATIC_RESOURCES.map(url => new Request(url, { mode: 'no-cors' })));
      })
      .then(() => {
        log('Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        log('Installation failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  log('Activating enhanced service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        log('Service worker activated successfully');
        return self.clients.claim();
      })
  );
});

// Enhanced fetch handler with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle different request types with appropriate strategies
  if (shouldUseNetworkFirst(url.pathname)) {
    event.respondWith(handleNetworkFirst(request));
  } else if (shouldUseCacheFirst(url.pathname)) {
    event.respondWith(handleCacheFirst(request));
  } else {
    event.respondWith(handleDefault(request));
  }
});

// Determine if route should use network-first strategy
function shouldUseNetworkFirst(pathname) {
  return NETWORK_FIRST_ROUTES.some(route => pathname.startsWith(route));
}

// Determine if route should use cache-first strategy
function shouldUseCacheFirst(pathname) {
  return CACHE_FIRST_ROUTES.some(route => 
    pathname.includes(route) || pathname.endsWith(route)
  );
}

// Network-first strategy with enhanced offline fallback
async function handleNetworkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone(), {
      timeout: 5000 // 5 second timeout
    });
    
    if (networkResponse && networkResponse.status === 200) {
      // Cache successful responses
      await cache.put(request.clone(), networkResponse.clone());
      log('Network response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    log('Network failed, trying cache:', request.url);
    
    // Try cache fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      log('Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Final fallback for navigation requests
    if (request.mode === 'navigate') {
      log('Serving offline page for navigation');
      const offlineResponse = await cache.match(OFFLINE_URL);
      return offlineResponse || new Response('Offline', { status: 503 });
    }
    
    // Return network error for other requests
    return new Response('Network error', { 
      status: 503,
      statusText: 'Service Unavailable' 
    });
  }
}

// Cache-first strategy for static assets
async function handleCacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      log('Serving static asset from cache:', request.url);
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request.clone(), networkResponse.clone());
      log('Static asset cached from network:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    log('Cache-first failed for:', request.url, error);
    return new Response('Asset not available', { status: 404 });
  }
}

// Default strategy - stale-while-revalidate
async function handleDefault(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Serve from cache immediately if available
    const cachedResponse = await cache.match(request);
    
    // Start network request in background
    const networkPromise = fetch(request.clone())
      .then(async (networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          await cache.put(request.clone(), networkResponse.clone());
          log('Background update cached:', request.url);
        }
        return networkResponse;
      })
      .catch((error) => {
        log('Background update failed:', request.url, error);
        return null;
      });
    
    // Return cached response or wait for network
    return cachedResponse || await networkPromise || new Response('Not available', { status: 503 });
  } catch (error) {
    log('Default strategy failed:', request.url, error);
    return new Response('Service error', { status: 500 });
  }
}

// Enhanced message handling for cache management
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data && data.type === 'SKIP_WAITING') {
    log('Received skip waiting message');
    self.skipWaiting();
  } else if (data && data.type === 'CLEAR_CACHE') {
    log('Clearing cache on request');
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        log('Cache cleared successfully');
        event.ports[0].postMessage({ success: true });
      })
    );
  } else if (data && data.type === 'CACHE_STATUS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        const keys = await cache.keys();
        event.ports[0].postMessage({ 
          cacheSize: keys.length,
          cacheName: CACHE_NAME 
        });
      })
    );
  }
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    log('Background sync triggered');
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Notify clients that sync is starting
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_START' });
    });
    
    log('Background sync completed');
    
    // Notify clients that sync is complete
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
  } catch (error) {
    log('Background sync failed:', error);
  }
}

// Network state monitoring
self.addEventListener('online', () => {
  log('Network is online');
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NETWORK_ONLINE' });
    });
  });
});

self.addEventListener('offline', () => {
  log('Network is offline');
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NETWORK_OFFLINE' });
    });
  });
});

log('Enhanced robust service worker loaded successfully');
