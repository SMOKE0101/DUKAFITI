import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { SyncService } from '../services/syncService';

export const useUnifiedSyncManager = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { pendingOps, clearAllPendingOperations } = useCacheManager();

  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || pendingOps.length === 0 || !user) return false;

    console.log('[UnifiedSyncManager] Starting sync process...');
    console.log('[UnifiedSyncManager] Pending operations:', pendingOps);
    
    try {
      // Convert cache manager operations to sync service format
      const syncOperations = pendingOps.map(op => ({
        id: op.id,
        type: op.type as 'sale' | 'product' | 'customer' | 'transaction',
        operation: op.operation as 'create' | 'update' | 'delete',
        data: op.data,
      }));

      const success = await SyncService.syncPendingOperations(syncOperations, user.id);
      
      if (success) {
        // Clear all pending operations after successful sync
        clearAllPendingOperations();
        console.log('[UnifiedSyncManager] Sync completed successfully - operations cleared');
        
        // Dispatch sync events to notify all components immediately and after a delay
        console.log('[UnifiedSyncManager] Dispatching immediate refresh events');
        window.dispatchEvent(new CustomEvent('sync-completed'));
        window.dispatchEvent(new CustomEvent('data-synced'));
        window.dispatchEvent(new CustomEvent('sales-synced'));
        window.dispatchEvent(new CustomEvent('products-synced')); 
        window.dispatchEvent(new CustomEvent('customers-synced'));
        
        // Also dispatch after a delay to ensure all components receive the events
        setTimeout(() => {
          console.log('[UnifiedSyncManager] Dispatching delayed refresh events');
          window.dispatchEvent(new CustomEvent('sync-completed'));
          window.dispatchEvent(new CustomEvent('data-synced'));
          window.dispatchEvent(new CustomEvent('sales-synced'));
          window.dispatchEvent(new CustomEvent('products-synced')); 
          window.dispatchEvent(new CustomEvent('customers-synced'));
        }, 500);
        
        return true;
      } else {
        console.log('[UnifiedSyncManager] Some operations failed to sync');
        return false;
      }
    } catch (error) {
      console.error('[UnifiedSyncManager] Sync failed:', error);
      return false;
    }
  }, [isOnline, pendingOps, user, clearAllPendingOperations]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingOps.length > 0 && user) {
      console.log('[UnifiedSyncManager] Coming online with pending operations, auto-syncing...');
      // Use timeout to prevent immediate re-triggering
      const timeout = setTimeout(() => {
        syncPendingOperations();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, user?.id, pendingOps.length, syncPendingOperations]);

  return {
    isOnline,
    pendingOperations: pendingOps.length,
    syncPendingOperations,
  };
};