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
  errorMessage?: string;
}

class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly dbName = 'DukaSmartOffline';
  private readonly dbVersion = 3; // Increased version for enhanced robustness
  private isInitializing = false;

  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db && !this.isInitializing) {
      return Promise.resolve();
    }

    this.initPromise = this.initializeDB();
    return this.initPromise;
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[OfflineDB] Initializing database...');
      this.isInitializing = true;
      
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[OfflineDB] Failed to open database:', request.error);
        this.initPromise = null;
        this.isInitializing = false;
        reject(new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitializing = false;
        console.log('[OfflineDB] ✅ Database initialized successfully');
        
        // Add error handler for database
        this.db.onerror = (event) => {
          console.error('[OfflineDB] Database error:', event);
        };
        
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('[OfflineDB] Upgrading database schema...');

        // Create object stores with enhanced error handling
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
            try {
              const store = db.createObjectStore(storeName, { keyPath: 'id' });
              
              // Add indexes for better querying
              if (['products', 'customers', 'sales', 'transactions'].includes(storeName)) {
                store.createIndex('user_id', 'user_id', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
              }
              
              if (storeName === 'syncQueue') {
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('synced', 'synced', { unique: false });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('user_id', 'user_id', { unique: false });
              }
              
              if (storeName === 'sales') {
                store.createIndex('product_id', 'product_id', { unique: false });
                store.createIndex('customer_id', 'customer_id', { unique: false });
                store.createIndex('synced', 'synced', { unique: false });
              }
              
              console.log(`[OfflineDB] ✅ Created store: ${storeName}`);
            } catch (error) {
              console.error(`[OfflineDB] ❌ Failed to create store ${storeName}:`, error);
            }
          }
        });
      };
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db || this.isInitializing) {
      await this.init();
    }
    
    if (!this.db) {
      throw new Error('Database not initialized after init attempt');
    }
  }

  // Enhanced test database functionality with transaction safety
  async testDatabase(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      // Try to perform a simple operation with transaction safety
      const testData = {
        id: 'test_' + Date.now(),
        data: 'test',
        timestamp: new Date().toISOString()
      };
      
      await this.storeOfflineData('settings', testData);
      const retrieved = await this.getOfflineData('settings', testData.id);
      
      // Clean up test data
      await this.delete('settings', testData.id);
      
      if (retrieved && retrieved.id === testData.id) {
        console.log('[OfflineDB] ✅ Database test passed');
        return true;
      } else {
        console.error('[OfflineDB] ❌ Database test failed: data mismatch');
        return false;
      }
    } catch (error) {
      console.error('[OfflineDB] ❌ Database test failed:', error);
      return false;
    }
  }

  async storeOfflineData(storeName: string, data: any): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Ensure data has an ID and timestamp
        if (!data.id) {
          data.id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        if (!data.timestamp) {
          data.timestamp = new Date().toISOString();
        }
        
        const request = store.put(data);
        
        request.onsuccess = () => {
          console.log(`[OfflineDB] ✅ Stored data in ${storeName}:`, data.id);
          resolve();
        };
        
        request.onerror = () => {
          console.error(`[OfflineDB] ❌ Failed to store data in ${storeName}:`, request.error);
          reject(new Error(`Failed to store data: ${request.error?.message || 'Unknown error'}`));
        };
        
        transaction.onerror = () => {
          console.error(`[OfflineDB] ❌ Transaction failed for ${storeName}:`, transaction.error);
          reject(new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`));
        };
      } catch (error) {
        console.error(`[OfflineDB] ❌ Error in storeOfflineData for ${storeName}:`, error);
        reject(error);
      }
    });
  }

  async getOfflineData(storeName: string, id?: string): Promise<any> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      try {
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
        
        transaction.onerror = () => {
          console.error(`[OfflineDB] ❌ Transaction failed for ${storeName}:`, transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error(`[OfflineDB] ❌ Error in getOfflineData for ${storeName}:`, error);
        reject(error);
      }
    });
  }

  async getAllOfflineData(storeName: string, userFilter?: string): Promise<any[]> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      try {
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
        
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        console.error(`[OfflineDB] ❌ Error in getAllOfflineData for ${storeName}:`, error);
        reject(error);
      }
    });
  }

  // Enhanced sale operations with proper error handling and no corruption
  async storeSale(sale: OfflineSale): Promise<void> {
    try {
      console.log('[OfflineDB] 💾 Storing sale offline:', sale.id);
      
      // Validate sale data before storing
      if (!sale.id || !sale.user_id || !sale.product_id) {
        throw new Error('Invalid sale data: missing required fields');
      }
      
      // Store the sale with enhanced transaction safety
      const saleData = {
        ...sale,
        synced: false,
        timestamp: sale.timestamp || new Date().toISOString()
      };
      
      await this.store('sales', saleData);
      
      // Update product stock if product exists (with proper error isolation)
      if (sale.product_id && sale.quantity > 0) {
        try {
          const product = await this.getProduct(sale.product_id);
          if (product && typeof product.current_stock === 'number' && product.current_stock >= 0) {
            const newStock = Math.max(0, product.current_stock - sale.quantity);
            await this.updateProductStock(sale.product_id, newStock);
            console.log(`[OfflineDB] ✅ Updated product stock for ${sale.product_id}: ${product.current_stock} -> ${newStock}`);
          }
        } catch (stockError) {
          console.warn('[OfflineDB] ⚠️ Failed to update product stock (sale still stored):', stockError);
          // Don't fail the sale if stock update fails - sale is still valid
        }
      }
      
      console.log('[OfflineDB] ✅ Sale stored successfully offline');
    } catch (error) {
      console.error('[OfflineDB] ❌ Failed to store sale:', error);
      throw new Error(`Failed to store sale: ${error.message}`);
    }
  }

  // Enhanced methods for specific data types
  async store(storeName: string, data: any): Promise<void> {
    return this.storeOfflineData(storeName, data);
  }

  async delete(storeName: string, id: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.delete(id);
        request.onsuccess = () => {
          console.log(`[OfflineDB] ✅ Deleted from ${storeName}:`, id);
          resolve();
        };
        request.onerror = () => reject(request.error);
        
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        console.error(`[OfflineDB] ❌ Error in delete for ${storeName}:`, error);
        reject(error);
      }
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

  // Enhanced sync queue methods with better error handling
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

  async addToSyncQueue(operation: any): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        
        const queueItem = {
          ...operation,
          id: operation.id || `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          synced: false,
          attempts: 0
        };
        
        const request = store.put(queueItem);
        request.onsuccess = () => {
          console.log('[OfflineDB] ✅ Added to sync queue:', queueItem.id);
          resolve();
        };
        request.onerror = () => {
          console.error('[OfflineDB] ❌ Failed to add to sync queue:', request.error);
          reject(request.error);
        };
        
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        console.error('[OfflineDB] ❌ Error in addToSyncQueue:', error);
        reject(error);
      }
    });
  }

  async getSyncQueue(): Promise<any[]> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['syncQueue'], 'readonly');
        const store = transaction.objectStore('syncQueue');
        
        const request = store.getAll();
        request.onsuccess = () => {
          const results = request.result || [];
          const unsynced = results.filter(item => !item.synced);
          resolve(unsynced);
        };
        request.onerror = () => reject(request.error);
        
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        console.error('[OfflineDB] ❌ Error in getSyncQueue:', error);
        reject(error);
      }
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        
        const request = store.delete(id);
        request.onsuccess = () => {
          console.log('[OfflineDB] ✅ Removed from sync queue:', id);
          resolve();
        };
        request.onerror = () => reject(request.error);
        
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        console.error('[OfflineDB] ❌ Error in removeFromSyncQueue:', error);
        reject(error);
      }
    });
  }

  async clearStore(storeName: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.clear();
        request.onsuccess = () => {
          console.log(`[OfflineDB] ✅ Cleared store: ${storeName}`);
          resolve();
        };
        request.onerror = () => reject(request.error);
        
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        console.error(`[OfflineDB] ❌ Error in clearStore for ${storeName}:`, error);
        reject(error);
      }
    });
  }

  // Force close and reinitialize (for troubleshooting)
  async forceReinitialize(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
    this.isInitializing = false;
    await this.init();
  }

  // Get database stats for debugging
  async getStats(): Promise<{ [key: string]: number }> {
    const stats: { [key: string]: number } = {};
    const stores = ['sales', 'products', 'customers', 'transactions', 'syncQueue'];
    
    for (const storeName of stores) {
      try {
        const data = await this.getAllOfflineData(storeName);
        stats[storeName] = Array.isArray(data) ? data.length : 0;
      } catch (error) {
        console.error(`[OfflineDB] ❌ Failed to get stats for ${storeName}:`, error);
        stats[storeName] = 0;
      }
    }
    
    return stats;
  }
}

// Export singleton instance
export const offlineDB = new OfflineDatabase();

// Auto-initialize on import with better error handling
if (typeof window !== 'undefined') {
  offlineDB.init().then(async () => {
    console.log('[OfflineDB] ✅ Auto-initialization successful');
    
    // Test the database after initialization
    const testResult = await offlineDB.testDatabase();
    if (testResult) {
      console.log('[OfflineDB] ✅ Database test passed after initialization');
    } else {
      console.warn('[OfflineDB] ⚠️ Database test failed after initialization');
    }
  }).catch(error => {
    console.error('[OfflineDB] ❌ Auto-initialization failed:', error);
  });
}
