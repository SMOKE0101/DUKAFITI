
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
        {/* Enhanced Sidebar - Hidden on mobile, always visible on tablet+ */}
        {!isMobile && (
          <EnhancedSidebar 
            isCollapsed={sidebarCollapsed}
            onToggle={handleSidebarToggle}
          />
        )}

        {/* Main Content */}
        <main 
          className={`
            flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] transition-all duration-500 ease-out
            ${isMobile 
              ? 'pb-20 ml-0 w-full' 
              : sidebarCollapsed 
                ? 'ml-[72px] w-[calc(100vw-72px)]' 
                : 'ml-[280px] w-[calc(100vw-280px)]'
            }
          `}
        >
          <div className={`
            h-full overflow-x-hidden
            ${isMobile ? 'p-3 pt-4' : 'p-4 md:p-6 lg:p-8'}
          `}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default PremiumAppLayout;
