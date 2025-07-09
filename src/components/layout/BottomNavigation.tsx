
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
    path: '/app' 
  },
  { 
    id: 'products', 
    icon: Package, 
    path: '/products' 
  },
  { 
    id: 'sales', 
    icon: ShoppingCart, 
    path: '/sales' 
  },
  { 
    id: 'customers', 
    icon: Users, 
    path: '/customers' 
  },
  { 
    id: 'history', 
    icon: FileText, 
    path: '/history' 
  },
  { 
    id: 'settings', 
    icon: Settings, 
    path: '/settings' 
  },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="flex justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/app' && location.pathname === '/');
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "bottom-nav-item",
                isActive && "active"
              )}
            >
              <Icon className="w-6 h-6" />
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
