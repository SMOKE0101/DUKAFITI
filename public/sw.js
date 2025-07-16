const CACHE_NAME = 'dukasmart-v3.2.3';
const RUNTIME_CACHE = 'dukasmart-runtime-v3.2.3';
const API_CACHE = 'dukasmart-api-v3.2.3';

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
  console.log('[SW] Installing service worker v3.2.3');
  
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

// Activate event - clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v3.2.3');
  
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

// CRITICAL: Enhanced fetch event handling for consistent navigation
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

  // Handle different request types with proper navigation detection
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request) || isSPARoute(url.pathname)) {
    // CRITICAL: Always serve app shell for navigation requests - NEVER static offline page
    event.respondWith(handleNavigationToAppShell(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// ENHANCED: Always serve the React app shell for navigation requests - NEVER a static offline page
async function handleNavigationToAppShell(request) {
  const url = new URL(request.url);
  
  console.log('[SW] Navigation request for:', url.pathname);
  
  // CRITICAL: For ALL navigation requests, ALWAYS serve app shell from cache
  // This ensures React can bootstrap and load from IndexedDB
  try {
    const appShell = await getAppShellFromCache();
    
    if (appShell) {
      console.log('[SW] ✅ Successfully served React app shell for:', url.pathname);
      return appShell;
    }
  } catch (error) {
    console.error('[SW] Failed to serve app shell from cache:', error);
  }
  
  // Try network as fallback but prioritize app shell
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses for future use
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for navigation request, falling back to minimal app shell');
  }
  
  // Final fallback: generate minimal React app shell that will bootstrap
  console.log('[SW] ⚠️ Serving minimal app shell as last resort for:', url.pathname);
  return new Response(generateReactAppShell(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// ENHANCED: Get React app shell from cache (never return static offline page)
async function getAppShellFromCache() {
  const cache = await caches.open(CACHE_NAME);
  
  // Try to get the main app shell in order of preference
  let appShell = await cache.match('/');
  if (!appShell) {
    appShell = await cache.match('/index.html');
  }
  
  if (appShell) {
    console.log('[SW] ✅ Found cached React app shell');
    return appShell.clone();
  }
  
  console.log('[SW] ❌ No cached React app shell found');
  return null;
}

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

// Handle API requests (cache-first for critical data, network-first for others)
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    
    // For critical data, serve from cache first for instant loading
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

// Handle generic requests
async function handleGenericRequest(request) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // Network failed, use cache
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

// Enhanced offline write requests with better error handling
async function handleOfflineWrite(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Write request failed, queuing for sync:', request.url);
    
    // Store request for later sync with enhanced error handling
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
      console.error('[SW] Failed to store offline request:', storeError);
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

// CRITICAL: Generate React app shell that will bootstrap from IndexedDB (NEVER static offline message)
function generateReactAppShell() {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DukaSmart - Offline Mode</title>
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
            <p style="font-size: 12px; color: #94a3b8;">Initializing offline mode...</p>
          </div>
        </div>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
  `;
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
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

// Enhanced IndexedDB operations for offline requests
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
      
      // Check if the object store exists
      if (!db.objectStoreNames.contains('offlineRequests')) {
        console.error('[SW] Object store offlineRequests does not exist');
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
