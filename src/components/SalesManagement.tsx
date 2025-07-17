
import React, { useEffect } from 'react';
import OptimizedModernSalesPage from './OptimizedModernSalesPage';
import { useSyncContext } from './sync/SyncStatusProvider';

const SalesManagement = () => {
  const { isOnline, isSyncing } = useSyncContext();

  // Refresh data when sync completes
  useEffect(() => {
    const handleRefreshData = () => {
      // Force re-render of sales data
      window.location.reload();
    };

    window.addEventListener('refresh-data', handleRefreshData);

    return () => {
      window.removeEventListener('refresh-data', handleRefreshData);
    };
  }, []);

  return (
    <div className="relative">
      {/* Sync-aware overlay during syncing */}
      {isSyncing && (
        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
          <div className="bg-background border rounded-lg p-4 shadow-lg">
            <p className="text-sm text-muted-foreground">Syncing sales data...</p>
          </div>
        </div>
      )}
      
      <OptimizedModernSalesPage />
    </div>
  );
};

export default SalesManagement;
