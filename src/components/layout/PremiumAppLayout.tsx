
import React, { useState } from 'react';
import { PremiumSidebar } from './PremiumSidebar';
import EnhancedTopbar from './EnhancedTopbar';
import { useIsMobile } from '@/hooks/use-mobile';

interface PremiumAppLayoutProps {
  children: React.ReactNode;
}

export const PremiumAppLayout: React.FC<PremiumAppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Topbar */}
      <EnhancedTopbar
        onSidebarToggle={toggleSidebar}
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Sidebar */}
      <PremiumSidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Content with proper spacing */}
      <main 
        className={`
          pt-16 
          transition-all duration-300 ease-in-out
          ${!isMobile && sidebarOpen ? 'lg:ml-[280px]' : ''}
          ${!isMobile && !sidebarOpen ? 'lg:ml-20' : ''}
        `}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
