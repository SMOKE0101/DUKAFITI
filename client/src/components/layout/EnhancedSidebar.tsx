
import React from 'react';
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

  // Completely hide sidebar on mobile and tablet - return null immediately
  if (isMobile || isTablet) {
    return null;
  }

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  // Get the appropriate logo based on theme and collapsed state
  const getLogoSrc = () => {
    if (isCollapsed) {
      // Use collapsed logos for sidebar collapsed state
      return theme === 'dark' 
        ? '/sidebar-logo-dark-collapsed.png' // Dark mode collapsed
        : '/sidebar-logo-light-collapsed.png'; // Light mode collapsed
    } else {
      // Use full logos for expanded state
      return theme === 'dark'
        ? '/sidebar-logo-dark.png' // Dark mode full logo
        : '/sidebar-logo-light.png'; // Light mode full logo
    }
  };

  // Desktop Sidebar only - Enhanced with professional white design and dark mode support
  return (
    <div className={`hidden lg:block ${className}`}>
      <div 
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-700/80", 
          "flex flex-col z-40 shadow-xl shadow-gray-900/5 dark:shadow-gray-900/20",
          "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
          "transform-gpu will-change-[width,transform]",
          isCollapsed ? 'w-20' : 'w-72'
        )}
      >
        {/* Brand Section - Professional design with theme support */}
        <div className={cn(
          "p-6 border-b border-gray-200/60 dark:border-gray-700/60 flex-shrink-0 min-h-[88px] flex items-center justify-center overflow-hidden",
          "bg-white dark:bg-gray-900 transition-colors duration-300"
        )}>
          <div className={cn(
            "flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "transform-gpu will-change-transform"
          )}>
            <img 
              src={getLogoSrc()}
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

        {/* Navigation Links - Enhanced animations with theme support */}
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
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white hover:scale-[1.02] hover:shadow-sm'
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
                
                {/* Enhanced Tooltip for collapsed state with theme support */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900/95 dark:bg-gray-100/95 backdrop-blur-sm text-white dark:text-gray-900 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {item.name}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/95 dark:bg-gray-100/95 rotate-45"></div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section - Logout with theme support */}
        <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/60 space-y-2 flex-shrink-0 bg-white dark:bg-gray-900 transition-colors duration-300">
          <button
            onClick={handleSignOut}
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
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900/95 dark:bg-gray-100/95 backdrop-blur-sm text-white dark:text-gray-900 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                Logout
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/95 dark:bg-gray-100/95 rotate-45"></div>
              </div>
            )}
          </button>
        </div>

        {/* Enhanced Toggle Button with theme support */}
        <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/60 flex-shrink-0 bg-white dark:bg-gray-900 transition-colors duration-300">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group transform-gpu will-change-transform hover:scale-[1.02]"
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
  );
};

export default EnhancedSidebar;
