
import React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { SearchBar } from '@/components/search/SearchBar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ProfileMenu } from '@/components/profile/ProfileMenu';

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
    ? '/lovable-uploads/dedf9c88-aa30-41f1-9cb1-97691bcb580f.png'
    : '/lovable-uploads/89b3e0a6-730e-4441-8bec-2776d3c222d6.png';

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    } else if (onSidebarToggle) {
      onSidebarToggle();
    }
  };

  return (
    <div className="h-16 bg-[#602d86] border-b border-border/40 flex items-center justify-between px-4 lg:px-6 fixed top-0 left-0 right-0 z-50">
      {/* Left Side - Logo and Menu */}
      <div className="flex items-center gap-4">
        {!hideSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMenuClick}
            className="lg:hidden text-white hover:bg-white/10"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
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
