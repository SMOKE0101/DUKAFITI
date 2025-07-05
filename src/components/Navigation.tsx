
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
    <nav className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-3 mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-102 transform'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
        
        <div className="flex items-center ml-auto space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isOnline 
              ? 'text-green-700 bg-green-50 border border-green-200 shadow-sm' 
              : 'text-orange-700 bg-orange-50 border border-orange-200 shadow-sm'
          }`}>
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
