
import { openDB, IDBPDatabase } from 'idb';

export interface OfflineProduct {
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
  synced?: boolean;
}

export interface OfflineCustomer {
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
  synced?: boolean;
}

export interface OfflineSale {
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
  synced?: boolean;
}

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: 'products' | 'customers' | 'sales' | 'transactions';
  data: any;
  timestamp: number;
  user_id: string;
  synced: boolean;
  retry_count: number;
  error?: string;
}

class OfflineDBManager {
  private db: IDBPDatabase | null = null;
  private dbName = 'DukaSmartOffline';
  private version = 2;

  async init(): Promise<void> {
    try {
      this.db = await openDB(this.dbName, this.version, {
        upgrade(db, oldVersion) {
          console.log('[OfflineDB] Upgrading database from version', oldVersion);

          // Products store
          if (!db.objectStoreNames.contains('products')) {
            const productsStore = db.createObjectStore('products', { keyPath: 'id' });
            productsStore.createIndex('user_id', 'user_id');
            productsStore.createIndex('category', 'category');
            productsStore.createIndex('synced', 'synced');
          }

          // Customers store
          if (!db.objectStoreNames.contains('customers')) {
            const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
            customersStore.createIndex('user_id', 'user_id');
            customersStore.createIndex('phone', 'phone');
            customersStore.createIndex('synced', 'synced');
          }

          // Sales store
          if (!db.objectStoreNames.contains('sales')) {
            const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
            salesStore.createIndex('user_id', 'user_id');
            salesStore.createIndex('product_id', 'product_id');
            salesStore.createIndex('customer_id', 'customer_id');
            salesStore.createIndex('timestamp', 'timestamp');
            salesStore.createIndex('synced', 'synced');
          }

          // Action queue store
          if (!db.objectStoreNames.contains('actionQueue')) {
            const queueStore = db.createObjectStore('actionQueue', { keyPath: 'id' });
            queueStore.createIndex('user_id', 'user_id');
            queueStore.createIndex('timestamp', 'timestamp');
            queueStore.createIndex('synced', 'synced');
            queueStore.createIndex('type', 'type');
            queueStore.createIndex('table', 'table');
          }

          // Sync metadata store
          if (!db.objectStoreNames.contains('syncMetadata')) {
            const metadataStore = db.createObjectStore('syncMetadata', { keyPath: 'key' });
          }
        },
      });

      console.log('[OfflineDB] Database initialized successfully');
    } catch (error) {
      console.error('[OfflineDB] Failed to initialize database:', error);
      throw error;
    }
  }

  // Generic CRUD operations
  async store<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).put(data);
    await tx.done;
  }

  async getAll<T>(storeName: string, userId?: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    
    if (userId) {
      const index = store.index('user_id');
      return await index.getAll(userId);
    }
    
    return await store.getAll();
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction(storeName, 'readonly');
    return await tx.objectStore(storeName).get(id);
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).delete(id);
    await tx.done;
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    await tx.done;
  }

  // Products operations
  async storeProducts(products: OfflineProduct[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    
    for (const product of products) {
      await store.put({ ...product, synced: true });
    }
    
    await tx.done;
    console.log(`[OfflineDB] Stored ${products.length} products`);
  }

  async getProducts(userId: string): Promise<OfflineProduct[]> {
    return this.getAll<OfflineProduct>('products', userId);
  }

  async getProduct(id: string): Promise<OfflineProduct | undefined> {
    return this.get<OfflineProduct>('products', id);
  }

  async updateProductStock(productId: string, newStock: number): Promise<void> {
    const product = await this.getProduct(productId);
    if (product) {
      product.current_stock = newStock;
      product.updated_at = new Date().toISOString();
      await this.store('products', product);
    }
  }

  // Customers operations
  async storeCustomers(customers: OfflineCustomer[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction('customers', 'readwrite');
    const store = tx.objectStore('customers');
    
    for (const customer of customers) {
      await store.put({ ...customer, synced: true });
    }
    
    await tx.done;
    console.log(`[OfflineDB] Stored ${customers.length} customers`);
  }

  async getCustomers(userId: string): Promise<OfflineCustomer[]> {
    return this.getAll<OfflineCustomer>('customers', userId);
  }

  async getCustomer(id: string): Promise<OfflineCustomer | undefined> {
    return this.get<OfflineCustomer>('customers', id);
  }

  // Sales operations
  async storeSales(sales: OfflineSale[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction('sales', 'readwrite');
    const store = tx.objectStore('sales');
    
    for (const sale of sales) {
      await store.put({ ...sale, synced: true });
    }
    
    await tx.done;
    console.log(`[OfflineDB] Stored ${sales.length} sales`);
  }

  async getSales(userId: string): Promise<OfflineSale[]> {
    return this.getAll<OfflineSale>('sales', userId);
  }

  async getSale(id: string): Promise<OfflineSale | undefined> {
    return this.get<OfflineSale>('sales', id);
  }

  // Action queue operations
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retry_count'>): Promise<string> {
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedAction: OfflineAction = {
      ...action,
      id: actionId,
      timestamp: Date.now(),
      synced: false,
      retry_count: 0
    };

    await this.store('actionQueue', queuedAction);
    console.log('[OfflineDB] Action queued:', queuedAction.type, queuedAction.table);
    
    return actionId;
  }

  async getQueuedActions(userId: string): Promise<OfflineAction[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction('actionQueue', 'readonly');
    const index = tx.objectStore('actionQueue').index('user_id');
    const actions = await index.getAll(userId);
    
    return actions.filter(action => !action.synced);
  }

  async markActionSynced(actionId: string): Promise<void> {
    const action = await this.get<OfflineAction>('actionQueue', actionId);
    if (action) {
      action.synced = true;
      await this.store('actionQueue', action);
    }
  }

  async markActionFailed(actionId: string, error: string): Promise<void> {
    const action = await this.get<OfflineAction>('actionQueue', actionId);
    if (action) {
      action.retry_count++;
      action.error = error;
      await this.store('actionQueue', action);
    }
  }

  async removeAction(actionId: string): Promise<void> {
    await this.delete('actionQueue', actionId);
  }

  // Sync metadata operations
  async getLastSyncTime(key: string): Promise<number | null> {
    const metadata = await this.get<{ key: string; timestamp: number }>('syncMetadata', key);
    return metadata?.timestamp || null;
  }

  async setLastSyncTime(key: string, timestamp: number): Promise<void> {
    await this.store('syncMetadata', { key, timestamp });
  }

  // Utility operations
  async getStorageStats(): Promise<{ [key: string]: number }> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stats: { [key: string]: number } = {};
    const storeNames = ['products', 'customers', 'sales', 'actionQueue'];
    
    for (const storeName of storeNames) {
      const tx = this.db.transaction(storeName, 'readonly');
      const count = await tx.objectStore(storeName).count();
      stats[storeName] = count;
    }
    
    return stats;
  }

  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  async executeOfflineAction(actionId: string, product?: OfflineProduct, customer?: OfflineCustomer, sale?: OfflineSale): Promise<void> {
    // Execute the action locally for immediate UI feedback
    if (product) {
      await this.store('products', { ...product, synced: false });
    }
    if (customer) {
      await this.store('customers', { ...customer, synced: false });
    }
    if (sale) {
      await this.store('sales', { ...sale, synced: false });
      
      // Update product stock locally
      if (sale.product_id && sale.quantity) {
        const existingProduct = await this.getProduct(sale.product_id);
        if (existingProduct) {
          await this.updateProductStock(sale.product_id, existingProduct.current_stock - sale.quantity);
        }
      }
    }
  }
}

export const offlineDB = new OfflineDBManager();

// Initialize the database when the module loads
offlineDB.init().catch(error => {
  console.error('[OfflineDB] Failed to initialize:', error);
});
