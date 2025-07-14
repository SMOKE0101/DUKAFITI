
const CACHE_VERSION = 'dukafiti-v4-offline';
const STATIC_CACHE = 'dukafiti-static-v4';
const DYNAMIC_CACHE = 'dukafiti-dynamic-v4';
const API_CACHE = 'dukafiti-api-v4';

// Core app shell - critical for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  // These will be replaced with built assets during build
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// API patterns to cache
const API_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /auth\//
];

// Install - Cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing DukaFiti Offline Service Worker v4');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE)
    ])
  );
  
  self.skipWaiting();
});

// Activate - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating DukaFiti Offline Service Worker v4');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
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

// Fetch - Intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
      event.respondWith(handleWriteRequest(request));
    }
    return;
  }

  // Handle different request types
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Static assets - Cache first with background update
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Serve from cache immediately, update in background
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
    // Return offline fallback if available
    return new Response('Asset not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// API requests - Network first with cache fallback
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] API request failed, trying cache:', request.url);
    
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add offline indicator header
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

// Page requests - Handle navigation (serve main app for SPA routing)
async function handlePageRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for navigation requests
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network request failed');
    
  } catch (error) {
    console.log('[SW] Network failed for navigation, serving cached app');
    
    // For app routes, serve the cached main app (SPA)
    if (url.pathname.startsWith('/app') || 
        url.pathname === '/dashboard' ||
        url.pathname === '/inventory' ||
        url.pathname === '/customers' ||
        url.pathname === '/reports' ||
        url.pathname === '/settings') {
      
      // Try to serve cached main app
      const staticCache = await caches.open(STATIC_CACHE);
      const mainApp = await staticCache.match('/') || await staticCache.match('/index.html');
      
      if (mainApp) {
        console.log('[SW] Serving cached main app for SPA route:', url.pathname);
        return mainApp;
      }
    }
    
    // For other routes, try cache first
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's the root path or an app route, serve the main app anyway
    if (url.pathname === '/' || url.pathname.startsWith('/app')) {
      const staticCache = await caches.open(STATIC_CACHE);
      const mainApp = await staticCache.match('/') || await staticCache.match('/index.html');
      
      if (mainApp) {
        console.log('[SW] Serving main app as fallback for:', url.pathname);
        return mainApp;
      }
    }
    
    // Last resort: serve a minimal offline-aware HTML that loads the app
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>DukaFiti - Loading...</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              background: #f8fafc;
            }
            .loader { text-align: center; }
            .spinner { 
              border: 4px solid #e2e8f0; 
              border-top: 4px solid #3b82f6; 
              border-radius: 50%; 
              width: 40px; 
              height: 40px; 
              animation: spin 1s linear infinite; 
              margin: 0 auto 16px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <h2>Loading DukaFiti...</h2>
            <p>Starting offline mode...</p>
            <script>
              // Try to navigate to the main app
              setTimeout(() => {
                if (window.location.pathname !== '/') {
                  window.location.href = '/';
                } else {
                  window.location.reload();
                }
              }, 2000);
            </script>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Write request handling - Queue for sync
async function handleWriteRequest(request) {
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

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineRequests());
  } else if (event.tag === 'priority-sync') {
    event.waitUntil(syncPriorityData());
  }
});

// Sync offline requests
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

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico)$/);
}

function isAPIRequest(request) {
  return API_PATTERNS.some(pattern => pattern.test(request.url));
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

// IndexedDB operations for offline requests
async function storeOfflineRequest(requestData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaFitiOffline', 1);
    
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
    const request = indexedDB.open('DukaFitiOffline', 1);
    
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
    const request = indexedDB.open('DukaFitiOffline', 1);
    
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

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(syncOfflineRequests());
  }
});
