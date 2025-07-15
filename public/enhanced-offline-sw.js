// Enhanced Service Worker for True Offline-First PWA
const CACHE_VERSION = 'dukafiti-offline-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Core app shell resources - everything needed to run offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png',
  // Add more critical assets as needed
];

// API patterns to cache with different strategies
const API_PATTERNS = [
  { pattern: /supabase\.co/, strategy: 'networkFirst' },
  { pattern: /auth\//, strategy: 'networkFirst' },
  { pattern: /\/rest\/v1\//, strategy: 'networkFirst' }
];

// Install event - Pre-cache critical resources
self.addEventListener('install', (event) => {
  console.log('[Enhanced SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[Enhanced SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Initialize other caches
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
      // Initialize IndexedDB for offline queue
      initializeOfflineStorage()
    ])
  );
  
  // Force activation
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Enhanced SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.startsWith(CACHE_VERSION)) {
              console.log('[Enhanced SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim(),
      // Notify clients of activation
      notifyClients({ type: 'SW_ACTIVATED', version: CACHE_VERSION })
    ])
  );
});

// Fetch event - Intelligent routing and caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for special handling
  if (request.method !== 'GET') {
    event.respondWith(handleNonGetRequest(request));
    return;
  }

  // Route requests based on type
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request));
  } else {
    event.respondWith(fetch(request).catch(() => handleOfflineFallback(request)));
  }
});

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Enhanced SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'offline-sync':
      event.waitUntil(syncOfflineData());
      break;
    case 'priority-sync':
      event.waitUntil(syncPriorityData());
      break;
    case 'periodic-sync':
      event.waitUntil(performPeriodicSync());
      break;
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { data } = event;
  
  switch (data?.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'SYNC_NOW':
      event.waitUntil(syncOfflineData());
      break;
    case 'CACHE_STATS':
      event.waitUntil(getCacheStats().then(stats => {
        event.ports[0]?.postMessage({ type: 'CACHE_STATS', stats });
      }));
      break;
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;
  }
});

// Static assets - Cache first with stale-while-revalidate
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
    console.error('[Enhanced SW] Static asset fetch failed:', error);
    return createOfflineResponse('Asset not available offline');
  }
}

// API requests - Network first with cache fallback and offline queue
async function handleAPIRequest(request) {
  const strategy = getAPIStrategy(request);
  
  if (strategy === 'networkFirst') {
    return handleNetworkFirst(request);
  } else {
    return handleCacheFirst(request);
  }
}

// Network first strategy for API calls
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      
      // Add offline indicator removal header
      const response = networkResponse.clone();
      response.headers.set('x-served-by', 'network');
      response.headers.set('x-fresh-data', 'true');
      return response;
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[Enhanced SW] Network failed, trying cache:', request.url);
    
    // Try cache fallback
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const response = cachedResponse.clone();
      response.headers.set('x-served-by', 'cache');
      response.headers.set('x-offline', 'true');
      return response;
    }
    
    // No cache available, return structured offline response
    return createOfflineAPIResponse(request);
  }
}

// Page requests - App shell pattern for SPA
async function handlePageRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('[Enhanced SW] Serving app shell for navigation');
    
    // For app routes, serve the cached main app (SPA)
    if (isAppRoute(url.pathname)) {
      const staticCache = await caches.open(STATIC_CACHE);
      const appShell = await staticCache.match('/') || await staticCache.match('/index.html');
      
      if (appShell) {
        return appShell;
      }
    }
    
    // Try dynamic cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Generate offline page
    return createOfflinePageResponse();
  }
}

// Non-GET requests - Queue for sync when offline
async function handleNonGetRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[Enhanced SW] Queueing offline request:', request.method, request.url);
    
    // Extract request data
    const requestData = {
      id: generateRequestId(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.clone().text() : null,
      timestamp: Date.now(),
      priority: determineRequestPriority(request),
      attempts: 0,
      maxAttempts: 3
    };
    
    // Store in offline queue
    await storeOfflineRequest(requestData);
    
    // Schedule background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await self.registration.sync.register('offline-sync');
      } catch (syncError) {
        console.warn('[Enhanced SW] Background sync not available');
      }
    }
    
    // Return optimistic response
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

// Sync offline data when connection is restored
async function syncOfflineData() {
  console.log('[Enhanced SW] Starting offline data sync...');
  
  try {
    const offlineRequests = await getOfflineRequests();
    const priorityRequests = offlineRequests.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    console.log(`[Enhanced SW] Syncing ${priorityRequests.length} offline requests`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const requestData of priorityRequests) {
      try {
        // Reconstruct request
        const request = new Request(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        const response = await fetch(request);
        
        if (response.ok) {
          await removeOfflineRequest(requestData.id);
          successCount++;
          console.log('[Enhanced SW] Synced request:', requestData.url);
        } else {
          // Increment attempts
          requestData.attempts++;
          if (requestData.attempts >= requestData.maxAttempts) {
            await removeOfflineRequest(requestData.id);
            console.warn('[Enhanced SW] Request exceeded max attempts:', requestData.url);
          } else {
            await updateOfflineRequest(requestData);
            console.warn('[Enhanced SW] Request failed, will retry:', requestData.url);
          }
          failureCount++;
        }
      } catch (error) {
        console.error('[Enhanced SW] Failed to sync request:', requestData.url, error);
        requestData.attempts++;
        if (requestData.attempts >= requestData.maxAttempts) {
          await removeOfflineRequest(requestData.id);
        } else {
          await updateOfflineRequest(requestData);
        }
        failureCount++;
      }
    }
    
    // Notify clients of sync completion
    await notifyClients({
      type: 'SYNC_COMPLETED',
      stats: { success: successCount, failed: failureCount, total: priorityRequests.length }
    });
    
    console.log(`[Enhanced SW] Sync completed: ${successCount} success, ${failureCount} failed`);
    
  } catch (error) {
    console.error('[Enhanced SW] Sync process failed:', error);
    await notifyClients({ type: 'SYNC_FAILED', error: error.message });
  }
}

// Priority sync for high-priority operations
async function syncPriorityData() {
  const priorityRequests = await getOfflineRequestsByPriority('high');
  console.log(`[Enhanced SW] Syncing ${priorityRequests.length} priority requests`);
  
  for (const requestData of priorityRequests) {
    try {
      const request = new Request(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.body
      });
      
      const response = await fetch(request);
      
      if (response.ok) {
        await removeOfflineRequest(requestData.id);
        console.log('[Enhanced SW] Priority sync successful:', requestData.url);
      }
    } catch (error) {
      console.error('[Enhanced SW] Priority sync failed:', requestData.url, error);
    }
  }
}

// Periodic sync for data consistency
async function performPeriodicSync() {
  console.log('[Enhanced SW] Performing periodic sync...');
  
  // Sync any remaining offline requests
  await syncOfflineData();
  
  // Clean up old cache entries
  await cleanupOldCacheEntries();
  
  // Update critical data if online
  if (navigator.onLine) {
    await updateCriticalData();
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico|json)$/);
}

function isAPIRequest(request) {
  return API_PATTERNS.some(({ pattern }) => pattern.test(request.url));
}

function isPageRequest(request) {
  const url = new URL(request.url);
  return request.destination === 'document' || 
         url.pathname.endsWith('/') || 
         !url.pathname.includes('.');
}

function isAppRoute(pathname) {
  const appRoutes = ['/app', '/dashboard', '/inventory', '/customers', '/reports', '/settings'];
  return appRoutes.some(route => pathname.startsWith(route));
}

function getAPIStrategy(request) {
  const matchedPattern = API_PATTERNS.find(({ pattern }) => pattern.test(request.url));
  return matchedPattern?.strategy || 'networkFirst';
}

function determineRequestPriority(request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/sales')) return 'high';
  if (url.pathname.includes('/products')) return 'medium';
  if (url.pathname.includes('/customers')) return 'medium';
  return 'low';
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

// Response creators
function createOfflineResponse(message) {
  return new Response(message, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'x-offline': 'true' }
  });
}

function createOfflineAPIResponse(request) {
  const offlineData = {
    error: 'Offline',
    message: 'This data is not available offline',
    offline: true,
    cached: false,
    url: request.url
  };
  
  return new Response(JSON.stringify(offlineData), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'x-offline': 'true'
    }
  });
}

function createOfflinePageResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DukaFiti - Offline Mode</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
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
          }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          .btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            margin: 8px;
            transition: all 0.3s ease;
          }
          .btn:hover { background: rgba(255, 255, 255, 0.3); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📱</div>
          <h2>You're Offline</h2>
          <p>DukaFiti is working in offline mode. Your data will sync automatically when you're back online.</p>
          <button class="btn" onclick="window.location.href='/'">Go to App</button>
          <button class="btn" onclick="window.location.reload()">Retry</button>
        </div>
        <script>
          window.addEventListener('online', () => {
            setTimeout(() => window.location.reload(), 1000);
          });
        </script>
      </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// IndexedDB operations for offline queue
async function initializeOfflineStorage() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaFitiOfflineSW', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offlineRequests')) {
        const store = db.createObjectStore('offlineRequests', { keyPath: 'id' });
        store.createIndex('priority', 'priority', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeOfflineRequest(requestData) {
  const db = await initializeOfflineStorage();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineRequests'], 'readwrite');
    const store = transaction.objectStore('offlineRequests');
    
    store.add(requestData);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getOfflineRequests() {
  const db = await initializeOfflineStorage();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineRequests'], 'readonly');
    const store = transaction.objectStore('offlineRequests');
    
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function getOfflineRequestsByPriority(priority) {
  const db = await initializeOfflineStorage();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineRequests'], 'readonly');
    const store = transaction.objectStore('offlineRequests');
    const index = store.index('priority');
    
    const request = index.getAll(priority);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function removeOfflineRequest(id) {
  const db = await initializeOfflineStorage();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineRequests'], 'readwrite');
    const store = transaction.objectStore('offlineRequests');
    
    store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function updateOfflineRequest(requestData) {
  const db = await initializeOfflineStorage();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineRequests'], 'readwrite');
    const store = transaction.objectStore('offlineRequests');
    
    store.put(requestData);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Utility functions
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage(message));
}

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }
  
  return stats;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

async function cleanupOldCacheEntries() {
  // Implement cache cleanup logic here
  console.log('[Enhanced SW] Cleaning up old cache entries...');
}

async function updateCriticalData() {
  // Implement critical data update logic here
  console.log('[Enhanced SW] Updating critical data...');
}

console.log('[Enhanced SW] Service worker script loaded');