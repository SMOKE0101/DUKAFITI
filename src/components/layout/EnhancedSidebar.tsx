
import React from 'react';
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
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Completely hide sidebar on mobile and tablet - return null immediately
  if (isMobile || isTablet) {
    return null;
  }

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  // Desktop Sidebar only
  return (
    <div className={`hidden lg:block ${className}`}>
      <div 
        className={`
          fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
          flex flex-col z-40 shadow-lg
          transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
          ${isCollapsed ? 'w-20' : 'w-72'}
        `}
        style={{
          transitionProperty: 'width, transform',
        }}
      >
        {/* Brand Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 min-h-[88px] flex items-center overflow-hidden">
          <div className={`flex items-center transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className={`rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-700 ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}>
              <span className={`text-white font-black transition-all duration-700 ${isCollapsed ? 'text-sm' : 'text-lg'}`}>D</span>
            </div>
            <div 
              className={`
                min-w-0 transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] overflow-hidden
                ${isCollapsed 
                  ? 'opacity-0 w-0 max-w-0 transform translate-x-8 scale-95' 
                  : 'opacity-100 w-auto max-w-none transform translate-x-0 scale-100'
                }
              `}
              style={{
                transitionDelay: isCollapsed ? '0ms' : '300ms',
              }}
            >
              <h1 className="font-mono font-black text-lg uppercase tracking-tight text-gray-900 dark:text-white whitespace-nowrap">
                DUKASMART
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                Smart Business
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={`
          flex-1 p-4 space-y-2 transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
          ${isCollapsed 
            ? 'overflow-hidden' 
            : 'overflow-y-auto'
          }
        `}>
          {navigation.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center rounded-xl transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] relative
                  ${isCollapsed ? 'justify-center p-3 w-12 h-12 mx-auto' : 'p-4 gap-4'}
                  ${isActive 
                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 shadow-md border-l-4 border-purple-600' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-purple-400'
                  }
                `}
                style={{
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                <div className={`
                  flex items-center justify-center rounded-lg transition-all duration-700 flex-shrink-0
                  ${isCollapsed ? 'w-6 h-6' : 'w-8 h-8'}
                  ${isActive 
                    ? 'text-purple-700 dark:text-purple-400' 
                    : 'text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                  }
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span 
                  className={`
                    font-semibold text-sm min-w-0 truncate transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] overflow-hidden
                    ${isCollapsed 
                      ? 'opacity-0 w-0 max-w-0 transform translate-x-8 scale-95' 
                      : 'opacity-100 w-auto max-w-none transform translate-x-0 scale-100'
                    }
                  `}
                  style={{
                    transitionDelay: isCollapsed ? '0ms' : '400ms',
                  }}
                >
                  {item.name}
                </span>
                {/* Enhanced Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.name}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section - Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2 flex-shrink-0">
          <button
            onClick={handleSignOut}
            className={`
              group flex items-center rounded-xl transition-all duration-700 w-full relative
              ${isCollapsed ? 'justify-center p-3 h-12' : 'p-4 gap-4'}
              text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
            `}
          >
            <div className={`
              flex items-center justify-center rounded-lg transition-all duration-700 flex-shrink-0
              ${isCollapsed ? 'w-6 h-6' : 'w-8 h-8'}
              text-red-600 dark:text-red-400
            `}>
              <LogOut className="w-5 h-5" />
            </div>
            <span 
              className={`
                font-semibold text-sm transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] overflow-hidden
                ${isCollapsed 
                  ? 'opacity-0 w-0 max-w-0 transform translate-x-8 scale-95' 
                  : 'opacity-100 w-auto max-w-none transform translate-x-0 scale-100'
                }
              `}
              style={{
                transitionDelay: isCollapsed ? '0ms' : '400ms',
              }}
            >
              Logout
            </span>
            {/* Enhanced Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                Logout
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
              </div>
            )}
          </button>
        </div>

        {/* Enhanced Toggle Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 group"
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div 
              className={`
                p-1 transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
                ${isCollapsed ? 'rotate-0' : 'rotate-180'}
              `}
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-500" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSidebar;
