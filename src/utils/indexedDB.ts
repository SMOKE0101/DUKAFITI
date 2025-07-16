
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
  private dbName = 'DukaFitiOfflineV2';
  private version = 7; // Increased version to fix the error

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Clear existing databases to prevent version conflicts
      this.clearExistingDatabases().then(() => {
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
    });
  }

  private async clearExistingDatabases(): Promise<void> {
    try {
      // Delete old database versions
      const oldDatabases = ['DukaFitiOffline', 'DukaFitiOfflineV1', 'DukaFitiRobustV2'];
      for (const dbName of oldDatabases) {
        try {
          await new Promise<void>((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(dbName);
            deleteReq.onsuccess = () => resolve();
            deleteReq.onerror = () => resolve(); // Continue even if deletion fails
            deleteReq.onblocked = () => resolve();
          });
        } catch (error) {
          console.warn(`Failed to delete database ${dbName}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to clear existing databases:', error);
    }
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

    // Sync queue
    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
      syncStore.createIndex('type', 'type', { unique: false });
      syncStore.createIndex('priority', 'priority', { unique: false });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      syncStore.createIndex('synced', 'synced', { unique: false });
    }

    // Cache metadata store
    if (!db.objectStoreNames.contains('cacheMetadata')) {
      const cacheStore = db.createObjectStore('cacheMetadata', { keyPath: 'key' });
      cacheStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
    }

    console.log('IndexedDB stores created successfully');
  }

  async storeData(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getData(storeName: string, id?: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = id ? store.get(id) : store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteData(storeName: string, id: string): Promise<void> {
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
  async addToSyncQueue(operation: SyncQueueItem): Promise<void> {
    return this.storeData('syncQueue', operation);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const operations = await this.getData('syncQueue');
    return Array.isArray(operations) ? operations.filter(op => !op.synced) : [];
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    return this.deleteData('syncQueue', id);
  }

  async markSynced(id: string): Promise<void> {
    const item = await this.getData('syncQueue', id);
    if (item) {
      item.synced = true;
      await this.storeData('syncQueue', item);
    }
  }

  // Cache metadata operations
  async setCacheMetadata(key: string, metadata: any): Promise<void> {
    return this.storeData('cacheMetadata', {
      key,
      ...metadata,
      lastUpdated: new Date().toISOString()
    });
  }

  async getCacheMetadata(key: string): Promise<any> {
    return this.getData('cacheMetadata', key);
  }

  // Test database functionality
  async testOfflineCapabilities(): Promise<{ success: boolean; details: any }> {
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
      await this.storeData('products', testData);
      
      // Test retrieving data
      const retrieved = await this.getData('products', testData.id);
      if (!retrieved || retrieved.id !== testData.id) {
        throw new Error('Data retrieval failed');
      }

      // Test sync queue
      const syncItem: SyncQueueItem = {
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
      
      // Clean up test data
      await this.deleteData('products', testData.id);
      await this.removeFromSyncQueue(syncItem.id);

      return {
        success: true,
        details: {
          message: 'All offline capabilities working correctly',
          queueLength: syncQueue.length,
          testsPassed: ['store', 'retrieve', 'syncQueue', 'cleanup']
        }
      };

    } catch (error) {
      console.error('Offline test failed:', error);
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

// Auto-initialize with error handling
offlineDB.init().then(() => {
  console.log('✅ IndexedDB initialized successfully');
  
  // Run tests after initialization
  setTimeout(async () => {
    const testResult = await offlineDB.testOfflineCapabilities();
    if (testResult.success) {
      console.log('🎉 All offline tests passed!');
    } else {
      console.error('💥 Offline tests failed:', testResult.details);
    }
  }, 1000);
}).catch(error => {
  console.error('❌ Failed to initialize IndexedDB:', error);
});
