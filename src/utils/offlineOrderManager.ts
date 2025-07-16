
interface OfflineOrder {
  id: string;
  offlineId: string; // Unique identifier for deduplication
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  customerId?: string;
  customerName?: string;
  timestamp: string;
  synced: boolean;
  syncAttempts: number;
  lastSyncAttempt?: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  totalAmount: number;
}

class OfflineOrderManager {
  private db: IDBDatabase | null = null;
  private dbName = 'DukaFitiOrders';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open OrderManager IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('OfflineOrderManager IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // Clear existing stores to prevent conflicts
    if (db.objectStoreNames.contains('orders')) {
      db.deleteObjectStore('orders');
    }

    // Orders store with proper indexing
    const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
    ordersStore.createIndex('offlineId', 'offlineId', { unique: true });
    ordersStore.createIndex('userId', 'userId', { unique: false });
    ordersStore.createIndex('synced', 'synced', { unique: false });
    ordersStore.createIndex('timestamp', 'timestamp', { unique: false });

    console.log('OfflineOrderManager stores created successfully');
  }

  // Generate unique offline ID to prevent duplicates
  generateOfflineId(): string {
    return `offline_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async storeOfflineOrder(orderData: Omit<OfflineOrder, 'id' | 'offlineId' | 'synced' | 'syncAttempts'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const offlineId = this.generateOfflineId();
    const order: OfflineOrder = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      offlineId,
      synced: false,
      syncAttempts: 0,
      timestamp: orderData.timestamp || new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      const request = store.add(order);
      
      request.onsuccess = () => {
        console.log(`[OfflineOrderManager] Stored offline order with ID: ${offlineId}`);
        resolve(offlineId);
      };
      
      request.onerror = () => {
        console.error(`[OfflineOrderManager] Failed to store offline order:`, request.error);
        reject(request.error);
      };
    });
  }

  async getUnsyncedOrders(): Promise<OfflineOrder[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const index = store.index('synced');
      
      const request = index.getAll(false); // Get only unsynced orders
      
      request.onsuccess = () => {
        const orders = request.result || [];
        console.log(`[OfflineOrderManager] Found ${orders.length} unsynced orders`);
        resolve(orders);
      };
      
      request.onerror = () => {
        console.error(`[OfflineOrderManager] Failed to get unsynced orders:`, request.error);
        reject(request.error);
      };
    });
  }

  async markOrderAsSynced(offlineId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      const index = store.index('offlineId');
      
      const getRequest = index.get(offlineId);
      
      getRequest.onsuccess = () => {
        const order = getRequest.result;
        if (order) {
          order.synced = true;
          order.lastSyncAttempt = new Date().toISOString();
          
          const putRequest = store.put(order);
          putRequest.onsuccess = () => {
            console.log(`[OfflineOrderManager] Marked order ${offlineId} as synced`);
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          console.warn(`[OfflineOrderManager] Order not found for offline ID: ${offlineId}`);
          resolve();
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async incrementSyncAttempts(offlineId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      const index = store.index('offlineId');
      
      const getRequest = index.get(offlineId);
      
      getRequest.onsuccess = () => {
        const order = getRequest.result;
        if (order) {
          order.syncAttempts = (order.syncAttempts || 0) + 1;
          order.lastSyncAttempt = new Date().toISOString();
          
          const putRequest = store.put(order);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async removeFailedOrders(maxAttempts: number = 3): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const orders = request.result || [];
        const failedOrders = orders.filter(order => 
          !order.synced && (order.syncAttempts || 0) >= maxAttempts
        );
        
        const deletePromises = failedOrders.map(order => {
          return new Promise<void>((resolveDelete, rejectDelete) => {
            const deleteRequest = store.delete(order.id);
            deleteRequest.onsuccess = () => {
              console.log(`[OfflineOrderManager] Removed failed order: ${order.offlineId}`);
              resolveDelete();
            };
            deleteRequest.onerror = () => rejectDelete(deleteRequest.error);
          });
        });
        
        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAllOrders(): Promise<OfflineOrder[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncedOrders(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        const allOrders = getAllRequest.result || [];
        const syncedOrders = allOrders.filter(order => order.synced);
        
        const deletePromises = syncedOrders.map(order => {
          return new Promise<void>((resolveDelete, rejectDelete) => {
            const deleteRequest = store.delete(order.id);
            deleteRequest.onsuccess = () => resolveDelete();
            deleteRequest.onerror = () => rejectDelete(deleteRequest.error);
          });
        });
        
        Promise.all(deletePromises)
          .then(() => {
            console.log(`[OfflineOrderManager] Cleared ${syncedOrders.length} synced orders`);
            resolve();
          })
          .catch(reject);
      };
      
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }
}

export const offlineOrderManager = new OfflineOrderManager();

// Initialize the order manager
offlineOrderManager.init().then(() => {
  console.log('✅ OfflineOrderManager initialized successfully');
}).catch(error => {
  console.error('❌ Failed to initialize OfflineOrderManager:', error);
});

export type { OfflineOrder, OrderItem };
