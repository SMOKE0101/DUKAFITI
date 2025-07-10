
import React, { useState, useEffect } from 'react';
import EnhancedSidebar from './EnhancedSidebar';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import EnhancedTopbar from './EnhancedTopbar';

interface PremiumAppLayoutProps {
  children: React.ReactNode;
}

const PremiumAppLayout: React.FC<PremiumAppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Mobile layout - No sidebar, bottom navigation only
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-x-hidden">
        {/* Mobile Topbar */}
        <EnhancedTopbar 
          hideSidebarToggle={true}
          sidebarCollapsed={false}
        />

        {/* Mobile Main Content */}
        <main className="flex-1 pt-16 pb-20 overflow-x-hidden min-h-[calc(100vh-5rem)] w-full">
          <div className="h-full w-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation - Fixed and persistent */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-200/50 shadow-2xl">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  // Tablet layout - Bottom navigation with optimized spacing
  if (isTablet) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-x-hidden">
        {/* Tablet Topbar */}
        <EnhancedTopbar 
          hideSidebarToggle={true}
          sidebarCollapsed={false}
        />

        {/* Tablet Main Content */}
        <main className="flex-1 pt-16 pb-20 overflow-x-hidden min-h-[calc(100vh-5rem)] w-full">
          <div className="h-full w-full px-2 sm:px-4 py-4 sm:py-6">
            {children}
          </div>
        </main>

        {/* Tablet Bottom Navigation - Fixed and persistent */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-200/50 shadow-2xl">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  // Desktop layout - Sidebar with proper responsive behavior
  return (
    <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-x-hidden">
      {/* Desktop Topbar */}
      <EnhancedTopbar 
        onSidebarToggle={handleSidebarToggle}
        sidebarCollapsed={sidebarCollapsed}
        hideSidebarToggle={false}
      />

      <div className="flex flex-1 pt-16 relative w-full">
        {/* Desktop Sidebar */}
        <EnhancedSidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />

        {/* Desktop Main Content */}
        <main 
          className={`
            flex-1 transition-all duration-300 ease-out min-h-[calc(100vh-4rem)] overflow-x-hidden
            ${sidebarCollapsed 
              ? 'ml-[72px] w-[calc(100vw-72px)]' 
              : 'ml-[280px] w-[calc(100vw-280px)]'
            }
          `}
        >
          <div className="h-full overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
            <div className="max-w-full mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PremiumAppLayout;
