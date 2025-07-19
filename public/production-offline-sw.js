// Production-Ready Offline Service Worker for DukaFiti
// Ensures seamless offline experience with aggressive caching

const CACHE_NAME = 'dukafiti-app-v2';
const ASSETS_CACHE = 'dukafiti-assets-v2';
const API_CACHE = 'dukafiti-api-v2';

// Install event - minimal setup
self.addEventListener('install', (event) => {
  console.log('[OfflineSW] Installing Production Service Worker v2');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME),
      caches.open(ASSETS_CACHE), 
      caches.open(API_CACHE)
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up and claim
self.addEventListener('activate', (event) => {
  console.log('[OfflineSW] Activating Production Service Worker v2');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![CACHE_NAME, ASSETS_CACHE, API_CACHE].includes(cacheName)) {
              console.log('[OfflineSW] Deleting old cache:', cacheName);
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

// Fetch event - the main logic
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request));
  } else if (isAssetRequest(request)) {
    event.respondWith(handleAssetRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  }
});

// Page request handler - for HTML pages and navigation
async function handlePageRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Always try network first for pages
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the page
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network failed');
    
  } catch (error) {
    console.log('[OfflineSW] Page request failed, checking cache for:', url.pathname);
    
    // Try to serve from cache
    const cache = await caches.open(CACHE_NAME);
    
    // For any route that starts with /app, serve the cached root
    if (url.pathname.startsWith('/app') || url.pathname === '/') {
      const cachedResponse = await cache.match('/');
      if (cachedResponse) {
        console.log('[OfflineSW] Serving cached app for:', url.pathname);
        return cachedResponse;
      }
    }
    
    // Try exact match
    const exactMatch = await cache.match(request);
    if (exactMatch) {
      return exactMatch;
    }
    
    // No cached content - return a simple redirect to root
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/' }
    });
  }
}

// Asset request handler - for JS, CSS, images, etc.
async function handleAssetRequest(request) {
  try {
    // Try network first for assets
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache it
      const cache = await caches.open(ASSETS_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network failed');
    
  } catch (error) {
    // Try cache for assets
    const cache = await caches.open(ASSETS_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For critical assets, return appropriate empty responses
    const url = new URL(request.url);
    
    if (url.pathname.endsWith('.js')) {
      return new Response('// Asset not available offline', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    } else if (url.pathname.endsWith('.css')) {
      return new Response('/* Asset not available offline */', {
        headers: { 'Content-Type': 'text/css' }
      });
    } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
      // Return a 1x1 transparent pixel for images
      const transparentPixel = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      return new Response(transparentPixel, {
        headers: { 'Content-Type': 'image/png' }
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
    // Try cache
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add offline header
      const response = cachedResponse.clone();
      response.headers.set('x-offline', 'true');
      return response;
    }
    
    // Return offline error
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Data not available offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'x-offline': 'true' }
    });
  }
}

// Helper functions
function isPageRequest(request) {
  return request.mode === 'navigate' || 
         request.headers.get('accept')?.includes('text/html');
}

function isAssetRequest(request) {
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

console.log('[OfflineSW] Production Service Worker v2 loaded');