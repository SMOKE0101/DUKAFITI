
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

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
  type: 'sale' | 'product' | 'customer' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  synced: boolean;
}

// Enhanced IndexedDB Manager
class EnhancedOfflineDB {
  private db: IDBDatabase | null = null;
  private dbName = 'DukaFitiEnhanced';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Enhanced IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Enhanced IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // Sales store with proper field mapping
    if (!db.objectStoreNames.contains('sales')) {
      const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
      salesStore.createIndex('user_id', 'user_id', { unique: false });
      salesStore.createIndex('productId', 'productId', { unique: false });
      salesStore.createIndex('timestamp', 'timestamp', { unique: false });
      salesStore.createIndex('synced', 'synced', { unique: false });
    }

    // Products store with camelCase fields
    if (!db.objectStoreNames.contains('products')) {
      const productsStore = db.createObjectStore('products', { keyPath: 'id' });
      productsStore.createIndex('user_id', 'user_id', { unique: false });
      productsStore.createIndex('category', 'category', { unique: false });
      productsStore.createIndex('name', 'name', { unique: false });
    }

    // Customers store with camelCase fields
    if (!db.objectStoreNames.contains('customers')) {
      const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
      customersStore.createIndex('user_id', 'user_id', { unique: false });
      customersStore.createIndex('name', 'name', { unique: false });
      customersStore.createIndex('phone', 'phone', { unique: false });
    }

    // Enhanced sync queue
    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
      syncStore.createIndex('type', 'type', { unique: false });
      syncStore.createIndex('priority', 'priority', { unique: false });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      syncStore.createIndex('synced', 'synced', { unique: false });
    }

    console.log('Enhanced IndexedDB stores created successfully');
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

  async addToSyncQueue(operation: OfflineOperation): Promise<void> {
    return this.storeData('syncQueue', operation);
  }

  async getSyncQueue(): Promise<OfflineOperation[]> {
    return this.getData('syncQueue');
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

const enhancedOfflineDB = new EnhancedOfflineDB();

export const useEnhancedOfflineManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    isSyncing: false,
    pendingOperations: 0,
    syncProgress: 0,
    lastSyncTime: localStorage.getItem('lastSyncTime'),
    errors: []
  });

  // Initialize enhanced offline system
  useEffect(() => {
    initializeEnhancedOfflineSystem();
    
    const handleOnline = () => {
      console.log('[EnhancedOfflineManager] Online detected');
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      if (user) {
        setTimeout(() => syncPendingOperations(), 1000);
      }
    };

    const handleOffline = () => {
      console.log('[EnhancedOfflineManager] Offline detected');
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const initializeEnhancedOfflineSystem = async () => {
    try {
      console.log('[EnhancedOfflineManager] Initializing enhanced offline system...');
      
      // Initialize enhanced IndexedDB
      await enhancedOfflineDB.init();
      
      // Register single enhanced service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/enhanced-sw.js', {
            scope: '/'
          });
          console.log('[EnhancedOfflineManager] Enhanced Service Worker registered:', registration.scope);
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast({
                    title: "App Updated",
                    description: "New version available. Restart to apply updates.",
                    duration: 5000,
                  });
                }
              });
            }
          });
          
        } catch (error) {
          console.error('[EnhancedOfflineManager] Service Worker registration failed:', error);
        }
      }
      
      // Load pending operations
      await loadPendingOperationsCount();
      
      setOfflineState(prev => ({ ...prev, isInitialized: true }));
      console.log('[EnhancedOfflineManager] Enhanced offline system initialized successfully');
      
    } catch (error) {
      console.error('[EnhancedOfflineManager] Failed to initialize enhanced offline system:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isInitialized: true,
        errors: [...prev.errors, `Enhanced initialization failed: ${error.message}`]
      }));
    }
  };

  const loadPendingOperationsCount = async () => {
    try {
      const queue = await enhancedOfflineDB.getSyncQueue();
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: queue?.length || 0 
      }));
    } catch (error) {
      console.error('[EnhancedOfflineManager] Failed to load pending operations:', error);
    }
  };

  // Enhanced offline operation handling
  const addOfflineOperation = useCallback(async (
    type: 'sale' | 'product' | 'customer' | 'transaction',
    operation: 'create' | 'update' | 'delete',
    data: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> => {
    const operationId = `${type}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineOperation: OfflineOperation = {
      id: operationId,
      type,
      operation,
      data: { ...data, user_id: user?.id },
      timestamp: new Date().toISOString(),
      priority,
      attempts: 0,
      synced: false
    };

    try {
      // Store in enhanced IndexedDB
      await enhancedOfflineDB.addToSyncQueue(offlineOperation);
      
      // Update local storage with proper field mapping
      await updateLocalStorage(type, operation, data);
      
      // Update pending count
      await loadPendingOperationsCount();
      
      // Try immediate sync if online
      if (offlineState.isOnline && user) {
        setTimeout(() => syncPendingOperations(), 500);
      }
      
      console.log(`[EnhancedOfflineManager] Added ${type} ${operation} to enhanced offline queue:`, operationId);
      return operationId;
      
    } catch (error) {
      console.error('[EnhancedOfflineManager] Failed to add enhanced offline operation:', error);
      throw error;
    }
  }, [user, offlineState.isOnline]);

  // Enhanced local storage with proper field mapping
  const updateLocalStorage = async (type: string, operation: string, data: any) => {
    try {
      // Transform snake_case to camelCase for local storage
      const transformedData = transformFieldNames(data, 'camelCase');
      
      switch (type) {
        case 'sale':
          if (operation === 'create') {
            await enhancedOfflineDB.storeData('sales', transformedData);
            // Update product stock locally
            if (transformedData.productId && transformedData.quantity) {
              const product = await enhancedOfflineDB.getData('products', transformedData.productId);
              if (product) {
                product.currentStock = Math.max(0, product.currentStock - transformedData.quantity);
                await enhancedOfflineDB.storeData('products', product);
              }
            }
          }
          break;
          
        case 'product':
          await enhancedOfflineDB.storeData('products', transformedData);
          break;
          
        case 'customer':
          await enhancedOfflineDB.storeData('customers', transformedData);
          break;
      }
    } catch (error) {
      console.error('[EnhancedOfflineManager] Failed to update enhanced local storage:', error);
    }
  };

  // Field name transformation utility
  const transformFieldNames = (obj: any, format: 'camelCase' | 'snake_case') => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      let newKey = key;
      
      if (format === 'camelCase') {
        // Convert snake_case to camelCase
        newKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      } else {
        // Convert camelCase to snake_case
        newKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      }
      
      transformed[newKey] = value;
    }
    
    return transformed;
  };

  // Enhanced sync operations
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
      const operations = await enhancedOfflineDB.getSyncQueue();
      const totalOperations = operations?.length || 0;

      if (totalOperations === 0) {
        setOfflineState(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncTime: new Date().toISOString()
        }));
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        return;
      }

      console.log(`[EnhancedOfflineManager] Starting enhanced sync of ${totalOperations} operations`);

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
            await enhancedOfflineDB.removeFromSyncQueue(operation.id);
            completed++;
          } else {
            // Increment attempts
            operation.attempts++;
            if (operation.attempts >= 3) {
              await enhancedOfflineDB.removeFromSyncQueue(operation.id);
              errors.push(`Max attempts reached for ${operation.type} ${operation.operation}`);
            } else {
              await enhancedOfflineDB.addToSyncQueue(operation);
            }
          }
        } catch (error) {
          console.error(`[EnhancedOfflineManager] Failed to sync operation ${operation.id}:`, error);
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

      localStorage.setItem('lastSyncTime', syncTime);
      
      if (completed > 0) {
        toast({
          title: "Enhanced Sync Complete",
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

      console.log(`[EnhancedOfflineManager] Enhanced sync completed: ${completed} synced, ${errors.length} errors, ${finalPendingCount} pending`);

    } catch (error) {
      console.error('[EnhancedOfflineManager] Enhanced sync process failed:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        errors: [...prev.errors, `Enhanced sync failed: ${error.message}`]
      }));
    }
  }, [offlineState.isOnline, offlineState.isSyncing, user, toast]);

  const syncSingleOperation = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      // Transform data to snake_case for database
      const dbData = transformFieldNames(operation.data, 'snake_case');
      
      switch (operation.type) {
        case 'sale':
          return await syncSale(operation, dbData);
        case 'product':
          return await syncProduct(operation, dbData);
        case 'customer':
          return await syncCustomer(operation, dbData);
        default:
          console.warn(`[EnhancedOfflineManager] Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      console.error(`[EnhancedOfflineManager] Error syncing ${operation.type}:`, error);
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
      console.error('[EnhancedOfflineManager] Sale sync error:', error);
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
      console.error('[EnhancedOfflineManager] Product sync error:', error);
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
      console.error('[EnhancedOfflineManager] Customer sync error:', error);
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
      const data = await enhancedOfflineDB.getData(type, id);
      // Transform back to camelCase for UI
      return Array.isArray(data) 
        ? data.map(item => transformFieldNames(item, 'camelCase'))
        : transformFieldNames(data, 'camelCase');
    } catch (error) {
      console.error(`[EnhancedOfflineManager] Failed to get enhanced offline data for ${type}:`, error);
      return null;
    }
  }, []);

  // Test enhanced offline functionality
  const testEnhancedOffline = useCallback(async () => {
    console.log('[EnhancedOfflineManager] Testing enhanced offline functionality...');
    
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
        total: 200,
        paymentMethod: 'cash',
        timestamp: new Date().toISOString(),
        synced: false
      };

      // Test storing enhanced offline operation
      await addOfflineOperation('sale', 'create', testSale, 'high');
      console.log('[EnhancedOfflineManager] ✅ Enhanced offline operation test passed');

      // Test sync queue
      const queue = await enhancedOfflineDB.getSyncQueue();
      console.log('[EnhancedOfflineManager] ✅ Enhanced sync queue test passed, items:', queue.length);

      return {
        success: true,
        message: 'Enhanced offline functionality working correctly',
        pendingOperations: queue.length
      };

    } catch (error) {
      console.error('[EnhancedOfflineManager] ❌ Enhanced offline test failed:', error);
      return {
        success: false,
        message: 'Enhanced offline test failed',
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
    testEnhancedOffline,
    enhancedOfflineDB
  };
};
