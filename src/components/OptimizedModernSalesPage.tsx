import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useUnifiedOfflineManager } from '../hooks/useUnifiedOfflineManager';
import { formatCurrency } from '../utils/currency';
import { Product, Customer } from '../types';
import { CartItem } from '../types/cart';
import { ShoppingCart, Package, UserPlus, Search, X, Minus, Plus, Wifi, WifiOff, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import AddCustomerModal from './sales/AddCustomerModal';
import AddDebtModal from './sales/AddDebtModal';
import SalesCheckout from './sales/SalesCheckout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type PaymentMethod = 'cash' | 'mpesa' | 'debt';

const OptimizedModernSalesPage = () => {
  console.log('🚀 OptimizedModernSalesPage component loaded - TWO PANEL MOBILE POS');
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [activePanel, setActivePanel] = useState<'search' | 'cart'>('search');
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { user } = useAuth();
  const { toast } = useToast();

  const { sales, loading: salesLoading, refreshSales } = useSupabaseSales();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { isOnline, pendingOperations } = useUnifiedOfflineManager();

  const isLoading = salesLoading || productsLoading || customersLoading;

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('[OptimizedModernSalesPage] Setting up real-time subscriptions');

    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[OptimizedModernSalesPage] Products updated:', payload);
      })
      .subscribe();

    const customersChannel = supabase
      .channel('customers-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'customers',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[OptimizedModernSalesPage] Customers updated:', payload);
      })
      .subscribe();

    return () => {
      console.log('[OptimizedModernSalesPage] Cleaning up subscriptions');
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(customersChannel);
    };
  }, [user]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    console.log('[OptimizedModernSalesPage] Adding to cart:', product.name);
    
    if (product.currentStock === 0) {
      const shouldAdd = window.confirm('This product is out of stock. Do you want to add it anyway?');
      if (!shouldAdd) return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setCart(updatedCart);
    } else {
      const cartItem: CartItem = { ...product, quantity: 1 };
      setCart([...cart, cartItem]);
    }
  };

  const removeFromCart = (productId: string) => {
    console.log('[OptimizedModernSalesPage] Removing from cart:', productId);
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    console.log('[OptimizedModernSalesPage] Updating quantity:', productId, newQuantity);
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
  };

  const clearCart = () => {
    console.log('[OptimizedModernSalesPage] Clearing cart');
    setCart([]);
  };

  const handleCheckoutComplete = async () => {
    console.log('[OptimizedModernSalesPage] Checkout completed, clearing cart');
    clearCart();
    setSelectedCustomerId(null);
    setPaymentMethod('cash');
    
    // Refresh sales data
    try {
      await refreshSales();
    } catch (error) {
      console.error('[OptimizedModernSalesPage] Failed to refresh sales after checkout:', error);
    }
  };

  const getStockDisplayText = (stock: number) => {
    if (stock < 0) return 'Unspecified';
    if (stock === 0) return 'Out of Stock';
    return stock.toString();
  };

  const getStockColorClass = (stock: number, lowStockThreshold: number = 10) => {
    if (stock < 0) return 'text-gray-500 dark:text-gray-400';
    if (stock === 0) return 'text-orange-500 dark:text-orange-400';
    if (stock <= lowStockThreshold) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-purple-500 dark:text-purple-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 sticky top-0 z-40 shadow-lg">
        <div className="mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                🛒 SALES
              </h1>
              
              {/* Connection Status */}
              <div className="flex items-center gap-1 sm:gap-2">
                {isOnline ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                    <Wifi className="h-3 w-3" />
                    {!isMobile && "Online"}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-bold">
                    <WifiOff className="h-3 w-3" />
                    {!isMobile && "Offline"}
                  </div>
                )}
                
                {pendingOperations > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                    <Clock className="h-3 w-3" />
                    {!isMobile ? `${pendingOperations} pending` : pendingOperations}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Two Panel Layout for Mobile */}
        {isMobile ? (
          <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden">
            {/* Panel A: Search & Quick-Select */}
            <div className={`absolute inset-0 w-full h-full transform transition-transform duration-200 ease-out ${
              activePanel === 'search' ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <div className="flex flex-col h-full">
                {/* Search Section */}
                <div className="p-3 sm:p-4 bg-white/50 dark:bg-slate-800/50 border-b border-gray-200/60 dark:border-slate-700/60">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-700 border-2 border-purple-200 dark:border-purple-600/30 rounded-xl focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                      style={{ fontSize: '16px' }}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 touch-target flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Select Section */}
                <div className="p-3 sm:p-4 bg-white/30 dark:bg-slate-800/30 border-b border-gray-200/40 dark:border-slate-700/40">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">⚡ Quick Picks</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {products.slice(0, 6).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl p-3 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-lg transition-all group min-h-[80px] active:scale-95"
                      >
                        <div className="font-bold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                          {product.name}
                        </div>
                        <div className="text-purple-600 dark:text-purple-400 font-bold text-base sm:text-lg">
                          {formatCurrency(product.sellingPrice)}
                        </div>
                        <div className={`text-xs mt-1 ${getStockColorClass(product.currentStock)}`}>
                          {getStockDisplayText(product.currentStock)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-20">
                    {filteredProducts.length === 0 ? (
                      <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-bold">No products found</p>
                        <p className="text-sm">Try adjusting your search</p>
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className="bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl p-4 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-lg transition-all group text-left active:scale-95"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                                {product.name}
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">
                                {product.category}
                              </p>
                            </div>
                            <div className="ml-2">
                              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <div className="text-purple-600 dark:text-purple-400 font-bold text-lg">
                                {formatCurrency(product.sellingPrice)}
                              </div>
                              <div className={`text-xs ${getStockColorClass(product.currentStock)}`}>
                                Stock: {getStockDisplayText(product.currentStock)}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel B: Cart & Checkout */}
            <div className={`absolute inset-0 w-full h-full transform transition-transform duration-200 ease-out ${
              activePanel === 'cart' ? 'translate-x-0' : 'translate-x-full'
            }`}>
              <div className="flex flex-col h-full bg-white/60 dark:bg-slate-800/60">
                {/* Cart Header */}
                <div className="p-3 sm:p-4 border-b border-gray-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                      Cart ({cart.length})
                    </h2>
                    {cart.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="text-red-500 hover:text-red-700 text-sm font-bold px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors touch-target"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                    Total: {formatCurrency(total)}
                  </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-bold">Your cart is empty</p>
                      <p className="text-sm">Add products to get started</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-slate-700 rounded-xl p-3 sm:p-4 border-2 border-gray-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 pr-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">
                              {item.name}
                            </h3>
                            <p className="text-purple-600 dark:text-purple-400 font-bold text-base sm:text-lg">
                              {formatCurrency(item.sellingPrice)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors touch-target flex items-center justify-center"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-10 h-10 sm:w-8 sm:h-8 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-lg flex items-center justify-center transition-colors active:scale-95"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            </button>
                            <span className="font-bold text-lg text-gray-900 dark:text-white min-w-[2.5rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-10 h-10 sm:w-8 sm:h-8 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-lg flex items-center justify-center transition-colors active:scale-95"
                            >
                              <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Subtotal</div>
                            <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                              {formatCurrency(item.sellingPrice * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Checkout Section */}
                {cart.length > 0 && (
                  <div className="p-3 sm:p-4 border-t border-gray-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 space-y-4 pb-safe">
                    
                    {/* Customer Selection */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Customer (Optional)
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={selectedCustomerId || ''}
                          onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                          className="flex-1 px-3 py-3 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 text-gray-900 dark:text-white"
                          style={{ fontSize: '16px' }}
                        >
                          <option value="">Select customer...</option>
                          {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowAddCustomer(true)}
                          className="px-3 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors flex items-center justify-center min-w-[44px] active:scale-95"
                          title="Add new customer"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['cash', 'mpesa', 'debt'] as PaymentMethod[]).map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`px-3 py-3 rounded-xl text-sm font-bold transition-all touch-target active:scale-95 ${
                              paymentMethod === method
                                ? 'bg-purple-600 text-white shadow-lg scale-105'
                                : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500'
                            }`}
                          >
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Debt-specific validation */}
                    {paymentMethod === 'debt' && !selectedCustomerId && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3">
                        <p className="text-yellow-700 dark:text-yellow-300 text-sm font-bold">
                          ⚠️ Please select a customer for debt transactions
                        </p>
                      </div>
                    )}

                    {/* Quick Action Buttons */}
                    <div className="flex gap-2 flex-col">
                      <button
                        onClick={() => setShowAddCustomer(true)}
                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 touch-target active:scale-95"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Customer
                      </button>
                      <button
                        onClick={() => setShowAddDebt(true)}
                        className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 touch-target active:scale-95"
                      >
                        <Package className="h-4 w-4" />
                        Record Debt
                      </button>
                    </div>

                    {/* Enhanced Checkout Button */}
                    <SalesCheckout
                      cart={cart}
                      selectedCustomerId={selectedCustomerId}
                      paymentMethod={paymentMethod}
                      customers={customers}
                      onCheckoutComplete={handleCheckoutComplete}
                      isOnline={isOnline}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Floating Toggle Button */}
            <button
              onClick={() => setActivePanel(activePanel === 'search' ? 'cart' : 'search')}
              className={`fixed top-1/2 transform -translate-y-1/2 z-50 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ease-out active:scale-95 ${
                activePanel === 'search' ? 'right-4' : 'left-4'
              }`}
              aria-label={activePanel === 'search' ? 'Go to Cart' : 'Go to Search'}
            >
              {activePanel === 'search' ? (
                <ShoppingCart className="h-6 w-6" />
              ) : (
                <Search className="h-6 w-6" />
              )}
            </button>
          </div>
        ) : (
          // Desktop Layout (unchanged)
          <div className="flex">
            {/* Left Panel - Product Search & Quick Picks */}
            <div className="flex flex-col w-2/3 border-r border-gray-200/60 dark:border-slate-700/60">
              
              {/* Search Section */}
              <div className="p-3 sm:p-4 bg-white/50 dark:bg-slate-800/50 border-b border-gray-200/60 dark:border-slate-700/60">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-700 border-2 border-purple-200 dark:border-purple-600/30 rounded-xl focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                    style={{ fontSize: '16px' }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 touch-target flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Select Section */}
              <div className="p-3 sm:p-4 bg-white/30 dark:bg-slate-800/30 border-b border-gray-200/40 dark:border-slate-700/40">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">⚡ Quick Picks</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {products.slice(0, 6).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl p-3 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-lg transition-all group min-h-[80px] active:scale-95"
                    >
                      <div className="font-bold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                        {product.name}
                      </div>
                      <div className="text-purple-600 dark:text-purple-400 font-bold text-base sm:text-lg">
                        {formatCurrency(product.sellingPrice)}
                      </div>
                      <div className={`text-xs mt-1 ${getStockColorClass(product.currentStock)}`}>
                        {getStockDisplayText(product.currentStock)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-20">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-bold">No products found</p>
                      <p className="text-sm">Try adjusting your search</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl p-4 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-lg transition-all group text-left active:scale-95"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              {product.category}
                            </p>
                          </div>
                          <div className="ml-2">
                            <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-purple-600 dark:text-purple-400 font-bold text-lg">
                              {formatCurrency(product.sellingPrice)}
                            </div>
                            <div className={`text-xs ${getStockColorClass(product.currentStock)}`}>
                              Stock: {getStockDisplayText(product.currentStock)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Cart & Checkout */}
            <div className="flex flex-col w-1/3 bg-white/60 dark:bg-slate-800/60">
              
              {/* Cart Header */}
              <div className="p-3 sm:p-4 border-b border-gray-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                    Cart ({cart.length})
                  </h2>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-700 text-sm font-bold px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors touch-target"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                  Total: {formatCurrency(total)}
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-bold">Your cart is empty</p>
                    <p className="text-sm">Add products to get started</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-700 rounded-xl p-3 sm:p-4 border-2 border-gray-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-purple-600 dark:text-purple-400 font-bold text-base sm:text-lg">
                            {formatCurrency(item.sellingPrice)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors touch-target flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-10 h-10 sm:w-8 sm:h-8 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-lg flex items-center justify-center transition-colors active:scale-95"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </button>
                          <span className="font-bold text-lg text-gray-900 dark:text-white min-w-[2.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-10 h-10 sm:w-8 sm:h-8 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-lg flex items-center justify-center transition-colors active:scale-95"
                          >
                            <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Subtotal</div>
                          <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                            {formatCurrency(item.sellingPrice * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Section */}
              {cart.length > 0 && (
                <div className="p-3 sm:p-4 border-t border-gray-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 space-y-4 pb-safe">
                  
                  {/* Customer Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Customer (Optional)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedCustomerId || ''}
                        onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                        className="flex-1 px-3 py-3 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 text-gray-900 dark:text-white"
                        style={{ fontSize: '16px' }}
                      >
                        <option value="">Select customer...</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} - {customer.phone}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowAddCustomer(true)}
                        className="px-3 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors flex items-center justify-center min-w-[44px] active:scale-95"
                        title="Add new customer"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['cash', 'mpesa', 'debt'] as PaymentMethod[]).map((method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`px-3 py-3 rounded-xl text-sm font-bold transition-all touch-target active:scale-95 ${
                            paymentMethod === method
                              ? 'bg-purple-600 text-white shadow-lg scale-105'
                              : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500'
                          }`}
                        >
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Debt-specific validation */}
                  {paymentMethod === 'debt' && !selectedCustomerId && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3">
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm font-bold">
                        ⚠️ Please select a customer for debt transactions
                      </p>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="flex gap-2 flex-col">
                    <button
                      onClick={() => setShowAddCustomer(true)}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 touch-target active:scale-95"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Customer
                    </button>
                    <button
                      onClick={() => setShowAddDebt(true)}
                      className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 touch-target active:scale-95"
                    >
                      <Package className="h-4 w-4" />
                      Record Debt
                    </button>
                  </div>

                  {/* Enhanced Checkout Button */}
                  <SalesCheckout
                    cart={cart}
                    selectedCustomerId={selectedCustomerId}
                    paymentMethod={paymentMethod}
                    customers={customers}
                    onCheckoutComplete={handleCheckoutComplete}
                    isOnline={isOnline}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddCustomer && (
        <AddCustomerModal
          open={showAddCustomer}
          onOpenChange={setShowAddCustomer}
          onCustomerAdded={(customer) => {
            setSelectedCustomerId(customer.id);
            setShowAddCustomer(false);
          }}
        />
      )}

      {showAddDebt && (
        <AddDebtModal
          isOpen={showAddDebt}
          onClose={() => setShowAddDebt(false)}
        />
      )}
    </div>
  );
};

export default OptimizedModernSalesPage;
