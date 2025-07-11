
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
      "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-30",
      isOpen ? "w-60" : "w-18"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png" 
              alt="DukaFiti Logo" 
              className="w-8 h-8 rounded-lg"
            />
            <span className="dukafiti-brand text-lg">DukaFiti</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2 hover:bg-sidebar-accent"
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/app' && location.pathname === '/');
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "nav-item group",
                isActive && "active"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <span className="font-medium transition-opacity duration-200">
                  {item.label}
                </span>
              )}
              {!isOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
