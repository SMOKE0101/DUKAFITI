
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Mobile layout - No sidebar, bottom navigation only
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-900">
        {/* Mobile Topbar - No sidebar toggle */}
        <EnhancedTopbar 
          hideSidebarToggle={true}
          sidebarCollapsed={false}
        />

        {/* Mobile Main Content - Full width, proper spacing */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 pt-16 pb-20 overflow-x-hidden">
          <div className="h-full p-3 pt-4 max-w-full">
            <div className="max-w-full mx-auto">
              {children}
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation - Always visible and sticky */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  // Tablet layout - Bottom navigation with optimized spacing
  if (isTablet) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-900">
        {/* Tablet Topbar - No sidebar toggle */}
        <EnhancedTopbar 
          hideSidebarToggle={true}
          sidebarCollapsed={false}
        />

        {/* Tablet Main Content - Full width with tablet-optimized spacing */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 pt-16 pb-20 overflow-x-hidden">
          <div className="h-full p-4 pt-6 max-w-full">
            <div className="max-w-full mx-auto">
              {children}
            </div>
          </div>
        </main>

        {/* Tablet Bottom Navigation - Always visible */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  // Desktop layout - Sidebar with proper responsive behavior
  return (
    <div className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Desktop Topbar with sidebar toggle */}
      <EnhancedTopbar 
        onSidebarToggle={handleSidebarToggle}
        sidebarCollapsed={sidebarCollapsed}
        hideSidebarToggle={false}
      />

      <div className="flex flex-1 pt-16 relative">
        {/* Desktop Sidebar */}
        <EnhancedSidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />

        {/* Desktop Main Content with proper sidebar margins */}
        <main 
          className={`
            flex-1 bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-out min-h-[calc(100vh-4rem)]
            ${sidebarCollapsed 
              ? 'ml-[72px] w-[calc(100vw-72px)]' 
              : 'ml-[280px] w-[calc(100vw-280px)]'
            }
          `}
        >
          <div className="h-full overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
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
