
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

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
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const effectiveWidth = isCollapsed ? '72px' : '280px';

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:block ${className}`}>
        <div 
          className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col z-40 shadow-lg overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ 
            width: effectiveWidth,
          }}
        >
          {/* Brand Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className={`flex items-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
                <span className="text-white font-black text-lg">D</span>
              </div>
              <div className={`min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isCollapsed ? 'opacity-0 w-0 scale-90 translate-x-[-10px]' : 'opacity-100 scale-100 translate-x-0'
              }`} style={{ transitionDelay: isCollapsed ? '0ms' : '150ms' }}>
                <h1 className="font-mono font-black text-lg uppercase tracking-tight text-gray-900 dark:text-white truncate">
                  DUKASMART
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Smart Business
                </p>
              </div>
            </div>
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
                    group flex items-center rounded-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative
                    ${isCollapsed ? 'justify-center p-3 w-12 h-12 mx-auto' : 'p-4 gap-4'}
                    ${isActive 
                      ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 shadow-lg border-l-4 border-purple-600 transform scale-[1.02]' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-purple-400 hover:transform hover:scale-[1.02]'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex-shrink-0
                    ${isCollapsed ? 'w-6 h-6' : 'w-8 h-8'}
                    ${isActive 
                      ? 'text-purple-700 dark:text-purple-400' 
                      : 'text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                    }
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`font-semibold text-sm min-w-0 truncate transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isCollapsed ? 'opacity-0 w-0 scale-90 translate-x-[-10px]' : 'opacity-100 scale-100 translate-x-0'
                  }`} style={{ transitionDelay: isCollapsed ? '0ms' : '200ms' }}>
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Section - Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2 flex-shrink-0">
            <button
              onClick={handleSignOut}
              className={`
                group flex items-center rounded-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full relative
                ${isCollapsed ? 'justify-center p-3 h-12' : 'p-4 gap-4'}
                text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:transform hover:scale-[1.02]
              `}
            >
              <div className={`
                flex items-center justify-center rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex-shrink-0
                ${isCollapsed ? 'w-6 h-6' : 'w-8 h-8'}
                text-red-600 dark:text-red-400
              `}>
                <LogOut className="w-5 h-5" />
              </div>
              <span className={`font-semibold text-sm transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isCollapsed ? 'opacity-0 w-0 scale-90 translate-x-[-10px]' : 'opacity-100 scale-100 translate-x-0'
              }`} style={{ transitionDelay: isCollapsed ? '0ms' : '200ms' }}>
                Logout
              </span>
            </button>
          </div>

          {/* Toggle Button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 group hover:transform hover:scale-105"
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <div className="p-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{
                transform: isCollapsed ? 'rotate(0deg) scale(1.1)' : 'rotate(180deg) scale(1.1)'
              }}>
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600 px-4 py-2 shadow-lg">
          <div className="flex items-center justify-around">
            {navigation.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isActive 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 transform scale-105' 
                      : 'text-gray-600 dark:text-gray-400 hover:transform hover:scale-105'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">
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
