
// Robust Service Worker for DukaFiti PWA
const CACHE_NAME = 'dukafiti-v7';
const DB_NAME = 'dukafiti-sw-cache';
const API_CACHE_NAME = 'dukafiti-api-v7';

// Cache all essential app shell resources
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add more static assets as needed
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/products',
  '/api/customers', 
  '/api/sales',
  '/api/profiles'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE_NAME).then(cache => {
        console.log('[SW] API cache ready');
        return Promise.resolve();
      })
    ])
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle navigation requests (SPA routing)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(handleStaticAssets(request));
});

// Handle navigation requests - always serve cached shell
async function handleNavigation(request) {
  try {
    console.log('[SW] Handling navigation to:', request.url);
    
    // Try to get cached index.html (app shell)
    const cache = await caches.open(CACHE_NAME);
    let cachedResponse = await cache.match('/index.html') || await cache.match('/');
    
    if (cachedResponse) {
      console.log('[SW] Serving cached app shell');
      return cachedResponse;
    }
    
    // Fallback: try to fetch and cache
    try {
      const response = await fetch('/index.html');
      if (response.ok) {
        await cache.put('/index.html', response.clone());
        return response;
      }
    } catch (fetchError) {
      console.warn('[SW] Failed to fetch app shell:', fetchError);
    }
    
    // Last resort: create minimal HTML shell
    return new Response(createFallbackHTML(), {
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('[SW] Navigation error:', error);
    return new Response(createErrorHTML(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle API requests with offline queue
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // For GET requests, try cache first
    if (request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log('[SW] Serving cached API response for:', url.pathname);
        
        // Try to update cache in background
        fetch(request).then(response => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        }).catch(() => {
          // Silent fail for background updates
        });
        
        return cachedResponse;
      }
    }
    
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful GET responses
      if (request.method === 'GET') {
        const cache = await caches.open(API_CACHE_NAME);
        await cache.put(request, response.clone());
      }
      
      return response;
    }
    
    throw new Error(`HTTP ${response.status}`);
    
  } catch (error) {
    console.log('[SW] API request failed:', error);
    
    // For write operations (POST, PUT, DELETE), queue them
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      await queueRequest(request);
      
      return new Response(JSON.stringify({
        success: true,
        queued: true,
        message: 'Request queued for sync when online'
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For GET requests, try to serve stale cache
    if (request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME);
      const staleResponse = await cache.match(request);
      
      if (staleResponse) {
        console.log('[SW] Serving stale cache for:', url.pathname);
        return staleResponse;
      }
    }
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Network unavailable and no cached data',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static assets
async function handleStaticAssets(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.error('[SW] Static asset error:', error);
    
    // Return empty response for failed static assets
    return new Response('', { status: 404 });
  }
}

// Queue requests for later sync
async function queueRequest(request) {
  try {
    const requestData = {
      id: generateId(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now(),
      retries: 0
    };
    
    // Store in IndexedDB
    const db = await openDB();
    const transaction = db.transaction(['requestQueue'], 'readwrite');
    const store = transaction.objectStore('requestQueue');
    await store.add(requestData);
    
    console.log('[SW] Queued request:', requestData.method, requestData.url);
  } catch (error) {
    console.error('[SW] Failed to queue request:', error);
  }
}

// Open IndexedDB for request queue
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('requestQueue')) {
        const store = db.createObjectStore('requestQueue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Background sync for queued requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncQueuedRequests());
  }
});

// Sync queued requests when online
async function syncQueuedRequests() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['requestQueue'], 'readonly');
    const store = transaction.objectStore('requestQueue');
    const requests = await store.getAll();
    
    console.log('[SW] Syncing', requests.length, 'queued requests');
    
    for (const queuedRequest of requests) {
      try {
        const response = await fetch(queuedRequest.url, {
          method: queuedRequest.method,
          headers: queuedRequest.headers,
          body: queuedRequest.body || undefined
        });
        
        if (response.ok) {
          // Remove from queue
          const deleteTransaction = db.transaction(['requestQueue'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('requestQueue');
          await deleteStore.delete(queuedRequest.id);
          
          console.log('[SW] Synced request:', queuedRequest.method, queuedRequest.url);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
        
      } catch (error) {
        console.error('[SW] Failed to sync request:', error);
        
        // Increment retry count
        queuedRequest.retries += 1;
        
        // Remove if too many retries
        if (queuedRequest.retries >= 3) {
          const deleteTransaction = db.transaction(['requestQueue'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('requestQueue');
          await deleteStore.delete(queuedRequest.id);
        } else {
          // Update retry count
          const updateTransaction = db.transaction(['requestQueue'], 'readwrite');
          const updateStore = updateTransaction.objectStore('requestQueue');
          await updateStore.put(queuedRequest);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Handle online/offline events
self.addEventListener('online', () => {
  console.log('[SW] Device is online');
  syncQueuedRequests();
});

// Message handling
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'FORCE_SYNC') {
    syncQueuedRequests();
  } else if (data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

// Utility functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0; 
          padding: 20px; 
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 400px;
        }
        .logo { font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 20px; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">DukaFiti</div>
        <div class="spinner"></div>
        <h2>Loading DukaFiti...</h2>
        <p>Please wait while we prepare your offline experience.</p>
      </div>
      <script>
        // Auto-reload when online
        window.addEventListener('online', () => {
          window.location.reload();
        });
      </script>
    </body>
    </html>
  `;
}

function createErrorHTML() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DukaFiti - Error</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0; 
          padding: 20px; 
          background: #fee2e2;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          border: 2px solid #fecaca;
          text-align: center;
          max-width: 400px;
        }
        .logo { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 20px; }
        button { 
          background: #3b82f6; 
          color: white; 
          border: none; 
          padding: 12px 24px; 
          border-radius: 6px; 
          cursor: pointer; 
          font-size: 16px; 
          margin-top: 20px;
        }
        button:hover { background: #2563eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">DukaFiti</div>
        <h2>Something went wrong</h2>
        <p>We're having trouble loading the application. Please check your connection and try again.</p>
        <button onclick="window.location.reload()">Retry</button>
      </div>
    </body>
    </html>
  `;
}

console.log('[SW] Service Worker loaded successfully');
