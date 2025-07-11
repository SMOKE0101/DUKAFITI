
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
    path: '/dashboard',
    label: 'Dashboard',
    matchPaths: ['/dashboard', '/app']
  },
  { 
    id: 'inventory', 
    icon: Package, 
    path: '/inventory',
    label: 'Inventory',
    matchPaths: ['/inventory', '/products']
  },
  { 
    id: 'sales', 
    icon: ShoppingCart, 
    path: '/sales',
    label: 'Sales',
    matchPaths: ['/sales']
  },
  { 
    id: 'customers', 
    icon: Users, 
    path: '/customers',
    label: 'Customers',
    matchPaths: ['/customers']
  },
  { 
    id: 'reports', 
    icon: FileText, 
    path: '/reports',
    label: 'Reports',
    matchPaths: ['/reports']
  }
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="relative h-20 bg-white/95 backdrop-blur-xl border-t border-gray-200/60 w-full shadow-lg">
      {/* Improved gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-white/95 backdrop-blur-xl" />
      
      {/* Enhanced shadow system */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20" />
      
      <div className="relative grid grid-cols-5 h-full max-w-full mx-auto px-1 py-2 pb-safe">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.matchPaths.includes(location.pathname);
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center relative overflow-hidden group",
                "min-h-[44px] rounded-2xl mx-1 transition-all duration-300 ease-out",
                "transform-gpu will-change-transform active:scale-95",
                isActive 
                  ? "text-primary bg-gradient-to-br from-primary/10 to-blue-500/10 shadow-lg shadow-primary/20 scale-105" 
                  : "text-gray-600 hover:text-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-blue-500/5 hover:scale-105"
              )}
              style={{
                transitionDelay: `${index * 20}ms`,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
              }}
            >
              {/* Enhanced active state indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-2xl animate-pulse" />
              )}
              
              {/* Icon container with improved styling */}
              <div className={cn(
                "relative z-10 flex items-center justify-center rounded-xl transition-all duration-300",
                "flex-shrink-0 mb-1 transform-gpu will-change-transform",
                isActive 
                  ? "w-8 h-8 bg-gradient-to-br from-primary/20 to-blue-500/20 shadow-md shadow-primary/30" 
                  : "w-7 h-7 group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:to-blue-500/10 group-hover:shadow-sm"
              )}>
                <Icon className={cn(
                  "transition-all duration-300 transform-gpu will-change-transform",
                  isActive 
                    ? "w-5 h-5 text-primary drop-shadow-sm" 
                    : "w-4.5 h-4.5 text-gray-500 group-hover:text-primary group-hover:scale-110"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              
              {/* Improved label typography */}
              <span className={cn(
                "text-[10px] font-semibold truncate w-full text-center leading-tight px-1",
                "transition-all duration-300 relative z-10 transform-gpu will-change-transform",
                isActive 
                  ? "text-primary scale-105 font-bold tracking-wide" 
                  : "text-gray-600 group-hover:text-primary group-hover:scale-105 group-hover:font-bold"
              )}>
                {item.label}
              </span>
              
              {/* Enhanced active indicator */}
              {isActive && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-primary/80 to-blue-500/80 rounded-full shadow-sm animate-pulse" />
              )}
              
              {/* Improved hover glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-2xl transition-all duration-300 opacity-0 group-hover:opacity-100",
                "bg-gradient-to-br from-primary/3 to-blue-500/3"
              )} />
            </NavLink>
          );
        })}
      </div>
      
      {/* Enhanced bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/15 via-blue-500/15 to-primary/15" />
    </nav>
  );
};
