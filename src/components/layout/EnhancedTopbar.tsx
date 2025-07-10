
import React from 'react';
import { PanelLeft, Bell, Search, User, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../hooks/useAuth';

interface EnhancedTopbarProps {
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
}

const EnhancedTopbar: React.FC<EnhancedTopbarProps> = ({ 
  onSidebarToggle, 
  sidebarCollapsed 
}) => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50 shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left section - Logo and Sidebar Toggle */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button - Desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft 
              className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-all duration-300" 
              style={{
                transform: sidebarCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'
              }}
            />
          </Button>

          {/* Logo - Mobile */}
          <div className="md:hidden flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-sm">D</span>
            </div>
            <div>
              <h1 className="font-mono font-black text-lg uppercase tracking-tight text-gray-900 dark:text-white">
                DUKASMART
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                Smart Business
              </p>
            </div>
          </div>
        </div>

        {/* Right section - Actions and User */}
        <div className="flex items-center gap-3">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </Button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Owner
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default EnhancedTopbar;
