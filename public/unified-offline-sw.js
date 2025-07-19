
const CACHE_VERSION = 'dukafiti-unified-v1';
const STATIC_CACHE = 'dukafiti-static-v1';
const DYNAMIC_CACHE = 'dukafiti-dynamic-v1';
const API_CACHE = 'dukafiti-api-v1';

// Critical app shell files - these MUST be cached for offline operation
const STATIC_ASSETS = [
  '/',
  '/index.html',
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

// API patterns to cache
const API_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /auth\//,
  /rest\/v1\//
];

// Install - Aggressively cache app shell
self.addEventListener('install', (event) => {
  console.log('[UnifiedSW] Installing Unified Service Worker v1');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[UnifiedSW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => 
          new Request(url, { 
            credentials: 'same-origin',
            cache: 'no-cache'
          })
        )).catch(error => {
          console.warn('[UnifiedSW] Failed to cache some static assets:', error);
          // Continue installation even if some assets fail
        });
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
  console.log('[UnifiedSW] Activating Unified Service Worker v1');
  
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

// Fetch - Smart caching strategy
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
  } else if (isSPARoute(request)) {
    event.respondWith(handleSPARoute(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Handle static assets - Cache first with network fallback
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[UnifiedSW] Serving static asset from cache:', request.url);
      // Update cache in background
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('[UnifiedSW] Static asset fetch failed:', error);
    
    // Try to serve the main app shell as fallback
    const cache = await caches.open(STATIC_CACHE);
    const appShell = await cache.match('/') || await cache.match('/index.html');
    if (appShell) {
      console.log('[UnifiedSW] Serving app shell as fallback for static asset');
      return appShell;
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
    
    // No cache available
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

// Handle SPA routes - CRITICAL for offline navigation
async function handleSPARoute(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('[UnifiedSW] SPA route failed, serving app shell:', request.url);
    
    // CRITICAL: Always serve the main app shell for SPA navigation
    const staticCache = await caches.open(STATIC_CACHE);
    
    // Try multiple fallbacks for the app shell
    let appShell = await staticCache.match('/');
    if (!appShell) {
      appShell = await staticCache.match('/index.html');
    }
    if (!appShell) {
      appShell = await staticCache.match('/app');
    }
    
    if (appShell) {
      console.log('[UnifiedSW] Serving cached app shell for SPA route');
      return appShell;
    }
    
    // Final fallback - create a minimal working app shell
    return createMinimalAppShell();
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

// Create minimal app shell that preserves the React app structure
function createMinimalAppShell() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DukaFiti - Business Manager</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            background: #f8fafc;
            min-height: 100vh;
          }
          .offline-indicator {
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
            padding-top: 2rem;
            min-height: 100vh;
          }
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
            padding: 2rem;
          }
          .logo {
            width: 64px;
            height: 64px;
            background: linear-gradient(45deg, #8b5cf6, #3b82f6);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e5e7eb;
            border-top: 3px solid #8b5cf6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .retry-btn {
            background: linear-gradient(45deg, #8b5cf6, #3b82f6);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 1rem;
          }
          .retry-btn:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="offline-indicator">
          📵 Offline Mode - Your data will sync when you're back online
        </div>
        
        <div id="root">
          <div class="loading-container">
            <div class="logo">D</div>
            <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #1e293b;">DukaFiti</h1>
            <p style="color: #64748b; margin-bottom: 2rem;">Loading your business data...</p>
            <div class="spinner"></div>
            <p style="color: #64748b; text-align: center; max-width: 400px; line-height: 1.5;">
              Working offline with cached data. All changes will sync when you're back online.
            </p>
            <button onclick="window.location.reload()" class="retry-btn">
              Reload App
            </button>
          </div>
        </div>
        
        <script type="module" src="/src/main.tsx"></script>
        
        <script>
          // Try to load the main app after a short delay
          setTimeout(function() {
            console.log('[AppShell] Attempting to load main app...');
            
            // Check if the main app has loaded
            const checkAppLoaded = setInterval(function() {
              const app = document.querySelector('#root > div:not(.loading-container)');
              if (app) {
                console.log('[AppShell] Main app loaded successfully');
                clearInterval(checkAppLoaded);
              }
            }, 1000);
            
            // Stop checking after 10 seconds
            setTimeout(function() {
              clearInterval(checkAppLoaded);
            }, 10000);
          }, 1000);
          
          // Handle online/offline events
          window.addEventListener('online', function() {
            console.log('[AppShell] Network reconnected');
            const indicator = document.querySelector('.offline-indicator');
            if (indicator) {
              indicator.style.background = '#dcfce7';
              indicator.style.color = '#166534';
              indicator.textContent = '🟢 Back Online - Syncing data...';
              
              setTimeout(function() {
                window.location.reload();
              }, 2000);
            }
          });
          
          window.addEventListener('offline', function() {
            console.log('[AppShell] Network lost');
            const indicator = document.querySelector('.offline-indicator');
            if (indicator) {
              indicator.style.background = '#fee2e2';
              indicator.style.color = '#dc2626';
              indicator.textContent = '📵 Offline Mode - Your data will sync when you\'re back online';
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

// Create basic offline response
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
          <h1>🔌 Connection Lost</h1>
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

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|jsx|ts|tsx|css|png|jpg|jpeg|gif|svg|woff|woff2|ico|webp)$/) ||
         url.pathname === '/manifest.json' ||
         url.pathname === '/favicon.ico';
}

function isAPIRequest(request) {
  return API_PATTERNS.some(pattern => pattern.test(request.url));
}

function isSPARoute(request) {
  const url = new URL(request.url);
  // These are SPA routes that should serve the app shell
  return (url.pathname.startsWith('/app') || url.pathname === '/' || url.pathname === '/offline') && 
         request.headers.get('accept')?.includes('text/html') &&
         !isStaticAsset(request);
}

async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
      console.log('[UnifiedSW] Updated cache in background for:', request.url);
    }
  } catch (error) {
    console.log('[UnifiedSW] Background update failed:', error);
  }
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

console.log('[UnifiedSW] Unified Service Worker v1 loaded successfully');
