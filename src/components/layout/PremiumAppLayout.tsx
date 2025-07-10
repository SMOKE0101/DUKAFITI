
import React, { useState } from 'react';
import EnhancedSidebar from './EnhancedSidebar';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedTopbar from './EnhancedTopbar';

interface PremiumAppLayoutProps {
  children: React.ReactNode;
}

const PremiumAppLayout: React.FC<PremiumAppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Enhanced Topbar */}
      <EnhancedTopbar 
        onSidebarToggle={handleSidebarToggle}
        sidebarCollapsed={sidebarCollapsed}
      />

      <div className="flex flex-1 pt-16 relative">
        {/* Enhanced Sidebar - Only visible on desktop */}
        {!isMobile && !isTablet && (
          <EnhancedSidebar 
            isCollapsed={sidebarCollapsed}
            onToggle={handleSidebarToggle}
          />
        )}

        {/* Main Content */}
        <main 
          className={`
            flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] transition-all duration-300 ease-out
            ${isMobile || isTablet
              ? 'pb-20 ml-0 w-full' 
              : sidebarCollapsed 
                ? 'ml-[72px] w-[calc(100vw-72px)]' 
                : 'ml-[280px] w-[calc(100vw-280px)]'
            }
          `}
        >
          <div className={`
            h-full overflow-x-hidden overflow-y-auto
            ${isMobile 
              ? 'p-2 pt-2' 
              : isTablet 
                ? 'p-3 pt-3' 
                : 'p-4 md:p-6 lg:p-8'
            }
          `}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile/Tablet Bottom Navigation */}
      {(isMobile || isTablet) && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNavigation />
        </div>
      )}
    </div>
  );
};

export default PremiumAppLayout;
