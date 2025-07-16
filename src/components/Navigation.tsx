
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard, 
  History, 
  Settings
} from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import UserMenu from './UserMenu';
import EnhancedOfflineIndicator from './EnhancedOfflineIndicator';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline } = useOfflineSync();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { id: 'sales', label: 'Sales', icon: ShoppingCart, path: '/sales' },
    { id: 'products', label: 'Products', icon: Package, path: '/inventory' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
    { id: 'debts', label: 'Debts', icon: CreditCard, path: '/debts' },
    { id: 'history', label: 'History', icon: History, path: '/history' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const getActiveTab = () => {
    const path = location.pathname;
    const activeItem = navItems.find(item => item.path === path);
    return activeItem ? activeItem.id : 'dashboard';
  };

  return (
    <nav className="dukafiti-card p-4 mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = getActiveTab() === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "nav-item px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "hover:bg-accent/10 hover:text-accent hover:scale-102"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
        
        <div className="flex items-center ml-auto space-x-3">
          <EnhancedOfflineIndicator />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
