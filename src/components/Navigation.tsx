
import { Dispatch, SetStateAction } from 'react';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard, 
  History, 
  Settings,
  Wifi,
  WifiOff 
} from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import UserMenu from './UserMenu';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

const Navigation = ({ activeTab, setActiveTab }: NavigationProps) => {
  const { isOnline } = useOfflineSync();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'debts', label: 'Debts', icon: CreditCard },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="dukafiti-card p-4 mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "nav-item px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm",
                activeTab === item.id
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
          <div className={cn(
            "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            isOnline 
              ? "text-brand-green bg-green-50 border border-green-200 shadow-sm" 
              : "text-orange-700 bg-orange-50 border border-orange-200 shadow-sm"
          )}>
            {isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
