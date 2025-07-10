
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
        <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            {isMobile ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSidebarToggle}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Button>
            ) : (
              /* Desktop Sidebar Toggle */
              <Button
                variant="ghost"
                size="sm"
                onClick={onSidebarToggle}
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <Menu 
                  className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300"
                />
              </Button>
            )}

            {/* Logo - Mobile */}
            <div className="md:hidden flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">D</span>
              </div>
              <div>
                <h1 className="font-mono font-black text-lg uppercase tracking-tight text-gray-900 dark:text-white">
                  DUKASMART
                </h1>
              </div>
            </div>
          </div>

          {/* Center - Search Bar (Desktop) */}
          {!isMobile && (
            <div className="flex-1 max-w-md relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                    className="pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-300"
                  />
                  {searchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={() => {
                        setSearchTerm('');
                        setShowSearchDropdown(false);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Search Dropdown */}
                {showSearchDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto animate-scale-in">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b last:border-b-0 transition-colors duration-150"
                        onClick={() => handleSearchSelect(result)}
                      >
                        <div className="text-gray-500 dark:text-gray-400">
                          <Search className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {result.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.subtitle}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Right section - Actions and User */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            {isMobile && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Search className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            )}

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                onClick={handleNotificationClick}
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {hasUnreadNotifications && lowStockProducts.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-xs text-white font-medium">{lowStockProducts.length}</span>
                  </div>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto animate-scale-in">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Low Stock Alerts
                    </h3>
                  </div>
                  <div className="p-2">
                    {lowStockProducts.length > 0 ? (
                      lowStockProducts.map((product) => (
                        <div key={product.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-lg">⚠️</span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Only {product.currentStock} left in stock
                              </div>
                            </div>
                            <Badge 
                              variant={product.currentStock <= 0 ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {product.currentStock <= 0 ? 'Out of Stock' : 'Low Stock'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>All stocked up! 🎉</p>
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
                className="flex items-center gap-3 px-3 py-2 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group border border-gray-200 dark:border-gray-700 shadow-sm"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <UserCircle2 className="w-5 h-5 text-white" />
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
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-scale-in overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                        <UserCircle2 className="w-6 h-6 text-white" />
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
                      className="w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors group"
                      onClick={() => {
                        navigate('/reports');
                        setShowProfileMenu(false);
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium">Reports</span>
                    </button>
                    <button
                      className="w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors group"
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                        <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="font-medium">Settings</span>
                    </button>
                    <button
                      className="w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors group"
                      onClick={toggleDarkMode}
                    >
                      <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors">
                        {darkMode ? (
                          <Sun className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        ) : (
                          <Moon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        )}
                      </div>
                      <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                      <button
                        className="w-full px-3 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 transition-colors group"
                        onClick={handleSignOut}
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {isMobile && showMobileSearch && (
        <div className="fixed inset-x-0 top-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 z-40 shadow-lg">
          <div className="relative" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                  className="pl-10 pr-10 h-12 rounded-xl border-2 border-gray-300 dark:border-gray-600"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowMobileSearch(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Mobile Search Results */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b last:border-b-0 transition-colors"
                    onClick={() => handleSearchSelect(result)}
                  >
                    <div className="text-gray-500 dark:text-gray-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {result.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {result.subtitle}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedTopbar;
