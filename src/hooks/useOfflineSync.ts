
import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface PendingOperation {
  type: string;
  data: any;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const { toast } = useToast();

  const addPendingOperation = useCallback((operation: PendingOperation) => {
    setPendingOperations(prev => [...prev, operation]);
  }, []);

  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || pendingOperations.length === 0) return;

    try {
      // Process pending operations
      for (const operation of pendingOperations) {
        // Implementation would sync with your backend
        console.log('Syncing operation:', operation);
      }
      
      setPendingOperations([]);
      toast({
        title: "Sync Complete",
        description: `${pendingOperations.length} operations synchronized`,
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Some operations could not be synchronized",
        variant: "destructive"
      });
    }
  }, [isOnline, pendingOperations, toast]);

  return {
    isOnline,
    pendingOperations,
    addPendingOperation,
    syncPendingOperations
  };
};
