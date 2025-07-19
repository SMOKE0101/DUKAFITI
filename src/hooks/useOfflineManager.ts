
import { useUnifiedOfflineManager } from './useUnifiedOfflineManager';

// Re-export the unified offline manager with the expected interface
export const useOfflineManager = () => {
  const manager = useUnifiedOfflineManager();
  
  return {
    isOnline: manager.isOnline,
    pendingOperations: manager.pendingOperations,
    addOfflineOperation: manager.addOfflineOperation,
    syncPendingOperations: manager.syncPendingOperations,
  };
};
