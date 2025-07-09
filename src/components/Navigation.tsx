
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
  WifiOff,
  Sparkles,
  Crown
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
    <div className="relative">
      {/* Gradient Background with Glass Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-green-500/20 backdrop-blur-xl border-b border-white/10"></div>
      
      {/* Main Navigation Container */}
      <nav className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl mx-4 my-3 p-4">
        {/* Top Section - Brand & Status */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          {/* Brand Section */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                Alvin's Shop
              </h1>
              <p className="text-xs text-muted-foreground font-medium flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>Complete shop management - debt tracking, sales, and inventory</span>
              </p>
            </div>
          </div>

          {/* Status & User Section */}
          <div className="flex items-center space-x-4">
            {/* Trial Badge */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-full px-4 py-2">
              <span className="text-sm font-semibold text-amber-400 flex items-center space-x-2">
                <Crown className="w-4 h-4" />
                <span>10 days left in trial</span>
              </span>
            </div>

            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-300 ${
              isOnline 
                ? 'text-green-400 bg-green-500/10 border-green-400/20 shadow-green-400/20 shadow-lg' 
                : 'text-orange-400 bg-orange-500/10 border-orange-400/20 shadow-orange-400/20 shadow-lg'
            }`}>
              {isOnline ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="font-medium text-sm">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            <UserMenu />
          </div>
        </div>

        {/* Navigation Pills */}
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group relative flex items-center space-x-3 px-6 py-3 rounded-2xl transition-all duration-300 font-medium text-sm overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 text-white shadow-2xl transform scale-105 shadow-purple-500/25'
                    : 'text-foreground/70 hover:text-foreground hover:bg-white/5 hover:shadow-xl hover:scale-102 transform backdrop-blur-sm border border-white/5 hover:border-white/10'
                }`}
              >
                {/* Background Animation */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/0 to-green-500/0 group-hover:from-purple-500/10 group-hover:via-blue-500/10 group-hover:to-green-500/10 transition-all duration-500"></div>
                )}
                
                {/* Content */}
                <div className="relative z-10 flex items-center space-x-3">
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="font-semibold">{item.label}</span>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/50 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-green-500/10 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl"></div>
        </div>
      </nav>
    </div>
  );
};

export default Navigation;
