import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  FileText, 
  LogOut,
  Package,
  Users,
  ShoppingCart,
  X,
  Menu,
  PanelLeft
} from 'lucide-react';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../hooks/useAuth';

interface SearchResult {
  id: string;
  type: 'product' | 'customer' | 'sale';
  title: string;
  subtitle: string;
  route: string;
}

interface EnhancedTopbarProps {
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
}

const EnhancedTopbar: React.FC<EnhancedTopbarProps> = ({ onSidebarToggle, sidebarCollapsed = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { products } = useSupabaseProducts();
  const { customers } = useSupabaseCustomers();
  const { sales } = useSupabaseSales();

  // Get low stock alerts
  const lowStockAlerts = products.filter(p => p.currentStock <= (p.lowStockThreshold || 10));
  const unreadNotifications = notificationsRead ? 0 : lowStockAlerts.length;

  // Get overdue customers
  const overdueCustomers = customers.filter(c => c.outstandingDebt > 0);

  // Global search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, products, customers, sales]);

  const performSearch = () => {
    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    // Search products
    products
      .filter(p => p.name.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach(product => {
        results.push({
          id: product.id,
          type: 'product',
          title: product.name,
          subtitle: `${formatCurrency(product.sellingPrice)} • Stock: ${product.currentStock}`,
          route: '/inventory'
        });
      });

    // Search customers
    customers
      .filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term))
      .slice(0, 3)
      .forEach(customer => {
        results.push({
          id: customer.id,
          type: 'customer',
          title: customer.name,
          subtitle: `${customer.phone} • Debt: ${formatCurrency(customer.outstandingDebt)}`,
          route: '/customers'
        });
      });

    setSearchResults(results);
    setShowSearchDropdown(results.length > 0);
  };

  const handleSearchSelect = (result: SearchResult) => {
    navigate(result.route);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setShowLogoutConfirm(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // Mark notifications as read when opened
      setNotificationsRead(true);
    }
  };

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package className="w-4 h-4" />;
      case 'customer': return <Users className="w-4 h-4" />;
      case 'sale': return <ShoppingCart className="w-4 h-4" />;
      default: return null;
    }
  };

  const shopName = user?.user_metadata?.shop_name || 'DukaSmart';

  return (
    <>
      <header className="sticky top-0 z-50 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20 shadow-sm">
        <div className="flex items-center justify-between px-4 lg:px-6 h-full max-w-7xl mx-auto">
          {/* Left - Sidebar Toggle & Logo */}
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle Button - Desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="hidden md:flex text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-10 h-10 rounded-full p-0 transition-all duration-200"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft 
                className={`w-5 h-5 transition-transform duration-300 ease-out ${
                  sidebarCollapsed ? 'rotate-180' : 'rotate-0'
                }`} 
              />
            </Button>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div className="font-bold text-xl text-gray-900 dark:text-white hidden sm:block">{shopName}</div>
            </div>
          </div>

          {/* Center - Global Search */}
          <div className="flex-1 max-w-lg mx-8 relative hidden md:block" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products, customers, orders…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                className="pl-10 pr-10 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 focus:bg-white dark:focus:bg-gray-800 transition-colors rounded-xl"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
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
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 z-50 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 first:rounded-t-xl last:rounded-b-xl transition-colors"
                    onClick={() => handleSearchSelect(result)}
                  >
                    <div className="text-gray-500 dark:text-gray-400">
                      {getTypeIcon(result.type)}
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

          {/* Right - Actions - Fixed positioning */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Mobile Search */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {/* Handle mobile search */}}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <Button
                variant="ghost"
                size="sm"
                className="relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-10 h-10 rounded-full p-0"
                onClick={handleNotificationClick}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white flex items-center justify-center">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 z-50 max-h-80 overflow-y-auto">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {lowStockAlerts.length > 0 && (
                      <div className="mb-4">
                        <div className="px-3 py-1 text-sm font-medium text-orange-600 dark:text-orange-400">
                          Low Stock Alerts
                        </div>
                        {lowStockAlerts.slice(0, 5).map((product) => (
                          <div key={product.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg mx-1 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Only {product.currentStock} left
                                </div>
                              </div>
                              <Badge 
                                variant={product.currentStock <= 0 ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {product.currentStock <= 0 ? 'Out' : 'Low'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {overdueCustomers.length > 0 && (
                      <div>
                        <div className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400">
                          Overdue Payments
                        </div>
                        {overdueCustomers.slice(0, 3).map((customer) => (
                          <div key={customer.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg mx-1 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {customer.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Owes {formatCurrency(customer.outstandingDebt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {lowStockAlerts.length === 0 && overdueCustomers.length === 0 && (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">All caught up! 🎉</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={profileRef}>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-10 h-10 rounded-full p-0"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {shopName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </Button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 z-50">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700/50">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{shopName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                  </div>
                  <div className="p-2">
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors"
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors"
                      onClick={() => {
                        navigate('/reports');
                        setShowProfileMenu(false);
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      Reports
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 transition-colors"
                      onClick={() => {
                        setShowLogoutConfirm(true);
                        setShowProfileMenu(false);
                      }}
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Confirm Logout
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to exit {shopName}?
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Logout
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedTopbar;
