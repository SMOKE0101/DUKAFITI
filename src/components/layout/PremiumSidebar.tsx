
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
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

interface PremiumSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

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
    label: 'Inventory'
  },
  { 
    id: 'sales', 
    icon: ShoppingCart, 
    path: '/app/sales',
    label: 'Sales'
  },
  { 
    id: 'customers', 
    icon: Users, 
    path: '/app/customers',
    label: 'Customers'
  },
  { 
    id: 'reports', 
    icon: FileText, 
    path: '/app/reports',
    label: 'Reports'
  },
  { 
    id: 'settings', 
    icon: Settings, 
    path: '/app/settings',
    label: 'Settings'
  }
];

const PremiumSidebar: React.FC<PremiumSidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Hide sidebar completely on mobile/tablet
  if (isMobile || isTablet) {
    return null;
  }

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchPaths 
              ? item.matchPaths.includes(location.pathname)
              : location.pathname === item.path;
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-purple-600 dark:text-purple-400" : ""
                )} />
                {!isCollapsed && (
                  <span className="truncate text-sm font-medium">
                    {item.label}
                  </span>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className={cn(
            "text-xs text-gray-500 dark:text-gray-400",
            isCollapsed ? "text-center" : ""
          )}>
            {isCollapsed ? "v1.0" : "DUKAFITI v1.0"}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PremiumSidebar;
