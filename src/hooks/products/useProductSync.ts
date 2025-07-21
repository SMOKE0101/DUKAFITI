
import { useCallback, useRef } from 'react';
import { useAuth } from '../useAuth';
import { useNetworkStatus } from '../useNetworkStatus';
import { useCacheManager } from '../useCacheManager';
import { ProductSyncService } from '../../services/productSyncService';
import { useToast } from '../use-toast';

export const useProductSync = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { pendingOps, clearPendingOperation } = useCacheManager();
  const { toast } = useToast();
  
  const isSyncingRef = useRef(false);
  const lastSyncRef = useRef(0);

  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || !user || isSyncingRef.current) return false;

    const productOps = pendingOps.filter(op => op.type === 'product');
    if (productOps.length === 0) return true;

    console.log(`[ProductSync] Syncing ${productOps.length} pending operations`);
    isSyncingRef.current = true;

    try {
      const success = await ProductSyncService.syncProductOperations(productOps, user.id);
      
      if (success) {
        // Clear all synced operations
        productOps.forEach(op => clearPendingOperation(op.id));
        
        console.log('[ProductSync] All operations synced successfully');
        
        // Dispatch sync events
        window.dispatchEvent(new CustomEvent('products-synced'));
        window.dispatchEvent(new CustomEvent('sync-completed'));
        
        toast({
          title: "Sync Complete",
          description: `${productOps.length} product operations synced successfully`,
          duration: 3000,
        });
        
        return true;
      } else {
        console.log('[ProductSync] Some operations failed to sync');
        return false;
      }
    } catch (error) {
      console.error('[ProductSync] Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Some product operations failed to sync. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      isSyncingRef.current = false;
      lastSyncRef.current = Date.now();
    }
  }, [isOnline, user, pendingOps, clearPendingOperation, toast]);

  const shouldThrottleSync = useCallback(() => {
    const timeSinceLastSync = Date.now() - lastSyncRef.current;
    return timeSinceLastSync < 2000; // Throttle syncs to prevent spam
  }, []);

  return {
    syncPendingOperations,
    isSyncing: isSyncingRef.current,
    shouldThrottleSync,
    pendingProductOps: pendingOps.filter(op => op.type === 'product'),
  };
};
