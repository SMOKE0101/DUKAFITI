
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '../integrations/supabase/client';
import { offlineOrderManager, OfflineOrder } from '../utils/offlineOrderManager';

interface OrderSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOrdersCount: number;
  lastSyncTime: string | null;
  syncErrors: string[];
}

export const useOrderSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [syncState, setSyncState] = useState<OrderSyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOrdersCount: 0,
    lastSyncTime: localStorage.getItem('lastOrderSyncTime'),
    syncErrors: []
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OrderSync] Device online - starting sync');
      setSyncState(prev => ({ ...prev, isOnline: true }));
      if (user) {
        setTimeout(() => syncOrders(), 1000);
      }
    };

    const handleOffline = () => {
      console.log('[OrderSync] Device offline');
      setSyncState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending orders count on mount
    loadPendingOrdersCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const loadPendingOrdersCount = async () => {
    try {
      const unsyncedOrders = await offlineOrderManager.getUnsyncedOrders();
      setSyncState(prev => ({ 
        ...prev, 
        pendingOrdersCount: unsyncedOrders.length 
      }));
    } catch (error) {
      console.error('[OrderSync] Failed to load pending orders count:', error);
    }
  };

  const createOfflineOrder = useCallback(async (orderData: {
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      sellingPrice: number;
      costPrice: number;
      totalAmount: number;
    }>;
    totalAmount: number;
    paymentMethod: string;
    customerId?: string;
    customerName?: string;
  }): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('[OrderSync] Creating offline order:', orderData);

      const offlineId = await offlineOrderManager.storeOfflineOrder({
        userId: user.id,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        timestamp: new Date().toISOString()
      });

      // Update pending count
      await loadPendingOrdersCount();

      // Try to sync immediately if online
      if (syncState.isOnline) {
        setTimeout(() => syncOrders(), 500);
      }

      console.log('[OrderSync] Offline order created with ID:', offlineId);
      return offlineId;

    } catch (error) {
      console.error('[OrderSync] Failed to create offline order:', error);
      throw error;
    }
  }, [user, syncState.isOnline]);

  const syncOrders = useCallback(async () => {
    if (!syncState.isOnline || syncState.isSyncing || !user) {
      return;
    }

    setSyncState(prev => ({ 
      ...prev, 
      isSyncing: true,
      syncErrors: []
    }));

    try {
      console.log('[OrderSync] Starting order sync process');

      const unsyncedOrders = await offlineOrderManager.getUnsyncedOrders();
      
      if (unsyncedOrders.length === 0) {
        console.log('[OrderSync] No orders to sync');
        setSyncState(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncTime: new Date().toISOString()
        }));
        localStorage.setItem('lastOrderSyncTime', new Date().toISOString());
        return;
      }

      console.log(`[OrderSync] Syncing ${unsyncedOrders.length} orders`);

      let successCount = 0;
      const errors: string[] = [];

      // Process orders sequentially to avoid race conditions
      for (const order of unsyncedOrders) {
        try {
          console.log(`[OrderSync] Syncing order ${order.offlineId}`);

          // Check if this offline ID already exists in the database
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('offline_id', order.offlineId)
            .maybeSingle();

          if (existingOrder) {
            console.log(`[OrderSync] Order ${order.offlineId} already exists, marking as synced`);
            await offlineOrderManager.markOrderAsSynced(order.offlineId);
            successCount++;
            continue;
          }

          // Create individual sales records for each item in the order
          const salesData = order.items.map(item => ({
            user_id: user.id,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            selling_price: item.sellingPrice,
            cost_price: item.costPrice,
            profit: (item.sellingPrice - item.costPrice) * item.quantity,
            total_amount: item.totalAmount,
            payment_method: order.paymentMethod,
            customer_id: order.customerId,
            customer_name: order.customerName,
            timestamp: order.timestamp,
            offline_id: order.offlineId // Include offline ID for deduplication
          }));

          // Insert sales records
          const { error: salesError } = await supabase
            .from('sales')
            .insert(salesData);

          if (salesError) {
            console.error(`[OrderSync] Failed to sync order ${order.offlineId}:`, salesError);
            await offlineOrderManager.incrementSyncAttempts(order.offlineId);
            errors.push(`Order ${order.offlineId.slice(-8)}: ${salesError.message}`);
            continue;
          }

          // Mark as synced
          await offlineOrderManager.markOrderAsSynced(order.offlineId);
          successCount++;

          console.log(`[OrderSync] Successfully synced order ${order.offlineId}`);

        } catch (error) {
          console.error(`[OrderSync] Error syncing order ${order.offlineId}:`, error);
          await offlineOrderManager.incrementSyncAttempts(order.offlineId);
          errors.push(`Order ${order.offlineId.slice(-8)}: ${error.message}`);
        }
      }

      // Clean up failed orders after max attempts
      await offlineOrderManager.removeFailedOrders(3);

      const syncTime = new Date().toISOString();
      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastSyncTime: syncTime,
        syncErrors: errors
      }));

      localStorage.setItem('lastOrderSyncTime', syncTime);

      // Update pending count
      await loadPendingOrdersCount();

      if (successCount > 0) {
        toast({
          title: "Orders Synced",
          description: `${successCount} order${successCount > 1 ? 's' : ''} synced successfully`,
          duration: 3000,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Sync Issues",
          description: `${errors.length} order${errors.length > 1 ? 's' : ''} failed to sync`,
          variant: "destructive",
          duration: 5000,
        });
      }

      console.log(`[OrderSync] Sync completed: ${successCount} synced, ${errors.length} errors`);

    } catch (error) {
      console.error('[OrderSync] Sync process failed:', error);
      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false,
        syncErrors: [`Sync failed: ${error.message}`]
      }));
      
      toast({
        title: "Sync Failed",
        description: "Unable to sync orders. Will retry automatically.",
        variant: "destructive",
      });
    }
  }, [syncState.isOnline, syncState.isSyncing, user, toast]);

  const forceSyncNow = useCallback(async () => {
    if (syncState.isOnline && !syncState.isSyncing) {
      await syncOrders();
    } else if (!syncState.isOnline) {
      toast({
        title: "Offline Mode",
        description: "Cannot sync while offline. Orders will sync when connection is restored.",
        variant: "default",
      });
    }
  }, [syncState.isOnline, syncState.isSyncing, syncOrders, toast]);

  const clearSyncErrors = useCallback(() => {
    setSyncState(prev => ({ ...prev, syncErrors: [] }));
  }, []);

  return {
    ...syncState,
    createOfflineOrder,
    syncOrders,
    forceSyncNow,
    clearSyncErrors,
    loadPendingOrdersCount
  };
};
