
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
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from 'next-themes';

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
  const { theme } = useTheme();
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

  // Get the appropriate logo based on theme and open state
  const getLogoSrc = () => {
    if (!isOpen) {
      // Use cube icons for collapsed state
      return theme === 'dark' 
        ? '/lovable-uploads/e71b20c6-1457-4277-a594-bb9ce4f09d56.png' // Dark mode cube
        : '/lovable-uploads/0e966e8b-29a2-4e9c-bae2-eb4b0ff1f714.png'; // Light mode cube
    } else {
      // Use full logos for expanded state
      return theme === 'dark'
        ? '/lovable-uploads/eb77e4bd-5d96-4815-a1ff-0bc09529c54a.png' // Dark mode full logo
        : '/lovable-uploads/45d85eef-ee71-473e-95df-bb58337a9f07.png'; // Light mode full logo
    }
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200/80 dark:border-gray-700/80 transition-colors duration-300">
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
                    ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
        "fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-700/80 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-40 flex flex-col shadow-xl shadow-gray-900/5 dark:shadow-gray-900/20",
        isOpen ? "w-[280px]" : "w-20"
      )}>
        {/* Branding & Profile Section - Professional Design with theme support */}
        <div className="p-6 border-b border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 transition-colors duration-300">
          {isOpen ? (
            <div className="space-y-4">
              {/* Logo with Professional Styling and theme support */}
              <div className="flex items-center justify-center">
                <img 
                  src={getLogoSrc()}
                  alt="DUKAFITI Logo"
                  className="h-12 w-auto max-w-[200px] object-contain transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  style={{
                    filter: 'drop-shadow(0 2px 12px rgba(0, 0, 0, 0.1))'
                  }}
                />
              </div>
              
              {/* Profile Card - Enhanced Professional Design with theme support */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full p-4 bg-gray-50/80 dark:bg-gray-800/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-left group border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300/50 dark:hover:border-gray-600/50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600 rounded-full flex items-center justify-center shadow-sm">
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
                src={getLogoSrc()}
                alt="DUKAFITI Logo"
                className="w-10 h-10 object-contain transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))'
                }}
              />
            </div>
          )}
        </div>

        {/* Navigation - Professional Styling with theme support */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === '/app' && location.pathname === '/');
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  "flex items-center p-3 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group relative",
                  "transform-gpu will-change-[transform,background-color]",
                  isOpen ? "gap-3" : "justify-center",
                  isActive 
                    ? "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold shadow-sm border border-gray-200/50 dark:border-gray-700/50" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white hover:scale-[1.02] hover:shadow-sm"
                )}
                style={{
                  transitionDelay: `${index * 30}ms`,
                }}
              >
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-all duration-300",
                  isActive ? "text-gray-900 dark:text-white scale-110" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-hover:scale-110"
                )} />
                
                {isOpen && (
                  <span className="font-medium transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
                    {item.label}
                  </span>
                )}
                
                {!isOpen && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900/95 dark:bg-gray-100/95 text-white dark:text-gray-900 text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/95 dark:bg-gray-100/95 rotate-45"></div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Utility Buttons - Professional Design with theme support */}
        <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/60 space-y-2 flex-shrink-0 bg-white dark:bg-gray-900 transition-colors duration-300">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center w-full p-3 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/20 hover:scale-[1.02] hover:shadow-sm group",
              !isOpen ? "justify-center" : "gap-3"
            )}
          >
            <LogOut className={cn(
              "w-5 h-5 flex-shrink-0 transition-all duration-300",
              "text-red-600 dark:text-red-400 group-hover:scale-110"
            )} />
            {isOpen && <span className="font-medium">Logout</span>}
            {!isOpen && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900/95 dark:bg-gray-100/95 text-white dark:text-gray-900 text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50">
                Logout
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/95 dark:bg-gray-100/95 rotate-45"></div>
              </div>
            )}
          </button>
        </div>

        {/* Toggle Button - Professional Styling with theme support */}
        <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 transition-colors duration-300">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "w-full p-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu will-change-transform hover:scale-[1.02]",
              !isOpen && "justify-center"
            )}
          >
            {isOpen ? (
              <>
                <ChevronLeft className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 font-medium">Collapse</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Profile Modal - Enhanced Design with theme support */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profile Information
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                ×
              </Button>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {shopName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userEmail}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
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
