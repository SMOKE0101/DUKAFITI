
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
      
      const request = index.getAll(false);
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
