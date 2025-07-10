
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

interface PremiumSidebarProps {
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
    id: 'inventory', 
    label: 'Inventory', 
    icon: Package, 
    path: '/inventory' 
  },
  { 
    id: 'sales', 
    label: 'Sales', 
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
    id: 'reports', 
    label: 'Reports', 
    icon: FileText, 
    path: '/reports' 
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings, 
    path: '/settings' 
  },
];

export const PremiumSidebar: React.FC<PremiumSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const shopName = user?.user_metadata?.shop_name || 'DukaSmart';
  const userEmail = user?.email || '';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-around items-center py-2">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === '/app' && location.pathname === '/');
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-lg transition-colors",
                  isActive 
                    ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "fixed left-0 top-0 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-40 flex flex-col",
        isOpen ? "w-[280px]" : "w-20"
      )}>
        {/* Branding & Profile Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          {isOpen ? (
            <div className="space-y-4">
              {/* Logo with Custom Icon */}
              <div className="flex items-center space-x-3">
                <img 
                  src="/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png" 
                  alt="DukaFiti Logo" 
                  className="w-8 h-8 rounded-lg"
                />
                <span className="text-xl font-bold text-gray-900 dark:text-white">DukaFiti</span>
              </div>
              
              {/* Profile Card */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {shopName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Owner
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <img 
                src="/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png" 
                alt="DukaFiti Logo" 
                className="w-8 h-8 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === '/app' && location.pathname === '/');
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  "flex items-center p-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-semibold shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 dark:bg-purple-400 rounded-r-full" />
                )}
                
                <Icon className={cn("w-5 h-5 flex-shrink-0", isOpen ? "mr-3" : "")} />
                
                {isOpen && (
                  <span className="font-medium transition-opacity duration-200">
                    {item.label}
                  </span>
                )}
                
                {!isOpen && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Utility Buttons */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <button
            className={cn(
              "flex items-center w-full p-3 rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 group",
              !isOpen && "justify-center"
            )}
          >
            <HelpCircle className={cn("w-5 h-5 flex-shrink-0", isOpen ? "mr-3" : "")} />
            {isOpen && <span className="font-medium">Help</span>}
            {!isOpen && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Help
              </div>
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center w-full p-3 rounded-xl transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 group",
              !isOpen && "justify-center"
            )}
          >
            <LogOut className={cn("w-5 h-5 flex-shrink-0", isOpen ? "mr-3" : "")} />
            {isOpen && <span className="font-medium">Logout</span>}
            {!isOpen && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>
        </div>

        {/* Toggle Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800",
              !isOpen && "justify-center"
            )}
          >
            {isOpen ? (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Collapse
              </>
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profile Information
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileModal(false)}
                className="p-2"
              >
                ×
              </Button>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <User className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {shopName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userEmail}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  Owner
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
