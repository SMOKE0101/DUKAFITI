
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings 
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
  },
  { 
    id: 'settings', 
    icon: Settings, 
    path: '/settings',
    label: 'Settings',
    matchPaths: ['/settings']
  },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="h-16 sm:h-20 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 w-full">
      <div className="grid grid-cols-6 h-full max-w-full mx-auto px-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchPaths.includes(location.pathname);
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center px-1 py-2 text-xs transition-all duration-300 min-h-0 rounded-2xl mx-1 my-2 relative overflow-hidden",
                isActive 
                  ? "text-purple-600 bg-gradient-to-br from-purple-100 to-blue-100 shadow-lg shadow-purple-200/50 scale-105" 
                  : "text-gray-600 hover:text-purple-600 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 hover:scale-105 active:scale-95"
              )}
            >
              {/* Animated background for active state */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-2xl animate-pulse" />
              )}
              
              <Icon className={cn(
                "w-4 h-4 sm:w-5 sm:h-5 mb-1 flex-shrink-0 transition-all duration-300",
                isActive ? "text-purple-600 drop-shadow-sm" : "text-gray-500"
              )} />
              
              <span className={cn(
                "text-[9px] sm:text-[10px] font-semibold truncate w-full text-center leading-tight px-1 transition-all duration-300",
                isActive ? "text-purple-700" : "text-gray-600"
              )}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 sm:w-8 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
