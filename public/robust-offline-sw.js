// Robust Offline Service Worker for DukaFiti
// Designed to handle Vite's build output and provide seamless offline experience

const CACHE_NAME = 'dukafiti-robust-v1';
const RUNTIME_CACHE = 'dukafiti-runtime-v1';
const API_CACHE = 'dukafiti-api-v1';

// Cache versioning for updates
const CACHE_VERSION = 1;

// Install event - minimal initial caching
self.addEventListener('install', (event) => {
  console.log('[RobustSW] Installing Robust Service Worker v1');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[RobustSW] Cache opened');
      // Only cache the manifest and root initially
      return cache.addAll([
        '/manifest.json'
      ]).catch(error => {
        console.warn('[RobustSW] Failed to cache initial assets:', error);
      });
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[RobustSW] Activating Robust Service Worker v1');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![CACHE_NAME, RUNTIME_CACHE, API_CACHE].includes(cacheName)) {
              console.log('[RobustSW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - comprehensive handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Navigation request handler - serves app shell for all SPA routes
async function handleNavigation(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the successful response
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('[RobustSW] Navigation failed, serving cached version for:', url.pathname);
    
    // Try to serve cached version of the specific route
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cached version of this route, serve cached root as app shell
    const appShell = await cache.match('/');
    if (appShell) {
      console.log('[RobustSW] Serving cached app shell');
      return appShell;
    }
    
    // Last resort - create a basic offline page that will try to load the app
    return createOfflineAppShell();
  }
}

// Static asset handler - aggressive caching with fallbacks
async function handleStaticAsset(request) {
  try {
    // For assets, try network first to get the latest
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache it for offline use
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    // Serve from cache if available
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For critical JS/CSS assets, return a minimal response that won't break the app
    const url = new URL(request.url);
    if (url.pathname.endsWith('.js')) {
      return new Response('console.log("Offline mode - script not available");', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    } else if (url.pathname.endsWith('.css')) {
      return new Response('/* Offline mode - styles not available */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    return new Response('', { status: 404 });
  }
}

// API request handler
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
      // Add offline headers
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
    
    // Return offline error response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Data not available offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Create offline app shell that loads the cached app
function createOfflineAppShell() {
  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DukaFiti - Loading...</title>
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
      .loading-container {
        text-align: center;
        max-width: 400px;
        padding: 2rem;
      }
      .logo {
        width: 64px;
        height: 64px;
        background: white;
        border-radius: 16px;
        margin: 0 auto 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: #667eea;
        font-weight: bold;
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255,255,255,0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 1rem auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .status {
        margin-top: 1rem;
        opacity: 0.9;
        font-size: 0.9rem;
      }
      .retry-btn {
        background: white;
        color: #667eea;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        margin-top: 1rem;
      }
    </style>
  </head>
  <body>
    <div class="loading-container">
      <div class="logo">D</div>
      <h1>DukaFiti</h1>
      <div class="spinner"></div>
      <div class="status">Loading your business data...</div>
      <p style="font-size: 0.8rem; margin-top: 1rem; opacity: 0.8;">
        Working offline. Your data is safe and will sync when you're back online.
      </p>
      <button class="retry-btn" onclick="window.location.reload()">
        Reload App
      </button>
    </div>
    
    <script>
      // Try to navigate to the main app
      setTimeout(() => {
        if (navigator.onLine) {
          window.location.href = '/app/dashboard';
        } else {
          // Check if we have cached app data
          if ('caches' in window) {
            caches.open('${RUNTIME_CACHE}').then(cache => {
              cache.match('/').then(response => {
                if (response) {
                  window.location.href = '/app/dashboard';
                }
              });
            });
          }
        }
      }, 2000);
      
      // Listen for network reconnection
      window.addEventListener('online', () => {
        window.location.reload();
      });
    </script>
  </body>
</html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Helper functions
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico|webp|json)$/);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.hostname.includes('supabase') || 
         url.pathname.startsWith('/api/') ||
         url.pathname.includes('rest/v1/');
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[RobustSW] Robust Service Worker v1 loaded successfully');