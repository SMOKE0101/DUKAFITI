
import { useState, useCallback } from 'react';
import { useOfflineFirst } from './useOfflineFirst';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface MutationOptions {
  table: 'products' | 'customers' | 'sales' | 'transactions';
  operation: 'insert' | 'update' | 'delete';
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
}

export const useOfflineAwareMutation = ({
  table,
  operation,
  onSuccess,
  onError
}: MutationOptions) => {
  const [loading, setLoading] = useState(false);
  const { isOnline, queueOfflineAction, updateOfflineData } = useOfflineFirst();
  const { toast } = useToast();

  const mutate = useCallback(async (data: any, options?: { id?: string }) => {
    setLoading(true);

    try {
      if (isOnline) {
        // Execute immediately when online
        let result;
        
        switch (operation) {
          case 'insert':
            result = await supabase.from(table as any).insert(data).select().single();
            break;
          case 'update':
            result = await supabase
              .from(table as any)
              .update(data)
              .eq('id', options?.id || data.id)
              .select()
              .single();
            break;
          case 'delete':
            result = await supabase
              .from(table as any)
              .delete()
              .eq('id', options?.id || data.id);
            break;
        }

        if (result?.error) throw result.error;

        // Update offline cache
        await updateOfflineData(table, operation === 'insert' ? 'create' : operation, result?.data || data);
        
        onSuccess?.(result?.data);
        
        toast({
          title: "Success",
          description: `${operation.charAt(0).toUpperCase() + operation.slice(1)} completed successfully`,
        });
      } else {
        // Queue for later when offline
        const queueItem = {
          id: crypto.randomUUID(),
          table,
          operation: operation === 'insert' ? 'create' : operation,
          data,
          options,
          timestamp: new Date().toISOString(),
          priority: operation === 'insert' ? 'high' : 'medium',
          attempts: 0,
          synced: false
        };

        await queueOfflineAction(queueItem);
        
        // Optimistically update offline cache
        await updateOfflineData(table, operation === 'insert' ? 'create' : operation, data);
        
        onSuccess?.(data);
        
        toast({
          title: "Queued for Sync",
          description: `${operation.charAt(0).toUpperCase() + operation.slice(1)} will be synced when back online`,
        });
      }
    } catch (error) {
      console.error(`Mutation error for ${table}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [table, operation, isOnline, queueOfflineAction, updateOfflineData, onSuccess, onError, toast]);

  return {
    mutate,
    loading,
    isOnline
  };
};
