
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
  User
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
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  // Calculate effective width - more precise hover expansion
  const effectiveWidth = isCollapsed 
    ? (isHovered ? '280px' : '72px') 
    : '280px';

  // Show expanded content when not collapsed OR when collapsed but hovered
  const showExpandedContent = !isCollapsed || isHovered;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:block ${className}`}>
        <div 
          className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col z-40 transition-all duration-300 ease-out shadow-lg"
          style={{ 
            width: effectiveWidth,
          }}
          onMouseEnter={() => isCollapsed && setIsHovered(true)}
          onMouseLeave={() => isCollapsed && setIsHovered(false)}
        >
          {/* Brand & Profile Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className={`flex items-center transition-all duration-300 ${!showExpandedContent ? 'justify-center' : 'gap-3'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-black text-lg">D</span>
              </div>
              {showExpandedContent && (
                <div className="min-w-0 opacity-100 transition-opacity duration-300">
                  <h1 className="font-mono font-black text-lg uppercase tracking-tight text-gray-900 dark:text-white truncate">
                    DUKASMART
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Smart Business
                  </p>
                </div>
              )}
            </div>
            
            {/* User Profile */}
            {showExpandedContent && user && (
              <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Owner
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center rounded-xl transition-all duration-200 relative
                    ${!showExpandedContent ? 'justify-center p-3 w-12 h-12 mx-auto' : 'p-4 gap-4'}
                    ${isActive 
                      ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 shadow-lg border-l-4 border-purple-600' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-purple-400'
                    }
                  `}
                  title={!showExpandedContent ? item.name : undefined}
                >
                  <div className={`
                    flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0
                    ${!showExpandedContent ? 'w-6 h-6' : 'w-8 h-8'}
                    ${isActive 
                      ? 'text-purple-700 dark:text-purple-400' 
                      : 'text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                    }
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {showExpandedContent && (
                    <span className="font-semibold text-sm min-w-0 truncate transition-all duration-300">
                      {item.name}
                    </span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {!showExpandedContent && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                      {item.name}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Utilities */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              className={`
                group flex items-center rounded-xl transition-all duration-200 w-full relative
                ${!showExpandedContent ? 'justify-center p-3 h-12' : 'p-4 gap-4'}
                text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-purple-400
              `}
              title={!showExpandedContent ? 'Help' : undefined}
            >
              <div className={`
                flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0
                ${!showExpandedContent ? 'w-6 h-6' : 'w-8 h-8'}
                text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400
              `}>
                <HelpCircle className="w-5 h-5" />
              </div>
              {showExpandedContent && (
                <span className="font-semibold text-sm">
                  Help
                </span>
              )}
              
              {!showExpandedContent && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                  Help
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                </div>
              )}
            </button>

            <button
              onClick={handleSignOut}
              className={`
                group flex items-center rounded-xl transition-all duration-200 w-full relative
                ${!showExpandedContent ? 'justify-center p-3 h-12' : 'p-4 gap-4'}
                text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
              `}
              title={!showExpandedContent ? 'Logout' : undefined}
            >
              <div className={`
                flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0
                ${!showExpandedContent ? 'w-6 h-6' : 'w-8 h-8'}
                text-red-600 dark:text-red-400
              `}>
                <LogOut className="w-5 h-5" />
              </div>
              {showExpandedContent && (
                <span className="font-semibold text-sm">
                  Logout
                </span>
              )}
              
              {!showExpandedContent && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                  Logout
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                </div>
              )}
            </button>
          </div>

          {/* Toggle Button - Bottom Center */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 group"
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <div className="p-1 transition-transform duration-300 ease-out" style={{
                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'
              }}>
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
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
                    flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                      : 'text-gray-600 dark:text-gray-400'
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
