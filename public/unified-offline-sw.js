
const CACHE_VERSION = 'dukafiti-unified-v2';
const STATIC_CACHE = 'dukafiti-static-v2';
const DYNAMIC_CACHE = 'dukafiti-dynamic-v2';
const API_CACHE = 'dukafiti-api-v2';

// Critical app shell files - these MUST be cached for offline operation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/manifest.json'
];

// SPA routes that should serve the main index.html
const SPA_ROUTES = [
  '/',
  '/app',
  '/app/dashboard',
  '/app/sales', 
  '/app/inventory',
  '/app/customers',
  '/app/reports',
  '/app/settings'
];

// API patterns to cache
const API_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /auth\//,
  /rest\/v1\//
];

// Install - Cache essential files
self.addEventListener('install', (event) => {
  console.log('[UnifiedSW] Installing Unified Service Worker v2');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets with more permissive error handling
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[UnifiedSW] Caching static assets');
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(new Request(url, { 
              credentials: 'same-origin',
              cache: 'reload' // Force fresh cache
            })).catch(error => {
              console.warn(`[UnifiedSW] Failed to cache ${url}:`, error);
              return null;
            })
          )
        );
      }),
      // Initialize other caches
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE)
    ])
  );
  
  // Force activation immediately
  self.skipWaiting();
});

// Activate - Clean up and claim clients
self.addEventListener('activate', (event) => {
  console.log('[UnifiedSW] Activating Unified Service Worker v2');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName)) {
              console.log('[UnifiedSW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch - Improved routing logic
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (except handle write operations)
  if (request.method !== 'GET') {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      event.respondWith(handleWriteRequest(request));
    }
    return;
  }

  // Handle different request types with improved logic
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isSPARoute(request)) {
    event.respondWith(handleSPARoute(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Handle static assets - Network first, then cache
async function handleStaticAsset(request) {
  try {
    // Try network first for better performance when online
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[UnifiedSW] Updated cache for static asset:', request.url);
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[UnifiedSW] Network failed for static asset, trying cache:', request.url);
    
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[UnifiedSW] Serving static asset from cache');
      return cachedResponse;
    }
    
    // Final fallback for critical files
    if (request.url.includes('main.tsx') || request.url.includes('index.html')) {
      return createOfflineAppShell();
    }
    
    return createOfflineResponse();
  }
}

// Handle API requests - Network first with cache fallback
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[UnifiedSW] Cached API response:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[UnifiedSW] API request failed, trying cache:', request.url);
    
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[UnifiedSW] Serving API response from cache');
      const response = cachedResponse.clone();
      response.headers.set('x-served-by', 'sw-cache');
      response.headers.set('x-offline', 'true');
      return response;
    }
    
    // Return offline API response
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

// Handle SPA routes - CRITICAL: Always serve cached index.html
async function handleSPARoute(request) {
  const url = new URL(request.url);
  console.log('[UnifiedSW] Handling SPA route:', url.pathname);
  
  try {
    // For SPA routes, always try to serve the cached index.html first when offline
    if (!navigator.onLine) {
      throw new Error('Offline - serve from cache');
    }
    
    // Try network first when online
    const networkResponse = await fetch(request, { 
      credentials: 'same-origin',
      cache: 'no-cache'
    });
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('[UnifiedSW] SPA route network failed, serving from cache:', url.pathname);
    
    // CRITICAL: For SPA routes, always serve the main index.html
    const staticCache = await caches.open(STATIC_CACHE);
    
    // Try to get the main index.html
    let appShell = await staticCache.match('/index.html');
    if (!appShell) {
      appShell = await staticCache.match('/');
    }
    
    if (appShell) {
      console.log('[UnifiedSW] Serving cached index.html for SPA route');
      return appShell;
    }
    
    // If no cached index.html, create a basic one that will load the React app
    return createOfflineAppShell();
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return createOfflineResponse();
  }
}

// Handle write requests - Queue for sync
async function handleWriteRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[UnifiedSW] Write request failed, queuing for sync:', request.url);
    
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

// Create a proper offline app shell that loads the React app
function createOfflineAppShell() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DukaFiti - Business Manager</title>
        <meta name="theme-color" content="#3b82f6">
        <link rel="manifest" href="/manifest.json">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            background: #f8fafc;
            min-height: 100vh;
          }
          .offline-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #fee2e2;
            color: #dc2626;
            padding: 0.5rem;
            text-align: center;
            font-size: 0.875rem;
            z-index: 1000;
          }
          #root {
            padding-top: 2.5rem;
            min-height: 100vh;
          }
        </style>
      </head>
      <body>
        <div class="offline-banner">
          📵 Offline Mode - Your data will sync when you're back online
        </div>
        
        <div id="root"></div>
        
        <script type="module" src="/src/main.tsx"></script>
        
        <script>
          console.log('[OfflineAppShell] Loading React app in offline mode...');
          
          // Handle online/offline events
          window.addEventListener('online', function() {
            console.log('[OfflineAppShell] Network reconnected');
            const banner = document.querySelector('.offline-banner');
            if (banner) {
              banner.style.background = '#dcfce7';
              banner.style.color = '#166534';
              banner.textContent = '🟢 Back Online - Syncing data...';
              
              setTimeout(function() {
                window.location.reload();
              }, 1500);
            }
          });
          
          window.addEventListener('offline', function() {
            console.log('[OfflineAppShell] Network lost');
            const banner = document.querySelector('.offline-banner');
            if (banner) {
              banner.style.background = '#fee2e2';
              banner.style.color = '#dc2626';
              banner.textContent = '📵 Offline Mode - Your data will sync when you\'re back online';
            }
          });
        </script>
      </body>
    </html>
  `, {
    status: 200,
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  });
}

// Create basic offline response for non-critical resources
function createOfflineResponse() {
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>DukaFiti - Offline</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .offline-container { 
            max-width: 400px; 
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .retry-btn { 
            background: #8b5cf6; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            cursor: pointer; 
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <h1>🔌 Resource Unavailable</h1>
          <p>This resource is not available offline. Please check your connection and try again.</p>
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
    </html>
  `, { 
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|jsx|ts|tsx|css|png|jpg|jpeg|gif|svg|woff|woff2|ico|webp)$/) ||
         url.pathname === '/manifest.json' ||
         url.pathname === '/favicon.ico' ||
         url.pathname.includes('/src/') ||
         url.pathname === '/index.html';
}

function isAPIRequest(request) {
  return API_PATTERNS.some(pattern => pattern.test(request.url));
}

function isSPARoute(request) {
  const url = new URL(request.url);
  // Check if it's a SPA route that should serve the app shell
  return SPA_ROUTES.some(route => {
    if (route === '/' && url.pathname === '/') return true;
    if (route !== '/' && url.pathname.startsWith(route)) return true;
    return false;
  }) && request.headers.get('accept')?.includes('text/html') && !isStaticAsset(request);
}

// IndexedDB operations for offline requests
async function storeOfflineRequest(requestData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaFitiUnified', 1);
    
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
    console.log('[UnifiedSW] Manual sync triggered');
    // Trigger sync logic here
  }
});

console.log('[UnifiedSW] Unified Service Worker v2 loaded successfully');
