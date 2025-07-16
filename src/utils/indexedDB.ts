
interface OfflineSale {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  selling_price: number;
  cost_price: number;
  profit: number;
  total_amount: number;
  payment_method: string;
  customer_id?: string;
  customer_name?: string;
  payment_details?: any;
  timestamp: string;
  synced: boolean;
}

interface OfflineProduct {
  id: string;
  user_id: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

interface OfflineCustomer {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  credit_limit: number;
  outstanding_debt: number;
  created_date: string;
  updated_at?: string;
}

interface SyncQueueItem {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  synced: boolean;
}

class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private dbName = 'DukaFitiOffline';
  private version = 6;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // Clear old stores if they exist
    const storeNames = ['sales', 'products', 'customers', 'transactions', 'syncQueue'];
    
    for (const storeName of storeNames) {
      if (db.objectStoreNames.contains(storeName)) {
        db.deleteObjectStore(storeName);
      }
    }

    // Sales store
    const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
    salesStore.createIndex('user_id', 'user_id', { unique: false });
    salesStore.createIndex('product_id', 'product_id', { unique: false });
    salesStore.createIndex('timestamp', 'timestamp', { unique: false });
    salesStore.createIndex('synced', 'synced', { unique: false });

    // Products store
    const productsStore = db.createObjectStore('products', { keyPath: 'id' });
    productsStore.createIndex('user_id', 'user_id', { unique: false });
    productsStore.createIndex('category', 'category', { unique: false });
    productsStore.createIndex('name', 'name', { unique: false });

    // Customers store
    const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
    customersStore.createIndex('user_id', 'user_id', { unique: false });
    customersStore.createIndex('name', 'name', { unique: false });
    customersStore.createIndex('phone', 'phone', { unique: false });

    // Transactions store
    const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
    transactionsStore.createIndex('user_id', 'user_id', { unique: false });
    transactionsStore.createIndex('customer_id', 'customer_id', { unique: false });
    transactionsStore.createIndex('date', 'date', { unique: false });

    // Sync queue store
    const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
    syncStore.createIndex('type', 'type', { unique: false });
    syncStore.createIndex('priority', 'priority', { unique: false });
    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
    syncStore.createIndex('synced', 'synced', { unique: false });

    console.log('IndexedDB stores created successfully');
  }

  async storeOfflineData(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (!data || !data.id) throw new Error('Data must have an id field');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineData(storeName: string, id?: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = id ? store.get(id) : store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteOfflineData(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const data = await this.getOfflineData('syncQueue');
    return Array.isArray(data) ? data : [];
  }

  async addToSyncQueue(operation: SyncQueueItem): Promise<void> {
    if (!operation.id) {
      operation.id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    if (typeof operation.attempts !== 'number') {
      operation.attempts = 0;
    }
    return this.storeOfflineData('syncQueue', operation);
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    return this.deleteOfflineData('syncQueue', id);
  }

  async getUnsyncedOperations(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('synced');
      
      // Use the correct value for the synced index
      const request = index.getAll(false);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getDataStats(): Promise<{ [key: string]: number }> {
    const stats: { [key: string]: number } = {};
    const stores = ['sales', 'products', 'customers', 'transactions', 'syncQueue'];
    
    for (const storeName of stores) {
      try {
        const data = await this.getOfflineData(storeName);
        stats[storeName] = Array.isArray(data) ? data.length : 0;
      } catch (error) {
        console.error(`Failed to get stats for ${storeName}:`, error);
        stats[storeName] = 0;
      }
    }
    
    return stats;
  }

  async testOfflineCapabilities(): Promise<{ success: boolean; details: any }> {
    console.log('[IndexedDB] Testing offline capabilities...');
    
    try {
      // Test data creation with proper structure
      const testData = {
        id: `test_${Date.now()}`,
        user_id: 'test-user',
        name: 'Test Product',
        category: 'Test',
        cost_price: 100,
        selling_price: 150,
        current_stock: 10,
        low_stock_threshold: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test storing data
      await this.storeOfflineData('products', testData);
      console.log('[IndexedDB] ✅ Store test passed');

      // Test retrieving data
      const retrieved = await this.getOfflineData('products', testData.id);
      if (!retrieved || retrieved.id !== testData.id) {
        throw new Error('Data retrieval failed');
      }
      console.log('[IndexedDB] ✅ Retrieve test passed');

      // Test sync queue
      const syncItem: SyncQueueItem = {
        id: `sync_test_${Date.now()}`,
        type: 'product',
        operation: 'create',
        data: testData,
        timestamp: new Date().toISOString(),
        priority: 'medium',
        attempts: 0,
        synced: false
      };

      await this.addToSyncQueue(syncItem);
      const syncQueue = await this.getSyncQueue();
      const foundSyncItem = syncQueue.find(item => item.id === syncItem.id);
      
      if (!foundSyncItem) {
        throw new Error('Sync queue test failed');
      }
      console.log('[IndexedDB] ✅ Sync queue test passed');

      // Clean up test data
      await this.deleteOfflineData('products', testData.id);
      await this.removeFromSyncQueue(syncItem.id);
      console.log('[IndexedDB] ✅ Cleanup completed');

      const stats = await this.getDataStats();
      
      return {
        success: true,
        details: {
          message: 'All offline capabilities working correctly',
          stats,
          testsPassed: ['store', 'retrieve', 'syncQueue', 'cleanup']
        }
      };

    } catch (error) {
      console.error('[IndexedDB] ❌ Offline test failed:', error);
      return {
        success: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Offline capabilities test failed'
        }
      };
    }
  }
}

export const offlineDB = new OfflineDatabase();

// Initialize and test on load
offlineDB.init().then(() => {
  console.log('[IndexedDB] 🎉 Database initialized successfully!');
}).catch(error => {
  console.error('[IndexedDB] Failed to initialize:', error);
});
