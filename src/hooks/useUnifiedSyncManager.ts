
import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { useSyncCoordinator } from './useSyncCoordinator';
import { SyncService } from '../services/syncService';

export const useUnifiedSyncManager = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { pendingOps, clearAllPendingOperations } = useCacheManager();
  const { requestSync, globalSyncInProgress, pendingOperationsCount } = useSyncCoordinator();

  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || pendingOps.length === 0 || !user || globalSyncInProgress) {
      console.log('[UnifiedSyncManager] Sync conditions not met:', {
        isOnline,
        pendingOpsLength: pendingOps.length,
        hasUser: !!user,
        globalSyncInProgress
      });
      return false;
    }

    console.log('[UnifiedSyncManager] Starting coordinated sync process...');
    console.log('[UnifiedSyncManager] Pending operations:', pendingOps);
    
    try {
      // Group operations by type for coordinated syncing
      const operationsByType = pendingOps.reduce((acc, op) => {
        if (!acc[op.type]) acc[op.type] = [];
        acc[op.type].push(op);
        return acc;
      }, {} as Record<string, any[]>);

      console.log('[UnifiedSyncManager] Operations by type:', Object.keys(operationsByType));

      // Request coordinated sync for each type that has pending operations
      for (const type of Object.keys(operationsByType)) {
        console.log(`[UnifiedSyncManager] Requesting sync for ${type}`);
        await requestSync(type);
      }

      return true;
    } catch (error) {
      console.error('[UnifiedSyncManager] Sync failed:', error);
      return false;
    }
  }, [isOnline, pendingOps, user, globalSyncInProgress, requestSync]);

  // Auto-sync when coming online (with coordination)
  useEffect(() => {
    if (isOnline && pendingOps.length > 0 && user && !globalSyncInProgress) {
      console.log('[UnifiedSyncManager] Coming online with pending operations, initiating coordinated sync...');
      // Use timeout to prevent immediate re-triggering
      const timeout = setTimeout(() => {
        syncPendingOperations();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, user?.id, pendingOps.length, globalSyncInProgress, syncPendingOperations]);

  return {
    isOnline,
    pendingOperations: pendingOperationsCount,
    syncPendingOperations,
    globalSyncInProgress,
  };
};
