
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

interface OfflineTransaction {
  id: string;
  user_id: string;
  customer_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  paid: boolean;
  notes?: string;
  date: string;
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
  private version = 4; // Increased version for schema fixes

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
    // Sales store
    if (!db.objectStoreNames.contains('sales')) {
      const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
      salesStore.createIndex('user_id', 'user_id', { unique: false });
      salesStore.createIndex('product_id', 'product_id', { unique: false });
      salesStore.createIndex('timestamp', 'timestamp', { unique: false });
      salesStore.createIndex('synced', 'synced', { unique: false });
    }

    // Products store
    if (!db.objectStoreNames.contains('products')) {
      const productsStore = db.createObjectStore('products', { keyPath: 'id' });
      productsStore.createIndex('user_id', 'user_id', { unique: false });
      productsStore.createIndex('category', 'category', { unique: false });
      productsStore.createIndex('name', 'name', { unique: false });
    }

    // Customers store
    if (!db.objectStoreNames.contains('customers')) {
      const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
      customersStore.createIndex('user_id', 'user_id', { unique: false });
      customersStore.createIndex('name', 'name', { unique: false });
      customersStore.createIndex('phone', 'phone', { unique: false });
    }

    // Transactions store
    if (!db.objectStoreNames.contains('transactions')) {
      const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
      transactionsStore.createIndex('user_id', 'user_id', { unique: false });
      transactionsStore.createIndex('customer_id', 'customer_id', { unique: false });
      transactionsStore.createIndex('date', 'date', { unique: false });
    }

    // Enhanced sync queue
    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
      syncStore.createIndex('type', 'type', { unique: false });
      syncStore.createIndex('priority', 'priority', { unique: false });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      syncStore.createIndex('synced', 'synced', { unique: false });
      syncStore.createIndex('attempts', 'attempts', { unique: false });
    }

    // Offline requests store (for service worker)
    if (!db.objectStoreNames.contains('offlineRequests')) {
      const requestsStore = db.createObjectStore('offlineRequests', { keyPath: 'id' });
      requestsStore.createIndex('timestamp', 'timestamp', { unique: false });
      requestsStore.createIndex('method', 'method', { unique: false });
    }

    console.log('IndexedDB stores created/updated successfully');
  }

  // Enhanced store operations
  async storeOfflineData(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

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

  // Enhanced sync queue operations
  async getSyncQueue(): Promise<any[]> {
    return this.getOfflineData('syncQueue');
  }

  async addToSyncQueue(operation: any): Promise<void> {
    return this.storeOfflineData('syncQueue', operation);
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    return this.deleteOfflineData('syncQueue', id);
  }

  async updateSyncQueueItem(operation: any): Promise<void> {
    return this.storeOfflineData('syncQueue', operation);
  }

  // Get sync queue by priority
  async getSyncQueueByPriority(priority: 'high' | 'medium' | 'low'): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('priority');
      
      const request = index.getAll(priority);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Get unsynced operations - Fixed the boolean issue
  async getUnsyncedOperations(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('synced');
      
      // Use IDBKeyRange for boolean values
      const request = index.getAll(IDBKeyRange.only(false));
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Data statistics
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

  // Test offline functionality
  async testOfflineCapabilities(): Promise<{ success: boolean; details: any }> {
    console.log('[IndexedDB] Testing offline capabilities...');
    
    try {
      // Test data creation
      const testData = {
        id: 'test_' + Date.now(),
        name: 'Test Product',
        category: 'Test',
        price: 100,
        timestamp: new Date().toISOString()
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
      const syncItem = {
        id: 'sync_test_' + Date.now(),
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
          error: error.message,
          message: 'Offline capabilities test failed'
        }
      };
    }
  }
}

export const offlineDB = new OfflineDatabase();

// Auto-run tests when database is initialized
offlineDB.init().then(() => {
  // Run comprehensive tests
  setTimeout(async () => {
    const testResult = await offlineDB.testOfflineCapabilities();
    if (testResult.success) {
      console.log('[IndexedDB] 🎉 All offline tests passed successfully!');
    } else {
      console.error('[IndexedDB] 💥 Offline tests failed:', testResult.details);
    }
  }, 1000);
}).catch(error => {
  console.error('[IndexedDB] Failed to initialize:', error);
});
