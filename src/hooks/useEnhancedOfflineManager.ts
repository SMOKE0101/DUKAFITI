
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: string | null;
  serviceWorkerReady: boolean;
}

interface PendingOperation {
  id: string;
  type: 'sale' | 'product' | 'customer';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  attempts: number;
}

export const useEnhancedOfflineManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    isSyncing: false,
    pendingOperations: 0,
    lastSyncTime: localStorage.getItem('lastSyncTime'),
    serviceWorkerReady: false
  });

  // Initialize enhanced offline system
  useEffect(() => {
    initializeOfflineSystem();
    
    const handleOnline = () => {
      console.log('[EnhancedOffline] Going online');
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      if (user) {
        setTimeout(() => syncPendingOperations(), 1000);
      }
    };

    const handleOffline = () => {
      console.log('[EnhancedOffline] Going offline');
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const initializeOfflineSystem = async () => {
    try {
      console.log('[EnhancedOffline] Initializing enhanced offline system...');
      
      // Register enhanced service worker
      if ('serviceWorker' in navigator) {
        try {
          // Unregister old service workers
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
          
          // Register new enhanced service worker
          const registration = await navigator.serviceWorker.register('/enhanced-robust-sw.js', {
            scope: '/'
          });
          
          console.log('[EnhancedOffline] Enhanced service worker registered');
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast({
                    title: "App Updated",
                    description: "New version available. Refresh to update.",
                    duration: 5000,
                  });
                }
              });
            }
          });

          setOfflineState(prev => ({ ...prev, serviceWorkerReady: true }));
          
        } catch (error) {
          console.error('[EnhancedOffline] Service worker registration failed:', error);
        }
      }
      
      // Load pending operations count
      await loadPendingOperationsCount();
      
      setOfflineState(prev => ({ ...prev, isInitialized: true }));
      console.log('[EnhancedOffline] Enhanced offline system initialized');
      
    } catch (error) {
      console.error('[EnhancedOffline] Failed to initialize:', error);
      setOfflineState(prev => ({ ...prev, isInitialized: true }));
    }
  };

  const loadPendingOperationsCount = async () => {
    try {
      const operations = await getStoredOperations();
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: operations.length 
      }));
    } catch (error) {
      console.error('[EnhancedOffline] Failed to load pending operations:', error);
    }
  };

  const addOfflineOperation = useCallback(async (
    type: 'sale' | 'product' | 'customer',
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<string> => {
    const operationId = `${type}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingOperation: PendingOperation = {
      id: operationId,
      type,
      operation,
      data: { ...data, userId: user?.id },
      timestamp: new Date().toISOString(),
      attempts: 0
    };

    try {
      // Store in localStorage for persistence
      const existing = await getStoredOperations();
      const updated = [...existing, pendingOperation];
      localStorage.setItem('pendingOperations', JSON.stringify(updated));
      
      // Update state
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: updated.length 
      }));
      
      // Try immediate sync if online
      if (offlineState.isOnline && user) {
        setTimeout(() => syncPendingOperations(), 500);
      }
      
      console.log(`[EnhancedOffline] Added ${type} ${operation} operation:`, operationId);
      return operationId;
      
    } catch (error) {
      console.error('[EnhancedOffline] Failed to add operation:', error);
      throw error;
    }
  }, [user, offlineState.isOnline]);

  const syncPendingOperations = useCallback(async () => {
    if (!offlineState.isOnline || offlineState.isSyncing || !user) {
      return;
    }

    setOfflineState(prev => ({ ...prev, isSyncing: true }));

    try {
      const operations = await getStoredOperations();
      
      if (operations.length === 0) {
        setOfflineState(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncTime: new Date().toISOString()
        }));
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        return;
      }

      console.log(`[EnhancedOffline] Syncing ${operations.length} operations`);

      let syncedCount = 0;
      const failedOperations: PendingOperation[] = [];

      for (const operation of operations) {
        try {
          const success = await syncSingleOperation(operation);
          if (success) {
            syncedCount++;
          } else {
            operation.attempts++;
            if (operation.attempts < 3) {
              failedOperations.push(operation);
            }
          }
        } catch (error) {
          console.error(`[EnhancedOffline] Failed to sync operation ${operation.id}:`, error);
          operation.attempts++;
          if (operation.attempts < 3) {
            failedOperations.push(operation);
          }
        }
      }

      // Update stored operations with failed ones
      localStorage.setItem('pendingOperations', JSON.stringify(failedOperations));
      
      const syncTime = new Date().toISOString();
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        pendingOperations: failedOperations.length,
        lastSyncTime: syncTime
      }));

      localStorage.setItem('lastSyncTime', syncTime);
      
      if (syncedCount > 0) {
        toast({
          title: "Sync Complete",
          description: `${syncedCount} operations synced successfully`,
          duration: 3000,
        });
      }

      console.log(`[EnhancedOffline] Sync completed: ${syncedCount} synced, ${failedOperations.length} pending`);

    } catch (error) {
      console.error('[EnhancedOffline] Sync process failed:', error);
      setOfflineState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [offlineState.isOnline, offlineState.isSyncing, user, toast]);

  const syncSingleOperation = async (operation: PendingOperation): Promise<boolean> => {
    // This would integrate with your actual API calls
    // For now, we'll simulate success
    console.log(`[EnhancedOffline] Syncing ${operation.type} ${operation.operation}`);
    return true;
  };

  const getStoredOperations = async (): Promise<PendingOperation[]> => {
    try {
      const stored = localStorage.getItem('pendingOperations');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[EnhancedOffline] Failed to get stored operations:', error);
      return [];
    }
  };

  const forceSyncNow = useCallback(async () => {
    if (offlineState.isOnline && !offlineState.isSyncing) {
      await syncPendingOperations();
    } else if (!offlineState.isOnline) {
      toast({
        title: "Offline Mode",
        description: "Cannot sync while offline. Data will sync when connection is restored.",
        variant: "default",
      });
    }
  }, [offlineState.isOnline, offlineState.isSyncing, syncPendingOperations, toast]);

  return {
    ...offlineState,
    addOfflineOperation,
    syncPendingOperations,
    forceSyncNow,
  };
};
