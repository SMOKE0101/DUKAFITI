
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

  // Completely hide sidebar on mobile and tablet
  if (isMobile || isTablet) {
    return null;
  }

  const handleSignOut = async () => {
    setShowLogoutDialog(false);
    await signOut();
  };

  const logoSrc = theme === 'dark' 
    ? '/lovable-uploads/dedf9c88-aa30-41f1-9cb1-97691bcb580f.png'
    : '/lovable-uploads/89b3e0a6-730e-4441-8bec-2776d3c222d6.png';

  return (
    <>
      <div className={`hidden lg:block ${className}`}>
        <div 
          className={cn(
            "fixed left-0 top-16 h-[calc(100vh-4rem)] border-r flex flex-col z-30 shadow-xl",
            "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "transform-gpu will-change-[width,transform]",
            "bg-white dark:bg-gray-900 border-gray-200/80 dark:border-gray-700/80 shadow-gray-900/5 dark:shadow-black/20",
            isCollapsed ? 'w-20' : 'w-72'
          )}
        >
          {/* Brand Section */}
          <div className={cn(
            "p-6 border-b flex-shrink-0 min-h-[88px] flex items-center justify-center overflow-hidden",
            "border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900"
          )}>
            <div className={cn(
              "flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "transform-gpu will-change-transform"
            )}>
              <img 
                src={logoSrc}
                alt="DUKAFITI Logo"
                className={cn(
                  "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] object-contain",
                  "transform-gpu will-change-[width,height,opacity]",
                  isCollapsed 
                    ? 'w-10 h-10' 
                    : 'h-12 w-auto max-w-[200px]'
                )}
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))'
                }}
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className={cn(
            "flex-1 p-4 space-y-2 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "transform-gpu will-change-[overflow]",
            isCollapsed 
              ? 'overflow-hidden' 
              : 'overflow-y-auto'
          )}>
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || (item.href === '/dashboard' && ['/app'].includes(location.pathname));
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center rounded-xl relative overflow-hidden",
                    "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    "transform-gpu will-change-[transform,background-color,box-shadow]",
                    isCollapsed ? 'justify-center p-3 w-12 h-12 mx-auto' : 'p-4 gap-4',
                    isActive 
                      ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold shadow-sm border border-gray-200/50 dark:border-gray-700/50' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white hover:scale-[1.02] hover:shadow-sm'
                  )}
                  style={{
                    transitionDelay: `${index * 30}ms`,
                  }}
                >
                  <div className={cn(
                    "flex items-center justify-center rounded-lg flex-shrink-0 relative z-10",
                    "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu will-change-transform",
                    isCollapsed ? 'w-6 h-6' : 'w-8 h-8',
                    isActive 
                      ? 'text-gray-900 dark:text-white scale-110' 
                      : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-hover:scale-110'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <span 
                    className={cn(
                      "font-semibold text-sm min-w-0 truncate relative z-10",
                      "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden",
                      "transform-gpu will-change-[opacity,transform,width]",
                      isCollapsed 
                        ? 'opacity-0 w-0 max-w-0 transform translate-x-8 scale-95' 
                        : 'opacity-100 w-auto max-w-none transform translate-x-0 scale-100'
                    )}
                    style={{
                      transitionDelay: isCollapsed ? '0ms' : '300ms',
                    }}
                  >
                    {item.name}
                  </span>
                  
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900/95 dark:bg-gray-700/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                      {item.name}
                      <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/95 dark:bg-gray-700/95 rotate-45"></div>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Section - Logout */}
          <div className={cn(
            "p-4 border-t space-y-2 flex-shrink-0",
            "border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900"
          )}>
            <button
              onClick={() => setShowLogoutDialog(true)}
              className={cn(
                "group flex items-center rounded-xl w-full relative overflow-hidden",
                "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "transform-gpu will-change-[transform,background-color]",
                isCollapsed ? 'justify-center p-3 h-12' : 'p-4 gap-4',
                "text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/20 hover:scale-[1.02] hover:shadow-sm"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-lg flex-shrink-0",
                "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu will-change-transform",
                isCollapsed ? 'w-6 h-6' : 'w-8 h-8',
                "text-red-600 dark:text-red-400 group-hover:scale-110"
              )}>
                <LogOut className="w-5 h-5" />
              </div>
              <span 
                className={cn(
                  "font-semibold text-sm overflow-hidden",
                  "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  "transform-gpu will-change-[opacity,transform,width]",
                  isCollapsed 
                    ? 'opacity-0 w-0 max-w-0 transform translate-x-8 scale-95' 
                    : 'opacity-100 w-auto max-w-none transform translate-x-0 scale-100'
                )}
                style={{
                  transitionDelay: isCollapsed ? '0ms' : '300ms',
                }}
              >
                Logout
              </span>
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900/95 dark:bg-gray-700/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                  Logout
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/95 dark:bg-gray-700/95 rotate-45"></div>
                </div>
              )}
            </button>
          </div>

          {/* Toggle Button */}
          <div className={cn(
            "p-4 border-t flex-shrink-0",
            "border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900"
          )}>
            <button
              onClick={onToggle}
              className={cn(
                "w-full flex items-center justify-center p-3 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group transform-gpu will-change-transform hover:scale-[1.02]",
                "hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
              )}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <div 
                className={cn(
                  "p-1 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  "transform-gpu will-change-transform",
                  isCollapsed ? 'rotate-0' : 'rotate-180'
                )}
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300" />
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
