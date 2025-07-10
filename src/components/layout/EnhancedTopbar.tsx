
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, X, LogOut, UserCircle2, FileText, Settings, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useIsMobile } from '../../hooks/use-mobile';

interface EnhancedTopbarProps {
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
}

interface SearchResult {
  id: string;
  type: 'product';
  title: string;
  subtitle: string;
  route: string;
}

const EnhancedTopbar: React.FC<EnhancedTopbarProps> = ({ 
  onSidebarToggle, 
  sidebarCollapsed 
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { products } = useSupabaseProducts();
  const isMobile = useIsMobile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Real low stock notifications
  const lowStockProducts = products.filter(p => 
    p.currentStock !== -1 && 
    p.currentStock <= (p.lowStockThreshold || 5)
  );

  // Check if there are unread notifications
  useEffect(() => {
    setHasUnreadNotifications(lowStockProducts.length > 0);
  }, [lowStockProducts.length]);

  // Dark mode toggle
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Real-time search functionality
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        const results: SearchResult[] = products
          .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, 5)
          .map(product => ({
            id: product.id,
            type: 'product',
            title: product.name,
            subtitle: `KSh ${product.sellingPrice.toFixed(2)} • Stock: ${product.currentStock === -1 ? 'Unspecified' : product.currentStock}`,
            route: '/inventory'
          }));
        
        setSearchResults(results);
        setShowSearchDropdown(results.length > 0);
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, products]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
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
    if (searchTerm.trim() && searchResults.length > 0) {
      navigate(searchResults[0].route);
      setSearchTerm('');
      setShowSearchDropdown(false);
      setShowMobileSearch(false);
    }
  };

  const handleSearchSelect = (result: SearchResult) => {
    navigate(result.route);
    setSearchTerm('');
    setShowSearchDropdown(false);
    setShowMobileSearch(false);
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setHasUnreadNotifications(false);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
    setShowProfileMenu(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-50 shadow-sm">
        <div className={`h-full flex items-center justify-between ${isMobile ? 'px-3' : 'px-4 md:px-6'}`}>
          {/* Left section */}
          <div className="flex items-center gap-2">
            {/* Menu Button for Desktop Sidebar Toggle */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSidebarToggle}
                className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <Menu 
                  className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300"
                />
              </Button>
            )}

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                <span className="text-white font-black text-xs">D</span>
              </div>
              {!isMobile && (
                <div>
                  <h1 className="font-mono font-black text-base uppercase tracking-tight text-gray-900 dark:text-white">
                    DUKASMART
                  </h1>
                </div>
              )}
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className={`flex-1 relative ${isMobile ? 'max-w-[180px] mx-2' : 'max-w-md mx-8'}`} ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={isMobile ? "Search..." : "Search products..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                  className={`pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-300 ${isMobile ? 'h-9 text-sm' : 'h-11'}`}
                />
                {searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={() => {
                      setSearchTerm('');
                      setShowSearchDropdown(false);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* Search Dropdown */}
              {showSearchDropdown && (
                <div className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto animate-scale-in ${isMobile ? 'text-sm' : ''}`}>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b last:border-b-0 transition-colors duration-150"
                      onClick={() => handleSearchSelect(result)}
                    >
                      <div className="text-gray-500 dark:text-gray-400">
                        <Search className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {result.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {result.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Right section - Actions and User */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative ${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`}
                onClick={handleNotificationClick}
              >
                <Bell className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                {hasUnreadNotifications && lowStockProducts.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-xs text-white font-medium">{lowStockProducts.length}</span>
                  </div>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className={`absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[60] max-h-96 overflow-y-auto animate-scale-in ${isMobile ? 'w-72 -translate-x-16' : 'w-80'}`}>
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className={`font-semibold text-gray-900 dark:text-white ${isMobile ? 'text-sm' : ''}`}>
                      Low Stock Alerts
                    </h3>
                  </div>
                  <div className="p-2">
                    {lowStockProducts.length > 0 ? (
                      lowStockProducts.map((product) => (
                        <div key={product.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <div className="flex items-start gap-3">
                            <span className={isMobile ? 'text-base' : 'text-lg'}>⚠️</span>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-gray-900 dark:text-white ${isMobile ? 'text-sm' : ''} truncate`}>
                                {product.name}
                              </div>
                              <div className={`text-gray-500 dark:text-gray-400 mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                Only {product.currentStock} left in stock
                              </div>
                            </div>
                            <Badge 
                              variant={product.currentStock <= 0 ? "destructive" : "secondary"}
                              className="text-xs flex-shrink-0"
                            >
                              {product.currentStock <= 0 ? 'Out' : 'Low'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className={isMobile ? 'text-sm' : ''}>All stocked up! 🎉</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative" ref={profileRef}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group border border-gray-200 dark:border-gray-700 shadow-sm ${isMobile ? 'px-2 py-1 h-8' : 'px-3 py-2 h-10'}`}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className={`rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
                  <UserCircle2 className={`text-white ${isMobile ? 'w-3 h-3' : 'w-5 h-5'}`} />
                </div>
                {!isMobile && (
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Admin
                    </div>
                  </div>
                )}
              </Button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className={`absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[60] animate-scale-in overflow-hidden ${isMobile ? 'w-56 -translate-x-8' : 'w-64'}`}>
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}>
                        <UserCircle2 className={`text-white ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold text-gray-900 dark:text-white truncate ${isMobile ? 'text-sm' : ''}`}>
                          {user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className={`text-gray-500 dark:text-gray-400 truncate ${isMobile ? 'text-xs' : 'text-xs'}`}>
                          {user?.email || 'user@example.com'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      className={`w-full px-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors group ${isMobile ? 'py-2' : 'py-3'}`}
                      onClick={() => {
                        navigate('/reports');
                        setShowProfileMenu(false);
                      }}
                    >
                      <div className={`rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
                        <FileText className={`text-blue-600 dark:text-blue-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      </div>
                      <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>Reports</span>
                    </button>
                    <button
                      className={`w-full px-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors group ${isMobile ? 'py-2' : 'py-3'}`}
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                    >
                      <div className={`rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
                        <Settings className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      </div>
                      <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>Settings</span>
                    </button>
                    <button
                      className={`w-full px-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors group ${isMobile ? 'py-2' : 'py-3'}`}
                      onClick={toggleDarkMode}
                    >
                      <div className={`rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
                        {darkMode ? (
                          <Sun className={`text-yellow-600 dark:text-yellow-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        ) : (
                          <Moon className={`text-yellow-600 dark:text-yellow-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        )}
                      </div>
                      <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                      <button
                        className={`w-full px-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 transition-colors group ${isMobile ? 'py-2' : 'py-3'}`}
                        onClick={handleSignOut}
                      >
                        <div className={`rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
                          <LogOut className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        </div>
                        <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default EnhancedTopbar;
