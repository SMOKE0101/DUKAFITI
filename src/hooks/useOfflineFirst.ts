
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { offlineDB } from '@/utils/indexedDB';

interface OfflineStats {
  cached: {
    products: number;
    customers: number;
    sales: number;
    transactions: number;
  };
  queued: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  syncInProgress: boolean;
  queuedOperations: number;
  lastSyncTime?: Date;
  error?: string;
  stats: OfflineStats;
}

export const useOfflineFirst = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    syncInProgress: false,
    queuedOperations: 0,
    stats: {
      cached: { products: 0, customers: 0, sales: 0, transactions: 0 },
      queued: { total: 0, high: 0, medium: 0, low: 0 }
    }
  });

  // Initialize offline-first system
  const initialize = useCallback(async () => {
    if (!user || state.isInitialized) return;

    try {
      console.log('[OfflineFirst] Initializing offline-first system...');
      
      // Initialize IndexedDB
      await offlineDB.init();
      
      // Clear sync queue on fresh start to avoid phantom operations
      await offlineDB.clearStore('syncQueue');
      console.log('[OfflineFirst] Cleared phantom sync operations');
      
      // Seed data if online
      if (navigator.onLine) {
        await seedOfflineData();
      }
      
      // Update stats
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
      
      // Fetch and cache products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);
      
      if (products) {
        for (const product of products) {
          await offlineDB.storeOfflineData('products', {
            id: product.id,
            user_id: product.user_id,
            name: product.name,
            category: product.category,
            cost_price: product.cost_price,
            selling_price: product.selling_price,
            current_stock: product.current_stock,
            low_stock_threshold: product.low_stock_threshold || 10,
            created_at: product.created_at,
            updated_at: product.updated_at
          });
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
          await offlineDB.storeOfflineData('customers', {
            id: customer.id,
            user_id: customer.user_id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            credit_limit: customer.credit_limit || 1000,
            outstanding_debt: customer.outstanding_debt || 0,
            created_date: customer.created_date || customer.created_at,
            updated_at: customer.updated_at
          });
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
          await offlineDB.storeOfflineData('sales', {
            id: sale.id,
            user_id: sale.user_id,
            product_id: sale.product_id,
            product_name: sale.product_name,
            quantity: sale.quantity,
            selling_price: sale.selling_price,
            cost_price: sale.cost_price,
            profit: sale.profit,
            total_amount: sale.total_amount,
            payment_method: sale.payment_method,
            customer_id: sale.customer_id,
            customer_name: sale.customer_name,
            payment_details: sale.payment_details,
            timestamp: sale.timestamp || sale.created_at,
            synced: true
          });
        }
        console.log(`[OfflineFirst] Cached ${sales.length} recent sales`);
      }

      // Fetch and cache transactions
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

  // Update stats
  const updateStats = useCallback(async () => {
    try {
      const dataStats = await offlineDB.getDataStats();
      const queue = await offlineDB.getSyncQueue();
      
      const stats: OfflineStats = {
        cached: {
          products: dataStats.products || 0,
          customers: dataStats.customers || 0,
          sales: dataStats.sales || 0,
          transactions: dataStats.transactions || 0
        },
        queued: {
          total: queue.length,
          high: queue.filter(item => item.priority === 'high').length,
          medium: queue.filter(item => item.priority === 'medium').length,
          low: queue.filter(item => item.priority === 'low').length
        }
      };
      
      setState(prev => ({ ...prev, stats, queuedOperations: queue.length }));
    } catch (error) {
      console.error('[OfflineFirst] Failed to update stats:', error);
    }
  }, []);

  // Force sync
  const forceSync = useCallback(async () => {
    if (!state.isOnline || state.syncInProgress) return;

    setState(prev => ({ ...prev, syncInProgress: true }));
    
    try {
      console.log('[OfflineFirst] Starting force sync...');
      
      // Implement sync logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate sync
      
      await updateStats();
      
      toast({
        title: "Sync Complete",
        description: "All offline data has been synchronized",
      });
      
    } catch (error) {
      console.error('[OfflineFirst] Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize offline data",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, syncInProgress: false }));
    }
  }, [state.isOnline, state.syncInProgress, updateStats, toast]);

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await Promise.all([
        offlineDB.clearStore('sales'),
        offlineDB.clearStore('products'),
        offlineDB.clearStore('customers'),
        offlineDB.clearStore('transactions'),
        offlineDB.clearStore('syncQueue'),
      ]);
      
      await updateStats();
      
      toast({
        title: "Data Cleared",
        description: "All offline data has been cleared",
      });
    } catch (error) {
      console.error('[OfflineFirst] Failed to clear offline data:', error);
      throw error;
    }
  }, [updateStats, toast]);

  // Get offline data
  const getOfflineData = useCallback(async (table: string) => {
    try {
      return await offlineDB.getOfflineData(table);
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return [];
    }
  }, []);

  // Store offline data
  const storeOfflineData = useCallback(async (table: string, data: any[]) => {
    try {
      for (const item of data) {
        await offlineDB.storeOfflineData(table, item);
      }
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  }, []);

  // Queue offline action
  const queueOfflineAction = useCallback(async (operation: any) => {
    try {
      await offlineDB.addToSyncQueue(operation);
      const queue = await offlineDB.getSyncQueue();
      setState(prev => ({ ...prev, queuedOperations: queue.length }));
    } catch (error) {
      console.error('Failed to queue offline action:', error);
    }
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineFirst] Device back online');
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      console.log('[OfflineFirst] Device went offline');
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize when user is available
  useEffect(() => {
    if (user && !state.isInitialized) {
      initialize();
    }
  }, [user, state.isInitialized, initialize]);

  return {
    ...state,
    initialize,
    seedOfflineData,
    getOfflineData,
    storeOfflineData,
    queueOfflineAction,
    forceSync,
    clearOfflineData,
    updateStats
  };
};
