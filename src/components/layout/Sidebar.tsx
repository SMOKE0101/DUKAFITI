
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard, 
  BarChart3,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'sales', label: 'Sales', icon: ShoppingCart, path: '/sales' },
    { id: 'products', label: 'Products', icon: Package, path: '/inventory' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
    { id: 'debts', label: 'Debts', icon: CreditCard, path: '/debts' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4">
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
