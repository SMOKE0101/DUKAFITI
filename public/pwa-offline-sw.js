// PWA Offline-First Service Worker for DukaFiti
const CACHE_VERSION = 'dukafiti-pwa-v1';
const STATIC_CACHE = 'dukafiti-static-v1';
const DYNAMIC_CACHE = 'dukafiti-dynamic-v1';
const API_CACHE = 'dukafiti-api-v1';

// Complete app shell for offline access
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  // Add all your built assets here - these will be auto-populated during build
  '/assets/index.css',
  '/assets/index.js'
];

// API endpoints to cache for offline access
const API_PATTERNS = [
  /\/rest\/v1\/products/,
  /\/rest\/v1\/customers/,
  /\/rest\/v1\/sales/,
  /\/rest\/v1\/transactions/,
  /\/auth\/v1\//,
  /supabase\.co/
];

// App routes for SPA handling
const APP_ROUTES = [
  '/',
  '/inventory',
  '/sales', 
  '/customers',
  '/reports',
  '/settings',
  '/dashboard'
];

// Install - Pre-cache all critical resources
self.addEventListener('install', (event) => {
  console.log('[PWA SW] Installing DukaFiti PWA Service Worker v1');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[PWA SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
      }),
      // Initialize other caches
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE)
    ]).then(() => {
      console.log('[PWA SW] Pre-caching complete');
      return self.skipWaiting();
    })
  );
});

// Activate - Clean up and take control
self.addEventListener('activate', (event) => {
  console.log('[PWA SW] Activating DukaFiti PWA Service Worker v1');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[PWA SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ]).then(() => {
      console.log('[PWA SW] Activation complete - PWA ready for offline use');
    })
  );
});

// Fetch - Implement offline-first strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (handle them separately)
  if (request.method !== 'GET') {
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
      event.respondWith(handleWriteRequest(request));
    }
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Route to appropriate handler
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isAppRoute(request)) {
    event.respondWith(handleAppRoute(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Static assets - Cache first with update
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Serve from cache, update in background
      updateAssetInBackground(request, cache);
      return cachedResponse;
    }
    
    // Not in cache, fetch and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('[PWA SW] Static asset failed:', error);
    // Return a basic offline response for assets
    return new Response('Asset not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// API requests - Cache first for GET, queue writes
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    
    // For offline-first, try cache first for GET requests
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[PWA SW] Serving API from cache:', request.url);
      
      // Update cache in background if online
      if (navigator.onLine) {
        updateAPIInBackground(request, cache);
      }
      
      return cachedResponse;
    }
    
    // Not in cache, try network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[PWA SW] API request failed, no cache available:', request.url);
    
    // Return structured offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline. Please connect to the internet.',
        offline: true,
        timestamp: new Date().toISOString()
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

// App routes - Always serve cached app shell
async function handleAppRoute(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    
    // Always serve the cached app shell for SPA routes
    const appShell = await cache.match('/') || await cache.match('/index.html');
    
    if (appShell) {
      console.log('[PWA SW] Serving app shell for route:', request.url);
      return appShell;
    }
    
    // If no cached app shell, try network
    const networkResponse = await fetch('/');
    if (networkResponse.ok) {
      cache.put('/', networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('No app shell available');
    
  } catch (error) {
    console.error('[PWA SW] App route failed:', error);
    
    // Generate minimal offline app shell
    return new Response(generateOfflineAppShell(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Write requests - Queue for background sync
async function handleWriteRequest(request) {
  try {
    // Try network first
    return await fetch(request);
  } catch (error) {
    console.log('[PWA SW] Write request failed, queuing for sync:', request.url);
    
    // Queue request for background sync
    const requestData = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.clone().text(),
      timestamp: Date.now(),
    };
    
    await storeOfflineRequest(requestData);
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await self.registration.sync.register('offline-sync');
      } catch (syncError) {
        console.log('[PWA SW] Background sync registration failed:', syncError);
      }
    }
    
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

// Other requests - Standard network first
async function handleOtherRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try cache fallback
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Resource not available offline', { status: 503 });
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico|webp)$/);
}

function isAPIRequest(request) {
  return API_PATTERNS.some(pattern => pattern.test(request.url));
}

function isAppRoute(request) {
  const url = new URL(request.url);
  return APP_ROUTES.includes(url.pathname) || 
         url.pathname.startsWith('/app') ||
         (request.mode === 'navigate' && request.destination === 'document');
}

async function updateAssetInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    // Ignore background update errors
  }
}

async function updateAPIInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    // Ignore background update errors
  }
}

function generateOfflineAppShell() {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DukaFiti - Offline</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px;
            background: #f5f5f5;
          }
          .offline-container { 
            max-width: 600px;
            margin: 50px auto;
            text-align: center; 
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .offline-icon { 
            font-size: 4rem; 
            margin-bottom: 20px;
            color: #667eea;
          }
          h1 { color: #333; margin-bottom: 10px; }
          p { color: #666; margin-bottom: 20px; }
          .retry-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            margin: 10px;
            font-size: 16px;
          }
          .retry-btn:hover { background: #5a6fd8; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📱</div>
          <h1>DukaFiti</h1>
          <p>You're offline, but your app is ready to work!</p>
          <p>You can still view your cached data and make changes that will sync when you're back online.</p>
          <button class="retry-btn" onclick="window.location.reload()">Retry</button>
          <button class="retry-btn" onclick="window.location.href='/'">Go to Dashboard</button>
        </div>
        <script>
          // Auto-reload when back online
          window.addEventListener('online', () => {
            setTimeout(() => window.location.reload(), 1000);
          });
        </script>
      </body>
    </html>
  `;
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[PWA SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineRequests());
  }
});

// Sync offline requests
async function syncOfflineRequests() {
  try {
    const requests = await getStoredOfflineRequests();
    console.log(`[PWA SW] Syncing ${requests.length} offline requests`);
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });
        
        if (response.ok) {
          await removeStoredOfflineRequest(requestData.id);
          console.log('[PWA SW] Synced offline request:', requestData.url);
        } else {
          console.warn('[PWA SW] Sync failed for request:', requestData.url, response.status);
        }
      } catch (error) {
        console.error('[PWA SW] Failed to sync request:', requestData.url, error);
      }
    }
    
    // Notify app about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncedCount: requests.length
      });
    });
    
  } catch (error) {
    console.error('[PWA SW] Sync process failed:', error);
  }
}

// IndexedDB operations for offline requests
async function storeOfflineRequest(requestData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaFitiOfflineRequests', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      
      store.add(requestData);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function getStoredOfflineRequests() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaFitiOfflineRequests', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('requests')) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['requests'], 'readonly');
      const store = transaction.objectStore('requests');
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
      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      
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

console.log('[PWA SW] DukaFiti PWA Service Worker v1 loaded and ready for offline-first operation');
