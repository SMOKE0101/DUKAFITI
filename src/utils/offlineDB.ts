
// Simple offline database utility using IndexedDB
class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private dbName = 'DukaSmartOffline';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sales')) {
          db.createObjectStore('sales', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      };
    });
  }

  async testDatabase(): Promise<boolean> {
    try {
      if (!this.db) await this.init();
      return this.db !== null;
    } catch (error) {
      console.error('Database test failed:', error);
      return false;
    }
  }

  async forceReinitialize(): Promise<void> {
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      await this.init();
    } catch (error) {
      console.error('Force reinitialize failed:', error);
      throw error;
    }
  }

  async getAllOfflineData(storeName: string, userId?: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const data = request.result || [];
        if (userId) {
          resolve(data.filter((item: any) => item.user_id === userId));
        } else {
          resolve(data);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async store(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async storeSale(saleData: any): Promise<void> {
    return this.store('sales', saleData);
  }

  async addToSyncQueue(queueItem: any): Promise<void> {
    return this.store('syncQueue', queueItem);
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProduct(id: string): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getStats(): Promise<any> {
    try {
      if (!this.db) await this.init();
      
      const [products, customers, sales, syncQueue] = await Promise.all([
        this.getAllOfflineData('products'),
        this.getAllOfflineData('customers'),
        this.getAllOfflineData('sales'),
        this.getAllOfflineData('syncQueue')
      ]);

      return {
        products: products.length,
        customers: customers.length,
        sales: sales.length,
        syncQueue: syncQueue.length,
        totalRecords: products.length + customers.length + sales.length + syncQueue.length
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getProducts(userId: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const products = request.result || [];
        // Filter by userId if needed
        resolve(products.filter((p: any) => p.user_id === userId));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getCustomers(userId: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const customers = request.result || [];
        resolve(customers.filter((c: any) => c.user_id === userId));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSales(userId: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sales'], 'readonly');
      const store = transaction.objectStore('sales');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const sales = request.result || [];
        resolve(sales.filter((s: any) => s.user_id === userId));
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineDB = new OfflineDatabase();
