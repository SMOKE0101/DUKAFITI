
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import PremiumSidebar from './PremiumSidebar';
import EnhancedTopbar from './EnhancedTopbar';
import OfflineStatus from '../OfflineStatus';

const PremiumAppLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <PremiumSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <EnhancedTopbar />
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 space-y-4">
              <OfflineStatus />
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default PremiumAppLayout;
