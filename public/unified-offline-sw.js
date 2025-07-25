// DukaFiti Unified Offline Service Worker - Production Ready
// Ensures full offline functionality with proper app shell caching

const CACHE_VERSION = 'dukafiti-unified-v1';
const APP_SHELL_CACHE = 'dukafiti-app-shell-v1';
const STATIC_CACHE = 'dukafiti-static-v1';
const DYNAMIC_CACHE = 'dukafiti-dynamic-v1';
const API_CACHE = 'dukafiti-api-v1';

// Essential files for offline operation
const APP_SHELL_FILES = [
  '/',
  '/manifest.json',
  '/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png'
];

// App routes that should always serve the app shell
const APP_ROUTES = [
  '/',
  '/app',
  '/app/dashboard',
  '/app/sales',
  '/app/inventory',
  '/app/customers',
  '/app/reports',
  '/app/settings',
  '/signin',
  '/signup'
];

// Install event - cache the app shell
self.addEventListener('install', (event) => {
  console.log('[Unified SW] Installing DukaFiti Unified Service Worker v1');
  
  event.waitUntil(
    Promise.all([
      caches.open(APP_SHELL_CACHE).then(async cache => {
        console.log('[Unified SW] Caching app shell');
        
        // Cache the main app shell
        try {
          for (const file of APP_SHELL_FILES) {
            await cache.add(new Request(file, { 
              credentials: 'same-origin',
              cache: 'reload'
            }));
          }
          console.log('[Unified SW] App shell cached successfully');
        } catch (error) {
          console.warn('[Unified SW] Failed to cache some app shell files:', error);
        }
      }),
      caches.open(STATIC_CACHE),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE)
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Unified SW] Activating DukaFiti Unified Service Worker v1');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![APP_SHELL_CACHE, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName)) {
              console.log('[Unified SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - unified caching strategy
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
  if (isAppRoute(request)) {
    event.respondWith(handleAppRoute(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Handle app routes - always serve the app shell for SPA navigation
async function handleAppRoute(request) {
  const url = new URL(request.url);
  console.log('[Unified SW] Handling app route:', url.pathname);
  
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[Unified SW] Network failed for app route, serving cached app shell');
    
    // Serve the cached app shell for offline navigation
    const appShellCache = await caches.open(APP_SHELL_CACHE);
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    
    // Try to get the main app shell
    let appShell = await appShellCache.match('/');
    
    // If not found in app shell cache, try dynamic cache
    if (!appShell) {
      appShell = await dynamicCache.match('/');
    }
    
    if (appShell) {
      console.log('[Unified SW] Serving cached app shell for offline navigation');
      return appShell;
    }
    
    // Fallback: create a minimal app shell that preserves layout
    return createOfflineApp();
  }
}

// Handle static assets
async function handleStaticAsset(request) {
  try {
    // Network first for better performance when online
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    // Try cache
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For critical assets, try to serve the app shell
    const url = new URL(request.url);
    if (url.pathname.includes('assets/') && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
      const appShellCache = await caches.open(APP_SHELL_CACHE);
      const appShell = await appShellCache.match('/');
      if (appShell) {
        return appShell;
      }
    }
    
    return new Response('', { status: 404 });
  }
}

// Handle API requests
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
    // Try to serve from cache
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Clone and add offline headers
      const response = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: {
          ...Object.fromEntries(cachedResponse.headers.entries()),
          'x-served-by': 'sw-cache',
          'x-offline': 'true'
        }
      });
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

// Handle other requests
async function handleOtherRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('', { status: 404 });
  }
}

// Handle write requests (POST, PUT, DELETE, PATCH)
async function handleWriteRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[Unified SW] Write request failed, queuing for sync');
    
    // Queue for background sync
    const requestData = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.clone().text(),
      timestamp: Date.now()
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

// Store offline request for later sync
async function storeOfflineRequest(requestData) {
  try {
    const requests = JSON.parse(localStorage.getItem('offline_requests') || '[]');
    requests.push(requestData);
    localStorage.setItem('offline_requests', JSON.stringify(requests));
  } catch (error) {
    console.error('[Unified SW] Failed to store offline request:', error);
  }
}

// Create minimal offline app
function createOfflineApp() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DukaFiti - Offline</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .container { 
            text-align: center; 
            padding: 2rem; 
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 400px;
            width: 90%;
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
            font-weight: bold;
            font-size: 24px;
            margin: 0 auto 1rem;
          }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          p { margin-bottom: 1.5rem; opacity: 0.9; }
          .retry-btn { 
            background: linear-gradient(45deg, #8b5cf6, #3b82f6); 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 12px; 
            cursor: pointer; 
            font-size: 16px;
            transition: transform 0.2s;
          }
          .retry-btn:hover { transform: scale(1.05); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">D</div>
          <h1>DukaFiti</h1>
          <p>Loading your business dashboard...</p>
          <button onclick="window.location.reload()" class="retry-btn">
            Try Again
          </button>
        </div>
        
        <script>
          // Auto-reload when online
          window.addEventListener('online', () => {
            setTimeout(() => window.location.reload(), 1000);
          });
          
          // Try to navigate to app after a delay
          setTimeout(() => {
            if (navigator.onLine) {
              window.location.href = '/app/dashboard';
            }
          }, 3000);
        </script>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Helper functions
function isAppRoute(request) {
  const url = new URL(request.url);
  return APP_ROUTES.some(route => 
    url.pathname === route || 
    (route !== '/' && url.pathname.startsWith(route))
  );
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/assets/') || 
         url.pathname.endsWith('.js') || 
         url.pathname.endsWith('.css') || 
         url.pathname.endsWith('.png') || 
         url.pathname.endsWith('.jpg') || 
         url.pathname.endsWith('.svg') || 
         url.pathname.endsWith('.ico') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.includes('lovable-uploads');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.hostname !== location.hostname || 
         url.pathname.includes('/api/') ||
         url.hostname.includes('supabase.co');
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});