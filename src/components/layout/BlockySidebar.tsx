
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

interface BlockySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigationItems = [
  { 
    id: 'dashboard', 
    label: 'DASHBOARD', 
    icon: BarChart3, 
    path: '/app' 
  },
  { 
    id: 'inventory', 
    label: 'INVENTORY', 
    icon: Package, 
    path: '/inventory' 
  },
  { 
    id: 'sales', 
    label: 'SALES', 
    icon: ShoppingCart, 
    path: '/sales' 
  },
  { 
    id: 'customers', 
    label: 'CUSTOMERS', 
    icon: Users, 
    path: '/customers' 
  },
  { 
    id: 'reports', 
    label: 'REPORTS', 
    icon: FileText, 
    path: '/reports' 
  },
  { 
    id: 'settings', 
    label: 'SETTINGS', 
    icon: Settings, 
    path: '/settings' 
  },
];

export const BlockySidebar: React.FC<BlockySidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [showProfileTooltip, setShowProfileTooltip] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const shopName = user?.user_metadata?.shop_name || 'DUKASMART';
  const userEmail = user?.email || '';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  // Mobile bottom navigation bar
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600">
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
                  "flex flex-col items-center justify-center min-w-[50px] min-h-[50px] p-2 rounded-2xl transition-all duration-150",
                  isActive 
                    ? "bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 transition-colors duration-150",
                  isActive 
                    ? "border-purple-500 text-purple-600 dark:text-purple-400" 
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={cn(
                  "text-xs font-mono font-black tracking-tight uppercase",
                  isActive 
                    ? "text-purple-600 dark:text-purple-400" 
                    : "text-gray-600 dark:text-gray-400"
                )}>
                  {item.label.substring(0, 3)}
                </span>
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
        "fixed left-0 top-0 h-full border-r-2 border-gray-300 dark:border-gray-600 bg-transparent transition-all duration-250 ease-out z-40 flex flex-col",
        isOpen ? "w-60" : "w-[72px]"
      )}>
        {/* Brand & Profile Section */}
        <div className="p-6 border-b-2 border-gray-300 dark:border-gray-600">
          {isOpen ? (
            <div className="space-y-4">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-800">
                  <img 
                    src="/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png" 
                    alt="DukaFiti Logo" 
                    className="w-8 h-8 rounded-lg"
                  />
                </div>
                <span className="font-mono font-black text-xl tracking-tight uppercase text-gray-900 dark:text-white">
                  {shopName}
                </span>
              </div>
              
              {/* Profile Card */}
              <div 
                className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-150 cursor-pointer group"
                onMouseEnter={() => setShowProfileTooltip(true)}
                onMouseLeave={() => setShowProfileTooltip(false)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-purple-500 transition-colors duration-150">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-black text-sm tracking-tight uppercase text-gray-900 dark:text-white truncate">
                      OWNER
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {userEmail}
                    </p>
                  </div>
                </div>
                {showProfileTooltip && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap font-mono font-black tracking-tight uppercase">
                    STORE OWNER
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-800">
                <img 
                  src="/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png" 
                  alt="DukaFiti Logo" 
                  className="w-8 h-8 rounded-lg"
                />
              </div>
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
                  "flex items-center p-4 rounded-lg transition-all duration-150 group relative",
                  isActive 
                    ? "border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20" 
                    : "hover:border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20",
                  !isOpen && "justify-center"
                )}
              >
                {/* Icon with circular outline */}
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-150",
                  isActive 
                    ? "border-purple-500 text-purple-600 dark:text-purple-400" 
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 group-hover:border-purple-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                
                {isOpen && (
                  <span className={cn(
                    "ml-4 font-mono font-black tracking-tight uppercase transition-colors duration-150",
                    isActive 
                      ? "text-purple-600 dark:text-purple-400" 
                      : "text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400"
                  )}>
                    {item.label}
                  </span>
                )}
                
                {!isOpen && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 font-mono font-black tracking-tight uppercase">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Utility Buttons */}
        <div className="px-4 py-4 border-t-2 border-gray-300 dark:border-gray-600 space-y-2">
          {/* Help */}
          <button
            className={cn(
              "flex items-center w-full p-4 rounded-lg transition-all duration-150 text-gray-600 dark:text-gray-400 hover:border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 group",
              !isOpen && "justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-purple-500 transition-colors duration-150">
             <HelpCircle className="w-4 h-4" />
            </div>
            {isOpen && (
              <span className="ml-4 font-mono font-black tracking-tight uppercase">
                HELP
              </span>
            )}
            {!isOpen && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 font-mono font-black tracking-tight uppercase">
                HELP
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={cn(
              "flex items-center w-full p-4 rounded-lg transition-all duration-150 text-red-600 dark:text-red-400 hover:border-2 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 group",
              !isOpen && "justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-red-500 transition-colors duration-150">
              <LogOut className="w-4 h-4" />
            </div>
            {isOpen && (
              <span className="ml-4 font-mono font-black tracking-tight uppercase">
                LOGOUT
              </span>
            )}
            {!isOpen && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 font-mono font-black tracking-tight uppercase">
                LOGOUT
              </div>
            )}
          </button>
        </div>

        {/* Toggle Button */}
        <div className="p-4 border-t-2 border-gray-300 dark:border-gray-600">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 transition-all duration-150",
              !isOpen && "justify-center"
            )}
          >
            <div className={cn(
              "transition-transform duration-250 ease-out",
              isOpen ? "rotate-0" : "rotate-180"
            )}>
              <ChevronLeft className="w-4 h-4" />
            </div>
            {isOpen && (
              <span className="ml-2 font-mono font-black tracking-tight uppercase text-xs">
                COLLAPSE
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-gray-300 dark:border-gray-600">
            <div className="text-center space-y-4">
              <h2 className="font-mono font-black text-xl tracking-tight uppercase text-gray-900 dark:text-white">
                CONFIRM LOGOUT
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to exit DukaSmart?
              </p>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-mono font-black tracking-tight uppercase"
                >
                  YES, LOGOUT
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 font-mono font-black tracking-tight uppercase"
                >
                  CANCEL
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
