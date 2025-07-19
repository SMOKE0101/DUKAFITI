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
    
    // CRITICAL FIX: Always try to serve the cached root page for SPA routes
    const cache = await caches.open(RUNTIME_CACHE);
    
    // For any app route, serve the cached root page (which contains the full React app)
    if (url.pathname.startsWith('/app/') || url.pathname === '/' || url.pathname === '/app') {
      const cachedRoot = await cache.match('/');
      if (cachedRoot) {
        console.log('[RobustSW] Serving cached root for SPA route:', url.pathname);
        return cachedRoot;
      }
    }
    
    // Try to serve cached version of the specific route
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cached content at all, return a minimal response that won't break the app
    return new Response('<!DOCTYPE html><html><head><title>Offline</title></head><body><script>window.location.href = "/";</script></body></html>', {
      headers: { 'Content-Type': 'text/html' }
    });
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