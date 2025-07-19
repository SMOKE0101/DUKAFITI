
const CACHE_VERSION = 'dukafiti-v7-enhanced';
const STATIC_CACHE = 'dukafiti-static-v7';
const DYNAMIC_CACHE = 'dukafiti-dynamic-v7';
const API_CACHE = 'dukafiti-api-v7';

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
  console.log('[Enhanced SW] Installing DukaFiti Enhanced Service Worker v7');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(async cache => {
        console.log('[Enhanced SW] Caching static assets');
        
        // Cache the main app shell first
        try {
          await cache.add('/');
          console.log('[Enhanced SW] Main app shell cached successfully');
        } catch (error) {
          console.warn('[Enhanced SW] Failed to cache main app shell:', error);
        }
        
        // Cache other routes
        for (const url of STATIC_ASSETS.slice(1)) {
          try {
            await cache.add(new Request(url, { 
              credentials: 'same-origin',
              cache: 'no-cache'
            }));
          } catch (error) {
            console.warn(`[Enhanced SW] Failed to cache ${url}:`, error);
          }
        }
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE)
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Enhanced SW] Activating DukaFiti Enhanced Service Worker v7');
  
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
    
    // For critical app files, try to serve the main app shell
    const cache = await caches.open(STATIC_CACHE);
    const appShell = await cache.match('/');
    if (appShell) {
      return appShell;
    }
    
    return createOfflineResponse();
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

// Enhanced app navigation handling - CRITICAL FIX
async function handleAppNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[Enhanced SW] App navigation failed, serving cached app shell:', request.url);
    
    // CRITICAL: Always serve the main app shell for SPA navigation
    // This ensures sidebar and topbar are always present
    const staticCache = await caches.open(STATIC_CACHE);
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    
    // Try to get the main app shell first
    let appShell = await staticCache.match('/');
    
    // If not found in static cache, try dynamic cache
    if (!appShell) {
      appShell = await dynamicCache.match('/');
    }
    
    // If still not found, try to get any cached app route
    if (!appShell) {
      appShell = await staticCache.match('/app');
    }
    
    if (appShell) {
      console.log('[Enhanced SW] Serving cached app shell for offline navigation');
      return appShell;
    }
    
    // Fallback: create a minimal app shell that preserves layout
    return createMinimalAppShell();
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
    // For the root route or app routes, always serve the app shell
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname.startsWith('/app')) {
      return handleAppNavigation(request);
    }
    
    // Try cache first for other pages
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
    
    return createOfflineResponse();
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

// Create minimal app shell that preserves layout structure
function createMinimalAppShell() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DukaFiti - Business Manager</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            background: #f8fafc;
            min-height: 100vh;
          }
          .app-container { 
            min-height: 100vh; 
            display: flex; 
            width: 100%;
          }
          .sidebar { 
            width: 256px; 
            background: rgba(255, 255, 255, 0.5); 
            border-right: 1px solid #e2e8f0;
            backdrop-filter: blur(4px);
            padding: 1rem;
          }
          .main-content { 
            flex: 1; 
            display: flex; 
            flex-direction: column;
            min-width: 0;
          }
          .topbar { 
            height: 64px; 
            background: rgba(255, 255, 255, 0.8);
            border-bottom: 1px solid rgba(226, 232, 240, 0.5);
            backdrop-filter: blur(12px);
            display: flex; 
            align-items: center; 
            padding: 0 1.5rem;
            position: sticky;
            top: 0;
            z-index: 50;
          }
          .content { 
            flex: 1; 
            overflow: auto; 
            padding: 2rem;
          }
          .brand { 
            display: flex; 
            align-items: center; 
            gap: 0.75rem; 
            margin-bottom: 2rem;
          }
          .brand-logo { 
            width: 32px; 
            height: 32px; 
            background: linear-gradient(45deg, #8b5cf6, #3b82f6); 
            border-radius: 8px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold;
          }
          .nav-item { 
            display: flex; 
            align-items: center; 
            gap: 0.75rem; 
            padding: 0.75rem; 
            border-radius: 12px; 
            margin-bottom: 0.5rem; 
            color: #64748b; 
            text-decoration: none;
            transition: all 0.2s;
          }
          .nav-item:hover { 
            background: rgba(139, 92, 246, 0.1); 
            color: #8b5cf6;
          }
          .offline-indicator { 
            background: #fee2e2; 
            color: #dc2626; 
            padding: 1rem; 
            border-radius: 8px; 
            margin-bottom: 1rem;
            text-align: center;
          }
          .loading { 
            text-align: center; 
            padding: 2rem; 
            color: #64748b;
          }
          .retry-btn { 
            background: linear-gradient(45deg, #8b5cf6, #3b82f6); 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px; 
            margin-top: 20px;
          }
          .network-status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #dc2626;
            font-size: 0.875rem;
          }
          .status-dot {
            width: 8px;
            height: 8px;
            background: #dc2626;
            border-radius: 50%;
          }
        </style>
      </head>
      <body>
        <div class="app-container">
          <div class="sidebar">
            <div class="brand">
              <div class="brand-logo">D</div>
              <div>
                <h1 style="font-size: 1.125rem; font-weight: bold; color: #1e293b;">DukaFiti</h1>
                <p style="font-size: 0.75rem; color: #64748b;">Business Manager</p>
              </div>
            </div>
            
            <div class="network-status">
              <div class="status-dot"></div>
              <span>Offline Mode</span>
            </div>
            
            <nav style="margin-top: 1.5rem;">
              <a href="/app/dashboard" class="nav-item">📊 Dashboard</a>
              <a href="/app/sales" class="nav-item">🛒 Sales</a>
              <a href="/app/inventory" class="nav-item">📦 Inventory</a>
              <a href="/app/customers" class="nav-item">👥 Customers</a>
              <a href="/app/reports" class="nav-item">📈 Reports</a>
              <a href="/app/settings" class="nav-item">⚙️ Settings</a>
            </nav>
          </div>
          
          <div class="main-content">
            <div class="topbar">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <button onclick="toggleSidebar()" style="background: none; border: none; padding: 0.5rem; cursor: pointer;">☰</button>
                <div class="network-status">
                  <div class="status-dot"></div>
                  <span>Offline</span>
                </div>
              </div>
              
              <div style="margin-left: auto; display: flex; align-items: center; gap: 0.75rem;">
                <button onclick="window.location.reload()" class="retry-btn" style="padding: 8px 16px; font-size: 14px;">
                  Try Again
                </button>
              </div>
            </div>
            
            <div class="content">
              <div class="offline-indicator">
                <h2 style="margin-bottom: 0.5rem;">You're Offline</h2>
                <p>DukaFiti is working offline. Your data is safe and will sync when you're back online.</p>
              </div>
              
              <div class="loading">
                <div id="app">Loading DukaFiti...</div>
                <button onclick="window.location.reload()" class="retry-btn">
                  Reload App
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Try to load the main app
          setTimeout(() => {
            if (navigator.onLine) {
              window.location.reload();
            }
          }, 2000);
          
          // Handle online/offline events
          window.addEventListener('online', () => {
            window.location.reload();
          });
          
          function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const isVisible = sidebar.style.display !== 'none';
            sidebar.style.display = isVisible ? 'none' : 'block';
          }
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
          }
          .offline-container { 
            max-width: 400px; 
            margin: 0 auto; 
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
  // Check if it's a navigation request (page reload or direct navigation)
  return request.mode === 'navigate' || 
         (url.pathname.startsWith('/app/') || url.pathname === '/') && 
         request.headers.get('accept')?.includes('text/html');
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
    console.log('[Enhanced SW] Manual sync triggered');
  }
});

console.log('[Enhanced SW] Enhanced Service Worker v7 loaded successfully');
