
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, Plus, Package, Users, ShoppingCart, BarChart3, Settings, User, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { formatCurrency } from '../../utils/currency';

interface EnhancedTopbarProps {
  onMenuClick: () => void;
  onQuickAction: (action: string) => void;
}

const EnhancedTopbar: React.FC<EnhancedTopbarProps> = ({ onMenuClick, onQuickAction }) => {
  const { user, signOut } = useAuth();
  const { products } = useSupabaseProducts();
  const { customers } = useSupabaseCustomers();
  const { sales } = useSupabaseSales();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return { products: [], customers: [] };
    
    const query = searchQuery.toLowerCase();
    
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    ).slice(0, 5);
    
    const filteredCustomers = customers.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query)
    ).slice(0, 5);
    
    return { products: filteredProducts, customers: filteredCustomers };
  }, [searchQuery, products, customers]);

  // Notifications
  const notifications = React.useMemo(() => {
    const alerts = [];
    
    // Low stock alerts
    const lowStockProducts = products.filter(p => 
      p.current_stock > 0 && p.current_stock <= (p.low_stock_threshold || 10)
    );
    const outOfStockProducts = products.filter(p => p.current_stock === 0);
    
    if (lowStockProducts.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${lowStockProducts.length} products are running low`,
        time: 'Now'
      });
    }
    
    if (outOfStockProducts.length > 0) {
      alerts.push({
        type: 'error',
        title: 'Out of Stock Alert',
        message: `${outOfStockProducts.length} products are out of stock`,
        time: 'Now'
      });
    }
    
    // Customer debt alerts
    const highDebtCustomers = customers.filter(c => c.outstanding_debt && c.outstanding_debt > 1000);
    if (highDebtCustomers.length > 0) {
      alerts.push({
        type: 'info',
        title: 'High Debt Customers',
        message: `${highDebtCustomers.length} customers have debt over KES 1,000`,
        time: '5 min ago'
      });
    }
    
    // Recent sales
    const todaySales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp || sale.created_at || '');
      const today = new Date();
      return saleDate.toDateString() === today.toDateString();
    });
    
    if (todaySales.length > 0) {
      const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
      alerts.push({
        type: 'success',
        title: 'Today\'s Sales',
        message: `${todaySales.length} sales worth ${formatCurrency(todayRevenue)}`,
        time: '1 hour ago'
      });
    }
    
    return alerts.slice(0, 5);
  }, [products, customers, sales]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search submission
    setShowSearchResults(false);
  };

  const quickActions = [
    { id: 'new-sale', label: 'New Sale', icon: ShoppingCart, color: 'bg-green-500' },
    { id: 'add-product', label: 'Add Product', icon: Package, color: 'bg-blue-500' },
    { id: 'add-customer', label: 'Add Customer', icon: Users, color: 'bg-purple-500' },
    { id: 'view-reports', label: 'Reports', icon: BarChart3, color: 'bg-orange-500' },
  ];

  return (
    <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:block">
            DukaFiti
          </span>
        </div>

        {/* Quick Actions */}
        <div className="hidden md:flex items-center gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                onClick={() => onQuickAction(action.id)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <div className={`w-6 h-6 ${action.color} rounded-md flex items-center justify-center`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium hidden lg:block">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4 relative" ref={searchRef}>
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search products, customers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
        </form>

        {/* Search Results Dropdown */}
        {showSearchResults && (searchResults.products.length > 0 || searchResults.customers.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {searchResults.products.length > 0 && (
              <div className="p-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Products</h4>
                {searchResults.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    onClick={() => {
                      onQuickAction('view-product');
                      setShowSearchResults(false);
                    }}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(product.selling_price)}</p>
                      <p className={`text-xs ${
                        product.current_stock <= (product.low_stock_threshold || 10) 
                          ? product.current_stock === 0 
                            ? 'text-red-500' 
                            : 'text-orange-500'
                          : 'text-green-500'
                      }`}>
                        {product.current_stock} in stock
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResults.customers.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Customers</h4>
                {searchResults.customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    onClick={() => {
                      onQuickAction('view-customer');
                      setShowSearchResults(false);
                    }}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        customer.outstanding_debt && customer.outstanding_debt > 0 
                          ? 'text-red-500' 
                          : 'text-green-500'
                      }`}>
                        {customer.outstanding_debt && customer.outstanding_debt > 0 
                          ? formatCurrency(customer.outstanding_debt)
                          : 'No debt'
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
              >
                {notifications.length}
              </Badge>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white">Notifications</h4>
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No new notifications
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification, index) => (
                    <div key={index} className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          notification.type === 'error' ? 'bg-red-500' :
                          notification.type === 'warning' ? 'bg-orange-500' :
                          notification.type === 'success' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
              {user?.email?.split('@')[0] || 'User'}
            </span>
          </Button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
              <div className="p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onQuickAction('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full justify-start"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    signOut();
                    setShowUserMenu(false);
                  }}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedTopbar;
