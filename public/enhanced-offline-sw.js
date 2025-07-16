
// Enhanced Offline-First Service Worker for DukaFiti PWA
const CACHE_VERSION = 'dukafiti-enhanced-v4';
const STATIC_CACHE = 'dukafiti-static-v4';
const DYNAMIC_CACHE = 'dukafiti-dynamic-v4';
const API_CACHE = 'dukafiti-api-v4';

// Complete app shell for true offline-first experience
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  // Add all critical assets - these should be auto-populated during build
  '/assets/index.css',
  '/assets/index.js'
];

// API endpoints for cache-first strategy
const API_PATTERNS = [
  /\/rest\/v1\/products/,
  /\/rest\/v1\/customers/,
  /\/rest\/v1\/sales/,
  /\/rest\/v1\/transactions/,
  /\/auth\/v1\//,
  /supabase\.co/
];

// SPA routes for app shell serving
const SPA_ROUTES = [
  '/',
  '/inventory',
  '/sales',
  '/customers',
  '/reports',
  '/settings',
  '/dashboard'
];

// Install - Pre-cache everything critical
self.addEventListener('install', (event) => {
  console.log('[Enhanced SW] Installing DukaFiti Enhanced Offline SW v4');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets with cache-busting
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[Enhanced SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => 
          new Request(url, { cache: 'reload' })
        ));
      }),
      // Initialize other caches
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
      // Pre-cache SPA routes
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[Enhanced SW] Pre-caching SPA routes');
        return Promise.all(
          SPA_ROUTES.map(route => 
            cache.add(new Request(route, { 
              headers: { 'Accept': 'text/html' },
              cache: 'reload'
            })).catch(err => {
              console.warn(`[Enhanced SW] Failed to cache route ${route}:`, err);
            })
          )
        );
      })
    ]).then(() => {
      console.log('[Enhanced SW] Pre-caching complete');
      return self.skipWaiting();
    })
  );
});

// Activate - Clean up and take immediate control
self.addEventListener('activate', (event) => {
  console.log('[Enhanced SW] Activating DukaFiti Enhanced Offline SW v4');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes('v4')) {
              console.log('[Enhanced SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take immediate control
      self.clients.claim()
    ]).then(() => {
      console.log('[Enhanced SW] Activation complete - Enhanced offline ready');
    })
  );
});

// Fetch - Implement true offline-first strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      event.respondWith(handleWriteRequest(request));
    }
    return;
  }

  // Skip non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Route to appropriate strategy
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstWithUpdate(request, STATIC_CACHE));
  } else if (isAPIRequest(request)) {
    event.respondWith(cacheFirstAPIRequest(request));
  } else if (isSPARoute(request)) {
    event.respondWith(serveSPAShell(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache-first with background update for static assets
async function cacheFirstWithUpdate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Serve from cache immediately
      updateInBackground(request, cache);
      return cachedResponse;
    }
    
    // Not in cache, fetch and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('[Enhanced SW] Cache-first failed:', error);
    return new Response('Asset not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache-first for API requests with IndexedDB fallback
async function cacheFirstAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[Enhanced SW] Serving API from cache:', request.url);
      
      // Update in background if online
      if (navigator.onLine) {
        updateInBackground(request, cache);
      }
      
      return cachedResponse;
    }
    
    // Try network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
      // Also store in IndexedDB for richer offline access
      storeInIndexedDB(request.url, await networkResponse.clone().json());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[Enhanced SW] API request failed, trying IndexedDB:', request.url);
    
    // Try IndexedDB as last resort
    const idbData = await getFromIndexedDB(request.url);
    if (idbData) {
      return new Response(JSON.stringify(idbData), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'x-served-by': 'indexeddb'
        }
      });
    }
    
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

// Always serve SPA shell from cache for navigation
async function serveSPAShell(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    
    // Always serve the cached app shell for SPA routes
    const appShell = await cache.match('/') || await cache.match('/index.html');
    
    if (appShell) {
      console.log('[Enhanced SW] Serving SPA shell for route:', request.url);
      return appShell;
    }
    
    // Fallback: try to fetch and cache the shell
    try {
      const networkResponse = await fetch('/');
      if (networkResponse.ok) {
        cache.put('/', networkResponse.clone());
        cache.put('/index.html', networkResponse.clone());
        return networkResponse;
      }
    } catch (networkError) {
      console.warn('[Enhanced SW] Network failed for app shell');
    }
    
    // Last resort: generate minimal app shell
    return new Response(generateMinimalAppShell(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('[Enhanced SW] SPA shell serving failed:', error);
    return new Response(generateMinimalAppShell(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Stale-while-revalidate for other resources
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Handle write requests with offline queuing
async function handleWriteRequest(request) {
  try {
    // Try network first for write operations
    return await fetch(request);
  } catch (error) {
    console.log('[Enhanced SW] Write request failed, queuing:', request.url);
    
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
        console.log('[Enhanced SW] Background sync registration failed:', syncError);
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
          'x-offline-queued': 'true'
        }
      }
    );
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico|webp|json)$/);
}

function isAPIRequest(request) {
  return API_PATTERNS.some(pattern => pattern.test(request.url));
}

function isSPARoute(request) {
  const url = new URL(request.url);
  return SPA_ROUTES.includes(url.pathname) || 
         url.pathname.startsWith('/app') ||
         (request.mode === 'navigate' && request.destination === 'document');
}

async function updateInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    // Silent fail for background updates
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
            font-family: system-ui, sans-serif; 
            margin: 0; 
            padding: 0;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .loading-container { 
            text-align: center;
            padding: 2rem;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h1 { color: #1e293b; margin-bottom: 0.5rem; }
          p { color: #64748b; }
        </style>
      </head>
      <body>
        <div class="loading-container">
          <div class="spinner"></div>
          <h1>DukaFiti</h1>
          <p>Loading your offline-ready app...</p>
        </div>
        <script>
          // Auto-reload when online
          window.addEventListener('online', () => {
            setTimeout(() => window.location.reload(), 500);
          });
          
          // Try to load the actual app after a delay
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        </script>
      </body>
    </html>
  `;
}

// IndexedDB helpers for richer offline data storage
async function storeInIndexedDB(url, data) {
  try {
    const request = indexedDB.open('DukaFitiAPICache', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('apiCache')) {
        db.createObjectStore('apiCache', { keyPath: 'url' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['apiCache'], 'readwrite');
      const store = transaction.objectStore('apiCache');
      
      store.put({
        url: url,
        data: data,
        timestamp: Date.now()
      });
    };
  } catch (error) {
    console.error('[Enhanced SW] IndexedDB store failed:', error);
  }
}

async function getFromIndexedDB(url) {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('DukaFitiAPICache', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('apiCache')) {
          resolve(null);
          return;
        }
        
        const transaction = db.transaction(['apiCache'], 'readonly');
        const store = transaction.objectStore('apiCache');
        const getRequest = store.get(url);
        
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            // Check if data is not too old (24 hours)
            const age = Date.now() - getRequest.result.timestamp;
            if (age < 24 * 60 * 60 * 1000) {
              resolve(getRequest.result.data);
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
        
        getRequest.onerror = () => resolve(null);
      };
      
      request.onerror = () => resolve(null);
    } catch (error) {
      console.error('[Enhanced SW] IndexedDB get failed:', error);
      resolve(null);
    }
  });
}

// Background sync and offline request management
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

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[Enhanced SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineRequests());
  }
});

// Sync offline requests
async function syncOfflineRequests() {
  try {
    const requests = await getStoredOfflineRequests();
    console.log(`[Enhanced SW] Syncing ${requests.length} offline requests`);
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });
        
        if (response.ok) {
          await removeStoredOfflineRequest(requestData.id);
          console.log('[Enhanced SW] Synced offline request:', requestData.url);
        }
      } catch (error) {
        console.error('[Enhanced SW] Failed to sync request:', requestData.url, error);
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
    console.error('[Enhanced SW] Sync process failed:', error);
  }
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

console.log('[Enhanced SW] DukaFiti Enhanced Offline Service Worker v4 loaded and ready');
