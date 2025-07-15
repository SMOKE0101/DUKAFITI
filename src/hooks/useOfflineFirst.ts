
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { offlineDB } from '@/utils/indexedDB';

interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  syncInProgress: boolean;
  queuedOperations: number;
  lastSyncTime?: Date;
  error?: string;
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

  // Initialize offline-first system
  const initialize = useCallback(async () => {
    if (!user || state.isInitialized) return;

    try {
      console.log('[OfflineFirst] Initializing offline-first system...');
      
      // Initialize IndexedDB
      await offlineDB.init();
      
      // Clear sync queue on fresh start to avoid phantom operations
      await offlineDB.clearStore('syncQueue');
      console.log('[OfflineFirst] Cleared sync queue');
      
      // Seed data if online
      if (navigator.onLine) {
        await seedOfflineData();
      }
      
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

    } catch (error) {
      console.error('[OfflineFirst] Failed to seed offline data:', error);
    }
  }, [user]);

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
    queueOfflineAction
  };
};
