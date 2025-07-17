
interface OfflineOrder {
  id: string;
  offlineId: string; // Guaranteed unique identifier for deduplication
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
  private version = 2; // Increment version for enhanced deduplication
  private processedOfflineIds = new Set<string>(); // In-memory deduplication

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

    // Enhanced orders store with better indexing for deduplication
    const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
    ordersStore.createIndex('offlineId', 'offlineId', { unique: true });
    ordersStore.createIndex('userId', 'userId', { unique: false });
    ordersStore.createIndex('synced', 'synced', { unique: false });
    ordersStore.createIndex('timestamp', 'timestamp', { unique: false });
    ordersStore.createIndex('userIdSynced', ['userId', 'synced'], { unique: false });

    console.log('OfflineOrderManager stores created successfully with enhanced deduplication');
  }

  // Enhanced offline ID generation with better uniqueness
  generateOfflineId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 12);
    const uniqueId = `offline_order_${timestamp}_${random}`;
    
    // Ensure we don't generate duplicate IDs
    if (this.processedOfflineIds.has(uniqueId)) {
      return this.generateOfflineId(); // Regenerate if duplicate
    }
    
    this.processedOfflineIds.add(uniqueId);
    return uniqueId;
  }

  async storeOfflineOrder(orderData: Omit<OfflineOrder, 'id' | 'offlineId' | 'synced' | 'syncAttempts'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const offlineId = this.generateOfflineId();
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const order: OfflineOrder = {
      ...orderData,
      id: orderId,
      offlineId,
      synced: false,
      syncAttempts: 0,
      timestamp: orderData.timestamp || new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      // Check for duplicate offline ID before inserting
      const index = store.index('offlineId');
      const checkRequest = index.get(offlineId);
      
      checkRequest.onsuccess = () => {
        if (checkRequest.result) {
          // Duplicate found, regenerate ID and try again
          console.warn(`[OfflineOrderManager] Duplicate offline ID detected: ${offlineId}, regenerating...`);
          this.storeOfflineOrder(orderData).then(resolve).catch(reject);
          return;
        }
        
        // No duplicate, proceed with insertion
        const insertRequest = store.add(order);
        
        insertRequest.onsuccess = () => {
          console.log(`[OfflineOrderManager] Stored offline order with unique ID: ${offlineId}`);
          resolve(offlineId);
        };
        
        insertRequest.onerror = () => {
          console.error(`[OfflineOrderManager] Failed to store offline order:`, insertRequest.error);
          reject(insertRequest.error);
        };
      };
      
      checkRequest.onerror = () => {
        console.error(`[OfflineOrderManager] Error checking for duplicate:`, checkRequest.error);
        reject(checkRequest.error);
      };
    });
  }

  async getUnsyncedOrders(): Promise<OfflineOrder[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const index = store.index('synced');
      
      // Use IDBKeyRange for boolean values
      const range = IDBKeyRange.only(false);
      const request = index.getAll(range);
      
      request.onsuccess = () => {
        const unsyncedOrders = request.result || [];
        console.log(`[OfflineOrderManager] Found ${unsyncedOrders.length} unsynced orders`);
        
        // Sort by timestamp to ensure oldest orders sync first
        unsyncedOrders.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        resolve(unsyncedOrders);
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
          putRequest.onsuccess = () => {
            console.log(`[OfflineOrderManager] Incremented sync attempts for ${offlineId} to ${order.syncAttempts}`);
            resolve();
          };
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
        
        console.log(`[OfflineOrderManager] Removing ${failedOrders.length} failed orders`);
        
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
        const orders = request.result || [];
        // Sort by timestamp, newest first
        orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(orders);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncedOrders(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      const index = store.index('synced');
      
      // Use IDBKeyRange for boolean values
      const range = IDBKeyRange.only(true);
      const getAllRequest = index.getAll(range);
      
      getAllRequest.onsuccess = () => {
        const syncedOrders = getAllRequest.result || [];
        
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

  // Enhanced method to check for duplicates
  async isDuplicateOfflineId(offlineId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const index = store.index('offlineId');
      
      const request = index.get(offlineId);
      
      request.onsuccess = () => {
        resolve(!!request.result);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineOrderManager = new OfflineOrderManager();

// Initialize the order manager with enhanced error handling
offlineOrderManager.init().then(() => {
  console.log('✅ OfflineOrderManager initialized successfully with enhanced deduplication');
}).catch(error => {
  console.error('❌ Failed to initialize OfflineOrderManager:', error);
});

export type { OfflineOrder, OrderItem };
