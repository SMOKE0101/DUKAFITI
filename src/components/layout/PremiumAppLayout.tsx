
import React, { useState } from 'react';
import { PremiumSidebar } from './PremiumSidebar';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedTopbar from './EnhancedTopbar';

interface PremiumAppLayoutProps {
  children: React.ReactNode;
}

const PremiumAppLayout: React.FC<PremiumAppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Topbar - Fixed */}
      <EnhancedTopbar />

      <div className="flex flex-1 pt-16">
        {/* Premium Sidebar */}
        <PremiumSidebar 
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          !isMobile ? (sidebarOpen ? 'ml-[280px]' : 'ml-20') : ''
        } ${isMobile ? 'pb-20' : ''} bg-gray-50 dark:bg-gray-900 min-h-screen`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default PremiumAppLayout;
