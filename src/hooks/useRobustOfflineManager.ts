import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '../integrations/supabase/client';

interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  syncProgress: number;
  lastSyncTime: string | null;
  errors: string[];
}

interface OfflineOperation {
  id: string;
  type: 'sale' | 'product' | 'customer';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  synced: boolean;
}

// Enhanced IndexedDB with proper field mapping
class RobustOfflineDB {
  private db: IDBDatabase | null = null;
  private dbName = 'DukaFitiRobust';
  private version = 3;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('RobustOfflineDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('RobustOfflineDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // Clear existing stores
    const existingStores = Array.from(db.objectStoreNames);
    existingStores.forEach(storeName => {
      if (db.objectStoreNames.contains(storeName)) {
        db.deleteObjectStore(storeName);
      }
    });

    // Sales store
    const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
    salesStore.createIndex('userId', 'userId', { unique: false });
    salesStore.createIndex('timestamp', 'timestamp', { unique: false });
    salesStore.createIndex('synced', 'synced', { unique: false });

    // Products store
    const productsStore = db.createObjectStore('products', { keyPath: 'id' });
    productsStore.createIndex('userId', 'userId', { unique: false });
    productsStore.createIndex('category', 'category', { unique: false });

    // Customers store
    const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
    customersStore.createIndex('userId', 'userId', { unique: false });
    customersStore.createIndex('name', 'name', { unique: false });

    // Sync queue
    const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
    syncStore.createIndex('type', 'type', { unique: false });
    syncStore.createIndex('priority', 'priority', { unique: false });
    syncStore.createIndex('timestamp', 'timestamp', { unique: false });

    console.log('RobustOfflineDB stores created successfully');
  }

  // Field name transformation - handles snake_case ↔ camelCase conversion
  transformFields(obj: any, toFormat: 'camelCase' | 'snake_case'): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      let newKey = key;
      
      if (toFormat === 'camelCase') {
        // snake_case to camelCase
        newKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      } else {
        // camelCase to snake_case
        newKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      }
      
      result[newKey] = value;
    }
    
    return result;
  }

  async storeData(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Ensure data has proper camelCase format for local storage
    const transformedData = this.transformFields(data, 'camelCase');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.put(transformedData);
      
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
      
      request.onsuccess = () => {
        const result = request.result;
        // Keep camelCase format for frontend
        if (Array.isArray(result)) {
          resolve(result.map(item => this.transformFields(item, 'camelCase')));
        } else {
          resolve(this.transformFields(result, 'camelCase'));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addToSyncQueue(operation: OfflineOperation): Promise<void> {
    return this.storeData('syncQueue', operation);
  }

  async getSyncQueue(): Promise<OfflineOperation[]> {
    const operations = await this.getData('syncQueue');
    return Array.isArray(operations) ? operations.filter(op => !op.synced) : [];
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
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
}

const robustOfflineDB = new RobustOfflineDB();

export const useRobustOfflineManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    isSyncing: false,
    pendingOperations: 0,
    syncProgress: 0,
    lastSyncTime: localStorage.getItem('robustLastSyncTime'),
    errors: []
  });

  // Initialize robust offline system
  useEffect(() => {
    initializeRobustOfflineSystem();
    
    const handleOnline = () => {
      console.log('[RobustOfflineManager] Online detected');
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      if (user) {
        setTimeout(() => syncPendingOperations(), 1000);
      }
    };

    const handleOffline = () => {
      console.log('[RobustOfflineManager] Offline detected');
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const initializeRobustOfflineSystem = async () => {
    try {
      console.log('[RobustOfflineManager] Initializing robust offline system...');
      
      // Unregister all existing service workers to prevent conflicts
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
        console.log('[RobustOfflineManager] Cleared existing service workers');
      }

      // Initialize enhanced IndexedDB
      await robustOfflineDB.init();
      
      // Register single robust service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/robust-sw.js', {
            scope: '/'
          });
          console.log('[RobustOfflineManager] Robust Service Worker registered:', registration.scope);
        } catch (error) {
          console.error('[RobustOfflineManager] Service Worker registration failed:', error);
        }
      }
      
      // Load pending operations
      await loadPendingOperationsCount();
      
      setOfflineState(prev => ({ ...prev, isInitialized: true }));
      console.log('[RobustOfflineManager] Robust offline system initialized successfully');
      
    } catch (error) {
      console.error('[RobustOfflineManager] Failed to initialize robust offline system:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isInitialized: true,
        errors: [...prev.errors, `Robust initialization failed: ${error.message}`]
      }));
    }
  };

  const loadPendingOperationsCount = async () => {
    try {
      const queue = await robustOfflineDB.getSyncQueue();
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: queue?.length || 0 
      }));
    } catch (error) {
      console.error('[RobustOfflineManager] Failed to load pending operations:', error);
    }
  };

  // Add robust offline operation
  const addOfflineOperation = useCallback(async (
    type: 'sale' | 'product' | 'customer',
    operation: 'create' | 'update' | 'delete',
    data: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> => {
    const operationId = `${type}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineOperation: OfflineOperation = {
      id: operationId,
      type,
      operation,
      data: { ...data, userId: user?.id },
      timestamp: new Date().toISOString(),
      priority,
      attempts: 0,
      synced: false
    };

    try {
      // Store in robust IndexedDB
      await robustOfflineDB.addToSyncQueue(offlineOperation);
      
      // Update local storage immediately
      await updateLocalStorage(type, operation, data);
      
      // Update pending count
      await loadPendingOperationsCount();
      
      // Try immediate sync if online
      if (offlineState.isOnline && user) {
        setTimeout(() => syncPendingOperations(), 500);
      }
      
      console.log(`[RobustOfflineManager] Added ${type} ${operation} to robust offline queue:`, operationId);
      return operationId;
      
    } catch (error) {
      console.error('[RobustOfflineManager] Failed to add robust offline operation:', error);
      throw error;
    }
  }, [user, offlineState.isOnline]);

  // Update local storage with proper field mapping
  const updateLocalStorage = async (type: string, operation: string, data: any) => {
    try {
      switch (type) {
        case 'sale':
          if (operation === 'create') {
            await robustOfflineDB.storeData('sales', data);
            // Update product stock locally
            if (data.productId && data.quantity) {
              const product = await robustOfflineDB.getData('products', data.productId);
              if (product) {
                product.currentStock = Math.max(0, product.currentStock - data.quantity);
                await robustOfflineDB.storeData('products', product);
              }
            }
          }
          break;
          
        case 'product':
          await robustOfflineDB.storeData('products', data);
          break;
          
        case 'customer':
          await robustOfflineDB.storeData('customers', data);
          break;
      }
    } catch (error) {
      console.error('[RobustOfflineManager] Failed to update robust local storage:', error);
    }
  };

  // Robust sync operations
  const syncPendingOperations = useCallback(async () => {
    if (!offlineState.isOnline || offlineState.isSyncing || !user) {
      return;
    }

    setOfflineState(prev => ({ 
      ...prev, 
      isSyncing: true, 
      syncProgress: 0,
      errors: []
    }));

    try {
      const operations = await robustOfflineDB.getSyncQueue();
      const totalOperations = operations?.length || 0;

      if (totalOperations === 0) {
        setOfflineState(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncTime: new Date().toISOString()
        }));
        localStorage.setItem('robustLastSyncTime', new Date().toISOString());
        return;
      }

      console.log(`[RobustOfflineManager] Starting robust sync of ${totalOperations} operations`);

      // Sort by priority and timestamp
      const sortedOperations = operations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      let completed = 0;
      const errors: string[] = [];

      for (const operation of sortedOperations) {
        try {
          const success = await syncSingleOperation(operation);
          if (success) {
            await robustOfflineDB.removeFromSyncQueue(operation.id);
            completed++;
          } else {
            // Increment attempts
            operation.attempts++;
            if (operation.attempts >= 3) {
              await robustOfflineDB.removeFromSyncQueue(operation.id);
              errors.push(`Max attempts reached for ${operation.type} ${operation.operation}`);
            } else {
              await robustOfflineDB.addToSyncQueue(operation);
            }
          }
        } catch (error) {
          console.error(`[RobustOfflineManager] Failed to sync operation ${operation.id}:`, error);
          errors.push(`Failed to sync ${operation.type}: ${error.message}`);
        }

        // Update progress
        const progress = Math.round(((completed + errors.length) / totalOperations) * 100);
        setOfflineState(prev => ({ ...prev, syncProgress: progress }));
      }

      const finalPendingCount = totalOperations - completed;
      const syncTime = new Date().toISOString();
      
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        pendingOperations: finalPendingCount,
        lastSyncTime: syncTime,
        errors: errors
      }));

      localStorage.setItem('robustLastSyncTime', syncTime);
      
      if (completed > 0) {
        toast({
          title: "Sync Complete",
          description: `${completed} operations synced successfully`,
          duration: 3000,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Sync Issues",
          description: `${errors.length} operations failed to sync`,
          variant: "destructive",
          duration: 5000,
        });
      }

      console.log(`[RobustOfflineManager] Robust sync completed: ${completed} synced, ${errors.length} errors, ${finalPendingCount} pending`);

    } catch (error) {
      console.error('[RobustOfflineManager] Robust sync process failed:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        errors: [...prev.errors, `Robust sync failed: ${error.message}`]
      }));
    }
  }, [offlineState.isOnline, offlineState.isSyncing, user, toast]);

  const syncSingleOperation = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      // Transform data to snake_case for database
      const dbData = robustOfflineDB.transformFields(operation.data, 'snake_case');
      
      switch (operation.type) {
        case 'sale':
          return await syncSale(operation, dbData);
        case 'product':
          return await syncProduct(operation, dbData);
        case 'customer':
          return await syncCustomer(operation, dbData);
        default:
          console.warn(`[RobustOfflineManager] Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      console.error(`[RobustOfflineManager] Error syncing ${operation.type}:`, error);
      return false;
    }
  };

  const syncSale = async (operation: OfflineOperation, dbData: any): Promise<boolean> => {
    try {
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('sales')
          .insert([{
            user_id: user?.id,
            product_id: dbData.product_id,
            product_name: dbData.product_name,
            quantity: dbData.quantity,
            selling_price: dbData.selling_price,
            cost_price: dbData.cost_price,
            profit: dbData.profit,
            total_amount: dbData.total_amount,
            payment_method: dbData.payment_method,
            customer_id: dbData.customer_id,
            customer_name: dbData.customer_name,
            payment_details: dbData.payment_details || {},
            timestamp: dbData.timestamp || new Date().toISOString(),
            synced: true
          }]);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[RobustOfflineManager] Sale sync error:', error);
      return false;
    }
  };

  const syncProduct = async (operation: OfflineOperation, dbData: any): Promise<boolean> => {
    try {
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('products')
          .insert([{
            user_id: user?.id,
            name: dbData.name,
            category: dbData.category,
            cost_price: dbData.cost_price,
            selling_price: dbData.selling_price,
            current_stock: dbData.current_stock || 0,
            low_stock_threshold: dbData.low_stock_threshold || 10
          }]);
        
        return !error;
      } else if (operation.operation === 'update') {
        const { error } = await supabase
          .from('products')
          .update(dbData.updates)
          .eq('id', dbData.id)
          .eq('user_id', user?.id);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[RobustOfflineManager] Product sync error:', error);
      return false;
    }
  };

  const syncCustomer = async (operation: OfflineOperation, dbData: any): Promise<boolean> => {
    try {
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('customers')
          .insert([{
            user_id: user?.id,
            name: dbData.name,
            phone: dbData.phone,
            email: dbData.email,
            address: dbData.address,
            credit_limit: dbData.credit_limit || 1000,
            outstanding_debt: dbData.outstanding_debt || 0
          }]);
        
        return !error;
      } else if (operation.operation === 'update') {
        const { error } = await supabase
          .from('customers')
          .update(dbData.updates)
          .eq('id', dbData.id)
          .eq('user_id', user?.id);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[RobustOfflineManager] Customer sync error:', error);
      return false;
    }
  };

  // Force sync now
  const forceSyncNow = useCallback(async () => {
    if (offlineState.isOnline && !offlineState.isSyncing) {
      await syncPendingOperations();
    } else if (!offlineState.isOnline) {
      toast({
        title: "Offline Mode",
        description: "Cannot sync while offline. Data will sync when connection is restored.",
        variant: "default",
      });
    }
  }, [offlineState.isOnline, offlineState.isSyncing, syncPendingOperations, toast]);

  // Clear sync errors
  const clearSyncErrors = useCallback(() => {
    setOfflineState(prev => ({ ...prev, errors: [] }));
  }, []);

  // Get offline data with proper field transformation
  const getOfflineData = useCallback(async (type: string, id?: string) => {
    try {
      return await robustOfflineDB.getData(type, id);
    } catch (error) {
      console.error(`[RobustOfflineManager] Failed to get robust offline data for ${type}:`, error);
      return null;
    }
  }, []);

  // Test robust offline functionality
  const testRobustOffline = useCallback(async () => {
    console.log('[RobustOfflineManager] Testing robust offline functionality...');
    
    try {
      // Test data creation with proper field mapping
      const testSale = {
        id: 'test_sale_' + Date.now(),
        productId: 'test_product_123',
        productName: 'Test Product',
        quantity: 2,
        sellingPrice: 100,
        costPrice: 50,
        profit: 50,
        totalAmount: 200,
        paymentMethod: 'cash',
        timestamp: new Date().toISOString(),
        synced: false
      };

      // Test storing robust offline operation
      await addOfflineOperation('sale', 'create', testSale, 'high');
      console.log('[RobustOfflineManager] ✅ Robust offline operation test passed');

      // Test sync queue
      const queue = await robustOfflineDB.getSyncQueue();
      console.log('[RobustOfflineManager] ✅ Robust sync queue test passed, items:', queue.length);

      return {
        success: true,
        message: 'Robust offline functionality working correctly',
        pendingOperations: queue.length
      };

    } catch (error) {
      console.error('[RobustOfflineManager] ❌ Robust offline test failed:', error);
      return {
        success: false,
        message: 'Robust offline test failed',
        error: error.message
      };
    }
  }, [addOfflineOperation]);

  return {
    ...offlineState,
    addOfflineOperation,
    syncPendingOperations,
    forceSyncNow,
    clearSyncErrors,
    getOfflineData,
    testRobustOffline,
    robustOfflineDB
  };
};
