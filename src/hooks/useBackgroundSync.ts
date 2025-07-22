
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { useToast } from './use-toast';

export const useBackgroundSync = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { pendingOps, clearPendingOperation, loadPendingOperations } = useCacheManager();
  const { toast } = useToast();

  // Process pending operations
  const processPendingOperations = useCallback(async () => {
    if (!user || !isOnline || pendingOps.length === 0) return;

    console.log('[BackgroundSync] Processing', pendingOps.length, 'pending operations');

    for (const operation of pendingOps) {
      try {
        let success = false;

        switch (operation.type) {
          case 'sale':
            if (operation.operation === 'create') {
              const { error } = await supabase
                .from('sales')
                .insert([{
                  user_id: user.id,
                  product_id: operation.data.productId,
                  product_name: operation.data.productName,
                  customer_id: operation.data.customerId,
                  customer_name: operation.data.customerName,
                  quantity: operation.data.quantity,
                  selling_price: operation.data.sellingPrice,
                  cost_price: operation.data.costPrice,
                  profit: operation.data.profit,
                  total_amount: operation.data.totalAmount,
                  payment_method: operation.data.paymentMethod,
                  timestamp: operation.data.timestamp,
                  synced: true,
                }]);
              success = !error;
            }
            break;

          case 'product':
            if (operation.operation === 'create') {
              const { error } = await supabase
                .from('products')
                .insert([{
                  name: operation.data.name,
                  category: operation.data.category,
                  cost_price: operation.data.costPrice,
                  selling_price: operation.data.sellingPrice,
                  current_stock: operation.data.currentStock,
                  low_stock_threshold: operation.data.lowStockThreshold,
                  user_id: user.id,
                }]);
              success = !error;
            } else if (operation.operation === 'update') {
              const updateData: any = {};
              const updates = operation.data.updates;
              if (updates.name !== undefined) updateData.name = updates.name;
              if (updates.category !== undefined) updateData.category = updates.category;
              if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
              if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice;
              if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
              if (updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = updates.lowStockThreshold;

              const { error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', operation.data.id)
                .eq('user_id', user.id);
              success = !error;
            }
            break;

          case 'customer':
            if (operation.operation === 'create') {
              const { error } = await supabase
                .from('customers')
                .insert([{ ...operation.data, user_id: user.id }]);
              success = !error;
            } else if (operation.operation === 'update') {
              const { error } = await supabase
                .from('customers')
                .update(operation.data.updates)
                .eq('id', operation.data.id)
                .eq('user_id', user.id);
              success = !error;
            }
            break;
        }

        if (success) {
          clearPendingOperation(operation.id);
          console.log('[BackgroundSync] Synced operation:', operation.id);
        } else {
          console.error('[BackgroundSync] Failed to sync operation:', operation.id);
        }
      } catch (error) {
        console.error('[BackgroundSync] Error syncing operation:', operation.id, error);
      }
    }

    if (pendingOps.length > 0) {
      toast({
        title: "Sync Complete",
        description: `Synchronized ${pendingOps.length} offline changes`,
      });
    }
  }, [user, isOnline, pendingOps, clearPendingOperation, toast]);

  // Load pending operations on mount
  useEffect(() => {
    loadPendingOperations();
  }, [loadPendingOperations]);

  // Process pending operations when coming online
  useEffect(() => {
    const handleReconnect = () => {
      setTimeout(() => {
        processPendingOperations();
      }, 2000); // Delay to ensure stable connection
    };

    window.addEventListener('network-reconnected', handleReconnect);
    return () => window.removeEventListener('network-reconnected', handleReconnect);
  }, [processPendingOperations]);

  // Periodic sync when online
  useEffect(() => {
    if (!isOnline || pendingOps.length === 0) return;

    const interval = setInterval(() => {
      processPendingOperations();
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, pendingOps.length, processPendingOperations]);

  return {
    pendingOperationsCount: pendingOps.length,
    processPendingOperations,
  };
};
