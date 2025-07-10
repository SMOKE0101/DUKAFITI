
import React, { useState } from 'react';
import { BlockySidebar } from './BlockySidebar';
import EnhancedTopbar from './EnhancedTopbar';
import { useIsMobile } from '@/hooks/use-mobile';

interface PremiumAppLayoutProps {
  children: React.ReactNode;
}

const PremiumAppLayout: React.FC<PremiumAppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Topbar */}
      <EnhancedTopbar />
      
      <div className="flex">
        {/* Blocky Sidebar */}
        <BlockySidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        
        {/* Main Content */}
        <main className={`
          flex-1 transition-all duration-250 ease-out pt-4
          ${sidebarOpen && !isMobile ? 'ml-60' : !isMobile ? 'ml-[72px]' : 'ml-0'}
          ${isMobile ? 'pb-20' : 'pb-4'}
        `}>
          <div className="px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PremiumAppLayout;
