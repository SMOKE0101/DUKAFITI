
import React, { useState, useEffect } from 'react';
import EnhancedSidebar from './EnhancedSidebar';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile, useIsTablet, useIsDesktop, useLayoutInfo } from '@/hooks/use-mobile';
import EnhancedTopbar from './EnhancedTopbar';
import { cn } from '@/lib/utils';

interface PremiumAppLayoutProps {
  children: React.ReactNode;
}

const PremiumAppLayout: React.FC<PremiumAppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const { mounted, isMobile, isTablet, isDesktop } = useLayoutInfo();

  useEffect(() => {
    if (mounted) {
      // Add a small delay to ensure smooth transitions
      const timer = setTimeout(() => {
        setLayoutReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Enhanced loading state with better UX
  if (!mounted || !layoutReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Mobile layout - Enhanced with better spacing and no layout shifts
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-x-hidden">
        {/* Mobile Topbar */}
        <EnhancedTopbar 
          hideSidebarToggle={true}
          sidebarCollapsed={false}
        />

        {/* Mobile Main Content - Enhanced for better space utilization */}
        <main className="flex-1 pt-16 pb-20 overflow-x-hidden min-h-[calc(100vh-5rem)] w-full">
          <div className={cn(
            "h-full w-full transition-all duration-300 ease-out",
            "px-3 py-4" // Optimized padding for mobile
          )}>
            <div className="max-w-full mx-auto h-full">
              {children}
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation - Enhanced with better positioning */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl shadow-purple-500/10">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  // Tablet layout - Enhanced with optimized grid and spacing
  if (isTablet) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-x-hidden">
        {/* Tablet Topbar */}
        <EnhancedTopbar 
          hideSidebarToggle={true}
          sidebarCollapsed={false}
        />

        {/* Tablet Main Content - Enhanced for better content density */}
        <main className="flex-1 pt-16 pb-20 overflow-x-hidden min-h-[calc(100vh-5rem)] w-full">
          <div className={cn(
            "h-full w-full transition-all duration-300 ease-out",
            "px-4 py-6" // Optimized padding for tablet
          )}>
            <div className="max-w-full mx-auto h-full">
              {children}
            </div>
          </div>
        </main>

        {/* Tablet Bottom Navigation - Enhanced positioning */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl shadow-purple-500/10">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  // Desktop layout - Enhanced with better sidebar integration and animations
  return (
    <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-x-hidden">
      {/* Desktop Topbar */}
      <EnhancedTopbar 
        onSidebarToggle={handleSidebarToggle}
        sidebarCollapsed={sidebarCollapsed}
        hideSidebarToggle={false}
      />

      <div className="flex flex-1 pt-16 relative w-full">
        {/* Desktop Sidebar - Enhanced with better animation performance */}
        <EnhancedSidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />

        {/* Desktop Main Content - Enhanced with smooth transitions and better space utilization */}
        <main 
          className={cn(
            "flex-1 min-h-[calc(100vh-4rem)] overflow-x-hidden",
            "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "transform-gpu will-change-[margin,width]",
            sidebarCollapsed 
              ? 'ml-[72px] w-[calc(100vw-72px)]' 
              : 'ml-[280px] w-[calc(100vw-280px)]'
          )}
        >
          <div className={cn(
            "h-full overflow-x-hidden overflow-y-auto w-full",
            "transition-all duration-300 ease-out",
            "p-4 md:p-6 lg:p-8" // Responsive padding for desktop
          )}>
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
