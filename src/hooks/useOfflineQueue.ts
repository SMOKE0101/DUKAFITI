import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QueuedOperation {
  type: string;
  payload: any;
  offlineId: string;
  timestamp: number;
}

export const useOfflineQueue = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const processQueue = async () => {
    if (!user || isProcessing) return;

    const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]') as QueuedOperation[];
    if (queue.length === 0) return;

    setIsProcessing(true);
    console.log('[OfflineQueue] Processing queue with', queue.length, 'operations');

    const failedOperations: QueuedOperation[] = [];

    for (const operation of queue) {
      try {
        console.log('[OfflineQueue] Processing operation:', operation.type);

        switch (operation.type) {
          case 'CREATE_CUSTOMER':
            await processCreateCustomer(operation);
            break;
          case 'CREATE_PRODUCT':
            await processCreateProduct(operation);
            break;
          case 'ADD_STOCK':
            await processAddStock(operation);
            break;
          case 'RECORD_DEBT':
            await processRecordDebt(operation);
            break;
          default:
            console.warn('[OfflineQueue] Unknown operation type:', operation.type);
        }

        console.log('[OfflineQueue] Successfully processed:', operation.type);
      } catch (error) {
        console.error('[OfflineQueue] Failed to process operation:', operation.type, error);
        failedOperations.push(operation);
      }
    }

    // Update queue with only failed operations
    localStorage.setItem('offline_queue', JSON.stringify(failedOperations));

    // Update local caches to reflect synced state
    if (failedOperations.length < queue.length) {
      await refreshLocalCaches();
      
      const syncedCount = queue.length - failedOperations.length;
      toast({
        title: "Sync Complete",
        description: `${syncedCount} offline operations synced successfully`,
      });
    }

    if (failedOperations.length > 0) {
      toast({
        title: "Partial Sync",
        description: `${failedOperations.length} operations failed to sync and will retry later`,
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  const processCreateCustomer = async (operation: QueuedOperation) => {
    const { error } = await supabase
      .from('customers')
      .insert({
        user_id: user!.id,
        ...operation.payload,
      });

    if (error) {
      // Check if it's a duplicate error
      if (error.code === '23505') { // Unique constraint violation
        console.log('[OfflineQueue] Customer already exists, skipping');
        return;
      }
      throw error;
    }

    // Remove from local cache with offline ID
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const updatedCustomers = customers.filter((c: any) => c.id !== operation.offlineId);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
  };

  const processCreateProduct = async (operation: QueuedOperation) => {
    const { error } = await supabase
      .from('products')
      .insert({
        user_id: user!.id,
        name: operation.payload.name,
        category: operation.payload.category,
        cost_price: operation.payload.costPrice,
        selling_price: operation.payload.sellingPrice,
        current_stock: operation.payload.currentStock || 0,
        low_stock_threshold: operation.payload.lowStockThreshold || 10,
      });

    if (error) {
      if (error.code === '23505') {
        console.log('[OfflineQueue] Product already exists, skipping');
        return;
      }
      throw error;
    }

    // Remove from local cache
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = products.filter((p: any) => p.id !== operation.offlineId);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  const processAddStock = async (operation: QueuedOperation) => {
    const { productId, quantity, buyingPrice } = operation.payload;

    // Get current stock from database
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', productId)
      .eq('user_id', user!.id)
      .single();

    if (fetchError) throw fetchError;

    // Update stock
    const { error } = await supabase
      .from('products')
      .update({
        current_stock: product.current_stock + quantity,
        cost_price: buyingPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('user_id', user!.id);

    if (error) throw error;
  };

  const processRecordDebt = async (operation: QueuedOperation) => {
    const { error } = await supabase
      .from('transactions')
      .insert(operation.payload);

    if (error) {
      if (error.code === '23505') {
        console.log('[OfflineQueue] Transaction already exists, skipping');
        return;
      }
      throw error;
    }
  };

  const refreshLocalCaches = async () => {
    // Refresh customers
    try {
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user!.id);
      
      if (customers) {
        localStorage.setItem('customers', JSON.stringify(customers));
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to refresh customers cache:', error);
    }

    // Refresh products
    try {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user!.id);
      
      if (products) {
        localStorage.setItem('products', JSON.stringify(products));
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to refresh products cache:', error);
    }
  };

  // Auto-process queue when coming online
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineQueue] Detected online, processing queue...');
      setTimeout(processQueue, 1000); // Small delay to ensure connection is stable
    };

    window.addEventListener('online', handleOnline);
    
    // Also process on initial load if online
    if (navigator.onLine) {
      setTimeout(processQueue, 2000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

  const getQueueSize = () => {
    const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    return queue.length;
  };

  return {
    processQueue,
    getQueueSize,
    isProcessing,
  };
};