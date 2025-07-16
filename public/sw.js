
const CACHE_NAME = 'dukafiti-v2';
const urlsToCache = [
  '/',
  '/app',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/fonts/inter-var.woff2'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('DukaFiti cache opened');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-sales') {
    event.waitUntil(syncPendingSales());
  } else if (event.tag === 'background-sync-inventory') {
    event.waitUntil(syncPendingInventory());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'DukaFiti notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open DukaFiti',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('DukaFiti', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/app')
    );
  }
});

// Background sync functions
async function syncPendingSales() {
  try {
    // Get pending sales from IndexedDB or localStorage
    const pendingSales = await getPendingSales();
    
    for (const sale of pendingSales) {
      try {
        await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale)
        });
        
        // Remove from pending after successful sync
        await removePendingSale(sale.id);
      } catch (error) {
        console.error('Failed to sync sale:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function syncPendingInventory() {
  try {
    const pendingUpdates = await getPendingInventoryUpdates();
    
    for (const update of pendingUpdates) {
      try {
        await fetch('/api/inventory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        
        await removePendingInventoryUpdate(update.id);
      } catch (error) {
        console.error('Failed to sync inventory update:', error);
      }
    }
  } catch (error) {
    console.error('Inventory sync failed:', error);
  }
}

// Helper functions for offline data management
async function getPendingSales() {
  // Implementation would use IndexedDB to retrieve pending sales
  return [];
}

async function removePendingSale(id) {
  // Implementation would remove the sale from IndexedDB
}

async function getPendingInventoryUpdates() {
  // Implementation would use IndexedDB to retrieve pending inventory updates
  return [];
}

async function removePendingInventoryUpdate(id) {
  // Implementation would remove the update from IndexedDB
}
