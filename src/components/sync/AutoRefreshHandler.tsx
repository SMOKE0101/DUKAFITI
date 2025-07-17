
import { useEffect, useRef } from 'react';
import { useSyncContext } from './SyncStatusProvider';
import { useToast } from '../../hooks/use-toast';

interface AutoRefreshHandlerProps {
  onRefresh?: () => void;
  component?: string;
}

export const AutoRefreshHandler: React.FC<AutoRefreshHandlerProps> = ({ 
  onRefresh, 
  component = 'unknown' 
}) => {
  const { isSyncing, isOnline, pendingOperations } = useSyncContext();
  const { toast } = useToast();
  const lastSyncState = useRef({ isSyncing: false, pendingOperations: 0 });

  useEffect(() => {
    const handleAutoRefresh = () => {
      console.log(`[AutoRefreshHandler:${component}] Auto refresh triggered`);
      if (onRefresh) {
        onRefresh();
      }
    };

    // Listen to sync completion events
    const handleSyncCompleted = () => {
      console.log(`[AutoRefreshHandler:${component}] Sync completed, triggering refresh`);
      handleAutoRefresh();
    };

    const handleOrdersUpdated = () => {
      console.log(`[AutoRefreshHandler:${component}] Orders updated, triggering refresh`);
      handleAutoRefresh();
    };

    const handleForceRefresh = () => {
      console.log(`[AutoRefreshHandler:${component}] Force refresh triggered`);
      handleAutoRefresh();
    };

    window.addEventListener('sync-completed', handleSyncCompleted);
    window.addEventListener('orders-updated', handleOrdersUpdated);
    window.addEventListener('force-refresh', handleForceRefresh);

    return () => {
      window.removeEventListener('sync-completed', handleSyncCompleted);
      window.removeEventListener('orders-updated', handleOrdersUpdated);
      window.removeEventListener('force-refresh', handleForceRefresh);
    };
  }, [onRefresh, component]);

  // Monitor sync state changes
  useEffect(() => {
    const prevSyncState = lastSyncState.current;
    
    // If sync just completed (was syncing, now not syncing)
    if (prevSyncState.isSyncing && !isSyncing) {
      console.log(`[AutoRefreshHandler:${component}] Sync completion detected`);
      if (onRefresh) {
        setTimeout(onRefresh, 500); // Small delay to ensure all operations complete
      }
    }

    // If pending operations changed (likely sync occurred)
    if (prevSyncState.pendingOperations !== pendingOperations) {
      console.log(`[AutoRefreshHandler:${component}] Pending operations changed: ${prevSyncState.pendingOperations} -> ${pendingOperations}`);
      if (onRefresh) {
        setTimeout(onRefresh, 300);
      }
    }

    // Update last sync state
    lastSyncState.current = { isSyncing, pendingOperations };
  }, [isSyncing, pendingOperations, onRefresh, component]);

  // Handle online status changes
  useEffect(() => {
    if (isOnline && pendingOperations > 0) {
      console.log(`[AutoRefreshHandler:${component}] Device online with pending operations`);
      
      toast({
        title: "Connection Restored",
        description: `Syncing ${pendingOperations} pending operation${pendingOperations > 1 ? 's' : ''}...`,
        duration: 3000,
      });
    }
  }, [isOnline, pendingOperations, toast, component]);

  return null; // This is a utility component, no UI needed
};
