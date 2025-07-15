
const CACHE_NAME = 'dukafiti-v2.0.0';
const RUNTIME_CACHE = 'dukafiti-runtime-v2.0.0';
const DATA_CACHE = 'dukafiti-data-v2.0.0';

// Assets to cache immediately
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png',
  // Add other critical assets
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/',
  'https://jrmwivphspbxmacqrava.supabase.co/rest/v1/'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2.0.0');
  
  event.waitUntil(
    Promise.all([
      // Cache app shell
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      }),
      // Initialize runtime cache
      caches.open(RUNTIME_CACHE),
      // Initialize data cache
      caches.open(DATA_CACHE)
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Take control immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2.0.0');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== DATA_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) return;

  event.respondWith(
    handleFetch(request, url)
  );
});

async function handleFetch(request, url) {
  try {
    // Strategy 1: Cache First for app shell and static assets
    if (isAppShell(url) || isStaticAsset(url)) {
      return await cacheFirst(request, CACHE_NAME);
    }

    // Strategy 2: Network First with fallback for API calls
    if (isApiCall(url)) {
      return await networkFirstWithFallback(request, DATA_CACHE);
    }

    // Strategy 3: Stale While Revalidate for other resources
    return await staleWhileRevalidate(request, RUNTIME_CACHE);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    
    // Fallback to offline page for navigation requests
    if (request.destination === 'document') {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match('/') || new Response('Offline', { status: 200 });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Caching strategies
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

async function networkFirstWithFallback(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      // Cache successful API responses
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback to cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Always try to fetch from network in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached version immediately if available
  if (cached) {
    // Update cache in background
    fetchPromise;
    return cached;
  }
  
  // Wait for network if no cache
  return await fetchPromise || new Response('Offline', { status: 503 });
}

// Helper functions
function isAppShell(url) {
  return url.pathname === '/' || 
         url.pathname.startsWith('/app') ||
         url.pathname === '/index.html';
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/);
}

function isApiCall(url) {
  return CACHEABLE_APIS.some(api => url.href.includes(api));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  try {
    console.log('[SW] Starting offline sync...');
    
    // Notify all clients about sync start
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_START' });
    });

    // The actual sync logic will be handled by the app
    // This just triggers the sync process
    
    console.log('[SW] Offline sync completed');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'SYNC_NOW':
      // Trigger immediate sync
      syncOfflineActions();
      break;
      
    case 'CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', stats });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.source.postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
  }
});

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats[name] = keys.length;
  }
  
  return stats;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
}

// Push notification handling (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png',
    badge: '/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png',
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.openWindow('/')
  );
});

console.log('[SW] Enhanced offline service worker v2.0.0 loaded');
