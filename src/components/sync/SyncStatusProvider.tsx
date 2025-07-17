
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUnifiedSyncManager } from '../../hooks/useUnifiedSyncManager';
import { useLocation, useNavigate } from 'react-router-dom';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: string | null;
  syncProgress: number;
  errors: string[];
  completedOperations: number;
  createOfflineOrder: (orderData: any) => Promise<string>;
  forceSyncNow: () => Promise<void>;
  clearSyncErrors: () => void;
  triggerUIRefresh: () => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncStatusProvider');
  }
  return context;
};

interface SyncStatusProviderProps {
  children: React.ReactNode;
}

export const SyncStatusProvider: React.FC<SyncStatusProviderProps> = ({ children }) => {
  const syncManager = useUnifiedSyncManager();
  const location = useLocation();
  const navigate = useNavigate();
  const [lastRoute, setLastRoute] = useState(location.pathname);

  // Enhanced sync completion handler with automatic UI refresh
  useEffect(() => {
    const handleSyncCompleted = (event: CustomEvent) => {
      console.log('[SyncStatusProvider] Sync completed, triggering comprehensive UI refresh');
      
      // Ensure we stay on the current route unless it's invalid
      const currentPath = location.pathname;
      const validPaths = ['/app', '/app/sales', '/app/inventory', '/app/customers', '/app/reports', '/app/settings'];
      
      if (!validPaths.includes(currentPath)) {
        console.log('[SyncStatusProvider] Invalid route detected, redirecting to dashboard');
        navigate('/app', { replace: true });
      }

      // Trigger comprehensive data refresh
      window.dispatchEvent(new CustomEvent('refresh-data'));
      window.dispatchEvent(new CustomEvent('orders-updated'));
      window.dispatchEvent(new CustomEvent('sales-updated'));
      
      // Force component re-renders
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('force-refresh'));
      }, 200);
    };

    const handleOrdersUpdated = () => {
      console.log('[SyncStatusProvider] Orders updated, refreshing order components');
    };

    const handleSalesUpdated = () => {
      console.log('[SyncStatusProvider] Sales updated, refreshing sales components');
    };

    const handleForceRefresh = () => {
      console.log('[SyncStatusProvider] Force refresh triggered');
      // Additional refresh logic if needed
    };

    // Listen to all sync-related events
    window.addEventListener('sync-completed', handleSyncCompleted as EventListener);
    window.addEventListener('orders-updated', handleOrdersUpdated as EventListener);
    window.addEventListener('sales-updated', handleSalesUpdated as EventListener);
    window.addEventListener('force-refresh', handleForceRefresh as EventListener);

    return () => {
      window.removeEventListener('sync-completed', handleSyncCompleted as EventListener);
      window.removeEventListener('orders-updated', handleOrdersUpdated as EventListener);
      window.removeEventListener('sales-updated', handleSalesUpdated as EventListener);
      window.removeEventListener('force-refresh', handleForceRefresh as EventListener);
    };
  }, [location.pathname, navigate]);

  // Track route changes to preserve navigation state
  useEffect(() => {
    setLastRoute(location.pathname);
  }, [location.pathname]);

  // Enhanced online status monitoring
  useEffect(() => {
    const handleOnlineStatus = () => {
      if (navigator.onLine && syncManager.pendingOperations > 0) {
        console.log('[SyncStatusProvider] Device online with pending operations, triggering sync');
        setTimeout(() => {
          syncManager.forceSyncNow();
        }, 1000);
      }
    };

    // Check online status periodically
    const onlineCheckInterval = setInterval(handleOnlineStatus, 5000);

    return () => {
      clearInterval(onlineCheckInterval);
    };
  }, [syncManager]);

  const contextValue: SyncContextType = {
    isOnline: syncManager.isOnline,
    isSyncing: syncManager.isSyncing,
    pendingOperations: syncManager.pendingOperations,
    lastSyncTime: syncManager.lastSyncTime,
    syncProgress: syncManager.syncProgress,
    errors: syncManager.errors,
    completedOperations: syncManager.completedOperations,
    createOfflineOrder: syncManager.createOfflineOrder,
    forceSyncNow: syncManager.forceSyncNow,
    clearSyncErrors: syncManager.clearSyncErrors,
    triggerUIRefresh: syncManager.triggerUIRefresh
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};
