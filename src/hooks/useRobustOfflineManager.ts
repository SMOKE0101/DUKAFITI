
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

// Enhanced IndexedDB with better error handling
class UnifiedOfflineDB {
  private db: IDBDatabase | null = null;
  private dbName = 'DukaFitiUnifiedV1';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('[UnifiedOfflineDB] Failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[UnifiedOfflineDB] Initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // Sales store with better indexing
    if (!db.objectStoreNames.contains('sales')) {
      const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
      salesStore.createIndex('userId', 'userId', { unique: false });
      salesStore.createIndex('timestamp', 'timestamp', { unique: false });
      salesStore.createIndex('synced', 'synced', { unique: false });
    }

    // Products store
    if (!db.objectStoreNames.contains('products')) {
      const productsStore = db.createObjectStore('products', { keyPath: 'id' });
      productsStore.createIndex('userId', 'userId', { unique: false });
      productsStore.createIndex('category', 'category', { unique: false });
    }

    // Customers store
    if (!db.objectStoreNames.contains('customers')) {
      const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
      customersStore.createIndex('userId', 'userId', { unique: false });
      customersStore.createIndex('name', 'name', { unique: false });
    }

    // Sync queue with priority
    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
      syncStore.createIndex('type', 'type', { unique: false });
      syncStore.createIndex('priority', 'priority', { unique: false });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    console.log('[UnifiedOfflineDB] Stores created successfully');
  }

  async storeData(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.put(data);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getData(storeName: string, id?: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        const request = id ? store.get(id) : store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
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
      try {
        const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }
}

const unifiedOfflineDB = new UnifiedOfflineDB();

export const useRobustOfflineManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    isSyncing: false,
    pendingOperations: 0,
    syncProgress: 0,
    lastSyncTime: localStorage.getItem('unifiedLastSyncTime'),
    errors: []
  });

  // Initialize unified offline system
  useEffect(() => {
    initializeUnifiedOfflineSystem();
    
    const handleOnline = () => {
      console.log('[UnifiedOfflineManager] Online detected');
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      if (user) {
        setTimeout(() => syncPendingOperations(), 1000);
      }
    };

    const handleOffline = () => {
      console.log('[UnifiedOfflineManager] Offline detected');
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const initializeUnifiedOfflineSystem = async () => {
    try {
      console.log('[UnifiedOfflineManager] Initializing unified offline system...');
      
      // Initialize IndexedDB
      await unifiedOfflineDB.init();
      
      // Load pending operations
      await loadPendingOperationsCount();
      
      setOfflineState(prev => ({ ...prev, isInitialized: true }));
      console.log('[UnifiedOfflineManager] Unified offline system initialized successfully');
      
    } catch (error) {
      console.error('[UnifiedOfflineManager] Failed to initialize unified offline system:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isInitialized: true,
        errors: [...prev.errors, `Unified initialization failed: ${error.message}`]
      }));
    }
  };

  const loadPendingOperationsCount = async () => {
    try {
      const queue = await unifiedOfflineDB.getSyncQueue();
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: queue?.length || 0 
      }));
    } catch (error) {
      console.error('[UnifiedOfflineManager] Failed to load pending operations:', error);
    }
  };

  // Add unified offline operation
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
      // Store in IndexedDB
      await unifiedOfflineDB.addToSyncQueue(offlineOperation);
      
      // Update local storage immediately
      await updateLocalStorage(type, operation, data);
      
      // Update pending count
      await loadPendingOperationsCount();
      
      // Try immediate sync if online
      if (offlineState.isOnline && user) {
        setTimeout(() => syncPendingOperations(), 500);
      }
      
      console.log(`[UnifiedOfflineManager] Added ${type} ${operation} to unified offline queue:`, operationId);
      return operationId;
      
    } catch (error) {
      console.error('[UnifiedOfflineManager] Failed to add unified offline operation:', error);
      throw error;
    }
  }, [user, offlineState.isOnline]);

  // Update local storage
  const updateLocalStorage = async (type: string, operation: string, data: any) => {
    try {
      switch (type) {
        case 'sale':
          if (operation === 'create') {
            await unifiedOfflineDB.storeData('sales', data);
          }
          break;
          
        case 'product':
          await unifiedOfflineDB.storeData('products', data);
          break;
          
        case 'customer':
          await unifiedOfflineDB.storeData('customers', data);
          break;
      }
    } catch (error) {
      console.error('[UnifiedOfflineManager] Failed to update unified local storage:', error);
    }
  };

  // Unified sync operations
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
      const operations = await unifiedOfflineDB.getSyncQueue();
      const totalOperations = operations?.length || 0;

      if (totalOperations === 0) {
        setOfflineState(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncTime: new Date().toISOString()
        }));
        localStorage.setItem('unifiedLastSyncTime', new Date().toISOString());
        return;
      }

      console.log(`[UnifiedOfflineManager] Starting unified sync of ${totalOperations} operations`);

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
            await unifiedOfflineDB.removeFromSyncQueue(operation.id);
            completed++;
          } else {
            operation.attempts++;
            if (operation.attempts >= 3) {
              await unifiedOfflineDB.removeFromSyncQueue(operation.id);
              errors.push(`Max attempts reached for ${operation.type} ${operation.operation}`);
            } else {
              await unifiedOfflineDB.addToSyncQueue(operation);
            }
          }
        } catch (error) {
          console.error(`[UnifiedOfflineManager] Failed to sync operation ${operation.id}:`, error);
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

      localStorage.setItem('unifiedLastSyncTime', syncTime);
      
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

      console.log(`[UnifiedOfflineManager] Unified sync completed: ${completed} synced, ${errors.length} errors, ${finalPendingCount} pending`);

    } catch (error) {
      console.error('[UnifiedOfflineManager] Unified sync process failed:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        errors: [...prev.errors, `Unified sync failed: ${error.message}`]
      }));
    }
  }, [offlineState.isOnline, offlineState.isSyncing, user, toast]);

  const syncSingleOperation = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      switch (operation.type) {
        case 'sale':
          return await syncSale(operation);
        case 'product':
          return await syncProduct(operation);
        case 'customer':
          return await syncCustomer(operation);
        default:
          console.warn(`[UnifiedOfflineManager] Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      console.error(`[UnifiedOfflineManager] Error syncing ${operation.type}:`, error);
      return false;
    }
  };

  const syncSale = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('sales')
          .insert([{
            user_id: user?.id,
            product_id: operation.data.productId,
            product_name: operation.data.productName,
            quantity: operation.data.quantity,
            selling_price: operation.data.sellingPrice,
            cost_price: operation.data.costPrice,
            profit: operation.data.profit,
            total_amount: operation.data.totalAmount,
            payment_method: operation.data.paymentMethod,
            customer_id: operation.data.customerId,
            customer_name: operation.data.customerName,
            payment_details: operation.data.paymentDetails || {},
            timestamp: operation.data.timestamp || new Date().toISOString(),
            synced: true
          }]);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[UnifiedOfflineManager] Sale sync error:', error);
      return false;
    }
  };

  const syncProduct = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('products')
          .insert([{
            user_id: user?.id,
            name: operation.data.name,
            category: operation.data.category,
            cost_price: operation.data.costPrice,
            selling_price: operation.data.sellingPrice,
            current_stock: operation.data.currentStock || 0,
            low_stock_threshold: operation.data.lowStockThreshold || 10
          }]);
        
        return !error;
      } else if (operation.operation === 'update') {
        const { error } = await supabase
          .from('products')
          .update({
            name: operation.data.name,
            category: operation.data.category,
            cost_price: operation.data.costPrice,
            selling_price: operation.data.sellingPrice,
            current_stock: operation.data.currentStock,
            low_stock_threshold: operation.data.lowStockThreshold
          })
          .eq('id', operation.data.id)
          .eq('user_id', user?.id);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[UnifiedOfflineManager] Product sync error:', error);
      return false;
    }
  };

  const syncCustomer = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('customers')
          .insert([{
            user_id: user?.id,
            name: operation.data.name,
            phone: operation.data.phone,
            email: operation.data.email,
            address: operation.data.address,
            credit_limit: operation.data.creditLimit || 1000,
            outstanding_debt: operation.data.outstandingDebt || 0
          }]);
        
        return !error;
      } else if (operation.operation === 'update') {
        const { error } = await supabase
          .from('customers')
          .update({
            name: operation.data.name,
            phone: operation.data.phone,
            email: operation.data.email,
            address: operation.data.address,
            credit_limit: operation.data.creditLimit,
            outstanding_debt: operation.data.outstandingDebt
          })
          .eq('id', operation.data.id)
          .eq('user_id', user?.id);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[UnifiedOfflineManager] Customer sync error:', error);
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

  // Get offline data
  const getOfflineData = useCallback(async (type: string, id?: string) => {
    try {
      return await unifiedOfflineDB.getData(type, id);
    } catch (error) {
      console.error(`[UnifiedOfflineManager] Failed to get unified offline data for ${type}:`, error);
      return null;
    }
  }, []);

  return {
    ...offlineState,
    addOfflineOperation,
    syncPendingOperations,
    forceSyncNow,
    clearSyncErrors,
    getOfflineData,
    unifiedOfflineDB
  };
};
