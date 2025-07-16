
const CACHE_NAME = 'dukasmart-v3.1.0';
const RUNTIME_CACHE = 'dukasmart-runtime-v3.1.0';
const API_CACHE = 'dukasmart-api-v3.1.0';

// Enhanced core app shell resources for full offline support
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/favicon.ico'
];

// All SPA routes that should serve the app shell
const SPA_ROUTES = [
  '/',
  '/app',
  '/app/',
  '/app/dashboard',
  '/app/sales',
  '/app/inventory',
  '/app/customers',
  '/app/reports',
  '/app/settings',
  '/dashboard',
  '/sales',
  '/inventory',
  '/customers',
  '/reports',
  '/settings',
  '/signin',
  '/signup',
  '/landing',
  '/modern-landing'
];

// Install event - cache core assets and app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v3.1.0');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS).catch(err => {
          console.warn('[SW] Failed to cache some core assets:', err);
          // Continue even if some assets fail to cache
        });
      }),
      caches.open(RUNTIME_CACHE),
      caches.open(API_CACHE)
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v3.1.0');
  
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

// Handle API requests (cache-first for settings/profile, network-first for others)
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    
    // For settings and profile data, serve from cache first for instant loading
    if (request.url.includes('/profiles') || 
        request.url.includes('/shop_settings') ||
        request.url.includes('/products') ||
        request.url.includes('/customers') ||
        request.url.includes('/sales')) {
      
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // Serve cached response immediately, update in background
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
    const cachedResponse = await cache.match(request);
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

// Handle navigation requests (CRITICAL: Always serve app shell for SPA routes)
async function handleNavigation(request) {
  const url = new URL(request.url);
  
  try {
    // For SPA routes, always try to serve the app shell first when offline
    if (isSPARoute(url.pathname)) {
      console.log('[SW] Handling SPA route:', url.pathname);
      
      // Check if we're offline or network request would fail
      if (!navigator.onLine) {
        console.log('[SW] Offline detected, serving app shell for:', url.pathname);
        return await serveAppShell();
      }
      
      // Try network first when online
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }
      } catch (networkError) {
        console.log('[SW] Network failed for SPA route, serving app shell:', url.pathname);
        return await serveAppShell();
      }
    }
    
    // For non-SPA routes, try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network request failed');
    
  } catch (error) {
    console.log('[SW] Navigation failed, serving app shell for:', request.url);
    return await serveAppShell();
  }
}

// CRITICAL: Always serve the React app shell, never a static offline page
async function serveAppShell() {
  const cache = await caches.open(CACHE_NAME);
  
  // Try to get the main app shell
  let appShell = await cache.match('/');
  if (!appShell) {
    appShell = await cache.match('/index.html');
  }
  
  if (appShell) {
    console.log('[SW] Serving cached app shell');
    return appShell;
  }
  
  // Last resort: create a minimal app shell that will load the React app
  console.log('[SW] Creating fallback app shell');
  return new Response(generateMinimalAppShell(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
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
  // Normalize pathname
  const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  
  return SPA_ROUTES.some(route => {
    const normalizedRoute = route.endsWith('/') ? route.slice(0, -1) : route;
    return normalizedPath === normalizedRoute || 
           normalizedPath.startsWith(normalizedRoute + '/') ||
           normalizedPath === '' || 
           normalizedPath === '/';
  });
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

// Generate minimal app shell that will bootstrap the React app
function generateMinimalAppShell() {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DukaSmart - Offline</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0;
            background: #f8fafc;
          }
          #root { min-height: 100vh; }
          .loading { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            flex-direction: column;
            color: #64748b;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div id="root">
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading DukaSmart...</p>
            <p style="font-size: 14px; opacity: 0.7;">Working in offline mode</p>
          </div>
        </div>
        <script>
          // Try to load the main app
          setTimeout(() => {
            window.location.reload();
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
