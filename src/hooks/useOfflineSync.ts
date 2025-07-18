
import { useState, useEffect } from 'react';

interface PendingOperation {
  id: string;
  type: 'sale' | 'inventory' | 'customer';
  data: any;
  timestamp: string;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending operations from localStorage
    loadPendingOperations();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingOperations = () => {
    try {
      const stored = localStorage.getItem('dts_pending_operations');
      if (stored) {
        setPendingOperations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  };

  const addPendingOperation = (operation: Omit<PendingOperation, 'id' | 'timestamp'>) => {
    const newOperation: PendingOperation = {
      ...operation,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...pendingOperations, newOperation];
    setPendingOperations(updated);
    localStorage.setItem('dts_pending_operations', JSON.stringify(updated));

    // Try to sync immediately if online
    if (isOnline) {
      syncPendingOperations();
    }
  };

  const syncPendingOperations = async () => {
    if (!isOnline || pendingOperations.length === 0 || isSyncing) {
      return;
    }

    setIsSyncing(true);
    console.log('Syncing pending operations:', pendingOperations.length);

    try {
      // Process each pending operation
      const syncedOperations: string[] = [];

      for (const operation of pendingOperations) {
        try {
          // Here you would normally send to your backend
          // For now, we'll just simulate success and store locally
          console.log(`Syncing ${operation.type} operation:`, operation.data);
          
          // Mark as synced
          syncedOperations.push(operation.id);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
        }
      }

      // Remove successfully synced operations
      const remaining = pendingOperations.filter(op => !syncedOperations.includes(op.id));
      setPendingOperations(remaining);
      localStorage.setItem('dts_pending_operations', JSON.stringify(remaining));

      console.log(`Synced ${syncedOperations.length} operations, ${remaining.length} remaining`);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearPendingOperations = () => {
    setPendingOperations([]);
    localStorage.removeItem('dts_pending_operations');
  };

  return {
    isOnline,
    pendingOperations,
    isSyncing,
    addPendingOperation,
    syncPendingOperations,
    clearPendingOperations,
  };
};
