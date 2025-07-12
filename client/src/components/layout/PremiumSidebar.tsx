
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

  const shopName = user?.user_metadata?.shop_name || 'DUKAFITI';
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
    return theme === 'dark' 
      ? '/assets/banner-with-purple-items-and-black-background.png'
      : '/assets/banner-with-purple-items-and-white-background.png';
  };

  // Get just the DUKAFITI icon for collapsed state
  const getIconSrc = () => {
    return '/assets/dukafiti-icon.svg';
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
        <div className={cn(
          "border-b border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
          isOpen ? "p-6" : "p-4"
        )}>
          <div className={cn(
            "relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
            isOpen ? "space-y-5" : "space-y-0"
          )}>
            {/* Logo Container with Professional Styling and smooth transitions */}
            <div className={cn(
              "relative flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
              isOpen ? "h-16" : "h-12"
            )}>
              <div className={cn(
                "relative transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu",
                isOpen ? "scale-100 opacity-100" : "scale-90 opacity-100"
              )}>
                <img 
                  src={getLogoSrc()}
                  alt="DUKAFITI - Duka Bora Ni Duka Fiti"
                  className={cn(
                    "object-contain transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu",
                    isOpen 
                      ? "h-14 w-auto max-w-[240px]" 
                      : "h-10 w-auto max-w-[40px] object-left"
                  )}
                  style={{
                    filter: isOpen 
                      ? 'drop-shadow(0 4px 20px rgba(139, 69, 197, 0.15)) brightness(1.02)' 
                      : 'drop-shadow(0 2px 12px rgba(139, 69, 197, 0.12)) brightness(1.05)',
                    clipPath: isOpen 
                      ? 'none' 
                      : 'inset(0 75% 0 0)', // Show only the left 25% (icon part) when collapsed
                  }}
                />
              </div>
              
              {/* Subtle glow effect for branding */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )} />
            </div>
            
            {/* Profile Card - Enhanced Professional Design with smooth collapse */}
            <div className={cn(
              "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden",
              isOpen ? "max-h-20 opacity-100 transform translate-y-0" : "max-h-0 opacity-0 transform -translate-y-4"
            )}>
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full p-4 bg-gradient-to-r from-gray-50/90 to-gray-100/50 dark:from-gray-800/90 dark:to-gray-700/50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 text-left group border border-gray-200/60 dark:border-gray-700/60 hover:border-primary/30 dark:hover:border-primary/40 backdrop-blur-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/80 to-primary/60 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary dark:group-hover:text-primary/90 transition-colors duration-300">
                      {shopName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
                      Owner
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full group-hover:bg-primary group-hover:scale-125 transition-all duration-300" />
                </div>
              </button>
            </div>
          </div>
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
