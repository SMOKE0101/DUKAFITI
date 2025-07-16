
const CACHE_NAME = 'duka-fiti-v1.0.0';
const RUNTIME_CACHE = 'duka-fiti-runtime-v1.0.0';
const API_CACHE = 'duka-fiti-api-v1.0.0';

// Core app shell resources - these are cached during install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/favicon.ico'
];

// All SPA routes that should serve the app shell when offline
const SPA_ROUTES = [
  '/',
  '/app',
  '/app/',
  '/app/dashboard',
  '/app/sales',
  '/app/inventory',
  '/app/products',
  '/app/customers',
  '/app/reports',
  '/app/settings'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[RobustSW] Installing service worker v1.0.0');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('[RobustSW] Caching core assets');
        return cache.addAll(CORE_ASSETS).catch(err => {
          console.warn('[RobustSW] Failed to cache some core assets:', err);
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
  console.log('[RobustSW] Activating service worker v1.0.0');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[RobustSW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for special handling
  if (request.method !== 'GET') {
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
      event.respondWith(handleWriteRequest(request));
    }
    return;
  }

  // Route different request types
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request) || isSPARoute(url.pathname)) {
    event.respondWith(handleSPANavigation(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// Handle SPA navigation - ALWAYS serve the React app shell
async function handleSPANavigation(request) {
  const url = new URL(request.url);
  console.log('[RobustSW] SPA Navigation request:', url.pathname);
  
  try {
    // Try network first for fresh content (with timeout)
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 2000)
      )
    ]);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[RobustSW] ✅ Served fresh content for:', url.pathname);
      return networkResponse;
    }
  } catch (error) {
    console.log('[RobustSW] Network failed for navigation, serving cached app shell');
  }
  
  // Network failed - serve cached app shell
  const appShell = await getAppShellFromCache();
  
  if (appShell) {
    console.log('[RobustSW] ✅ Served cached React app shell for:', url.pathname);
    return appShell;
  }
  
  // Final fallback - generate minimal app shell
  console.log('[RobustSW] ⚠️ Serving minimal app shell as last resort');
  return new Response(generateMinimalAppShell(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// Get cached app shell
async function getAppShellFromCache() {
  const cache = await caches.open(CACHE_NAME);
  
  let appShell = await cache.match('/');
  if (!appShell) {
    appShell = await cache.match('/index.html');
  }
  
  return appShell ? appShell.clone() : null;
}

// Handle static assets (CSS, JS, images)
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Serve from cache, update in background
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    // Not in cache - fetch and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('[RobustSW] Static asset fetch failed:', error);
    return new Response('Asset not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    
    // Try network first
    const networkResponse = await fetch(request, { timeout: 5000 });
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('[RobustSW] API request failed, trying cache:', request.url);
    
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const response = cachedResponse.clone();
      response.headers.set('x-served-by', 'sw-cache');
      response.headers.set('x-offline', 'true');
      return response;
    }
    
    // No cache - return offline response
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

// Handle write requests (POST/PUT/DELETE)
async function handleWriteRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[RobustSW] Write request failed, queuing for sync:', request.url);
    
    try {
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
    } catch (storeError) {
      console.error('[RobustSW] Failed to store offline request:', storeError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to queue request for sync',
          offline: true
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'x-offline': 'true'
          }
        }
      );
    }
  }
}

// Handle generic requests
async function handleGenericRequest(request) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    const cachedResponse = await cache.match(request);
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

// Helper functions
function isSPARoute(pathname) {
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

function generateMinimalAppShell() {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DukaFiti - Loading...</title>
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
            <p>Loading DukaFiti...</p>
            <p style="font-size: 12px; color: #94a3b8;">Initializing offline mode...</p>
          </div>
        </div>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
  `;
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[RobustSW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineRequests());
  }
});

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
    const request = indexedDB.open('DukaFitiOfflineRequests', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineRequests')) {
        db.createObjectStore('offlineRequests', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offlineRequests')) {
        console.error('[RobustSW] Object store offlineRequests does not exist');
        reject(new Error('Object store not found'));
        return;
      }
      
      const transaction = db.transaction(['offlineRequests'], 'readwrite');
      const store = transaction.objectStore('offlineRequests');
      
      store.add(requestData);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function syncOfflineRequests() {
  try {
    const requests = await getStoredOfflineRequests();
    console.log(`[RobustSW] Syncing ${requests.length} offline requests`);
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });
        
        if (response.ok) {
          await removeStoredOfflineRequest(requestData.id);
          console.log('[RobustSW] Synced offline request:', requestData.url);
        }
      } catch (error) {
        console.error('[RobustSW] Failed to sync request:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('[RobustSW] Sync process failed:', error);
  }
}

async function getStoredOfflineRequests() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaFitiOfflineRequests', 1);
    
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
    const request = indexedDB.open('DukaFitiOfflineRequests', 1);
    
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
