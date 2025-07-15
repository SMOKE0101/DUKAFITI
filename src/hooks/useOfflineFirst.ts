import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  syncInProgress: boolean;
  queuedOperations: number;
  lastSyncTime?: Date;
  error?: string;
}

interface OfflineStats {
  cached: {
    products: number;
    customers: number;
    sales: number;
    transactions: number;
  };
  queued: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

export const useOfflineFirst = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    syncInProgress: false,
    queuedOperations: 0
  });

  const [stats, setStats] = useState<OfflineStats>({
    cached: { products: 0, customers: 0, sales: 0, transactions: 0 },
    queued: { high: 0, medium: 0, low: 0, total: 0 }
  });

  // Initialize offline-first system
  const initialize = useCallback(async () => {
    if (!user || state.isInitialized) return;

    try {
      console.log('[OfflineFirst] Initializing offline-first system...');
      
      // Import IndexedDB utilities dynamically
      const { offlineDB } = await import('@/utils/indexedDB');
      
      // Initialize IndexedDB
      await offlineDB.init();
      
      // Seed data if online
      if (navigator.onLine) {
        await seedOfflineData();
      }
      
      // Get initial stats
      await updateStats();
      
      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        lastSyncTime: new Date()
      }));
      
      console.log('[OfflineFirst] ✅ Initialization complete');
      
    } catch (error) {
      console.error('[OfflineFirst] ❌ Initialization failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize offline storage',
        isInitialized: false
      }));
    }
  }, [user, state.isInitialized]);

  // Seed offline data from Supabase
  const seedOfflineData = useCallback(async () => {
    if (!user) return;

    try {
      console.log('[OfflineFirst] Seeding offline data...');
      const { offlineDB } = await import('@/utils/indexedDB');
      
      // Fetch and cache products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);
      
      if (products) {
        for (const product of products) {
          await offlineDB.storeOfflineData('products', product);
        }
        console.log(`[OfflineFirst] Cached ${products.length} products`);
      }
      
      // Fetch and cache customers
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id);
      
      if (customers) {
        for (const customer of customers) {
          await offlineDB.storeOfflineData('customers', customer);
        }
        console.log(`[OfflineFirst] Cached ${customers.length} customers`);
      }
      
      // Fetch and cache recent sales (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (sales) {
        for (const sale of sales) {
          await offlineDB.storeOfflineData('sales', sale);
        }
        console.log(`[OfflineFirst] Cached ${sales.length} recent sales`);
      }
      
      // Fetch and cache recent transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (transactions) {
        for (const transaction of transactions) {
          await offlineDB.storeOfflineData('transactions', transaction);
        }
        console.log(`[OfflineFirst] Cached ${transactions.length} recent transactions`);
      }

    } catch (error) {
      console.error('[OfflineFirst] Failed to seed offline data:', error);
    }
  }, [user]);

  // Update statistics
  const updateStats = useCallback(async () => {
    try {
      const { offlineDB } = await import('@/utils/indexedDB');
      
      // Get cached data counts
      const [products, customers, sales, transactions] = await Promise.all([
        offlineDB.getOfflineData('products').then(data => data?.length || 0),
        offlineDB.getOfflineData('customers').then(data => data?.length || 0),
        offlineDB.getOfflineData('sales').then(data => data?.length || 0),
        offlineDB.getOfflineData('transactions').then(data => data?.length || 0)
      ]);
      
      // Get queued operations by priority
      const [highPriority, mediumPriority, lowPriority] = await Promise.all([
        offlineDB.getSyncQueueByPriority('high').then(data => data?.length || 0),
        offlineDB.getSyncQueueByPriority('medium').then(data => data?.length || 0),
        offlineDB.getSyncQueueByPriority('low').then(data => data?.length || 0)
      ]);
      
      const totalQueued = highPriority + mediumPriority + lowPriority;
      
      setStats({
        cached: { products, customers, sales, transactions },
        queued: { 
          high: highPriority, 
          medium: mediumPriority, 
          low: lowPriority, 
          total: totalQueued 
        }
      });
      
      setState(prev => ({ ...prev, queuedOperations: totalQueued }));
      
    } catch (error) {
      console.error('[OfflineFirst] Failed to update stats:', error);
    }
  }, []);

  // Sync data when online
  const syncData = useCallback(async () => {
    if (!state.isOnline || state.syncInProgress || !user) return;

    setState(prev => ({ ...prev, syncInProgress: true, error: undefined }));

    try {
      console.log('[OfflineFirst] Starting data sync...');
      const { offlineDB } = await import('@/utils/indexedDB');
      
      // Get unsynced operations
      const unsyncedOps = await offlineDB.getUnsyncedOperations();
      
      if (unsyncedOps.length === 0) {
        console.log('[OfflineFirst] No operations to sync');
        setState(prev => ({ ...prev, syncInProgress: false, lastSyncTime: new Date() }));
        return;
      }
      
      console.log(`[OfflineFirst] Syncing ${unsyncedOps.length} operations...`);
      
      let successCount = 0;
      let failureCount = 0;
      
      // Sort by priority and timestamp
      const sortedOps = unsyncedOps.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
      
      // Sync operations
      for (const operation of sortedOps) {
        try {
          const success = await syncOperation(operation);
          if (success) {
            await offlineDB.removeFromSyncQueue(operation.id);
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          console.error('[OfflineFirst] Failed to sync operation:', operation.id, error);
          failureCount++;
        }
      }
      
      // Update stats
      await updateStats();
      
      // Show notification
      if (successCount > 0) {
        toast({
          title: "Sync Complete",
          description: `${successCount} operations synced successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        });
      }
      
      setState(prev => ({ 
        ...prev, 
        syncInProgress: false, 
        lastSyncTime: new Date() 
      }));
      
      console.log(`[OfflineFirst] ✅ Sync complete: ${successCount} success, ${failureCount} failed`);
      
    } catch (error) {
      console.error('[OfflineFirst] ❌ Sync failed:', error);
      setState(prev => ({ 
        ...prev, 
        syncInProgress: false, 
        error: 'Sync failed. Will retry automatically.' 
      }));
    }
  }, [state.isOnline, state.syncInProgress, user, toast, updateStats]);

  // Sync individual operation
  const syncOperation = async (operation: any): Promise<boolean> => {
    try {
      switch (operation.type) {
        case 'sale':
          return await syncSale(operation.data);
        case 'product':
          return await syncProduct(operation);
        case 'customer':
          return await syncCustomer(operation);
        case 'transaction':
          return await syncTransaction(operation);
        default:
          console.warn('[OfflineFirst] Unknown operation type:', operation.type);
          return false;
      }
    } catch (error) {
      console.error('[OfflineFirst] Operation sync failed:', error);
      return false;
    }
  };

  // Sync sale
  const syncSale = async (saleData: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sales')
        .insert([saleData]);
      
      if (error) throw error;
      
      // Update local inventory
      await updateLocalInventory(saleData.product_id, -saleData.quantity);
      
      return true;
    } catch (error) {
      console.error('[OfflineFirst] Failed to sync sale:', error);
      return false;
    }
  };

  // Sync product
  const syncProduct = async (operation: any): Promise<boolean> => {
    try {
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('products')
          .insert([operation.data]);
        if (error) throw error;
      } else if (operation.operation === 'update') {
        const { error } = await supabase
          .from('products')
          .update(operation.data.updates)
          .eq('id', operation.data.id);
        if (error) throw error;
      } else if (operation.operation === 'delete') {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', operation.data.id);
        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('[OfflineFirst] Failed to sync product:', error);
      return false;
    }
  };

  // Sync customer
  const syncCustomer = async (operation: any): Promise<boolean> => {
    try {
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('customers')
          .insert([operation.data]);
        if (error) throw error;
      } else if (operation.operation === 'update') {
        const { error } = await supabase
          .from('customers')
          .update(operation.data.updates)
          .eq('id', operation.data.id);
        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('[OfflineFirst] Failed to sync customer:', error);
      return false;
    }
  };

  // Sync transaction
  const syncTransaction = async (operation: any): Promise<boolean> => {
    try {
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('transactions')
          .insert([operation.data]);
        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('[OfflineFirst] Failed to sync transaction:', error);
      return false;
    }
  };

  // Update local inventory
  const updateLocalInventory = async (productId: string, quantityChange: number) => {
    try {
      const { offlineDB } = await import('@/utils/indexedDB');
      const product = await offlineDB.getOfflineData('products', productId);
      
      if (product) {
        const updatedProduct = {
          ...product,
          current_stock: Math.max(0, product.current_stock + quantityChange),
          updated_at: new Date().toISOString()
        };
        
        await offlineDB.storeOfflineData('products', updatedProduct);
      }
    } catch (error) {
      console.error('[OfflineFirst] Failed to update local inventory:', error);
    }
  };

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    try {
      const { offlineDB } = await import('@/utils/indexedDB');
      await offlineDB.clearStore('sales');
      await offlineDB.clearStore('products');
      await offlineDB.clearStore('customers');
      await offlineDB.clearStore('transactions');
      await offlineDB.clearStore('syncQueue');
      
      await updateStats();
      
      toast({
        title: "Data Cleared",
        description: "All offline data has been cleared.",
      });
      
    } catch (error) {
      console.error('[OfflineFirst] Failed to clear offline data:', error);
    }
  }, [toast, updateStats]);

  // Force sync
  const forceSync = useCallback(async () => {
    if (state.isOnline) {
      await syncData();
    }
  }, [state.isOnline, syncData]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineFirst] Device back online');
      setState(prev => ({ ...prev, isOnline: true }));
      
      // Trigger sync after a short delay
      setTimeout(() => {
        syncData();
      }, 1000);
    };

    const handleOffline = () => {
      console.log('[OfflineFirst] Device went offline');
      setState(prev => ({ ...prev, isOnline: false }));
    };

    // Service worker messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETED') {
        console.log('[OfflineFirst] Service worker sync completed');
        updateStats();
        setState(prev => ({ ...prev, lastSyncTime: new Date() }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [syncData, updateStats]);

  // Initialize when user is available
  useEffect(() => {
    if (user && !state.isInitialized) {
      initialize();
    }
  }, [user, state.isInitialized, initialize]);

  // Periodic stats update
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isInitialized) {
        updateStats();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [state.isInitialized, updateStats]);

  return {
    ...state,
    stats,
    initialize,
    syncData,
    forceSync,
    clearOfflineData,
    updateStats,
    seedOfflineData
  };
};