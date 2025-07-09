
import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <AppSidebar 
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          !isMobile ? (sidebarOpen ? 'ml-60' : 'ml-18') : ''
        } ${isMobile ? 'pb-20' : ''}`}>
          <div className="container-responsive py-6">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && <BottomNavigation />}
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
