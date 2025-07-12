
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { 
    id: 'dashboard', 
    icon: BarChart3, 
    path: '/app/dashboard',
    label: 'Dashboard',
    matchPaths: ['/app/dashboard', '/app']
  },
  { 
    id: 'inventory', 
    icon: Package, 
    path: '/app/inventory',
    label: 'Inventory',
    matchPaths: ['/app/inventory']
  },
  { 
    id: 'sales', 
    icon: ShoppingCart, 
    path: '/app/sales',
    label: 'Sales',
    matchPaths: ['/app/sales']
  },
  { 
    id: 'customers', 
    icon: Users, 
    path: '/app/customers',
    label: 'Customers',
    matchPaths: ['/app/customers']
  },
  { 
    id: 'reports', 
    icon: FileText, 
    path: '/app/reports',
    label: 'Reports',
    matchPaths: ['/app/reports']
  }
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <nav className={cn(
      "relative h-20 w-full shadow-lg transition-all duration-300",
      isDark 
        ? "bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/60" 
        : "bg-white/95 backdrop-blur-xl border-t border-gray-200/60"
    )}>
      {/* Enhanced gradient backdrop */}
      <div className={cn(
        "absolute inset-0 backdrop-blur-xl transition-all duration-300",
        isDark 
          ? "bg-gradient-to-t from-gray-900/90 to-gray-800/95"
          : "bg-gradient-to-t from-white/80 to-white/95"
      )} />
      
      {/* Enhanced shadow system */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
        isDark
          ? "bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-purple-500/30"
          : "bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20"
      )} />
      
      <div className="relative grid grid-cols-5 h-full max-w-full mx-auto px-1 py-2 pb-safe">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.matchPaths?.includes(location.pathname) || location.pathname === item.path;
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center relative overflow-hidden group",
                "min-h-[44px] rounded-2xl mx-1 transition-all duration-300 ease-out",
                "transform-gpu will-change-transform active:scale-95",
                isDark
                  ? isActive 
                    ? "text-purple-400" 
                    : "text-gray-400 hover:text-purple-300"
                  : isActive 
                    ? "text-purple-600" 
                    : "text-gray-600 hover:text-purple-500"
              )}
              style={{
                transitionDelay: `${index * 20}ms`,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
              }}
            >
              {/* Icon container with purple glow for active state */}
              <div className={cn(
                "relative z-10 flex items-center justify-center rounded-xl transition-all duration-300",
                "flex-shrink-0 mb-1 transform-gpu will-change-transform",
                "w-8 h-8"
              )}>
                <Icon 
                  className={cn(
                    "transition-all duration-300 transform-gpu will-change-transform",
                    isActive 
                      ? "w-5 h-5 scale-110" 
                      : "w-4.5 h-4.5 group-hover:scale-110",
                    // Purple glow effect for active icons
                    isActive && "drop-shadow-[0_0_8px_rgb(147_51_234_/_0.8)]"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              
              {/* Improved label typography */}
              <span className={cn(
                "text-[10px] font-semibold truncate w-full text-center leading-tight px-1",
                "transition-all duration-300 relative z-10 transform-gpu will-change-transform",
                isActive 
                  ? "scale-105 font-bold tracking-wide" 
                  : "group-hover:scale-105 group-hover:font-bold"
              )}>
                {item.label}
              </span>
              
              {/* Enhanced active indicator - purple glow dot */}
              {isActive && (
                <div className={cn(
                  "absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full animate-pulse transition-all duration-300",
                  "bg-purple-500 shadow-[0_0_8px_rgb(147_51_234_/_0.8)]"
                )} />
              )}
              
              {/* Subtle hover glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-2xl transition-all duration-300 opacity-0 group-hover:opacity-100",
                isDark
                  ? "bg-gradient-to-br from-purple-500/5 to-blue-500/5"
                  : "bg-gradient-to-br from-purple-500/3 to-blue-500/3"
              )} />
            </NavLink>
          );
        })}
      </div>
      
      {/* Enhanced bottom accent */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300",
        isDark
          ? "bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20"
          : "bg-gradient-to-r from-purple-500/15 via-blue-500/15 to-purple-500/15"
      )} />
    </nav>
  );
};
