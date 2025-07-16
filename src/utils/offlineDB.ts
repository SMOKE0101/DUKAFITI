
// Define interfaces for offline data types
export interface OfflineProduct {
  id: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  low_stock_threshold: number | null;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  synced?: boolean;
}

export interface OfflineCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  credit_limit: number | null;
  outstanding_debt: number | null;
  user_id: string;
  created_date: string;
  updated_at?: string;
  synced?: boolean;
}

export interface OfflineSale {
  id: string;
  product_id: string;
  product_name: string;
  customer_id: string | null;
  customer_name: string | null;
  quantity: number;
  selling_price: number;
  cost_price: number;
  total_amount: number;
  profit: number;
  payment_method: string;
  payment_details: any | null;
  user_id: string;
  timestamp: string;
  synced?: boolean;
}

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  user_id: string;
  timestamp: number;
  synced: boolean;
  attempts?: number;
  lastAttempt?: number;
}

class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly dbName = 'DukaSmartOffline';
  private readonly dbVersion = 1;

  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = this.initializeDB();
    return this.initPromise;
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[OfflineDB] Initializing database...');
      
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[OfflineDB] Failed to open database:', request.error);
        this.initPromise = null;
        reject(new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineDB] Database initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('[OfflineDB] Upgrading database schema...');

        // Create object stores
        const stores = [
          'settings',
          'products', 
          'customers',
          'sales',
          'transactions',
          'syncQueue'
        ];

        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            
            // Add indexes for better querying
            if (['products', 'customers', 'sales', 'transactions'].includes(storeName)) {
              store.createIndex('user_id', 'user_id', { unique: false });
            }
            
            if (storeName === 'syncQueue') {
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('synced', 'synced', { unique: false });
              store.createIndex('type', 'type', { unique: false });
            }
            
            console.log(`[OfflineDB] Created store: ${storeName}`);
          }
        });
      };
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    
    if (!this.db) {
      throw new Error('Database not initialized after init attempt');
    }
  }

  // Test database functionality
  async testDatabase(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      // Try to perform a simple operation
      const testData = {
        id: 'test_' + Date.now(),
        data: 'test'
      };
      
      await this.storeOfflineData('settings', testData);
      const retrieved = await this.getOfflineData('settings', testData.id);
      
      if (retrieved && retrieved.id === testData.id) {
        console.log('[OfflineDB] Database test passed');
        return true;
      } else {
        console.error('[OfflineDB] Database test failed: data mismatch');
        return false;
      }
    } catch (error) {
      console.error('[OfflineDB] Database test failed:', error);
      return false;
    }
  }

  async storeOfflineData(storeName: string, data: any): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Ensure data has an ID
      if (!data.id) {
        data.id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      const request = store.put(data);
      
      request.onsuccess = () => {
        console.log(`[OfflineDB] Stored data in ${storeName}:`, data.id);
        resolve();
      };
      
      request.onerror = () => {
        console.error(`[OfflineDB] Failed to store data in ${storeName}:`, request.error);
        reject(new Error(`Failed to store data: ${request.error?.message || 'Unknown error'}`));
      };
    });
  }

  async getOfflineData(storeName: string, id?: string): Promise<any> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      if (id) {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      }
    });
  }

  async getAllOfflineData(storeName: string, userFilter?: string): Promise<any[]> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      if (userFilter && store.indexNames.contains('user_id')) {
        const index = store.index('user_id');
        const request = index.getAll(userFilter);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      }
    });
  }

  // Enhanced methods for specific data types
  async store(storeName: string, data: any): Promise<void> {
    return this.storeOfflineData(storeName, data);
  }

  async delete(storeName: string, id: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`[OfflineDB] Deleted from ${storeName}:`, id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Product methods
  async storeProducts(products: OfflineProduct[]): Promise<void> {
    for (const product of products) {
      await this.store('products', { ...product, synced: true });
    }
  }

  async getProducts(userId: string): Promise<OfflineProduct[]> {
    return this.getAllOfflineData('products', userId);
  }

  async getProduct(id: string): Promise<OfflineProduct | undefined> {
    return this.getOfflineData('products', id);
  }

  async updateProductStock(productId: string, newStock: number): Promise<void> {
    const product = await this.getProduct(productId);
    if (product) {
      product.current_stock = newStock;
      product.updated_at = new Date().toISOString();
      await this.store('products', product);
    }
  }

  // Customer methods
  async storeCustomers(customers: OfflineCustomer[]): Promise<void> {
    for (const customer of customers) {
      await this.store('customers', { ...customer, synced: true });
    }
  }

  async getCustomers(userId: string): Promise<OfflineCustomer[]> {
    return this.getAllOfflineData('customers', userId);
  }

  async getCustomer(id: string): Promise<OfflineCustomer | undefined> {
    return this.getOfflineData('customers', id);
  }

  // Sales methods
  async storeSales(sales: OfflineSale[]): Promise<void> {
    for (const sale of sales) {
      await this.store('sales', { ...sale, synced: true });
    }
  }

  async getSales(userId: string): Promise<OfflineSale[]> {
    return this.getAllOfflineData('sales', userId);
  }

  // Sync queue methods
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    const queueItem: OfflineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false,
      attempts: 0
    };
    
    await this.store('syncQueue', queueItem);
  }

  async getQueuedActions(userId?: string): Promise<OfflineAction[]> {
    const allActions = await this.getAllOfflineData('syncQueue');
    return allActions.filter(action => !action.synced && (!userId || action.user_id === userId));
  }

  async markActionSynced(actionId: string): Promise<void> {
    const action = await this.getOfflineData('syncQueue', actionId);
    if (action) {
      action.synced = true;
      await this.store('syncQueue', action);
    }
  }

  async markActionFailed(actionId: string, errorMessage: string): Promise<void> {
    const action = await this.getOfflineData('syncQueue', actionId);
    if (action) {
      action.attempts = (action.attempts || 0) + 1;
      action.lastAttempt = Date.now();
      action.errorMessage = errorMessage;
      await this.store('syncQueue', action);
    }
  }

  async setLastSyncTime(key: string, timestamp: number): Promise<void> {
    await this.store('settings', {
      id: `lastSyncTime_${key}`,
      value: timestamp,
      updated_at: new Date().toISOString()
    });
  }

  async addToSyncQueue(operation: any): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const queueItem = {
        ...operation,
        timestamp: Date.now(),
        synced: false
      };
      
      const request = store.put(queueItem);
      request.onsuccess = () => {
        console.log('[OfflineDB] Added to sync queue:', queueItem.id);
        resolve();
      };
      request.onerror = () => {
        console.error('[OfflineDB] Failed to add to sync queue:', request.error);
        reject(request.error);
      };
    });
  }

  async getSyncQueue(): Promise<any[]> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('synced');
      
      const request = index.getAll(IDBKeyRange.only(false));
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('[OfflineDB] Removed from sync queue:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.clear();
      request.onsuccess = () => {
        console.log(`[OfflineDB] Cleared store: ${storeName}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Force close and reinitialize (for troubleshooting)
  async forceReinitialize(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
    await this.init();
  }
}

// Export singleton instance
export const offlineDB = new OfflineDatabase();

// Auto-initialize on import
if (typeof window !== 'undefined') {
  offlineDB.init().catch(error => {
    console.error('[OfflineDB] Auto-initialization failed:', error);
  });
}
