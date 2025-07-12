
import { useState, useEffect, useCallback } from 'react';

interface OfflineFirstOptions<T> {
  cacheKey: string;
  tableName: string;
  loadFromSupabase: () => Promise<T[]>;
  transformToLocal: (item: any) => T;
  transformFromLocal: (item: T) => any;
}

// Enhanced IndexedDB manager for offline-first functionality
class OfflineFirstDB {
  private db: IDBDatabase | null = null;
  private dbName = 'DukaFitiOfflineFirst';
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
        
        // Create stores for each data type
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async getCachedData(key: string): Promise<any[]> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          console.log(`[OfflineFirst] Retrieved cached data for ${key}:`, result.data.length, 'items');
          resolve(result.data);
        } else {
          console.log(`[OfflineFirst] No cached data found for ${key}`);
          resolve([]);
        }
      };
      request.onerror = () => {
        console.error(`[OfflineFirst] Error retrieving cache for ${key}:`, request.error);
        resolve([]);
      };
    });
  }

  async setCachedData(key: string, data: any[]): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const cacheEntry = {
        key,
        data,
        timestamp: Date.now()
      };

      const request = store.put(cacheEntry);
      
      request.onsuccess = () => {
        console.log(`[OfflineFirst] Cached data for ${key}:`, data.length, 'items');
        resolve();
      };
      request.onerror = () => {
        console.error(`[OfflineFirst] Error caching data for ${key}:`, request.error);
        reject(request.error);
      };
    });
  }

  async clearCache(key?: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      if (key) {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } else {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }
    });
  }
}

const offlineFirstDB = new OfflineFirstDB();

export function useOfflineFirstSupabase<T>({
  cacheKey,
  tableName,
  loadFromSupabase,
  transformToLocal,
  transformFromLocal
}: OfflineFirstOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    localStorage.getItem(`lastSync_${cacheKey}`)
  );

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log(`[OfflineFirst-${cacheKey}] Network online detected`);
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log(`[OfflineFirst-${cacheKey}] Network offline detected`);
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [cacheKey]);

  // Load data with offline-first strategy
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError('');

      console.log(`[OfflineFirst-${cacheKey}] Loading data... Online: ${isOnline}, Force refresh: ${forceRefresh}`);

      // Always try to load cached data first for immediate display
      let cachedData: any[] = [];
      try {
        cachedData = await offlineFirstDB.getCachedData(cacheKey);
        if (cachedData && cachedData.length > 0) {
          const transformedData = cachedData.map(transformToLocal);
          setData(transformedData);
          console.log(`[OfflineFirst-${cacheKey}] Loaded cached data:`, transformedData.length, 'items');
        }
      } catch (cacheError) {
        console.warn(`[OfflineFirst-${cacheKey}] Cache read error:`, cacheError);
      }

      // If online, try to fetch fresh data from Supabase
      if (isOnline && !forceRefresh || forceRefresh) {
        try {
          console.log(`[OfflineFirst-${cacheKey}] Fetching fresh data from Supabase...`);
          const freshData = await loadFromSupabase();
          
          if (freshData && freshData.length >= 0) {
            console.log(`[OfflineFirst-${cacheKey}] Received fresh data:`, freshData.length, 'items');
            
            // Update local state with fresh data
            setData(freshData);
            
            // Cache the fresh data for offline use
            try {
              const dataToCache = freshData.map(transformFromLocal);
              await offlineFirstDB.setCachedData(cacheKey, dataToCache);
              
              // Update last sync time
              const syncTime = new Date().toISOString();
              setLastSyncTime(syncTime);
              localStorage.setItem(`lastSync_${cacheKey}`, syncTime);
              
              console.log(`[OfflineFirst-${cacheKey}] Successfully synced and cached fresh data`);
            } catch (cacheError) {
              console.warn(`[OfflineFirst-${cacheKey}] Failed to cache fresh data:`, cacheError);
            }
          }
        } catch (supabaseError) {
          console.error(`[OfflineFirst-${cacheKey}] Supabase fetch error:`, supabaseError);
          
          // If we have cached data, use it and show a warning
          if (cachedData && cachedData.length > 0) {
            setError(`Using offline data. Sync failed: ${supabaseError.message}`);
            console.log(`[OfflineFirst-${cacheKey}] Using cached data due to Supabase error`);
          } else {
            // No cached data available, show error
            setError(`Failed to load ${tableName}. Please check your connection.`);
            setData([]);
          }
        }
      } else if (!isOnline) {
        // Offline mode
        if (cachedData && cachedData.length > 0) {
          console.log(`[OfflineFirst-${cacheKey}] Operating in offline mode with cached data`);
          setError(''); // Clear any previous errors when we have cached data
        } else {
          console.log(`[OfflineFirst-${cacheKey}] No cached data available for offline mode`);
          setError(`No ${tableName} available offline. Please connect to sync data.`);
          setData([]);
        }
      }
    } catch (generalError) {
      console.error(`[OfflineFirst-${cacheKey}] General loading error:`, generalError);
      setError(`Failed to load ${tableName}: ${generalError.message}`);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, tableName, isOnline, loadFromSupabase, transformToLocal, transformFromLocal]);

  // Refresh function
  const refresh = useCallback(async () => {
    console.log(`[OfflineFirst-${cacheKey}] Manual refresh triggered`);
    await loadData(true);
  }, [loadData, cacheKey]);

  // Test offline functionality
  const testOffline = useCallback(async () => {
    console.log(`[OfflineFirst-${cacheKey}] Testing offline functionality...`);
    
    try {
      // Test cache operations
      const testData = [{ id: 'test-1', name: 'Test Item', test: true }];
      await offlineFirstDB.setCachedData(`test_${cacheKey}`, testData);
      const retrievedData = await offlineFirstDB.getCachedData(`test_${cacheKey}`);
      
      const success = retrievedData.length === 1 && retrievedData[0].id === 'test-1';
      
      // Clean up test data
      await offlineFirstDB.clearCache(`test_${cacheKey}`);
      
      console.log(`[OfflineFirst-${cacheKey}] Offline test result:`, success ? 'PASSED' : 'FAILED');
      
      return {
        success,
        message: success ? 'Offline functionality working correctly' : 'Offline test failed',
        cacheKey,
        dataCount: data.length,
        lastSyncTime
      };
    } catch (error) {
      console.error(`[OfflineFirst-${cacheKey}] Offline test error:`, error);
      return {
        success: false,
        message: `Offline test failed: ${error.message}`,
        cacheKey,
        error: error.message
      };
    }
  }, [cacheKey, data.length, lastSyncTime]);

  // Initialize data loading
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when coming back online
  useEffect(() => {
    if (isOnline) {
      console.log(`[OfflineFirst-${cacheKey}] Network restored, reloading data...`);
      loadData();
    }
  }, [isOnline, loadData, cacheKey]);

  return {
    data,
    loading,
    error,
    refresh,
    isOnline,
    lastSyncTime,
    testOffline
  };
}
