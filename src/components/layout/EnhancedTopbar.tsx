
import React, { useState, useRef, useEffect } from 'react';
import { PanelLeft, Bell, Search, Moon, Sun, X, LogOut, Check, UserCircle2, FileText } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface EnhancedTopbarProps {
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'info' | 'warning' | 'success';
}

const EnhancedTopbar: React.FC<EnhancedTopbarProps> = ({ 
  onSidebarToggle, 
  sidebarCollapsed 
}) => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { 
      id: 1, 
      title: 'Low Stock Alert', 
      message: 'Product ABC is running low on inventory', 
      time: '5 min ago', 
      unread: true,
      type: 'warning'
    },
    { 
      id: 2, 
      title: 'New Sale Completed', 
      message: 'Customer John made a purchase of KSh 2,500', 
      time: '10 min ago', 
      unread: true,
      type: 'success'
    },
    { 
      id: 3, 
      title: 'Payment Received', 
      message: 'Payment of KSh 1,250 received from Mary', 
      time: '1 hour ago', 
      unread: false,
      type: 'info'
    },
  ]);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log('Searching for:', searchTerm);
      // Add your search logic here
    }
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // Mark all as read when opening notifications
      setNotifications(prev => prev.map(notif => ({ ...notif, unread: false })));
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
    setShowProfileMenu(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50 shadow-sm">
      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Left section - Logo and Sidebar Toggle */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button - Desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group hover:scale-105"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft 
              className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" 
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

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products, customers, orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Right section - Actions and User */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative hover:scale-105"
              onClick={handleNotificationClick}
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-xs text-white font-medium">{unreadCount}</span>
                </div>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto animate-scale-in">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  {notifications.length > 0 && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-medium">All read</span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {notification.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {notification.message}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {notification.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleThemeToggle}
            className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105"
          >
            <div className="relative">
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] animate-in spin-in-180" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] animate-in spin-in-180" />
              )}
            </div>
          </Button>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </Button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-scale-in">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-150"
                    onClick={() => {
                      navigate('/reports');
                      setShowProfileMenu(false);
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Reports
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-150"
                    onClick={handleThemeToggle}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-yellow-500 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
                      ) : (
                        <Moon className="w-4 h-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
                      )}
                    </div>
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 transition-colors duration-150"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default EnhancedTopbar;
