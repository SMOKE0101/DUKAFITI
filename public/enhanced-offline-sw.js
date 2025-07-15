
const CACHE_VERSION = 'dukafiti-v5-enhanced';
const STATIC_CACHE = 'dukafiti-static-v5';
const DYNAMIC_CACHE = 'dukafiti-dynamic-v5';
const API_CACHE = 'dukafiti-api-v5';
const IMAGE_CACHE = 'dukafiti-images-v5';

// Enhanced app shell - critical for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// API patterns to cache
const API_PATTERNS = [
  /\/rest\/v1\//,
  /supabase\.co/,
  /auth\//
];

// Image patterns
const IMAGE_PATTERNS = [
  /\.(png|jpg|jpeg|gif|svg|webp|ico)$/
];

// Install - Cache critical resources with enhanced strategy
self.addEventListener('install', (event) => {
  console.log('[Enhanced SW] Installing DukaFiti Enhanced Service Worker v5');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[Enhanced SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { 
          credentials: 'same-origin',
          mode: 'cors'
        })));
      }),
      // Initialize other caches
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
      caches.open(IMAGE_CACHE),
      // Initialize IndexedDB for offline requests
      initializeOfflineStorage()
    ])
  );
  
  self.skipWaiting();
});

// Activate - Enhanced cleanup and takeover
self.addEventListener('activate', (event) => {
  console.log('[Enhanced SW] Activating DukaFiti Enhanced Service Worker v5');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes('v5') && cacheName.startsWith('dukafiti')) {
              console.log('[Enhanced SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim(),
      // Notify clients about activation
      notifyClientsAboutActivation()
    ])
  );
});

// Fetch - Enhanced caching with performance optimization
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (handle separately)
  if (request.method !== 'GET') {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      event.respondWith(handleWriteRequest(request));
    }
    return;
  }

  // Route to appropriate handler
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Enhanced static asset handling - Cache first with background update
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Serve from cache immediately, update in background
      updateCacheInBackground(request, cache);
      return addOfflineHeaders(cachedResponse);
    }
    
    // Not in cache, fetch and cache
    const networkResponse = await fetchWithTimeout(request, 5000);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('[Enhanced SW] Static asset fetch failed:', error);
    return createOfflineFallback('static');
  }
}

// Enhanced image handling - Cache first with compression
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return addOfflineHeaders(cachedResponse);
    }
    
    const networkResponse = await fetchWithTimeout(request, 8000);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('[Enhanced SW] Image fetch failed:', error);
    return createOfflineFallback('image');
  }
}

// Enhanced API handling - Network first with intelligent fallback
async function handleAPIRequest(request) {
  try {
    // Try network first with timeout
    const networkResponse = await fetchWithTimeout(request, 10000);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      // Only cache GET requests to avoid caching mutations
      if (request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
    
  } catch (error) {
    console.log('[Enhanced SW] API request failed, trying cache:', request.url);
    
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return addOfflineHeaders(cachedResponse, true);
    }
    
    // No cache available, return meaningful offline response
    return createOfflineAPIResponse(request);
  }
}

// Enhanced page handling - App shell with proper SPA routing
async function handlePageRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for navigation
    const networkResponse = await fetchWithTimeout(request, 5000);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network request failed');
    
  } catch (error) {
    console.log('[Enhanced SW] Network failed for navigation, serving app shell');
    
    // Serve app shell for SPA routes
    if (isSPARoute(url.pathname)) {
      const staticCache = await caches.open(STATIC_CACHE);
      const appShell = await staticCache.match('/') || await staticCache.match('/index.html');
      
      if (appShell) {
        console.log('[Enhanced SW] Serving app shell for:', url.pathname);
        return addOfflineHeaders(appShell, true);
      }
    }
    
    // Try dynamic cache
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await dynamicCache.match(request);
    
    if (cachedResponse) {
      return addOfflineHeaders(cachedResponse, true);
    }
    
    // Return offline page
    return createOfflinePage(url.pathname);
  }
}

// Enhanced write request handling with queue
async function handleWriteRequest(request) {
  try {
    const response = await fetchWithTimeout(request, 15000);
    return response;
  } catch (error) {
    console.log('[Enhanced SW] Write request failed, queuing:', request.url);
    
    // Store request for background sync
    const requestData = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.clone().text(),
      timestamp: Date.now(),
      retries: 0
    };
    
    await storeOfflineRequest(requestData);
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await self.registration.sync.register('offline-sync');
      } catch (syncError) {
        console.log('[Enhanced SW] Background sync not available');
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        queued: true,
        offline: true,
        message: 'Request queued for sync when online',
        id: requestData.id,
        timestamp: requestData.timestamp
      }),
      { 
        status: 202,
        headers: { 
          'Content-Type': 'application/json',
          'x-offline': 'true',
          'x-queued': 'true'
        }
      }
    );
  }
}

// Enhanced background sync with retry logic
self.addEventListener('sync', (event) => {
  console.log('[Enhanced SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineRequests());
  }
});

// Enhanced sync with exponential backoff
async function syncOfflineRequests() {
  try {
    const requests = await getStoredOfflineRequests();
    console.log(`[Enhanced SW] Syncing ${requests.length} offline requests`);
    
    for (const requestData of requests) {
      try {
        // Exponential backoff
        if (requestData.retries > 0) {
          const delay = Math.min(1000 * Math.pow(2, requestData.retries), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });
        
        if (response.ok) {
          await removeStoredOfflineRequest(requestData.id);
          console.log('[Enhanced SW] Synced request:', requestData.url);
          
          // Notify client about successful sync
          notifyClients('SYNC_SUCCESS', { 
            requestId: requestData.id,
            url: requestData.url 
          });
        } else {
          // Increment retry count
          requestData.retries = (requestData.retries || 0) + 1;
          if (requestData.retries < 5) {
            await updateStoredOfflineRequest(requestData);
          } else {
            await removeStoredOfflineRequest(requestData.id);
            console.warn('[Enhanced SW] Max retries reached for:', requestData.url);
          }
        }
      } catch (error) {
        console.error('[Enhanced SW] Sync failed for request:', requestData.url, error);
        requestData.retries = (requestData.retries || 0) + 1;
        if (requestData.retries < 5) {
          await updateStoredOfflineRequest(requestData);
        } else {
          await removeStoredOfflineRequest(requestData.id);
        }
      }
    }
    
    // Notify clients about sync completion
    notifyClients('SYNC_COMPLETED', { 
      processed: requests.length,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('[Enhanced SW] Sync process failed:', error);
  }
}

// Utility functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|woff|woff2|ico|json)$/) ||
         url.pathname === '/' ||
         url.pathname === '/index.html' ||
         url.pathname === '/manifest.json';
}

function isImageRequest(request) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isAPIRequest(request) {
  return API_PATTERNS.some(pattern => pattern.test(request.url));
}

function isSPARoute(pathname) {
  return pathname.startsWith('/app') || 
         ['/dashboard', '/inventory', '/sales', '/customers', '/reports', '/settings'].includes(pathname);
}

function addOfflineHeaders(response, fromCache = false) {
  const headers = new Headers(response.headers);
  if (fromCache) {
    headers.set('x-served-by', 'sw-cache');
    headers.set('x-offline', 'true');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function fetchWithTimeout(request, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
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

function createOfflineFallback(type) {
  const messages = {
    static: 'Static resource not available offline',
    image: 'Image not available offline',
    api: 'API not available offline'
  };
  
  return new Response(messages[type] || 'Resource not available offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 
      'Content-Type': 'text/plain',
      'x-offline': 'true'
    }
  });
}

function createOfflineAPIResponse(request) {
  const url = new URL(request.url);
  
  return new Response(
    JSON.stringify({ 
      error: 'Offline', 
      message: 'This data is not available offline',
      offline: true,
      url: url.pathname,
      timestamp: Date.now()
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

async function createOfflinePage(pathname) {
  const offlineHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DukaFiti - Offline</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container { 
            text-align: center; 
            max-width: 400px;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          .icon { 
            font-size: 4rem; 
            margin-bottom: 1rem;
            opacity: 0.8;
          }
          .retry-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            margin: 0.5rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
          }
          .retry-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }
          .path { 
            font-family: monospace; 
            opacity: 0.7; 
            margin-top: 1rem;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📱</div>
          <h2>You're Offline</h2>
          <p>DukaFiti is working in offline mode. Your data will sync when you're back online.</p>
          <div class="path">Requested: ${pathname}</div>
          <div style="margin-top: 2rem;">
            <a href="/" class="retry-btn">Go Home</a>
            <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
          </div>
        </div>
        <script>
          window.addEventListener('online', () => {
            setTimeout(() => window.location.reload(), 500);
          });
        </script>
      </body>
    </html>
  `;
  
  return new Response(offlineHtml, {
    status: 200,
    headers: { 
      'Content-Type': 'text/html',
      'x-offline': 'true'
    }
  });
}

// Enhanced IndexedDB operations
async function initializeOfflineStorage() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaFitiOfflineRequests', 2);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('requests')) {
        const store = db.createObjectStore('requests', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('retries', 'retries', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeOfflineRequest(requestData) {
  const db = await initializeOfflineStorage();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    
    store.add(requestData);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getStoredOfflineRequests() {
  const db = await initializeOfflineStorage();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['requests'], 'readonly');
    const store = transaction.objectStore('requests');
    const getAll = store.getAll();
    
    getAll.onsuccess = () => resolve(getAll.result || []);
    getAll.onerror = () => reject(getAll.error);
  });
}

async function updateStoredOfflineRequest(requestData) {
  const db = await initializeOfflineStorage();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    
    store.put(requestData);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function removeStoredOfflineRequest(id) {
  const db = await initializeOfflineStorage();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    
    store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Enhanced client communication
async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type, data });
  });
}

async function notifyClientsAboutActivation() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ 
      type: 'SW_ACTIVATED', 
      data: { 
        version: CACHE_VERSION,
        timestamp: Date.now()
      }
    });
  });
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(syncOfflineRequests());
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => {
      if (cacheName.startsWith('dukafiti')) {
        return caches.delete(cacheName);
      }
    })
  );
  notifyClients('CACHE_CLEARED', { timestamp: Date.now() });
}

console.log('[Enhanced SW] DukaFiti Enhanced Service Worker v5 loaded');
