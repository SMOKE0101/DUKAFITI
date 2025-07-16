
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { offlineDB } from '../utils/indexedDB';
import { supabase } from '../integrations/supabase/client';

interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: string | null;
  syncErrors: string[];
  syncProgress: number;
  errors: string[];
}

interface OfflineOperation {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'inventory';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  synced: boolean;
}

export const useOfflineManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    isSyncing: false,
    pendingOperations: 0,
    lastSyncTime: localStorage.getItem('lastSyncTime'),
    syncErrors: [],
    syncProgress: 0,
    errors: []
  });

  // Initialize offline system
  useEffect(() => {
    initializeOfflineSystem();
    
    const handleOnline = () => {
      console.log('[OfflineManager] Device online');
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      if (user) {
        setTimeout(() => syncPendingOperations(), 1000);
      }
    };

    const handleOffline = () => {
      console.log('[OfflineManager] Device offline');
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const initializeOfflineSystem = async () => {
    try {
      console.log('[OfflineManager] Initializing offline system...');
      
      await offlineDB.init();
      await loadPendingOperationsCount();
      
      setOfflineState(prev => ({ ...prev, isInitialized: true }));
      console.log('[OfflineManager] Offline system initialized successfully');
      
      if (navigator.onLine && user) {
        setTimeout(() => syncPendingOperations(), 2000);
      }
      
    } catch (error) {
      console.error('[OfflineManager] Failed to initialize offline system:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isInitialized: true,
        syncErrors: [`Initialization failed: ${error.message}`],
        errors: [`Initialization failed: ${error.message}`]
      }));
    }
  };

  const loadPendingOperationsCount = async () => {
    try {
      const queue = await offlineDB.getSyncQueue();
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: queue?.length || 0 
      }));
    } catch (error) {
      console.error('[OfflineManager] Failed to load pending operations:', error);
    }
  };

  // Add offline operation
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
      data: { ...data, user_id: user?.id },
      timestamp: new Date().toISOString(),
      priority,
      attempts: 0,
      synced: false
    };

    try {
      await offlineDB.addToSyncQueue(offlineOperation);
      await loadPendingOperationsCount();
      
      if (offlineState.isOnline && user) {
        setTimeout(() => syncPendingOperations(), 500);
      }
      
      console.log(`[OfflineManager] Added ${type} ${operation} to queue:`, operationId);
      return operationId;
      
    } catch (error) {
      console.error('[OfflineManager] Failed to add offline operation:', error);
      throw error;
    }
  }, [user, offlineState.isOnline]);

  // Sync pending operations
  const syncPendingOperations = useCallback(async () => {
    if (!offlineState.isOnline || offlineState.isSyncing || !user) {
      return;
    }

    setOfflineState(prev => ({ 
      ...prev, 
      isSyncing: true,
      syncErrors: [],
      syncProgress: 0
    }));

    try {
      const operations = await offlineDB.getSyncQueue();
      const totalOperations = operations?.length || 0;

      if (totalOperations === 0) {
        setOfflineState(prev => ({ 
          ...prev, 
          isSyncing: false,
          syncProgress: 100,
          lastSyncTime: new Date().toISOString()
        }));
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        return;
      }

      console.log(`[OfflineManager] Starting sync of ${totalOperations} operations`);

      const sortedOperations = operations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      let completed = 0;
      const errors: string[] = [];

      for (let i = 0; i < sortedOperations.length; i++) {
        const operation = sortedOperations[i];
        const progress = Math.round(((i + 1) / totalOperations) * 100);
        
        setOfflineState(prev => ({ 
          ...prev, 
          syncProgress: progress 
        }));

        try {
          const success = await syncSingleOperation(operation);
          if (success) {
            await offlineDB.removeFromSyncQueue(operation.id);
            completed++;
          } else {
            operation.attempts++;
            if (operation.attempts >= 3) {
              await offlineDB.removeFromSyncQueue(operation.id);
              errors.push(`Max attempts reached for ${operation.type} ${operation.operation}`);
            } else {
              await offlineDB.addToSyncQueue(operation);
            }
          }
        } catch (error) {
          console.error(`[OfflineManager] Failed to sync operation ${operation.id}:`, error);
          errors.push(`Failed to sync ${operation.type}: ${error.message}`);
        }
      }

      const finalPendingCount = totalOperations - completed;
      const syncTime = new Date().toISOString();
      
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        syncProgress: 100,
        pendingOperations: finalPendingCount,
        lastSyncTime: syncTime,
        syncErrors: errors,
        errors: errors
      }));

      localStorage.setItem('lastSyncTime', syncTime);
      
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

      console.log(`[OfflineManager] Sync completed: ${completed} synced, ${errors.length} errors, ${finalPendingCount} pending`);

    } catch (error) {
      console.error('[OfflineManager] Sync process failed:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        syncProgress: 0,
        syncErrors: [`Sync failed: ${error.message}`],
        errors: [`Sync failed: ${error.message}`]
      }));
    }
  }, [offlineState.isOnline, offlineState.isSyncing, user, toast]);

  const syncSingleOperation = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      switch (operation.type) {
        case 'sale':
          return await syncSale(operation);
        case 'product':
        case 'inventory':
          return await syncProduct(operation);
        case 'customer':
          return await syncCustomer(operation);
        default:
          console.warn(`[OfflineManager] Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      console.error(`[OfflineManager] Error syncing ${operation.type}:`, error);
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
            product_id: operation.data.product_id,
            product_name: operation.data.product_name,
            quantity: operation.data.quantity,
            selling_price: operation.data.selling_price,
            cost_price: operation.data.cost_price,
            profit: operation.data.profit,
            total_amount: operation.data.total_amount,
            payment_method: operation.data.payment_method,
            customer_id: operation.data.customer_id,
            customer_name: operation.data.customer_name,
            payment_details: operation.data.payment_details || {},
            timestamp: operation.data.timestamp || new Date().toISOString()
          }]);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[OfflineManager] Sale sync error:', error);
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
            cost_price: operation.data.cost_price,
            selling_price: operation.data.selling_price,
            current_stock: operation.data.current_stock || 0,
            low_stock_threshold: operation.data.low_stock_threshold || 10
          }]);
        
        return !error;
      } else if (operation.operation === 'update') {
        const { error } = await supabase
          .from('products')
          .update(operation.data.updates)
          .eq('id', operation.data.id)
          .eq('user_id', user?.id);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[OfflineManager] Product sync error:', error);
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
            credit_limit: operation.data.credit_limit || 1000,
            outstanding_debt: operation.data.outstanding_debt || 0
          }]);
        
        return !error;
      } else if (operation.operation === 'update') {
        const { error } = await supabase
          .from('customers')
          .update(operation.data.updates)
          .eq('id', operation.data.id)
          .eq('user_id', user?.id);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[OfflineManager] Customer sync error:', error);
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
    setOfflineState(prev => ({ ...prev, syncErrors: [], errors: [] }));
  }, []);

  const getOfflineData = useCallback(async (type: string, id?: string) => {
    try {
      return await offlineDB.getData(type, id);
    } catch (error) {
      console.error(`[OfflineManager] Failed to get offline data for ${type}:`, error);
      return null;
    }
  }, []);

  return {
    ...offlineState,
    addOfflineOperation,
    syncPendingOperations,
    forceSyncNow,
    clearSyncErrors,
    getOfflineData
  };
};
