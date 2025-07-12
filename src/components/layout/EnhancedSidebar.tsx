
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { LogoutConfirmDialog } from '@/components/dialogs/LogoutConfirmDialog';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface EnhancedSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({ 
  isCollapsed, 
  onToggle, 
  className = '' 
}) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { theme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Hide sidebar on mobile and tablet
  if (isMobile || isTablet) {
    return null;
  }

  const handleSignOut = async () => {
    setShowLogoutDialog(false);
    await signOut();
  };

  const logoSrc = theme === 'dark' 
    ? '/lovable-uploads/77d747ef-d8fb-4a5c-b4c7-3e43d709d5f3.png'
    : '/lovable-uploads/b8e58169-8231-49d4-95c5-39d340fd66dd.png';

  return (
    <>
      <div className={`hidden lg:block ${className}`}>
        <div 
          className={cn(
            "fixed left-0 top-16 h-[calc(100vh-4rem)] border-r flex flex-col z-30 shadow-xl",
            "transition-all duration-300 ease-in-out",
            "bg-white dark:bg-gray-900 border-gray-200/80 dark:border-gray-700/80",
            isCollapsed ? 'w-16' : 'w-64'
          )}
        >
          {/* Brand Section */}
          <div className={cn(
            "p-4 border-b flex-shrink-0 min-h-[72px] flex items-center",
            "border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900",
            isCollapsed ? 'justify-center' : 'justify-start'
          )}>
            <div className="flex items-center transition-all duration-300 ease-in-out">
              <img 
                src={logoSrc}
                alt="DUKAFITI Logo"
                className={cn(
                  "transition-all duration-300 ease-in-out object-contain",
                  isCollapsed 
                    ? 'w-8 h-8' 
                    : 'h-10 w-auto max-w-[180px]'
                )}
              />
              {!isCollapsed && (
                <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white transition-opacity duration-300">
                  DUKAFITI
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || (item.href === '/dashboard' && ['/app'].includes(location.pathname));
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center rounded-lg relative overflow-hidden",
                    "transition-all duration-200 ease-in-out",
                    isCollapsed ? 'justify-center p-3 w-10 h-10 mx-auto' : 'p-3 gap-3',
                    isActive 
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium shadow-sm border border-gray-200/50 dark:border-gray-700/50' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center flex-shrink-0",
                    "transition-all duration-200 ease-in-out",
                    isCollapsed ? 'w-5 h-5' : 'w-6 h-6'
                  )}>
                    <Icon className="w-full h-full" />
                  </div>
                  
                  {!isCollapsed && (
                    <span className="font-medium text-sm truncate transition-opacity duration-200">
                      {item.name}
                    </span>
                  )}
                  
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900/90 dark:bg-gray-700/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Section - Logout */}
          <div className="p-3 border-t border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900">
            <button
              onClick={() => setShowLogoutDialog(true)}
              className={cn(
                "group flex items-center rounded-lg w-full relative overflow-hidden",
                "transition-all duration-200 ease-in-out",
                isCollapsed ? 'justify-center p-3 h-10' : 'p-3 gap-3',
                "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              )}
            >
              <div className={cn(
                "flex items-center justify-center flex-shrink-0",
                "transition-all duration-200 ease-in-out",
                isCollapsed ? 'w-5 h-5' : 'w-6 h-6'
              )}>
                <LogOut className="w-full h-full" />
              </div>
              {!isCollapsed && (
                <span className="font-medium text-sm transition-opacity duration-200">
                  Sign Out
                </span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900/90 dark:bg-gray-700/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Sign Out
                </div>
              )}
            </button>
          </div>

          {/* Toggle Button */}
          <div className="p-3 border-t border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900">
            <button
              onClick={onToggle}
              className={cn(
                "w-full flex items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 group",
                "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <div 
                className={cn(
                  "transition-transform duration-200 ease-in-out",
                  isCollapsed ? 'rotate-0' : 'rotate-180'
                )}
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleSignOut}
      />
    </>
  );
};

export default EnhancedSidebar;
