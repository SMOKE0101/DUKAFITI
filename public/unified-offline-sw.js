// Unified Offline Service Worker for Dukafiti
// Version: 1.0.0
// Supports offline-first functionality, IndexedDB caching, and SMS receipts

const CACHE_NAME = 'dukafiti-v1.0.0';
const OFFLINE_CACHE_NAME = 'dukafiti-offline-v1.0.0';
const ASSETS_CACHE_NAME = 'dukafiti-assets-v1.0.0';

// Core assets to cache for offline functionality
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add core CSS and JS files after build
];

// API endpoints that should be cached with NetworkFirst strategy
const API_ENDPOINTS = [
  '/api/customers',
  '/api/products', 
  '/api/sales',
  '/api/settings',
  '/api/metrics'
];

// Image and static assets that should be cached with CacheFirst strategy
const STATIC_ASSETS = [
  /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
  /\.(css|js)$/,
  '/lovable-uploads/'
];

// IndexedDB configuration for offline data storage
const DB_NAME = 'DukafitiOfflineDB';
const DB_VERSION = 1;
const STORES = ['customers', 'products', 'sales', 'settings', 'templates'];

let db;

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores for each data type
      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
  });
}

// Save data to IndexedDB
async function saveToDB(storeName, data) {
  if (!db) await initDB();
  
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  
  if (Array.isArray(data)) {
    data.forEach(item => store.put(item));
  } else {
    store.put(data);
  }
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Get data from IndexedDB
async function getFromDB(storeName, key = null) {
  if (!db) await initDB();
  
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  
  if (key) {
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } else {
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Cache strategies
const CACHE_STRATEGIES = {
  // Network First with Cache Fallback
  networkFirst: async (request) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(OFFLINE_CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
      throw new Error('Network response not ok');
    } catch (error) {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      return cachedResponse || new Response('Offline', { status: 503 });
    }
  },
  
  // Cache First with Network Fallback
  cacheFirst: async (request) => {
    const cache = await caches.open(ASSETS_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return new Response('Asset not available offline', { status: 404 });
    }
  },
  
  // Stale While Revalidate
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });
    
    return cachedResponse || fetchPromise;
  }
};

// Handle API requests with offline support
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Check if this is a known API endpoint
  const isAPIEndpoint = API_ENDPOINTS.some(endpoint => pathname.includes(endpoint));
  
  if (isAPIEndpoint) {
    return CACHE_STRATEGIES.networkFirst(request);
  }
  
  // Handle data sync requests
  if (pathname.includes('/sync')) {
    return handleSyncRequest(request);
  }
  
  return fetch(request);
}

// Handle sync requests for offline data
async function handleSyncRequest(request) {
  if (request.method === 'POST') {
    // Store sync data in IndexedDB for later processing
    const data = await request.json();
    await saveToDB('pendingSync', {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method,
      data: data,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    return new Response(JSON.stringify({ success: true, queued: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return CACHE_STRATEGIES.networkFirst(request);
}

// Handle SMS functionality for Android
function handleSMSFunctionality() {
  // Check if we're on Android and have SMS permissions
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Register message handler for SMS operations
    self.addEventListener('message', async (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'SEND_SMS':
          try {
            // Store SMS in pending queue for offline sending
            await saveToDB('pendingSMS', {
              id: Date.now() + Math.random(),
              timestamp: new Date().toISOString(),
              phoneNumber: data.phoneNumber,
              message: data.message,
              status: 'pending'
            });
            
            // Try to send immediately if online
            if (navigator.onLine) {
              await sendSMS(data.phoneNumber, data.message);
              event.ports[0].postMessage({ success: true });
            } else {
              event.ports[0].postMessage({ success: true, queued: true });
            }
          } catch (error) {
            event.ports[0].postMessage({ success: false, error: error.message });
          }
          break;
          
        case 'GET_PENDING_SMS':
          try {
            const pendingSMS = await getFromDB('pendingSMS');
            event.ports[0].postMessage({ success: true, data: pendingSMS });
          } catch (error) {
            event.ports[0].postMessage({ success: false, error: error.message });
          }
          break;
          
        default:
          event.ports[0].postMessage({ success: false, error: 'Unknown message type' });
      }
    });
  }
}

// Mock SMS sending function (will be replaced with actual Android SMS API)
async function sendSMS(phoneNumber, message) {
  // This would integrate with Android's SMS API in the mobile app
  console.log(`[SMS] Would send to ${phoneNumber}: ${message}`);
  
  // In a real Android app, this would use the native SMS API
  // For now, we'll just simulate success
  return { success: true };
}

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)),
      caches.open(ASSETS_CACHE_NAME).then(cache => {
        // Pre-cache static assets
        return Promise.resolve();
      }),
      initDB()
    ]).then(() => {
      console.log('[SW] Service worker installed successfully');
      self.skipWaiting();
    }).catch(error => {
      console.error('[SW] Service worker installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (![CACHE_NAME, OFFLINE_CACHE_NAME, ASSETS_CACHE_NAME].includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
    return;
  }
  
  // Handle other requests with stale-while-revalidate
  event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request));
});

// Message event - handle communication from app
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_DATA':
      try {
        await saveToDB(data.store, data.data);
        event.ports[0].postMessage({ success: true });
      } catch (error) {
        event.ports[0].postMessage({ success: false, error: error.message });
      }
      break;
      
    case 'GET_CACHED_DATA':
      try {
        const result = await getFromDB(data.store, data.key);
        event.ports[0].postMessage({ success: true, data: result });
      } catch (error) {
        event.ports[0].postMessage({ success: false, error: error.message });
      }
      break;
      
    case 'CLEAR_CACHE':
      try {
        if (data.store) {
          // Clear specific store
          const transaction = db.transaction([data.store], 'readwrite');
          const store = transaction.objectStore(data.store);
          store.clear();
        } else {
          // Clear all caches
          await caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          });
        }
        event.ports[0].postMessage({ success: true });
      } catch (error) {
        event.ports[0].postMessage({ success: false, error: error.message });
      }
      break;
  }
});

// Handle background sync for pending operations
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncPendingData());
  }
});

// Sync pending data when online
async function syncPendingData() {
  try {
    // Get pending sync data
    const pendingData = await getFromDB('pendingSync');
    
    // Process each pending item
    for (const item of pendingData || []) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
          // Remove from pending sync
          const transaction = db.transaction(['pendingSync'], 'readwrite');
          const store = transaction.objectStore('pendingSync');
          store.delete(item.id);
        }
      } catch (error) {
        console.error('[SW] Sync failed for item:', item.id, error);
      }
    }
    
    // Send pending SMS messages
    const pendingSMS = await getFromDB('pendingSMS');
    for (const sms of pendingSMS || []) {
      if (sms.status === 'pending') {
        try {
          await sendSMS(sms.phoneNumber, sms.message);
          
          // Update status
          const transaction = db.transaction(['pendingSMS'], 'readwrite');
          const store = transaction.objectStore('pendingSMS');
          store.put({ ...sms, status: 'sent' });
        } catch (error) {
          console.error('[SW] SMS send failed:', sms.id, error);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Initialize SMS functionality
handleSMSFunctionality();

console.log('[SW] Unified offline service worker loaded');
