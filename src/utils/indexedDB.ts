
// IndexedDB wrapper with encryption support
import CryptoJS from 'crypto-js';

const DB_NAME = 'DukaFitiOfflineDB';
const DB_VERSION = 1;
const ENCRYPTION_KEY = 'dukafiti-offline-key-2025';

interface OfflineData {
  id: string;
  type: 'sale' | 'inventory' | 'customer' | 'transaction';
  data: any;
  timestamp: string;
  synced: boolean;
  operation: 'create' | 'update' | 'delete';
  priority: 'high' | 'medium' | 'low';
}

class OfflineDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Sales store
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('timestamp', 'timestamp');
          salesStore.createIndex('synced', 'synced');
        }

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productsStore = db.createObjectStore('products', { keyPath: 'id' });
          productsStore.createIndex('category', 'category');
          productsStore.createIndex('updated_at', 'updated_at');
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
          customersStore.createIndex('name', 'name');
          customersStore.createIndex('phone', 'phone');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('priority', 'priority');
          syncStore.createIndex('timestamp', 'timestamp');
          syncStore.createIndex('type', 'type');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  private encrypt(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  }

  private decrypt(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  async addToSyncQueue(operation: OfflineData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    const encryptedOperation = {
      ...operation,
      data: this.encrypt(operation.data)
    };

    await store.add(encryptedOperation);
  }

  async getSyncQueue(): Promise<OfflineData[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('priority');

    return new Promise((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => {
        const operations = request.result.map(op => ({
          ...op,
          data: this.decrypt(op.data)
        }));
        resolve(operations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    await store.delete(id);
  }

  async storeOfflineData(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const encryptedData = {
      ...data,
      _encrypted: this.encrypt(data)
    };

    await store.put(encryptedData);
  }

  async getOfflineData(storeName: string, id?: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = id ? store.get(id) : store.getAll();
      request.onsuccess = () => {
        const result = request.result;
        if (Array.isArray(result)) {
          resolve(result.map(item => this.decrypt(item._encrypted)));
        } else if (result) {
          resolve(this.decrypt(result._encrypted));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await store.clear();
  }
}

export const offlineDB = new OfflineDB();
