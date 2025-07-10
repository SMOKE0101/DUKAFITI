
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
    label: 'Dashboard'
  },
  { 
    id: 'inventory', 
    icon: Package, 
    path: '/inventory',
    label: 'Inventory'
  },
  { 
    id: 'sales', 
    icon: ShoppingCart, 
    path: '/sales',
    label: 'Sales'
  },
  { 
    id: 'customers', 
    icon: Users, 
    path: '/customers',
    label: 'Customers'
  },
  { 
    id: 'reports', 
    icon: FileText, 
    path: '/reports',
    label: 'Reports'
  },
  { 
    id: 'settings', 
    icon: Settings, 
    path: '/settings',
    label: 'Settings'
  },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white dark:bg-gray-900 h-20 border-t border-gray-200 dark:border-gray-700 shadow-lg safe-area-pb">
      <div className="grid grid-cols-6 h-full max-w-full mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/dashboard' && (location.pathname === '/' || location.pathname === '/app'));
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center px-1 py-2 text-xs transition-all duration-200 min-h-0",
                isActive 
                  ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20" 
                  : "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <Icon className="w-5 h-5 mb-1 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate w-full text-center leading-tight px-1">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
