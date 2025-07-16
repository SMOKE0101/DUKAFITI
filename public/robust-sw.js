
const CACHE_NAME = 'dukafiti-v1';
const STATIC_CACHE = 'dukafiti-static-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/lovable-uploads/bce2a988-3cd7-48e7-9d0d-e1cfc119a5c4.png',
  // Add other critical assets
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing robust service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating robust service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all requests with robust offline strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle navigation requests (page loads, refreshes, deep links)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle API requests to Supabase
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(handleSupabaseRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleAssetRequest(request));
});

// Handle navigation requests with SPA fallback
async function handleNavigationRequest(request) {
  try {
    console.log('[SW] Handling navigation request:', request.url);
    
    // Try network first with timeout
    const networkPromise = fetch(request).then(response => {
      if (response.ok) {
        // Cache successful responses
        caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        return response;
      }
      throw new Error(`Network response not ok: ${response.status}`);
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), 3000);
    });

    try {
      // Race between network and timeout
      return await Promise.race([networkPromise, timeoutPromise]);
    } catch (networkError) {
      console.log('[SW] Network failed for navigation, serving SPA shell:', networkError.message);
      
      // Serve cached index.html for SPA routing
      const cache = await caches.open(CACHE_NAME);
      let response = await cache.match('/');
      
      if (!response) {
        // If no cached index, try to serve from static cache
        const staticCache = await caches.open(STATIC_CACHE);
        response = await staticCache.match('/');
      }
      
      if (response) {
        console.log('[SW] Serving cached SPA shell');
        return response;
      }
      
      // Last resort: return a basic HTML shell
      console.log('[SW] No cached shell available, serving fallback');
      return new Response(
        createFallbackHTML(),
        { 
          headers: { 'Content-Type': 'text/html' },
          status: 200
        }
      );
    }
  } catch (error) {
    console.error('[SW] Critical error in navigation handler:', error);
    return new Response(
      createErrorHTML(error.message),
      { 
        headers: { 'Content-Type': 'text/html' },
        status: 500
      }
    );
  }
}

// Handle Supabase API requests with offline queue
async function handleSupabaseRequest(request) {
  try {
    console.log('[SW] Handling Supabase request:', request.url);
    
    // For GET requests, try cache first, then network
    if (request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log('[SW] Serving cached Supabase data');
        // Try to update cache in background
        fetch(request).then(response => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        }).catch(err => console.log('[SW] Background update failed:', err.message));
        
        return cachedResponse;
      }
    }

    // Try network for all requests
    const networkPromise = fetch(request).then(response => {
      // Cache successful GET responses
      if (response.ok && request.method === 'GET') {
        caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      }
      return response;
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Supabase request timeout')), 5000);
    });

    try {
      return await Promise.race([networkPromise, timeoutPromise]);
    } catch (error) {
      console.log('[SW] Supabase request failed:', error.message);
      
      // For write operations when offline, queue them
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        await queueFailedRequest(request);
        return new Response(
          JSON.stringify({ 
            success: true, 
            queued: true, 
            message: 'Request queued for when online' 
          }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 202 
          }
        );
      }
      
      // For GET requests, return offline error
      return new Response(
        JSON.stringify({ 
          error: 'Offline - data not available', 
          offline: true 
        }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 503 
        }
      );
    }
  } catch (error) {
    console.error('[SW] Critical error in Supabase handler:', error);
    return new Response(
      JSON.stringify({ error: 'Service worker error', details: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
}

// Handle static asset requests
async function handleAssetRequest(request) {
  try {
    // Try cache first for static assets
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network with timeout
    const networkPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Asset request timeout')), 3000);
    });

    return await Promise.race([networkPromise, timeoutPromise]);
  } catch (error) {
    console.log('[SW] Asset request failed:', request.url, error.message);
    
    // Return 404 for missing assets
    return new Response('Asset not found', { status: 404 });
  }
}

// Queue failed requests for retry when online
async function queueFailedRequest(request) {
  try {
    const body = await request.text();
    const queueItem = {
      url: request.url,
      method: request.method,
      headers: [...request.headers.entries()],
      body: body,
      timestamp: Date.now()
    };
    
    // Store in IndexedDB queue (simplified for SW context)
    console.log('[SW] Queuing failed request:', queueItem);
    
    // Post message to clients to handle queuing
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'QUEUE_REQUEST',
        request: queueItem
      });
    });
  } catch (error) {
    console.error('[SW] Failed to queue request:', error);
  }
}

// Create fallback HTML for when no cache is available
function createFallbackHTML() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DukaFiti - Offline</title>
      <style>
        body { 
          font-family: system-ui, -apple-system, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: #f5f5f5; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          min-height: 100vh;
        }
        .container { 
          text-align: center; 
          background: white; 
          padding: 40px; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .logo { 
          font-size: 24px; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 20px; 
        }
        .offline-icon { 
          font-size: 48px; 
          margin-bottom: 20px; 
        }
        .retry-btn { 
          background: #2563eb; 
          color: white; 
          border: none; 
          padding: 12px 24px; 
          border-radius: 6px; 
          cursor: pointer; 
          margin-top: 20px; 
        }
        .retry-btn:hover { 
          background: #1d4ed8; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">DukaFiti</div>
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>This page isn't available offline yet. Please check your connection and try again.</p>
        <button class="retry-btn" onclick="window.location.reload()">Retry</button>
        <br><br>
        <a href="/" style="color: #2563eb; text-decoration: none;">← Go to Dashboard</a>
      </div>
    </body>
    </html>
  `;
}

// Create error HTML for critical failures
function createErrorHTML(errorMessage) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DukaFiti - Error</title>
      <style>
        body { 
          font-family: system-ui, -apple-system, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: #f5f5f5; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          min-height: 100vh;
        }
        .container { 
          text-align: center; 
          background: white; 
          padding: 40px; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border-left: 4px solid #dc2626;
        }
        .logo { 
          font-size: 24px; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 20px; 
        }
        .error-icon { 
          font-size: 48px; 
          margin-bottom: 20px; 
        }
        .error-details { 
          background: #fef2f2; 
          border: 1px solid #fecaca; 
          border-radius: 4px; 
          padding: 10px; 
          margin: 20px 0; 
          font-size: 14px; 
          color: #991b1b; 
        }
        .retry-btn { 
          background: #dc2626; 
          color: white; 
          border: none; 
          padding: 12px 24px; 
          border-radius: 6px; 
          cursor: pointer; 
          margin-top: 20px; 
        }
        .retry-btn:hover { 
          background: #b91c1c; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">DukaFiti</div>
        <div class="error-icon">⚠️</div>
        <h1>Something Went Wrong</h1>
        <p>We encountered an error while loading this page.</p>
        <div class="error-details">${errorMessage}</div>
        <button class="retry-btn" onclick="window.location.reload()">Retry</button>
        <br><br>
        <a href="/" style="color: #2563eb; text-decoration: none;">← Go to Dashboard</a>
      </div>
    </body>
    </html>
  `;
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Robust service worker loaded successfully');
