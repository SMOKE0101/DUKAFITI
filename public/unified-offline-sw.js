// DukaFiti Unified Offline Service Worker - Production Ready
// Ensures full offline functionality with proper app shell caching

const CACHE_VERSION = 'dukafiti-unified-v2';
const APP_SHELL_CACHE = 'dukafiti-app-shell-v2';
const STATIC_CACHE = 'dukafiti-static-v2';
const DYNAMIC_CACHE = 'dukafiti-dynamic-v2';
const API_CACHE = 'dukafiti-api-v2';

// Essential files for offline operation
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png'
];

// Critical app files that must be cached for offline functionality
const CRITICAL_ASSETS = [
  '/',
  '/index.html'
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
  '/signup',
  '/landing',
  '/modern-landing'
];

// Install event - cache the app shell
self.addEventListener('install', (event) => {
  console.log('[Unified SW] Installing DukaFiti Unified Service Worker v1');
  
  event.waitUntil(
    Promise.all([
      caches.open(APP_SHELL_CACHE).then(async cache => {
        console.log('[Unified SW] Caching app shell');
        
        // Cache the main app shell files one by one with error handling
        const cachePromises = APP_SHELL_FILES.map(async (file) => {
          try {
            const request = new Request(file, { 
              credentials: 'same-origin',
              cache: 'reload'
            });
            await cache.add(request);
            console.log(`[Unified SW] Successfully cached: ${file}`);
          } catch (error) {
            console.warn(`[Unified SW] Failed to cache ${file}:`, error);
            // For critical files like index.html, try alternative approach
            if (CRITICAL_ASSETS.includes(file)) {
              try {
                const response = await fetch(file);
                if (response.ok) {
                  await cache.put(file, response);
                  console.log(`[Unified SW] Alternative cache successful for: ${file}`);
                }
              } catch (altError) {
                console.error(`[Unified SW] Alternative cache also failed for ${file}:`, altError);
              }
            }
          }
        });
        
        await Promise.all(cachePromises);
        console.log('[Unified SW] App shell caching completed');
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
    const networkResponse = await fetch(request, { 
      timeout: 3000 // 3 second timeout
    });
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[Unified SW] Network failed for app route, serving cached content');
    
    // Priority order for serving cached content:
    // 1. Try exact route match from dynamic cache
    // 2. Try app shell from app shell cache
    // 3. Try index.html from app shell cache
    // 4. Create minimal offline app
    
    const appShellCache = await caches.open(APP_SHELL_CACHE);
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    
    // Try exact route match first
    let response = await dynamicCache.match(request);
    if (response) {
      console.log('[Unified SW] Serving exact cached route');
      return response;
    }
    
    // Try main app shell
    response = await appShellCache.match('/');
    if (response) {
      console.log('[Unified SW] Serving main app shell from cache');
      return response;
    }
    
    // Try index.html
    response = await appShellCache.match('/index.html');
    if (response) {
      console.log('[Unified SW] Serving index.html from cache');
      return response;
    }
    
    // Try from dynamic cache
    response = await dynamicCache.match('/');
    if (response) {
      console.log('[Unified SW] Serving app shell from dynamic cache');
      return response;
    }
    
    console.log('[Unified SW] No cached content found, creating minimal offline app');
    return createOfflineApp();
  }
}

// Handle static assets
async function handleStaticAsset(request) {
  const url = new URL(request.url);
  console.log('[Unified SW] Handling static asset:', url.pathname);
  
  try {
    // For critical assets, try cache first to avoid network delays
    const isCriticalAsset = url.pathname.includes('assets/') && 
      (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'));
    
    if (isCriticalAsset) {
      const staticCache = await caches.open(STATIC_CACHE);
      const cachedResponse = await staticCache.match(request);
      
      if (cachedResponse) {
        console.log('[Unified SW] Serving critical asset from cache:', url.pathname);
        // Update cache in background
        fetch(request).then(response => {
          if (response.ok) {
            staticCache.put(request, response);
          }
        }).catch(() => {}); // Silent fail for background update
        return cachedResponse;
      }
    }
    
    // Try network first for fresh content
    const networkResponse = await fetch(request, { timeout: 5000 });
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[Unified SW] Static asset cached from network:', url.pathname);
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[Unified SW] Network failed for static asset, trying cache:', url.pathname);
    
    // Try cache
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[Unified SW] Serving static asset from cache:', url.pathname);
      return cachedResponse;
    }
    
    // For critical JavaScript/CSS files that are needed for the app to function,
    // redirect to the app shell which should load the bundled app
    if (url.pathname.includes('assets/') && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
      console.log('[Unified SW] Critical asset not found, serving app shell');
      const appShellCache = await caches.open(APP_SHELL_CACHE);
      let appShell = await appShellCache.match('/');
      
      if (!appShell) {
        appShell = await appShellCache.match('/index.html');
      }
      
      if (appShell) {
        return appShell;
      }
    }
    
    console.log('[Unified SW] Static asset not found in cache:', url.pathname);
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

// Create minimal offline app that includes the full React app structure
function createOfflineApp() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DukaFiti - Smart Business Management</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta name="description" content="Smart Business Management for Kenyan Shop Owners" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            background: #ffffff;
            min-height: 100vh;
            color: #000000;
          }
          .loading-container { 
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, rgb(147, 51, 234) 0%, rgb(79, 70, 229) 100%);
          }
          .loading-content { 
            text-align: center; 
            padding: 2rem; 
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 400px;
            width: 90%;
            color: white;
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
          .spinner {
            animation: spin 1s linear infinite;
            width: 32px;
            height: 32px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            margin: 0 auto 1rem;
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
            border-radius: 12px; 
            cursor: pointer; 
            font-size: 16px;
            transition: transform 0.2s;
          }
          .retry-btn:hover { transform: scale(1.05); }
          #root { width: 100%; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="root">
          <div class="loading-container">
            <div class="loading-content">
              <div class="logo">D</div>
              <h1>DukaFiti</h1>
              <div class="spinner"></div>
              <p>Starting your business dashboard...</p>
              <button onclick="handleRetry()" class="retry-btn">
                Retry
              </button>
            </div>
          </div>
        </div>
        
        <script>
          console.log('[Offline App] Initializing offline fallback');
          
          function handleRetry() {
            if (navigator.onLine) {
              window.location.reload();
            } else {
              // Try to initialize app with cached data
              initializeOfflineApp();
            }
          }
          
          function initializeOfflineApp() {
            console.log('[Offline App] Attempting to initialize with cached data');
            
            // Check for cached user data
            const cachedUser = localStorage.getItem('lastKnownUser');
            const isAuthenticated = cachedUser && 
              JSON.parse(cachedUser).timestamp > (Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            // Redirect based on authentication status
            if (isAuthenticated) {
              console.log('[Offline App] Cached user found, navigating to dashboard');
              window.location.href = '/app/dashboard';
            } else {
              console.log('[Offline App] No cached user, navigating to landing');
              window.location.href = '/landing';
            }
          }
          
          // Auto-retry when online
          window.addEventListener('online', () => {
            console.log('[Offline App] Network restored, reloading');
            setTimeout(() => window.location.reload(), 1000);
          });
          
          // Try to initialize after a short delay
          setTimeout(() => {
            if (!navigator.onLine) {
              initializeOfflineApp();
            }
          }, 2000);
        </script>
      </body>
    </html>
  `, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
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