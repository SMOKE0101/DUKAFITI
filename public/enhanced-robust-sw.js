
const CACHE_VERSION = 'dukafiti-v5-enhanced';
const STATIC_CACHE = 'dukafiti-static-v5';
const DYNAMIC_CACHE = 'dukafiti-dynamic-v5';
const API_CACHE = 'dukafiti-api-v5';

// Critical app resources for offline functionality
const STATIC_ASSETS = [
  '/',
  '/app',
  '/app/dashboard',
  '/app/sales',
  '/app/inventory',
  '/app/customers',
  '/app/reports',
  '/app/settings',
  '/offline',
  '/manifest.json'
];

// API endpoints to cache
const API_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /auth\//,
  /rest\/v1\//
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[Enhanced SW] Installing DukaFiti Enhanced Service Worker v5');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[Enhanced SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => 
          new Request(url, { 
            credentials: 'same-origin',
            cache: 'no-cache'
          })
        ));
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE)
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Enhanced SW] Activating DukaFiti Enhanced Service Worker v5');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName)) {
              console.log('[Enhanced SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - enhanced caching strategy
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

  // Handle different request types
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isAppNavigation(request)) {
    event.respondWith(handleAppNavigation(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Enhanced static asset handling
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
    
    // Try to serve a basic offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DukaFiti - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; }
            .offline-container { max-width: 400px; margin: 0 auto; }
            .retry-btn { 
              background: #8b5cf6; color: white; border: none; 
              padding: 12px 24px; border-radius: 8px; cursor: pointer; 
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <h1>You're Offline</h1>
            <p>DukaFiti is working offline. Your data is safe and will sync when you're back online.</p>
            <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, { 
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Enhanced API request handling
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
    console.log('[Enhanced SW] API request failed, trying cache:', request.url);
    
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add offline indicator headers
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
        offline: true,
        cached: false
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

// Enhanced app navigation handling
async function handleAppNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[Enhanced SW] App navigation failed, serving offline app:', request.url);
    
    // Always serve the main app shell for SPA navigation
    const cache = await caches.open(STATIC_CACHE);
    const appShell = await cache.match('/app') || await cache.match('/');
    
    if (appShell) {
      return appShell;
    }
    
    // Fallback offline app
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DukaFiti - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0; padding: 0; min-height: 100vh;
              display: flex; align-items: center; justify-content: center;
            }
            .container { 
              background: white; border-radius: 16px; padding: 40px; 
              text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 400px; margin: 20px;
            }
            .logo { 
              width: 64px; height: 64px; background: linear-gradient(45deg, #8b5cf6, #3b82f6);
              border-radius: 12px; margin: 0 auto 20px; display: flex;
              align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;
            }
            .retry-btn { 
              background: linear-gradient(45deg, #8b5cf6, #3b82f6); color: white; 
              border: none; padding: 12px 24px; border-radius: 8px; 
              cursor: pointer; font-size: 16px; margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">D</div>
            <h1>DukaFiti</h1>
            <p>You're offline, but your data is safe. The app will sync when you're back online.</p>
            <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Regular page request handling
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Try cache first
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return main app for SPA routes
    const appShell = await cache.match('/') || await cache.match('/app');
    if (appShell) {
      return appShell;
    }
    
    return new Response('Page not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Enhanced write request handling
async function handleWriteRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[Enhanced SW] Write request failed, queuing for sync:', request.url);
    
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

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico|webp)$/);
}

function isAPIRequest(request) {
  return API_PATTERNS.some(pattern => pattern.test(request.url));
}

function isAppNavigation(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/app/') && request.headers.get('accept')?.includes('text/html');
}

async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    console.log('[Enhanced SW] Background update failed:', error);
  }
}

// IndexedDB operations for offline requests
async function storeOfflineRequest(requestData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaFitiEnhanced', 1);
    
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

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SYNC_NOW') {
    // Trigger sync process
    console.log('[Enhanced SW] Manual sync triggered');
  }
});

console.log('[Enhanced SW] Enhanced Service Worker v5 loaded successfully');
