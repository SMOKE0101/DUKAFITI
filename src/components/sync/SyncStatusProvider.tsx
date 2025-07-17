
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

  // Handle sync completion and ensure UI consistency
  useEffect(() => {
    const handleSyncCompleted = (event: CustomEvent) => {
      console.log('[SyncStatusProvider] Sync completed, refreshing UI state');
      
      // Ensure we stay on the current route unless it's invalid
      const currentPath = location.pathname;
      const validPaths = ['/app', '/app/sales', '/app/inventory', '/app/customers', '/app/reports', '/app/settings'];
      
      if (!validPaths.includes(currentPath)) {
        console.log('[SyncStatusProvider] Invalid route detected, redirecting to dashboard');
        navigate('/app', { replace: true });
      }

      // Dispatch custom event to refresh data in components
      window.dispatchEvent(new CustomEvent('refresh-data'));
    };

    window.addEventListener('sync-completed', handleSyncCompleted as EventListener);

    return () => {
      window.removeEventListener('sync-completed', handleSyncCompleted as EventListener);
    };
  }, [location.pathname, navigate]);

  // Track route changes to preserve navigation state
  useEffect(() => {
    setLastRoute(location.pathname);
  }, [location.pathname]);

  // Prevent navigation during sync to avoid UI corruption
  useEffect(() => {
    if (syncManager.isSyncing) {
      console.log('[SyncStatusProvider] Sync in progress, locking navigation');
    }
  }, [syncManager.isSyncing]);

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
    clearSyncErrors: syncManager.clearSyncErrors
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};
