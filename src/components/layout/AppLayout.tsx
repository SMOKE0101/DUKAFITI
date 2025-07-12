
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import PremiumAppLayout from './PremiumAppLayout';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <PremiumAppLayout>
        {children}
      </PremiumAppLayout>
    </SidebarProvider>
  );
};

export default AppLayout;
