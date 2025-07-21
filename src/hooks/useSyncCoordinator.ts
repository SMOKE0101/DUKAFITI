
import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';

interface SyncOperation {
  type: 'product' | 'customer' | 'sale' | 'transaction';
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  lastAttempt?: number;
}

export const useSyncCoordinator = () => {
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncOperation>>({});
  const [globalSyncInProgress, setGlobalSyncInProgress] = useState(false);
  const syncQueueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { pendingOps } = useCacheManager();

  const requestSync = useCallback(async (type: string) => {
    if (!isOnline || !user || processingRef.current) {
      console.log(`[SyncCoordinator] Sync request denied for ${type}:`, { isOnline, hasUser: !!user, processing: processingRef.current });
      return false;
    }

    // Add to queue if not already present
    if (!syncQueueRef.current.includes(type)) {
      syncQueueRef.current.push(type);
      console.log(`[SyncCoordinator] Added ${type} to sync queue:`, syncQueueRef.current);
    }

    // Process queue if not already processing
    if (!processingRef.current) {
      await processSync();
    }

    return true;
  }, [isOnline, user]);

  const processSync = useCallback(async () => {
    if (processingRef.current || syncQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    setGlobalSyncInProgress(true);
    console.log('[SyncCoordinator] Starting sync process for queue:', syncQueueRef.current);

    try {
      // Process each type in the queue
      while (syncQueueRef.current.length > 0) {
        const type = syncQueueRef.current.shift()!;
        
        setSyncStatus(prev => ({
          ...prev,
          [type]: { type: type as any, status: 'syncing', lastAttempt: Date.now() }
        }));

        try {
          // Dispatch type-specific sync event
          console.log(`[SyncCoordinator] Processing sync for ${type}`);
          window.dispatchEvent(new CustomEvent(`sync-${type}`, { 
            detail: { coordinated: true } 
          }));

          // Wait a bit for the sync to process
          await new Promise(resolve => setTimeout(resolve, 500));

          setSyncStatus(prev => ({
            ...prev,
            [type]: { type: type as any, status: 'completed', lastAttempt: Date.now() }
          }));

          console.log(`[SyncCoordinator] Completed sync for ${type}`);
        } catch (error) {
          console.error(`[SyncCoordinator] Failed to sync ${type}:`, error);
          setSyncStatus(prev => ({
            ...prev,
            [type]: { type: type as any, status: 'failed', lastAttempt: Date.now() }
          }));
        }
      }

      // Final notification after all syncs complete
      setTimeout(() => {
        console.log('[SyncCoordinator] All syncs completed, dispatching global events');
        window.dispatchEvent(new CustomEvent('sync-completed'));
        window.dispatchEvent(new CustomEvent('data-synced'));
      }, 100);

    } finally {
      processingRef.current = false;
      setGlobalSyncInProgress(false);
      console.log('[SyncCoordinator] Sync process completed');
    }
  }, []);

  const getSyncStatus = useCallback((type: string) => {
    return syncStatus[type] || { type: type as any, status: 'pending' };
  }, [syncStatus]);

  const hasPendingOperations = useCallback((type: string) => {
    return pendingOps.filter(op => op.type === type).length > 0;
  }, [pendingOps]);

  return {
    requestSync,
    getSyncStatus,
    globalSyncInProgress,
    hasPendingOperations,
    pendingOperationsCount: pendingOps.length,
  };
};
