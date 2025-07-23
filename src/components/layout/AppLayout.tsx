
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Mobile TopBar without sidebar trigger
const MobileTopBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-center px-6">
        <h1 className="text-lg font-semibold">DukaFiti</h1>
      </div>
    </header>
  );
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Mobile layout with bottom navigation
    return (
      <div className="min-h-screen w-full bg-background flex flex-col">
        <MobileTopBar />
        <main className="flex-1 overflow-auto pb-20">
          <div className="h-full">
            {children}
          </div>
        </main>
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full bg-background flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
