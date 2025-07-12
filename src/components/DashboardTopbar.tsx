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
  X
} from 'lucide-react';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { formatCurrency } from '../utils/currency';
import { useTheme } from 'next-themes';
import CubeLogo from './branding/CubeLogo';

interface SearchResult {
  id: string;
  type: 'product' | 'customer' | 'sale';
  title: string;
  subtitle: string;
  route: string;
}

const DashboardTopbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();
  const { theme, resolvedTheme } = useTheme();
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { products } = useSupabaseProducts();
  const { customers } = useSupabaseCustomers();
  const { sales } = useSupabaseSales();

  // Enhanced low stock alerts - exclude products with unspecified stock (-1)
  const lowStockAlerts = products.filter(p => 
    p.currentStock !== -1 && 
    p.currentStock <= p.lowStockThreshold
  );
  const unreadNotifications = lowStockAlerts.length;

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
          subtitle: `${formatCurrency(product.sellingPrice)} • Stock: ${product.currentStock === -1 ? 'Unspecified' : product.currentStock}`,
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

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logging out...');
    setShowLogoutConfirm(false);
    navigate('/');
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

  // Enhanced brand text color with debugging
  const currentTheme = resolvedTheme || theme || 'light';
  console.log('DashboardTopbar: Current theme for branding:', currentTheme);
  const brandTextColor = 'text-white'; // Keep white for the purple background

  return (
    <>
      <header className="sticky top-0 z-50 h-16 border-b shadow-sm" style={{ backgroundColor: '#602d86' }}>
        <div className="flex items-center justify-between px-6 h-full">
          {/* Left - Enhanced Brand Section */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <CubeLogo 
                size="md"
                className="transition-all duration-300"
              />
            </div>
            <div className={`font-caesar font-normal ${brandTextColor} text-2xl tracking-wide transition-colors duration-300 drop-shadow-sm`}>
              DUKAFITI
            </div>
          </div>

          {/* Center - Global Search */}
          <div className="flex-1 max-w-md mx-8 relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products, customers, orders…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                className="pl-10 pr-10 bg-white/90 border-white/20 text-gray-900 placeholder:text-gray-500"
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
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b last:border-b-0"
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

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <Button
                variant="ghost"
                size="sm"
                className="relative text-white hover:bg-white/10"
                onClick={() => setShowNotifications(!showNotifications)}
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
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Low Stock Alerts
                    </h3>
                  </div>
                  {lowStockAlerts.length > 0 ? (
                    <div className="p-2">
                      {lowStockAlerts.map((product) => (
                        <div key={product.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Stock: {product.currentStock}, Threshold: {product.lowStockThreshold}
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
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      All stocked up! 🎉
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={profileRef}>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <User className="w-5 h-5" />
              </Button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-50">
                  <div className="p-2">
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      onClick={() => {
                        navigate('/reports');
                        setShowProfileMenu(false);
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      Reports
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Confirm Logout
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to exit DukaSmart?
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

export default DashboardTopbar;
