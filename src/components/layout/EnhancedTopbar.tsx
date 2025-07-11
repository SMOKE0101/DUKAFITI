
import React from 'react';
import { useTheme } from 'next-themes';
import { SearchBar } from '@/components/search/SearchBar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ProfileMenu } from '@/components/profile/ProfileMenu';
import { AnimatedSidebarToggle } from '@/components/ui/animated-sidebar-toggle';

interface EnhancedTopbarProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
  hideSidebarToggle?: boolean;
}

const EnhancedTopbar = ({ 
  onMenuClick, 
  sidebarOpen = false, 
  onSidebarToggle,
  sidebarCollapsed = false,
  hideSidebarToggle = false
}: EnhancedTopbarProps) => {
  const { theme } = useTheme();
  
  const logoSrc = theme === 'dark' 
    ? '/lovable-uploads/77d747ef-d8fb-4a5c-b4c7-3e43d709d5f3.png'
    : '/lovable-uploads/b8e58169-8231-49d4-95c5-39d340fd66dd.png';

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    } else if (onSidebarToggle) {
      onSidebarToggle();
    }
  };

  return (
    <div className="h-16 bg-[#602d86] border-b border-border/40 flex items-center justify-between px-4 lg:px-6 fixed top-0 left-0 right-0 z-50">
      {/* Left Side - Logo and Menu Toggle */}
      <div className="flex items-center gap-4">
        {!hideSidebarToggle && (
          <AnimatedSidebarToggle
            isOpen={sidebarOpen}
            onClick={handleMenuClick}
            className="text-white hover:bg-white/10 p-2 rounded-md"
          />
        )}
        
        <div className="flex items-center gap-3">
          <img 
            src={logoSrc}
            alt="DUKAFITI Logo" 
            className="h-10 w-auto"
          />
          <span className="text-xl font-bold text-white hidden sm:block">DUKAFITI</span>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <SearchBar placeholder="Search products, customers..." />
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </div>
  );
};

export default EnhancedTopbar;
