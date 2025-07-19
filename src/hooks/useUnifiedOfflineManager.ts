
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
  type: 'sale' | 'product' | 'customer' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  synced: boolean;
}

// Unified IndexedDB manager
class UnifiedOfflineDB {
  private db: IDBDatabase | null = null;
  private dbName = 'DukaFitiUnified';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('UnifiedOfflineDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('UnifiedOfflineDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // Clear any existing stores to prevent conflicts
    const existingStores = Array.from(db.objectStoreNames);
    existingStores.forEach(storeName => {
      try {
        db.deleteObjectStore(storeName);
      } catch (error) {
        console.warn('Failed to delete store:', storeName);
      }
    });

    // Create unified sync queue
    const syncStore = db.createObjectStore('unifiedSyncQueue', { keyPath: 'id' });
    syncStore.createIndex('type', 'type', { unique: false });
    syncStore.createIndex('priority', 'priority', { unique: false });
    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
    syncStore.createIndex('synced', 'synced', { unique: false });

    // Local data stores
    const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
    salesStore.createIndex('timestamp', 'timestamp', { unique: false });

    const productsStore = db.createObjectStore('products', { keyPath: 'id' });
    productsStore.createIndex('name', 'name', { unique: false });

    const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
    customersStore.createIndex('name', 'name', { unique: false });

    console.log('UnifiedOfflineDB stores created successfully');
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
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async addToSyncQueue(operation: OfflineOperation): Promise<void> {
    return this.storeData('unifiedSyncQueue', operation);
  }

  async getSyncQueue(): Promise<OfflineOperation[]> {
    const operations = await this.getData('unifiedSyncQueue');
    return Array.isArray(operations) ? operations.filter(op => !op.synced) : [];
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['unifiedSyncQueue'], 'readwrite');
        const store = transaction.objectStore('unifiedSyncQueue');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async clearAllData(): Promise<void> {
    const stores = ['unifiedSyncQueue', 'sales', 'products', 'customers'];
    for (const storeName of stores) {
      try {
        if (!this.db) continue;
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.clear();
      } catch (error) {
        console.warn(`Failed to clear store ${storeName}:`, error);
      }
    }
  }
}

const unifiedOfflineDB = new UnifiedOfflineDB();

export const useUnifiedOfflineManager = () => {
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

  // Initialize unified system
  useEffect(() => {
    initializeUnifiedSystem();
    
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

  const initializeUnifiedSystem = async () => {
    try {
      console.log('[UnifiedOfflineManager] Initializing unified system...');
      
      // Clear old localStorage entries to prevent conflicts
      const keysToRemove = [
        'offline_customer_creates',
        'offline_customer_updates',
        'dts_pending_operations',
        'lastSyncTime',
        'robustLastSyncTime'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Unregister all existing service workers to prevent conflicts
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
        console.log('[UnifiedOfflineManager] Cleared existing service workers');
      }

      // Initialize unified IndexedDB
      await unifiedOfflineDB.init();
      
      // Load pending operations
      await loadPendingOperationsCount();
      
      setOfflineState(prev => ({ ...prev, isInitialized: true }));
      console.log('[UnifiedOfflineManager] Unified system initialized successfully');
      
    } catch (error) {
      console.error('[UnifiedOfflineManager] Failed to initialize unified system:', error);
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

  const addOfflineOperation = useCallback(async (
    type: 'sale' | 'product' | 'customer' | 'transaction',
    operation: 'create' | 'update' | 'delete',
    data: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> => {
    // Generate unique ID to prevent duplicates
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
      // Check for duplicate operations before adding
      const existingQueue = await unifiedOfflineDB.getSyncQueue();
      const isDuplicate = existingQueue.some(op => 
        op.type === type && 
        op.operation === operation && 
        JSON.stringify(op.data) === JSON.stringify(offlineOperation.data)
      );

      if (isDuplicate) {
        console.log(`[UnifiedOfflineManager] Duplicate operation detected, skipping: ${type} ${operation}`);
        return operationId;
      }

      await unifiedOfflineDB.addToSyncQueue(offlineOperation);
      await unifiedOfflineDB.storeData(type + 's', data);
      await loadPendingOperationsCount();
      
      if (offlineState.isOnline && user) {
        setTimeout(() => syncPendingOperations(), 500);
      }
      
      console.log(`[UnifiedOfflineManager] Added ${type} ${operation} to unified queue:`, operationId);
      return operationId;
      
    } catch (error) {
      console.error('[UnifiedOfflineManager] Failed to add unified offline operation:', error);
      throw error;
    }
  }, [user, offlineState.isOnline]);

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
        case 'transaction':
          return await syncTransaction(operation);
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
      const { data } = operation;
      
      if (operation.operation === 'create') {
        // Check for existing sale to prevent duplicates
        const { data: existingSales } = await supabase
          .from('sales')
          .select('id')
          .eq('user_id', user?.id)
          .eq('product_id', data.product_id)
          .eq('timestamp', data.timestamp)
          .eq('total_amount', data.total_amount);

        if (existingSales && existingSales.length > 0) {
          console.log('[UnifiedOfflineManager] Sale already exists, skipping');
          return true;
        }

        const { error } = await supabase
          .from('sales')
          .insert([{
            user_id: user?.id,
            product_id: data.product_id,
            product_name: data.product_name,
            quantity: data.quantity,
            selling_price: data.selling_price,
            cost_price: data.cost_price,
            profit: data.profit,
            total_amount: data.total_amount,
            payment_method: data.payment_method,
            customer_id: data.customer_id,
            customer_name: data.customer_name,
            payment_details: data.payment_details || {},
            timestamp: data.timestamp,
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
      const { data } = operation;
      
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('products')
          .insert([{
            user_id: user?.id,
            name: data.name,
            category: data.category,
            cost_price: data.cost_price,
            selling_price: data.selling_price,
            current_stock: data.current_stock || 0,
            low_stock_threshold: data.low_stock_threshold || 10
          }]);
        
        return !error;
      } else if (operation.operation === 'update') {
        const { error } = await supabase
          .from('products')
          .update(data.updates)
          .eq('id', data.id)
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
      const { data } = operation;
      
      if (operation.operation === 'create') {
        // Check for existing customer to prevent duplicates
        const { data: existingCustomers } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user?.id)
          .eq('phone', data.phone);

        if (existingCustomers && existingCustomers.length > 0) {
          console.log('[UnifiedOfflineManager] Customer already exists, skipping');
          return true;
        }

        const { error } = await supabase
          .from('customers')
          .insert([{
            user_id: user?.id,
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            credit_limit: data.credit_limit || 1000,
            outstanding_debt: data.outstanding_debt || 0
          }]);
        
        return !error;
      } else if (operation.operation === 'update') {
        const { error } = await supabase
          .from('customers')
          .update(data.updates)
          .eq('id', data.id)
          .eq('user_id', user?.id);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[UnifiedOfflineManager] Customer sync error:', error);
      return false;
    }
  };

  const syncTransaction = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      const { data } = operation;
      
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('transactions')
          .insert([{
            user_id: user?.id,
            customer_id: data.customer_id,
            item_id: data.item_id,
            quantity: data.quantity,
            unit_price: data.unit_price,
            total_amount: data.total_amount,
            paid: data.paid || false,
            notes: data.notes
          }]);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[UnifiedOfflineManager] Transaction sync error:', error);
      return false;
    }
  };

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

  const clearSyncErrors = useCallback(() => {
    setOfflineState(prev => ({ ...prev, errors: [] }));
  }, []);

  const getOfflineData = useCallback(async (type: string, id?: string) => {
    try {
      return await unifiedOfflineDB.getData(type + 's', id);
    } catch (error) {
      console.error(`[UnifiedOfflineManager] Failed to get unified offline data for ${type}:`, error);
      return null;
    }
  }, []);

  const clearAllOfflineData = useCallback(async () => {
    try {
      await unifiedOfflineDB.clearAllData();
      setOfflineState(prev => ({ ...prev, pendingOperations: 0 }));
      toast({
        title: "Offline Data Cleared",
        description: "All offline data has been cleared successfully",
      });
    } catch (error) {
      console.error('[UnifiedOfflineManager] Failed to clear offline data:', error);
      toast({
        title: "Error",
        description: "Failed to clear offline data",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    ...offlineState,
    addOfflineOperation,
    syncPendingOperations,
    forceSyncNow,
    clearSyncErrors,
    getOfflineData,
    clearAllOfflineData,
    unifiedOfflineDB
  };
};
