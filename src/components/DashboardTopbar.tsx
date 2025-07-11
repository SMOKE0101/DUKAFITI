
import React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { SearchBar } from '@/components/search/SearchBar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ProfileMenu } from '@/components/profile/ProfileMenu';

interface DashboardTopbarProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

const DashboardTopbar = ({ onMenuClick, sidebarOpen }: DashboardTopbarProps) => {
  const { theme } = useTheme();
  
  const logoSrc = theme === 'dark' 
    ? '/lovable-uploads/8d8ce036-eba9-4359-8db6-057c40d653b7.png'
    : '/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png';

  return (
    <div className="h-16 bg-[#602d86] border-b border-border/40 flex items-center justify-between px-4 lg:px-6 fixed top-0 left-0 right-0 z-50">
      {/* Left Side - Logo and Menu */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden text-white hover:bg-white/10"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
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

export default DashboardTopbar;
