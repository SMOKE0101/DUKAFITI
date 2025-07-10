
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
    <div className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Topbar */}
      <EnhancedTopbar 
        onSidebarToggle={handleSidebarToggle}
        sidebarCollapsed={sidebarCollapsed}
      />

      <div className="flex flex-1 pt-16">
        {/* Enhanced Sidebar */}
        <EnhancedSidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />

        {/* Main Content */}
        <main 
          className={`
            flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen transition-all duration-300 ease-out
            ${isMobile 
              ? 'pb-20 ml-0' 
              : sidebarCollapsed 
                ? 'ml-[72px]' 
                : 'ml-[280px]'
            }
          `}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default PremiumAppLayout;
