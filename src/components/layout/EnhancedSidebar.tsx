
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

  // Completely hide sidebar on mobile and tablet - return null immediately
  if (isMobile || isTablet) {
    return null;
  }

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  // Desktop Sidebar only - Enhanced with better animations and GPU acceleration
  return (
    <div className={`hidden lg:block ${className}`}>
      <div 
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/95 backdrop-blur-xl border-r border-gray-200/50", 
          "flex flex-col z-40 shadow-2xl shadow-purple-500/5",
          "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
          "transform-gpu will-change-[width,transform]",
          isCollapsed ? 'w-20' : 'w-72'
        )}
      >
        {/* Brand Section - Enhanced with smooth animations */}
        <div className={cn(
          "p-6 border-b border-gray-200/50 flex-shrink-0 min-h-[88px] flex items-center overflow-hidden",
          "bg-gradient-to-br from-purple-50/80 to-blue-50/80"
        )}>
          <div className={cn(
            "flex items-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "transform-gpu will-change-transform",
            isCollapsed ? 'justify-center' : 'gap-3'
          )}>
            <div className={cn(
              "rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0",
              "shadow-xl shadow-purple-500/25 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "transform-gpu will-change-transform",
              isCollapsed ? 'w-10 h-10' : 'w-12 h-12'
            )}>
              <span className={cn(
                "text-white font-black transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isCollapsed ? 'text-sm' : 'text-lg'
              )}>D</span>
            </div>
            <div 
              className={cn(
                "min-w-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden",
                "transform-gpu will-change-[opacity,transform,width]",
                isCollapsed 
                  ? 'opacity-0 w-0 max-w-0 transform translate-x-8 scale-95' 
                  : 'opacity-100 w-auto max-w-none transform translate-x-0 scale-100'
              )}
              style={{
                transitionDelay: isCollapsed ? '0ms' : '200ms',
              }}
            >
              <h1 className="font-mono font-black text-lg uppercase tracking-tight text-gray-900 whitespace-nowrap bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                DUKASMART
              </h1>
              <p className="text-xs text-gray-500 font-medium whitespace-nowrap">
                Smart Business
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links - Enhanced animations with staggered entrance */}
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
                    ? 'bg-gradient-to-r from-purple-100/80 to-blue-100/80 text-purple-700 shadow-lg shadow-purple-500/20 border-l-4 border-purple-600 scale-105' 
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50/60 hover:to-blue-50/60 hover:text-purple-600 hover:scale-105 hover:shadow-md hover:shadow-purple-500/10'
                )}
                style={{
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                {/* Enhanced active background with GPU acceleration */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 rounded-xl animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/3 to-blue-400/3 rounded-xl animate-ping" />
                  </>
                )}
                
                <div className={cn(
                  "flex items-center justify-center rounded-lg flex-shrink-0 relative z-10",
                  "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu will-change-transform",
                  isCollapsed ? 'w-6 h-6' : 'w-8 h-8',
                  isActive 
                    ? 'text-purple-700 scale-110' 
                    : 'text-gray-600 group-hover:text-purple-600 group-hover:scale-110'
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
                
                {/* Enhanced Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl shadow-gray-900/20">
                    {item.name}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section - Logout - Enhanced with smooth animations */}
        <div className="p-4 border-t border-gray-200/50 space-y-2 flex-shrink-0 bg-gradient-to-br from-red-50/50 to-orange-50/50">
          <button
            onClick={handleSignOut}
            className={cn(
              "group flex items-center rounded-xl w-full relative overflow-hidden",
              "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "transform-gpu will-change-[transform,background-color]",
              isCollapsed ? 'justify-center p-3 h-12' : 'p-4 gap-4',
              "text-red-600 hover:bg-red-50/60 hover:scale-105 hover:shadow-md hover:shadow-red-500/10"
            )}
          >
            <div className={cn(
              "flex items-center justify-center rounded-lg flex-shrink-0",
              "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu will-change-transform",
              isCollapsed ? 'w-6 h-6' : 'w-8 h-8',
              "text-red-600 group-hover:scale-110"
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
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl shadow-gray-900/20">
                Logout
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
              </div>
            )}
          </button>
        </div>

        {/* Enhanced Toggle Button with spring animation */}
        <div className="p-4 border-t border-gray-200/50 flex-shrink-0">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50/60 hover:to-blue-50/60 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 group transform-gpu will-change-transform hover:scale-105"
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
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSidebar;
