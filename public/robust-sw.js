
const CACHE_NAME = 'dukafiti-robust-v1';
const STATIC_CACHE = 'dukafiti-static-robust-v1';
const DYNAMIC_CACHE = 'dukafiti-dynamic-robust-v1';

// Critical resources for app shell
const STATIC_ASSETS = [
  '/',
  '/app',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/products/,
  /\/api\/customers/,
  /\/api\/sales/,
  /supabase\.co/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Robust Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn('Failed to cache some static assets:', err);
          // Don't fail installation if some assets can't be cached
        });
      }),
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('Dynamic cache ready');
        return cache;
      })
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Robust Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - robust network handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Static asset handling - cache first with network fallback
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {
        // Ignore network errors for background updates
      });
      
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('Static asset fetch failed:', error);
    // Return a basic fallback for critical assets
    return new Response('Asset not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// API request handling - network first with cache fallback
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      
      // Add header to indicate fresh data
      const response = networkResponse.clone();
      response.headers.set('X-Served-By', 'network');
      return response;
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('Network request failed, trying cache:', request.url);
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add header to indicate cached data
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'cache');
      return response;
    }
    
    // Return structured offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline',
        cached: false,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'X-Served-By': 'offline'
        }
      }
    );
  }
}

// Navigation request handling
async function handleNavigationRequest(request) {
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
    
    // Return app shell or offline page
    return caches.match('/') || caches.match('/offline.html') || 
           new Response('Page not available offline', { 
             status: 503,
             headers: { 'Content-Type': 'text/html' }
           });
  }
}

// Background sync for robust offline operations
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'robust-sync') {
    event.waitUntil(performRobustSync());
  }
});

// Perform robust background sync
async function performRobustSync() {
  try {
    console.log('Performing robust background sync...');
    
    // Open IndexedDB and process sync queue
    const dbRequest = indexedDB.open('DukaFitiRobust', 3);
    
    dbRequest.onsuccess = async (event) => {
      const db = event.target.result;
      
      try {
        const transaction = db.transaction(['syncQueue'], 'readonly');
        const store = transaction.objectStore('syncQueue');
        const request = store.getAll();
        
        request.onsuccess = async () => {
          const operations = request.result || [];
          console.log(`Found ${operations.length} operations to sync`);
          
          for (const operation of operations) {
            try {
              await syncOperation(operation);
            } catch (error) {
              console.error('Failed to sync operation:', operation.id, error);
            }
          }
        };
      } catch (error) {
        console.error('Background sync DB operation failed:', error);
      }
    };
    
  } catch (error) {
    console.error('Robust background sync failed:', error);
  }
}

// Sync individual operation
async function syncOperation(operation) {
  const { type, data } = operation;
  
  let endpoint = '';
  switch (type) {
    case 'sale':
      endpoint = '/api/sales';
      break;
    case 'product':
      endpoint = '/api/products';
      break;
    case 'customer':
      endpoint = '/api/customers';
      break;
    default:
      return;
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      // Mark operation as synced in IndexedDB
      await markOperationSynced(operation.id);
      console.log('Successfully synced operation:', operation.id);
    }
  } catch (error) {
    console.error('Failed to sync operation:', operation.id, error);
  }
}

// Mark operation as synced
async function markOperationSynced(operationId) {
  return new Promise((resolve) => {
    const dbRequest = indexedDB.open('DukaFitiRobust', 3);
    
    dbRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const deleteRequest = store.delete(operationId);
      deleteRequest.onsuccess = () => resolve();
    };
  });
}

// Helper functions
function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico)$/);
}

function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.href)) ||
         url.pathname.startsWith('/api/');
}

// Message handling for manual sync triggers
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'FORCE_SYNC') {
    event.waitUntil(performRobustSync());
  }
});

// Push notifications for sync status
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'sync-complete') {
      event.waitUntil(
        self.registration.showNotification('DukaFiti Sync Complete', {
          body: `${data.synced} operations synced successfully`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'robust-sync-notification',
        })
      );
    }
  }
});

console.log('Robust Service Worker loaded successfully');
