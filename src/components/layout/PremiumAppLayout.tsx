
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import PremiumSidebar from './PremiumSidebar';
import EnhancedTopbar from './EnhancedTopbar';
import OfflineStatus from '../OfflineStatus';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

interface PremiumAppLayoutProps {
  children?: React.ReactNode;
}

const PremiumAppLayout: React.FC<PremiumAppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

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
        <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          !isMobile && !isTablet && !sidebarCollapsed 
            ? 'ml-64' 
            : !isMobile && !isTablet && sidebarCollapsed 
              ? 'ml-16' 
              : 'ml-0'
        }`}>
          <EnhancedTopbar 
            sidebarCollapsed={sidebarCollapsed} 
            onSidebarToggle={handleSidebarToggle}
          />
          <div className={`flex-1 overflow-auto ${isMobile || isTablet ? 'pb-20' : ''}`}>
            <div className="container mx-auto p-4 space-y-4">
              <OfflineStatus />
              {children || <Outlet />}
            </div>
          </div>
        </main>
        
        {/* Bottom Navigation for Mobile/Tablet */}
        {(isMobile || isTablet) && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <BottomNavigation />
          </div>
        )}
      </div>
    </SidebarProvider>
  );
};

export default PremiumAppLayout;
