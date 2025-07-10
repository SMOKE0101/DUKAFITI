
import React, { useState, useRef, useEffect } from 'react';
import { PanelLeft, Bell, Search, X, LogOut, UserCircle2, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';

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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

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
    }
  };

  const handleSearchSelect = (result: SearchResult) => {
    navigate(result.route);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    // Mark all notifications as read when opening
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
        <div className="flex-1 max-w-md relative" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                className="pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
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

        {/* Right section - Actions and User */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative hover:scale-105"
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
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto animate-scale-in">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Low Stock Alerts
                  </h3>
                </div>
                <div className="p-2">
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map((product) => (
                      <div key={product.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">⚠️</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Only {product.currentStock} left in stock
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Threshold: {product.lowStockThreshold || 5}
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
              className="flex items-center gap-2 px-3 py-2 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 border border-gray-200 dark:border-gray-700"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                <UserCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Admin
                </div>
              </div>
            </Button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-scale-in">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors duration-150"
                    onClick={() => {
                      navigate('/reports');
                      setShowProfileMenu(false);
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Reports
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors duration-150"
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 transition-colors duration-150"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
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
