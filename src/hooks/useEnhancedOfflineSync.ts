
import { useState, useEffect, useCallback } from 'react';
import { offlineDB } from '../utils/indexedDB';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingOperations: number;
  syncProgress: number;
  errors: string[];
}

interface ConflictResolution {
  id: string;
  type: 'sale' | 'inventory' | 'customer';
  localData: any;
  serverData: any;
  resolution: 'local' | 'server' | 'merge' | 'pending';
}

export const useEnhancedOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: localStorage.getItem('lastSyncTime'),
    pendingOperations: 0,
    syncProgress: 0,
    errors: [],
  });

  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      if (user) {
        setTimeout(() => startSync(), 1000); // Delay to ensure connection is stable
      }
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending operations count on mount
    loadPendingOperationsCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const loadPendingOperationsCount = async () => {
    try {
      const queue = await offlineDB.getSyncQueue();
      setSyncStatus(prev => ({ ...prev, pendingOperations: queue.length }));
    } catch (error) {
      console.error('Failed to load pending operations count:', error);
    }
  };

  const startSync = useCallback(async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing || !user) {
      return;
    }

    setSyncStatus(prev => ({ 
      ...prev, 
      isSyncing: true, 
      syncProgress: 0,
      errors: [] 
    }));

    try {
      const syncQueue = await offlineDB.getSyncQueue();
      const totalOperations = syncQueue.length;

      if (totalOperations === 0) {
        setSyncStatus(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncTime: new Date().toISOString(),
          pendingOperations: 0 
        }));
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        return;
      }

      console.log(`Starting sync of ${totalOperations} operations`);

      // Sort by priority: high -> medium -> low
      const sortedQueue = syncQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      let completed = 0;
      const errors: string[] = [];

      for (const operation of sortedQueue) {
        try {
          const success = await syncOperation(operation);
          if (success) {
            await offlineDB.removeFromSyncQueue(operation.id);
            completed++;
          }
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          errors.push(`Failed to sync ${operation.type}: ${error.message}`);
        }

        // Update progress
        const progress = Math.round(((completed + errors.length) / totalOperations) * 100);
        setSyncStatus(prev => ({ ...prev, syncProgress: progress }));
      }

      const finalPendingCount = totalOperations - completed;
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        pendingOperations: finalPendingCount,
        lastSyncTime: new Date().toISOString(),
        errors: errors
      }));

      localStorage.setItem('lastSyncTime', new Date().toISOString());
      console.log(`Sync completed: ${completed} synced, ${errors.length} errors, ${finalPendingCount} pending`);

    } catch (error) {
      console.error('Sync process failed:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        errors: [...prev.errors, `Sync failed: ${error.message}`]
      }));
    }
  }, [syncStatus.isOnline, syncStatus.isSyncing, user]);

  const syncOperation = async (operation: any): Promise<boolean> => {
    if (!user) return false;

    try {
      switch (operation.type) {
        case 'sale':
          return await syncSale(operation);
        case 'inventory':
          return await syncInventory(operation);
        case 'customer':
          return await syncCustomer(operation);
        default:
          console.warn(`Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Error syncing ${operation.type}:`, error);
      return false;
    }
  };

  const syncSale = async (operation: any): Promise<boolean> => {
    try {
      const saleData = {
        ...operation.data,
        user_id: user?.id,
        synced: true,
      };

      // Remove offline-specific fields
      delete saleData.id;
      delete saleData.synced;

      const { error } = await supabase
        .from('sales')
        .insert([saleData]);

      if (error) {
        console.error('Failed to sync sale:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Sale sync error:', error);
      return false;
    }
  };

  const syncInventory = async (operation: any): Promise<boolean> => {
    try {
      if (operation.operation === 'create') {
        const productData = {
          ...operation.data,
          user_id: user?.id,
        };

        delete productData.id;
        delete productData.createdAt;
        delete productData.updatedAt;

        const { error } = await supabase
          .from('products')
          .insert([productData]);

        return !error;
      } else if (operation.operation === 'update') {
        const { productId, newStock } = operation.data;
        
        const { error } = await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', productId)
          .eq('user_id', user?.id);

        return !error;
      }

      return false;
    } catch (error) {
      console.error('Inventory sync error:', error);
      return false;
    }
  };

  const syncCustomer = async (operation: any): Promise<boolean> => {
    try {
      if (operation.operation === 'create') {
        const customerData = {
          ...operation.data,
          user_id: user?.id,
        };

        delete customerData.id;
        delete customerData.createdDate;

        const { error } = await supabase
          .from('customers')
          .insert([customerData]);

        return !error;
      } else if (operation.operation === 'update') {
        const { id, updates } = operation.data;
        
        const { error } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user?.id);

        return !error;
      }

      return false;
    } catch (error) {
      console.error('Customer sync error:', error);
      return false;
    }
  };

  const resolveConflict = useCallback(async (conflictId: string, resolution: 'local' | 'server' | 'merge') => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    try {
      // Apply resolution logic based on choice
      let resolvedData;
      switch (resolution) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'server':
          resolvedData = conflict.serverData;
          break;
        case 'merge':
          resolvedData = { ...conflict.serverData, ...conflict.localData };
          break;
      }

      // Update the data accordingly
      // Implementation depends on the specific conflict type
      console.log(`Resolved conflict ${conflictId} with ${resolution} strategy`, resolvedData);

      // Remove from conflicts list
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }, [conflicts]);

  const forceSyncNow = useCallback(async () => {
    if (syncStatus.isOnline && !syncStatus.isSyncing) {
      await startSync();
    }
  }, [syncStatus.isOnline, syncStatus.isSyncing, startSync]);

  const clearSyncErrors = useCallback(() => {
    setSyncStatus(prev => ({ ...prev, errors: [] }));
  }, []);

  return {
    syncStatus,
    conflicts,
    startSync,
    forceSyncNow,
    resolveConflict,
    clearSyncErrors,
  };
};
