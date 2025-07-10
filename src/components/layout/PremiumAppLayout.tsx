
import React, { useState } from 'react';
import EnhancedSidebar from './EnhancedSidebar';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedTopbar from './EnhancedTopbar';

interface PremiumAppLayoutProps {
  children: React.ReactNode;
}

const PremiumAppLayout: React.FC<PremiumAppLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Topbar - Fixed */}
      <EnhancedTopbar />

      <div className="flex flex-1 pt-16">
        {/* Enhanced Sidebar */}
        <EnhancedSidebar />

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          isMobile ? 'pb-20' : ''
        } bg-gray-50 dark:bg-gray-900 min-h-screen`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default PremiumAppLayout;
