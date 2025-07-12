
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import PremiumSidebar from './PremiumSidebar';
import EnhancedTopbar from './EnhancedTopbar';
import OfflineStatus from '../OfflineStatus';
import OfflineValidator from '../OfflineValidator';

interface PremiumAppLayoutProps {
  children?: React.ReactNode;
}

const PremiumAppLayout: React.FC<PremiumAppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <PremiumSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={handleSidebarToggle} 
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <EnhancedTopbar sidebarCollapsed={sidebarCollapsed} />
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 space-y-4">
              <OfflineStatus />
              <OfflineValidator />
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default PremiumAppLayout;
