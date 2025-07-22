
import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { SyncService } from '../services/syncService';

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
  const { pendingOps, clearPendingOperation } = useCacheManager();

  const requestSync = useCallback(async (type: string) => {
    if (!isOnline || !user || processingRef.current) {
      console.log(`[SyncCoordinator] Sync request denied for ${type}:`, { isOnline, hasUser: !!user, processing: processingRef.current });
      return false;
    }

    // Check if we have pending operations for this type
    const typeOperations = pendingOps.filter(op => op.type === type);
    if (typeOperations.length === 0) {
      console.log(`[SyncCoordinator] No pending operations for ${type}`);
      return true;
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
  }, [isOnline, user, pendingOps]);

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
          // Get operations for this specific type
          const typeOperations = pendingOps.filter(op => op.type === type);
          
          if (typeOperations.length > 0) {
            console.log(`[SyncCoordinator] Syncing ${typeOperations.length} ${type} operations`);
            
            // Use SyncService to handle the actual sync
            const success = await SyncService.syncPendingOperations(typeOperations, user!.id);
            
            if (success) {
              // Clear the synced operations
              typeOperations.forEach(op => clearPendingOperation(op.id));
              
              setSyncStatus(prev => ({
                ...prev,
                [type]: { type: type as any, status: 'completed', lastAttempt: Date.now() }
              }));

              // Dispatch type-specific sync events
              console.log(`[SyncCoordinator] Dispatching events for ${type}`);
              window.dispatchEvent(new CustomEvent(`${type}-synced`));
              window.dispatchEvent(new CustomEvent(`sync-${type}-completed`));
              
              console.log(`[SyncCoordinator] Completed sync for ${type}`);
            } else {
              setSyncStatus(prev => ({
                ...prev,
                [type]: { type: type as any, status: 'failed', lastAttempt: Date.now() }
              }));
              console.error(`[SyncCoordinator] Failed to sync ${type} operations`);
            }
          } else {
            setSyncStatus(prev => ({
              ...prev,
              [type]: { type: type as any, status: 'completed', lastAttempt: Date.now() }
            }));
          }
        } catch (error) {
          console.error(`[SyncCoordinator] Error syncing ${type}:`, error);
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
  }, [pendingOps, user, clearPendingOperation]);

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
