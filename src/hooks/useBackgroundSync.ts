
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface SyncOperation {
  id: string;
  operation_type: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  created_at: string;
}

export const useBackgroundSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user && isOnline) {
      loadQueue();
    }
  }, [user, isOnline]);

  const loadQueue = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sync_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Type assertion to ensure status matches our interface
      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'processing' | 'completed' | 'failed'
      }));
      
      setSyncQueue(typedData);
      
      if (typedData && typedData.length > 0) {
        processQueue();
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  };

  const addToQueue = async (operationType: string, data: any) => {
    if (!user) return;

    const operation = {
      user_id: user.id,
      operation_type: operationType,
      data,
      status: 'pending' as const,
      attempts: 0,
    };

    try {
      if (isOnline) {
        // Try to process immediately if online
        await processOperation(operation);
      } else {
        // Add to queue for later processing
        const { error } = await supabase
          .from('sync_queue')
          .insert(operation);

        if (error) throw error;

        toast({
          title: "Offline Mode",
          description: "Operation saved and will sync when connection is restored.",
        });
      }
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
      // Store locally as fallback
      const localQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
      localQueue.push({ ...operation, id: Date.now().toString() });
      localStorage.setItem('offline_queue', JSON.stringify(localQueue));
    }
  };

  const processQueue = async () => {
    if (!user || isSyncing || !isOnline) return;

    setIsSyncing(true);

    try {
      // Process local queue first
      const localQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
      for (const operation of localQueue) {
        await processOperation(operation);
      }
      localStorage.removeItem('offline_queue');

      // Process database queue
      for (const operation of syncQueue) {
        await processOperation(operation);
      }

      await loadQueue(); // Refresh queue
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const processOperation = async (operation: any) => {
    if (!user) return;

    try {
      // Update status to processing
      if (operation.id) {
        await supabase
          .from('sync_queue')
          .update({ 
            status: 'processing', 
            attempts: operation.attempts + 1 
          })
          .eq('id', operation.id);
      }

      // Process based on operation type
      switch (operation.operation_type) {
        case 'sale':
          await processSaleSync(operation.data);
          break;
        case 'product_update':
          await processProductSync(operation.data);
          break;
        case 'customer_update':
          await processCustomerSync(operation.data);
          break;
        default:
          console.warn('Unknown operation type:', operation.operation_type);
      }

      // Mark as completed
      if (operation.id) {
        await supabase
          .from('sync_queue')
          .update({ status: 'completed' })
          .eq('id', operation.id);
      }

      console.log('Operation synced successfully:', operation.operation_type);
    } catch (error) {
      console.error('Failed to process operation:', error);
      
      // Mark as failed if max attempts reached
      if (operation.attempts >= 3) {
        if (operation.id) {
          await supabase
            .from('sync_queue')
            .update({ status: 'failed' })
            .eq('id', operation.id);
        }
      }
    }
  };

  const processSaleSync = async (saleData: any) => {
    await supabase.from('sales').insert(saleData);
  };

  const processProductSync = async (productData: any) => {
    await supabase
      .from('products')
      .update(productData.updates)
      .eq('id', productData.id);
  };

  const processCustomerSync = async (customerData: any) => {
    if (customerData.id) {
      await supabase
        .from('customers')
        .update(customerData.updates)
        .eq('id', customerData.id);
    } else {
      await supabase.from('customers').insert(customerData);
    }
  };

  return {
    isOnline,
    isSyncing,
    queueLength: syncQueue.length,
    addToQueue,
    processQueue,
  };
};
