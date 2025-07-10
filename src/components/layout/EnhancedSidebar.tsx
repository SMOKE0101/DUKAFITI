
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
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface EnhancedSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({ 
  isCollapsed, 
  onToggle, 
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  // Calculate effective width for hover peek effect
  const effectiveWidth = isCollapsed ? (isHovered ? '100px' : '72px') : '240px';

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:block ${className}`}>
        <div 
          className="fixed left-0 top-0 h-full bg-white dark:bg-black border-r border-gray-200 dark:border-gray-700 flex flex-col z-50 transition-all duration-300 ease-out"
          style={{ 
            width: effectiveWidth,
            '--sidebar-width': effectiveWidth
          } as React.CSSProperties}
          onMouseEnter={() => isCollapsed && setIsHovered(true)}
          onMouseLeave={() => isCollapsed && setIsHovered(false)}
        >
          {/* Brand & Profile Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className={`flex items-center ${isCollapsed && !isHovered ? 'justify-center' : 'gap-3'}`}>
              <div className="w-12 h-12 rounded-full border-2 border-purple-300 dark:border-purple-600 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 flex-shrink-0">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              {(!isCollapsed || isHovered) && (
                <div className="min-w-0">
                  <h1 className="font-mono font-black text-lg uppercase tracking-tight text-gray-900 dark:text-white truncate">
                    DUKASMART
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Smart Business
                  </p>
                </div>
              )}
            </div>
            
            {/* User Profile */}
            {(!isCollapsed || isHovered) && user && (
              <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
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
                    ${isCollapsed && !isHovered ? 'justify-center p-3' : 'p-4 gap-4'}
                    ${isActive 
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600 text-purple-700 dark:text-purple-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-2 hover:border-purple-300'
                    }
                  `}
                  title={isCollapsed && !isHovered ? item.name : undefined}
                >
                  <div className={`
                    p-2 rounded-full border-2 transition-colors duration-200 flex-shrink-0
                    ${isActive 
                      ? 'border-purple-300 bg-purple-100 dark:bg-purple-900/30' 
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-purple-300'
                    }
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {(!isCollapsed || isHovered) && (
                    <span className="font-mono font-bold uppercase tracking-tight text-sm min-w-0 truncate">
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
                ${isCollapsed && !isHovered ? 'justify-center p-3' : 'p-4 gap-4'}
                text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-2 hover:border-purple-300
              `}
              title={isCollapsed && !isHovered ? 'Help' : undefined}
            >
              <div className="p-2 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-purple-300 transition-colors duration-200 flex-shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              {(!isCollapsed || isHovered) && (
                <span className="font-mono font-bold uppercase tracking-tight text-sm">
                  Help
                </span>
              )}
            </button>

            <button
              onClick={handleSignOut}
              className={`
                group flex items-center rounded-lg transition-all duration-200 w-full
                ${isCollapsed && !isHovered ? 'justify-center p-3' : 'p-4 gap-4'}
                text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-2 hover:border-red-300
              `}
              title={isCollapsed && !isHovered ? 'Logout' : undefined}
            >
              <div className="p-2 rounded-full border-2 border-red-300 dark:border-red-600 group-hover:border-red-400 transition-colors duration-200 flex-shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              {(!isCollapsed || isHovered) && (
                <span className="font-mono font-bold uppercase tracking-tight text-sm">
                  Logout
                </span>
              )}
            </button>
          </div>

          {/* Toggle Button - Bottom Center */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <div className="p-1 transition-transform duration-300 ease-out" style={{
                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'
              }}>
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
            </button>
          </div>
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
