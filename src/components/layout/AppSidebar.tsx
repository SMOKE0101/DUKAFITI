
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DukafitiBrand from '../branding/DukafitiBrand';

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigationItems = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: BarChart3, 
    path: '/app' 
  },
  { 
    id: 'products', 
    label: 'Inventory', 
    icon: Package, 
    path: '/products' 
  },
  { 
    id: 'sales', 
    label: 'Sales POS', 
    icon: ShoppingCart, 
    path: '/sales' 
  },
  { 
    id: 'customers', 
    label: 'Customers', 
    icon: Users, 
    path: '/customers' 
  },
  { 
    id: 'history', 
    label: 'Reports', 
    icon: FileText, 
    path: '/history' 
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings, 
    path: '/settings' 
  },
];

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-700/80 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-30 shadow-xl shadow-gray-900/5",
      isOpen ? "w-60" : "w-18"
    )}>
      {/* Header with DUKAFITI Branding */}
      <div className="flex items-center justify-center p-4 border-b border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 min-h-[72px]">
        {isOpen ? (
          <div className="flex items-center justify-between w-full">
            <DukafitiBrand 
              size="sm" 
              layout="horizontal"
              className="transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-2 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all duration-300"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <DukafitiBrand 
              size="sm" 
              layout="logo-only"
              className="transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-1 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all duration-300"
            >
              <ChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation with Professional Styling */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/app' && location.pathname === '/');
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "flex items-center rounded-xl p-3 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group relative",
                "transform-gpu will-change-[transform,background-color]",
                isActive 
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-sm border border-blue-200/50 dark:border-blue-800/50" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-200 hover:scale-[1.02] hover:shadow-sm",
                !isOpen && "justify-center"
              )}
              style={{
                transitionDelay: `${index * 30}ms`,
              }}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-all duration-300",
                isActive ? "text-blue-600 dark:text-blue-400 scale-110" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 group-hover:scale-110"
              )} />
              {isOpen && (
                <span className="font-medium ml-3 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
                  {item.label}
                </span>
              )}
              {!isOpen && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900/95 dark:bg-gray-100/95 text-white dark:text-gray-900 text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/95 dark:bg-gray-100/95 rotate-45"></div>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
