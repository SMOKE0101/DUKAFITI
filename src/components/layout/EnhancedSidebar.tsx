
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  User
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface EnhancedSidebarProps {
  className?: string;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({ className = '' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex ${className}`}>
        <div 
          className={`
            fixed left-0 top-0 h-full transition-all duration-300 ease-out
            ${isCollapsed ? 'w-[72px]' : 'w-[240px]'}
            bg-white dark:bg-black border-r-2 border-gray-300 dark:border-gray-600
            flex flex-col z-40
          `}
        >
          {/* Brand & Profile Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-12 h-12 rounded-full border-2 border-purple-300 dark:border-purple-600 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="font-mono font-black text-lg uppercase tracking-tight text-gray-900 dark:text-white">
                    DUKASMART
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Smart Business
                  </p>
                </div>
              )}
            </div>
            
            {/* User Profile */}
            {!isCollapsed && user && (
              <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-bold text-gray-900 dark:text-white truncate">
                      {user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Owner
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center rounded-lg transition-all duration-200
                    ${isCollapsed ? 'justify-center p-3' : 'p-4 gap-4'}
                    ${isActive 
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600 text-purple-700 dark:text-purple-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-2 hover:border-purple-300'
                    }
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div className={`
                    p-2 rounded-full border-2 transition-colors duration-200
                    ${isActive 
                      ? 'border-purple-300 bg-purple-100 dark:bg-purple-900/30' 
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-purple-300'
                    }
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {!isCollapsed && (
                    <span className="font-mono font-bold uppercase tracking-tight text-sm">
                      {item.name}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Utilities */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              className={`
                group flex items-center rounded-lg transition-all duration-200 w-full
                ${isCollapsed ? 'justify-center p-3' : 'p-4 gap-4'}
                text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-2 hover:border-purple-300
              `}
              title={isCollapsed ? 'Help' : undefined}
            >
              <div className="p-2 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-purple-300 transition-colors duration-200">
                <HelpCircle className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <span className="font-mono font-bold uppercase tracking-tight text-sm">
                  Help
                </span>
              )}
            </button>

            <button
              onClick={handleSignOut}
              className={`
                group flex items-center rounded-lg transition-all duration-200 w-full
                ${isCollapsed ? 'justify-center p-3' : 'p-4 gap-4'}
                text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-2 hover:border-red-300
              `}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <div className="p-2 rounded-full border-2 border-red-300 dark:border-red-600 group-hover:border-red-400 transition-colors duration-200">
                <LogOut className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <span className="font-mono font-bold uppercase tracking-tight text-sm">
                  Logout
                </span>
              )}
            </button>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-black border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white dark:bg-black border-t-2 border-gray-300 dark:border-gray-600 px-4 py-2">
          <div className="flex items-center justify-around">
            {navigation.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                      : 'text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  <div className={`
                    p-1.5 rounded-full border transition-colors duration-200
                    ${isActive 
                      ? 'border-purple-300 bg-purple-100 dark:bg-purple-900/30' 
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-tight">
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default EnhancedSidebar;
