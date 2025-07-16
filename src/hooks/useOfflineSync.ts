
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { offlineDB, OfflineAction } from '../utils/offlineDB';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queuedActions: number;
  lastSyncTime: Date | null;
  syncProgress: number;
  errors: string[];
}

interface ConflictItem {
  id: string;
  type: 'product' | 'customer' | 'sale';
  localData: any;
  serverData: any;
  action: OfflineAction;
}

export const useOfflineSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    queuedActions: 0,
    lastSyncTime: null,
    syncProgress: 0,
    errors: []
  });

  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);

  // Initialize offline capabilities
  useEffect(() => {
    initializeOfflineSync();
    setupNetworkListeners();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const initializeOfflineSync = async () => {
    try {
      await updateQueuedActionsCount();
      
      if (navigator.onLine && user) {
        await performInitialDataSync();
      }
      
    } catch (error) {
      console.error('[OfflineSync] Initialization failed:', error);
    }
  };

  const setupNetworkListeners = () => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  };

  const handleOnline = useCallback(async () => {
    console.log('[OfflineSync] Network came online');
    setSyncStatus(prev => ({ ...prev, isOnline: true }));
    
    if (user) {
      setTimeout(() => {
        syncQueuedActions();
      }, 1000);
    }
  }, [user]);

  const handleOffline = useCallback(() => {
    console.log('[OfflineSync] Network went offline');
    setSyncStatus(prev => ({ ...prev, isOnline: false, isSyncing: false }));
  }, []);

  const performInitialDataSync = async () => {
    if (!user) return;

    try {
      console.log('[OfflineSync] Performing initial data sync');

      // Fetch and store products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);

      if (products) {
        await offlineDB.storeProducts(products);
      }

      // Fetch and store customers
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id);

      if (customers) {
        await offlineDB.storeCustomers(customers);
      }

      // Fetch and store recent sales
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', thirtyDaysAgo.toISOString());

      if (sales) {
        await offlineDB.storeSales(sales);
      }

      await offlineDB.setLastSyncTime('initial_sync', Date.now());
      setSyncStatus(prev => ({ ...prev, lastSyncTime: new Date() }));

      console.log('[OfflineSync] Initial data sync completed');

    } catch (error) {
      console.error('[OfflineSync] Initial sync failed:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        errors: [...prev.errors, `Initial sync failed: ${error.message}`]
      }));
    }
  };

  const updateQueuedActionsCount = async () => {
    if (!user) return;

    try {
      const queuedActions = await offlineDB.getQueuedActions(user.id);
      setSyncStatus(prev => ({ ...prev, queuedActions: queuedActions.length }));
    } catch (error) {
      console.error('[OfflineSync] Failed to update queued actions count:', error);
    }
  };

  const addPendingOperation = async (operation: any) => {
    if (!user) return;

    try {
      await offlineDB.queueAction({
        type: operation.type,
        table: operation.table,
        data: operation.data,
        user_id: user.id
      });
      
      await updateQueuedActionsCount();
    } catch (error) {
      console.error('[OfflineSync] Failed to add pending operation:', error);
    }
  };

  const syncQueuedActions = async () => {
    if (!user || !syncStatus.isOnline || syncStatus.isSyncing) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true, syncProgress: 0, errors: [] }));

    try {
      const queuedActions = await offlineDB.getQueuedActions(user.id);
      
      if (queuedActions.length === 0) {
        setSyncStatus(prev => ({ ...prev, isSyncing: false, lastSyncTime: new Date() }));
        return;
      }

      console.log(`[OfflineSync] Syncing ${queuedActions.length} queued actions`);

      const sortedActions = queuedActions.sort((a, b) => a.timestamp - b.timestamp);
      
      let synced = 0;
      const newErrors: string[] = [];

      for (const action of sortedActions) {
        try {
          const result = await syncSingleAction(action);
          
          if (result.success) {
            await offlineDB.markActionSynced(action.id);
            synced++;
          } else {
            throw new Error(result.error || 'Sync failed');
          }
          
        } catch (error) {
          console.error(`[OfflineSync] Failed to sync action ${action.id}:`, error);
          await offlineDB.markActionFailed(action.id, error.message);
          newErrors.push(`${action.type} ${action.table}: ${error.message}`);
        }

        const progress = Math.round(((synced + newErrors.length) / queuedActions.length) * 100);
        setSyncStatus(prev => ({ ...prev, syncProgress: progress }));
      }

      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastSyncTime: new Date(),
        errors: newErrors
      }));

      await updateQueuedActionsCount();

      if (synced > 0) {
        toast({
          title: "Sync Complete",
          description: `${synced} actions synchronized successfully`,
          duration: 3000,
        });
      }

      if (newErrors.length > 0) {
        toast({
          title: "Sync Issues",
          description: `${newErrors.length} actions failed to sync`,
          variant: "destructive",
          duration: 5000,
        });
      }

    } catch (error) {
      console.error('[OfflineSync] Sync process failed:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        errors: [`Sync failed: ${error.message}`]
      }));
    }
  };

  const syncSingleAction = async (action: OfflineAction): Promise<{ 
    success: boolean; 
    error?: string 
  }> => {
    try {
      const { type, data, table } = action;

      if (table === 'products') {
        if (type === 'CREATE') {
          const { error } = await supabase
            .from('products')
            .insert([{
              name: data.name,
              category: data.category,
              cost_price: data.cost_price,
              selling_price: data.selling_price,
              current_stock: data.current_stock,
              low_stock_threshold: data.low_stock_threshold,
              user_id: user!.id
            }]);

          if (error) throw error;
        } else if (type === 'UPDATE') {
          const { error } = await supabase
            .from('products')
            .update(data)
            .eq('id', data.id)
            .eq('user_id', user!.id);

          if (error) throw error;
        } else if (type === 'DELETE') {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', data.id)
            .eq('user_id', user!.id);

          if (error) throw error;
        }
      } else if (table === 'customers') {
        if (type === 'CREATE') {
          const { error } = await supabase
            .from('customers')
            .insert([data]);

          if (error) throw error;
        } else if (type === 'UPDATE') {
          const { error } = await supabase
            .from('customers')
            .update(data)
            .eq('id', data.id)
            .eq('user_id', user!.id);

          if (error) throw error;
        }
      } else if (table === 'sales') {
        if (type === 'CREATE') {
          const { error } = await supabase
            .from('sales')
            .insert([data]);

          if (error) throw error;
        }
      }

      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resolveConflict = async (conflictId: string, resolution: 'local' | 'server') => {
    // Implementation for conflict resolution
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  };

  const forceSyncNow = async () => {
    if (syncStatus.isOnline && !syncStatus.isSyncing) {
      await syncQueuedActions();
    }
  };

  return {
    syncStatus,
    conflicts,
    syncQueuedActions,
    resolveConflict,
    forceSyncNow,
    updateQueuedActionsCount,
    addPendingOperation,
    isOnline: syncStatus.isOnline
  };
};
