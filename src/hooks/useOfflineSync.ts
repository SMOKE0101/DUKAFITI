
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { offlineDB, OfflineAction, OfflineProduct, OfflineCustomer, OfflineSale } from '../utils/offlineDB';

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
      // Register service worker
      if ('serviceWorker' in navigator && user) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[OfflineSync] Service worker registered');
        
        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_COMPLETE') {
            updateQueuedActionsCount();
          }
        });
      }

      // Load initial data if online
      if (navigator.onLine && user) {
        await performInitialDataSync();
      }

      // Update queued actions count
      await updateQueuedActionsCount();
      
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
      // Small delay to ensure connection is stable
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

      // Fetch and store recent sales (last 30 days)
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

      // Update last sync time
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

      // Sort actions by timestamp to maintain order
      const sortedActions = queuedActions.sort((a, b) => a.timestamp - b.timestamp);
      
      let synced = 0;
      const newErrors: string[] = [];
      const newConflicts: ConflictItem[] = [];

      for (const action of sortedActions) {
        try {
          const result = await syncSingleAction(action);
          
          if (result.success) {
            await offlineDB.markActionSynced(action.id);
            synced++;
          } else if (result.conflict) {
            newConflicts.push(result.conflict);
          } else {
            throw new Error(result.error || 'Sync failed');
          }
          
        } catch (error) {
          console.error(`[OfflineSync] Failed to sync action ${action.id}:`, error);
          await offlineDB.markActionFailed(action.id, error.message);
          newErrors.push(`${action.type} ${action.table}: ${error.message}`);
        }

        // Update progress
        const progress = Math.round(((synced + newErrors.length + newConflicts.length) / queuedActions.length) * 100);
        setSyncStatus(prev => ({ ...prev, syncProgress: progress }));
      }

      // Update conflicts state
      if (newConflicts.length > 0) {
        setConflicts(prev => [...prev, ...newConflicts]);
      }

      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastSyncTime: new Date(),
        errors: newErrors
      }));

      await updateQueuedActionsCount();

      // Show toast notifications
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

      if (newConflicts.length > 0) {
        toast({
          title: "Conflicts Detected",
          description: `${newConflicts.length} conflicts need resolution`,
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
    conflict?: ConflictItem; 
    error?: string 
  }> => {
    try {
      switch (action.table) {
        case 'products':
          return await syncProductAction(action);
        case 'customers':
          return await syncCustomerAction(action);
        case 'sales':
          return await syncSaleAction(action);
        default:
          return { success: false, error: `Unknown table: ${action.table}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const syncProductAction = async (action: OfflineAction): Promise<{ 
    success: boolean; 
    conflict?: ConflictItem; 
    error?: string 
  }> => {
    const { type, data } = action;

    try {
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
        return { success: true };

      } else if (type === 'UPDATE') {
        // Check for conflicts by comparing server version
        const { data: serverData } = await supabase
          .from('products')
          .select('*')
          .eq('id', data.id)
          .eq('user_id', user!.id)
          .single();

        if (serverData && serverData.updated_at > data.updated_at) {
          return { 
            success: false, 
            conflict: {
              id: data.id,
              type: 'product',
              localData: data,
              serverData,
              action
            }
          };
        }

        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            category: data.category,
            cost_price: data.cost_price,
            selling_price: data.selling_price,
            current_stock: data.current_stock,
            low_stock_threshold: data.low_stock_threshold,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
          .eq('user_id', user!.id);

        if (error) throw error;
        return { success: true };

      } else if (type === 'DELETE') {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', data.id)
          .eq('user_id', user!.id);

        if (error) throw error;
        return { success: true };
      }

      return { success: false, error: `Unknown action type: ${type}` };

    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const syncCustomerAction = async (action: OfflineAction): Promise<{ 
    success: boolean; 
    conflict?: ConflictItem; 
    error?: string 
  }> => {
    const { type, data } = action;

    try {
      if (type === 'CREATE') {
        const { error } = await supabase
          .from('customers')
          .insert([{
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            credit_limit: data.credit_limit,
            outstanding_debt: data.outstanding_debt,
            user_id: user!.id
          }]);

        if (error) throw error;
        return { success: true };

      } else if (type === 'UPDATE') {
        const { error } = await supabase
          .from('customers')
          .update(data)
          .eq('id', data.id)
          .eq('user_id', user!.id);

        if (error) throw error;
        return { success: true };

      } else if (type === 'DELETE') {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', data.id)
          .eq('user_id', user!.id);

        if (error) throw error;
        return { success: true };
      }

      return { success: false, error: `Unknown action type: ${type}` };

    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const syncSaleAction = async (action: OfflineAction): Promise<{ 
    success: boolean; 
    conflict?: ConflictItem; 
    error?: string 
  }> => {
    const { type, data } = action;

    try {
      if (type === 'CREATE') {
        const { error } = await supabase
          .from('sales')
          .insert([{
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
            payment_details: data.payment_details,
            user_id: user!.id
          }]);

        if (error) throw error;
        return { success: true };
      }

      return { success: false, error: `Unknown action type: ${type}` };

    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resolveConflict = async (conflictId: string, resolution: 'local' | 'server') => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    try {
      if (resolution === 'local') {
        // Force sync local version
        await syncSingleAction(conflict.action);
      } else {
        // Use server version, update local data
        await offlineDB.store(conflict.action.table, conflict.serverData);
      }

      // Mark action as synced and remove conflict
      await offlineDB.markActionSynced(conflict.action.id);
      setConflicts(prev => prev.filter(c => c.id !== conflictId));

      toast({
        title: "Conflict Resolved",
        description: `Used ${resolution} version`,
        duration: 3000,
      });

    } catch (error) {
      console.error('[OfflineSync] Failed to resolve conflict:', error);
      toast({
        title: "Conflict Resolution Failed",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    }
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
    updateQueuedActionsCount
  };
};
