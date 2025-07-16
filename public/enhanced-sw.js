
const CACHE_NAME = 'dukafiti-v3-enhanced';
const STATIC_CACHE = 'dukafiti-static-v3';
const DYNAMIC_CACHE = 'dukafiti-dynamic-v3';

// Critical resources for app shell
const STATIC_ASSETS = [
  '/',
  '/app',
  '/manifest.json',
  '/offline',
  // Add your main JS and CSS files
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/products/,
  /\/api\/customers/,
  /\/api\/sales/,
  /supabase\.co/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Enhanced Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('Dynamic cache ready');
        return cache;
      })
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Enhanced Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - network first with intelligent fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    if (isStaticAsset(url)) {
      event.respondWith(handleStaticAsset(request));
    } else if (isAPIRequest(url)) {
      event.respondWith(handleAPIRequest(request));
    } else {
      event.respondWith(handleDynamicRequest(request));
    }
  } else if (request.method === 'POST' || request.method === 'PUT') {
    event.respondWith(handleWriteRequest(request));
  }
});

// Static asset handling - cache first
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {
        // Ignore network errors for background updates
      });
      
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('Static asset fetch failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// API request handling - network first with cache fallback
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('Network request failed, trying cache:', request.url);
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add offline indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'cache');
      return response;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline',
        cached: false 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Dynamic request handling
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline') || new Response('Page not available offline');
  }
}

// Write request handling - queue for later sync
async function handleWriteRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Store request for later sync
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now(),
    };
    
    // Store in IndexedDB for sync queue
    await storeOfflineRequest(requestData);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        queued: true,
        message: 'Request queued for sync when online' 
      }),
      { 
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-requests') {
    event.waitUntil(syncOfflineRequests());
  } else if (event.tag === 'priority-sync') {
    event.waitUntil(syncPriorityData());
  }
});

// Sync offline requests
async function syncOfflineRequests() {
  try {
    const requests = await getOfflineRequests();
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });
        
        if (response.ok) {
          await removeOfflineRequest(requestData.id);
          console.log('Synced offline request:', requestData.url);
        }
      } catch (error) {
        console.error('Failed to sync request:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Priority data sync
async function syncPriorityData() {
  try {
    // Sync critical data first (sales, then inventory, then customers)
    await syncDataType('sales');
    await syncDataType('inventory');
    await syncDataType('customers');
  } catch (error) {
    console.error('Priority sync failed:', error);
  }
}

// Helper functions
function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/);
}

function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.href));
}

async function storeOfflineRequest(requestData) {
  // Implementation would use IndexedDB
  console.log('Storing offline request:', requestData);
}

async function getOfflineRequests() {
  // Implementation would retrieve from IndexedDB
  return [];
}

async function removeOfflineRequest(id) {
  // Implementation would remove from IndexedDB
  console.log('Removing synced request:', id);
}

async function syncDataType(type) {
  // Implementation would sync specific data types
  console.log('Syncing data type:', type);
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Push notifications for sync status
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'sync-complete') {
      event.waitUntil(
        self.registration.showNotification('DukaFiti Sync Complete', {
          body: `${data.synced} operations synced successfully`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'sync-notification',
        })
      );
    }
  }
});
