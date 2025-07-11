
import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import EnhancedTopbar from './EnhancedTopbar';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Topbar */}
      <EnhancedTopbar
        onSidebarToggle={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />

      {/* Sidebar */}
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Content with proper spacing */}
      <main 
        className={`
          pt-16 
          transition-all duration-300 ease-in-out
          ${!isMobile && sidebarOpen ? 'lg:ml-60' : ''}
          ${!isMobile && !sidebarOpen ? 'lg:ml-18' : ''}
        `}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
