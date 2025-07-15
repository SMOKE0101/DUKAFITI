
const CACHE_NAME = 'dukafiti-offline-v2';
const RUNTIME_CACHE = 'dukafiti-runtime-v2';
const DATA_CACHE = 'dukafiti-data-v2';

// Cache-first resources (shell)
const SHELL_RESOURCES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Network-first with fallback resources (data APIs)
const API_PATTERNS = [
  /\/rest\/v1\//,
  /\/auth\/v1\//,
  /supabase\.co/
];

// Cache strategies
const STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Performance metrics
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  syncOperations: 0
};

// Install event - cache shell resources
self.addEventListener('install', event => {
  console.log('[SW] Installing enhanced service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching shell resources');
        return cache.addAll(SHELL_RESOURCES);
      })
      .then(() => {
        console.log('[SW] Shell resources cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache shell resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating enhanced service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== DATA_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Cache cleanup complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Determine strategy based on request type
  let strategy = STRATEGIES.CACHE_FIRST;
  
  if (API_PATTERNS.some(pattern => pattern.test(url.href))) {
    strategy = STRATEGIES.NETWORK_FIRST;
  } else if (url.pathname.includes('/static/')) {
    strategy = STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  
  event.respondWith(handleRequest(request, strategy));
});

// Handle different caching strategies
async function handleRequest(request, strategy) {
  const url = new URL(request.url);
  
  try {
    switch (strategy) {
      case STRATEGIES.CACHE_FIRST:
        return await cacheFirst(request);
      
      case STRATEGIES.NETWORK_FIRST:
        return await networkFirst(request);
      
      case STRATEGIES.STALE_WHILE_REVALIDATE:
        return await staleWhileRevalidate(request);
      
      default:
        return fetch(request);
    }
  } catch (error) {
    console.error('[SW] Request handling failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    performanceMetrics.cacheHits++;
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }
  
  performanceMetrics.cacheMisses++;
  performanceMetrics.networkRequests++;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, serving offline page');
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy with fallback
async function networkFirst(request) {
  const cache = await caches.open(DATA_CACHE);
  
  try {
    performanceMetrics.networkRequests++;
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      performanceMetrics.cacheHits++;
      return cached;
    }
    
    performanceMetrics.cacheMisses++;
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(error => {
      console.log('[SW] Background fetch failed:', error);
    });
  
  if (cached) {
    performanceMetrics.cacheHits++;
    // Update cache in background
    fetchPromise;
    return cached;
  }
  
  performanceMetrics.cacheMisses++;
  performanceMetrics.networkRequests++;
  return fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when back online
async function syncOfflineActions() {
  try {
    performanceMetrics.syncOperations++;
    
    // Open IndexedDB and get pending actions
    const db = await openIndexedDB();
    const actions = await getPendingActions(db);
    
    console.log(`[SW] Syncing ${actions.length} offline actions`);
    
    for (const action of actions) {
      try {
        await syncAction(action);
        await markActionAsSynced(db, action.id);
      } catch (error) {
        console.error('[SW] Failed to sync action:', action, error);
      }
    }
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncedCount: actions.length
      });
    });
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// IndexedDB helpers
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaFitiOffline', 4);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getPendingActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const actions = request.result.filter(action => !action.synced);
      resolve(actions);
    };
    request.onerror = () => reject(request.error);
  });
}

async function syncAction(action) {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(action)
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`);
  }
  
  return response.json();
}

function markActionAsSynced(db, actionId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.get(actionId);
    
    request.onsuccess = () => {
      const action = request.result;
      if (action) {
        action.synced = true;
        const updateRequest = store.put(action);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve(); // Action not found, consider it synced
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Message handling for debugging and metrics
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'GET_METRICS':
      event.ports[0].postMessage({
        type: 'METRICS_RESPONSE',
        metrics: performanceMetrics
      });
      break;
      
    case 'CLEAR_CACHES':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({
          type: 'CACHES_CLEARED'
        });
      });
      break;
      
    case 'FORCE_SYNC':
      syncOfflineActions().then(() => {
        event.ports[0].postMessage({
          type: 'SYNC_FORCED'
        });
      });
      break;
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  
  // Reset metrics
  performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    syncOperations: 0
  };
  
  console.log('[SW] All caches cleared');
}

// Error handling
self.addEventListener('error', event => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Enhanced offline service worker loaded');
