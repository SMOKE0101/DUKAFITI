
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';
import { useCacheManager } from '../../hooks/useCacheManager';
import { useBackgroundSync } from '../../hooks/useBackgroundSync';
import NetworkStatusIndicator from '../NetworkStatusIndicator';

const PremiumAppLayout = () => {
  const { loadPendingOperations } = useCacheManager();
  
  // Initialize cache manager on mount
  useEffect(() => {
    loadPendingOperations();
  }, [loadPendingOperations]);

  // Initialize background sync
  useBackgroundSync();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <TopNavigation />
              <NetworkStatusIndicator />
            </div>
          </div>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default PremiumAppLayout;
