const CACHE_NAME = 'dukasmart-v3.0.0';
const RUNTIME_CACHE = 'dukasmart-runtime-v3.0.0';
const API_CACHE = 'dukasmart-api-v3.0.0';

// Enhanced core app shell resources for full offline support
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/favicon.ico'
];

// SPA routes that should serve the app shell
const SPA_ROUTES = [
  '/app',
  '/app/dashboard',
  '/app/sales',
  '/app/inventory',
  '/app/customers',
  '/app/reports',
  '/app/settings',
  '/dashboard',
  '/inventory',
  '/customers',
  '/reports',
  '/settings'
];

// Install event - cache core assets and app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v3.0.0');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      }),
      caches.open(RUNTIME_CACHE),
      caches.open(API_CACHE)
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v3.0.0');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Enhanced fetch event handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
      event.respondWith(handleOfflineWrite(request));
    }
    return;
  }

  // Handle different request types
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request) || isSPARoute(url.pathname)) {
    event.respondWith(handleNavigation(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// Handle static assets (cache-first strategy)
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Serve from cache immediately, update cache in background
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    // Not in cache, fetch and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return new Response('Asset not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle API requests (cache-first with background update for settings)
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    // For settings and profile data, serve from cache first for instant loading
    if (request.url.includes('/profiles') || request.url.includes('/shop_settings')) {
      if (cachedResponse) {
        // Serve cached response immediately
        updateCacheInBackground(request, cache);
        return cachedResponse;
      }
    }
    
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // Network failed, use cache if available
    if (cachedResponse) {
      const response = cachedResponse.clone();
      response.headers.set('x-served-by', 'sw-cache');
      response.headers.set('x-offline', 'true');
      return response;
    }
    
    throw new Error('No cache available');
    
  } catch (error) {
    console.log('[SW] API request failed, trying cache:', request.url);
    
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const response = cachedResponse.clone();
      response.headers.set('x-served-by', 'sw-cache');
      response.headers.set('x-offline', 'true');
      return response;
    }
    
    // No cache available, return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline',
        offline: true
      }),
      { 
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'x-offline': 'true'
        }
      }
    );
  }
}

// Handle navigation requests (serve app shell for SPA routes)
async function handleNavigation(request) {
  try {
    // Always try network first for navigation
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network request failed');
    
  } catch (error) {
    console.log('[SW] Navigation failed, serving app shell for:', request.url);
    
    // Serve cached app shell for SPA routes
    const cache = await caches.open(CACHE_NAME);
    const appShell = await cache.match('/') || await cache.match('/index.html');
    
    if (appShell) {
      return appShell;
    }
    
    // Fallback to enhanced offline page that preserves app functionality
    return new Response(generateEnhancedOfflinePage(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle generic requests
async function handleGenericRequest(request) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // Network failed, use cache
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw new Error('No cached response available');
    
  } catch (error) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Resource not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle offline write requests
async function handleOfflineWrite(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Write request failed, queuing for sync:', request.url);
    
    // Store request for later sync
    const requestData = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.clone().text(),
      timestamp: Date.now(),
    };
    
    await storeOfflineRequest(requestData);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        queued: true,
        offline: true,
        message: 'Request queued for sync when online',
        id: requestData.id
      }),
      { 
        status: 202,
        headers: { 
          'Content-Type': 'application/json',
          'x-offline': 'true'
        }
      }
    );
  }
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineRequests());
  }
});

// Sync offline requests when back online
async function syncOfflineRequests() {
  try {
    const requests = await getStoredOfflineRequests();
    console.log(`[SW] Syncing ${requests.length} offline requests`);
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });
        
        if (response.ok) {
          await removeStoredOfflineRequest(requestData.id);
          console.log('[SW] Synced offline request:', requestData.url);
        } else {
          console.warn('[SW] Sync failed for request:', requestData.url, response.status);
        }
      } catch (error) {
        console.error('[SW] Failed to sync request:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync process failed:', error);
  }
}

// Enhanced helper functions
function isSPARoute(pathname) {
  return SPA_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico|webp)$/);
}

function isAPIRequest(request) {
  return request.url.includes('/api/') || 
         request.url.includes('supabase.co') ||
         request.url.includes('/rest/v1/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    // Ignore background update errors
  }
}

// Enhanced offline page that maintains app functionality
function generateEnhancedOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DukaSmart - Working Offline</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px;
            background: #f8fafc;
            color: #1e293b;
          }
          .container { 
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .offline-icon { 
            font-size: 3rem; 
            margin-bottom: 1rem;
          }
          .retry-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            margin: 0.5rem;
            font-weight: 500;
          }
          .retry-btn:hover {
            background: #2563eb;
          }
          .features {
            text-align: left;
            margin-top: 2rem;
            padding: 1rem;
            background: #f1f5f9;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="offline-icon">📱</div>
          <h2>DukaSmart - Working Offline</h2>
          <p>Your business app is running in offline mode. You can still:</p>
          
          <div class="features">
            <ul>
              <li>✅ Browse previously visited pages</li>
              <li>✅ View cached data and settings</li>
              <li>✅ Create new sales and customers (will sync later)</li>
              <li>✅ Access offline dashboard and reports</li>
            </ul>
          </div>
          
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
          <button class="retry-btn" onclick="window.history.back()">Go Back</button>
        </div>
        
        <script>
          // Auto-refresh when back online
          window.addEventListener('online', () => {
            setTimeout(() => window.location.reload(), 1000);
          });
          
          // Try to navigate to main app after a delay
          setTimeout(() => {
            if (window.location.pathname !== '/') {
              window.location.href = '/';
            }
          }, 2000);
        </script>
      </body>
    </html>
  `;
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(syncOfflineRequests());
  }
});

// IndexedDB operations for offline requests
async function storeOfflineRequest(requestData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaSmartOffline', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineRequests')) {
        db.createObjectStore('offlineRequests', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offlineRequests'], 'readwrite');
      const store = transaction.objectStore('offlineRequests');
      
      store.add(requestData);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function getStoredOfflineRequests() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaSmartOffline', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineRequests')) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['offlineRequests'], 'readonly');
      const store = transaction.objectStore('offlineRequests');
      const getAll = store.getAll();
      
      getAll.onsuccess = () => resolve(getAll.result || []);
      getAll.onerror = () => reject(getAll.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function removeStoredOfflineRequest(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaSmartOffline', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offlineRequests'], 'readwrite');
      const store = transaction.objectStore('offlineRequests');
      
      store.delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}
