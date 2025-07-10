
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
    <nav className="h-20 bg-white/95 backdrop-blur-xl border-t border-gray-200/30 w-full shadow-2xl shadow-purple-500/5">
      <div className="grid grid-cols-5 h-full max-w-full mx-auto px-3">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.matchPaths.includes(location.pathname);
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center px-1 py-3 text-xs transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] min-h-0 rounded-3xl mx-2 my-2 relative overflow-hidden group",
                "transform-gpu will-change-transform",
                isActive 
                  ? "text-purple-700 bg-gradient-to-br from-purple-100/80 to-blue-100/80 shadow-xl shadow-purple-200/40 scale-110 -translate-y-1" 
                  : "text-gray-600 hover:text-purple-600 hover:bg-gradient-to-br hover:from-purple-50/60 hover:to-blue-50/60 hover:scale-105 hover:-translate-y-0.5 active:scale-95"
              )}
              style={{
                transitionDelay: `${index * 30}ms`
              }}
            >
              {/* Enhanced animated background for active state */}
              {isActive && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-3xl animate-pulse opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-blue-400/5 rounded-3xl animate-ping" />
                </>
              )}
              
              {/* Icon container with enhanced animations */}
              <div className={cn(
                "relative z-10 flex items-center justify-center rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex-shrink-0 mb-1",
                "transform-gpu will-change-transform",
                isActive 
                  ? "w-7 h-7 bg-gradient-to-br from-purple-600/20 to-blue-600/20 shadow-lg shadow-purple-500/25" 
                  : "w-6 h-6 group-hover:bg-gradient-to-br group-hover:from-purple-500/10 group-hover:to-blue-500/10 group-hover:shadow-md group-hover:shadow-purple-500/15"
              )}>
                <Icon className={cn(
                  "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform-gpu will-change-transform",
                  isActive 
                    ? "w-5 h-5 text-purple-700 drop-shadow-sm scale-110" 
                    : "w-4 h-4 text-gray-500 group-hover:text-purple-600 group-hover:scale-110"
                )} />
              </div>
              
              {/* Enhanced label with better typography */}
              <span className={cn(
                "text-[10px] font-bold truncate w-full text-center leading-tight px-1 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative z-10",
                "transform-gpu will-change-transform",
                isActive 
                  ? "text-purple-800 scale-105 font-black" 
                  : "text-gray-600 group-hover:text-purple-700 group-hover:scale-105 group-hover:font-bold"
              )}>
                {item.label}
              </span>
              
              {/* Enhanced active indicator with gradient */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-1.5 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 rounded-full shadow-lg shadow-purple-500/50 animate-pulse" />
              )}
              
              {/* Subtle hover glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] opacity-0 group-hover:opacity-100",
                "bg-gradient-to-br from-purple-500/5 to-blue-500/5 blur-sm"
              )} />
            </NavLink>
          );
        })}
      </div>
      
      {/* Subtle bottom gradient for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10" />
    </nav>
  );
};
