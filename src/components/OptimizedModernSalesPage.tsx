
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useUnifiedOfflineManager } from '../hooks/useUnifiedOfflineManager';
import { formatCurrency } from '../utils/currency';
import { Product, Customer } from '../types';
import { CartItem } from '../types/cart';
import { ShoppingCart, Package, UserPlus, Search, X, Minus, Plus, Wifi, WifiOff, Clock, Grid3X3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import AddCustomerModal from './sales/AddCustomerModal';
import AddDebtModal from './sales/AddDebtModal';
import SalesCheckout from './sales/SalesCheckout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type PaymentMethod = 'cash' | 'mpesa' | 'debt';

const OptimizedModernSalesPage = () => {
  console.log('🚀 OptimizedModernSalesPage component loaded - REDESIGNED v3.0');
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [activePanel, setActivePanel] = useState<'products' | 'cart'>('products');
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

    // Switch to cart view on mobile after adding
    if (isMobile) {
      setActivePanel('cart');
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
    if (stock < 0) return 'text-slate-400';
    if (stock === 0) return 'text-red-400';
    if (stock <= lowStockThreshold) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-purple-400" />
                <h1 className="text-xl font-bold">SALES POINT</h1>
              </div>
              
              {/* Online Status */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isOnline 
                  ? 'bg-green-900/30 text-green-300 border border-green-600' 
                  : 'bg-red-900/30 text-red-300 border border-red-600'
              }`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Total Display */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>TOTAL: {formatCurrency(total)}</span>
              </div>
              
              {/* Mobile Panel Toggle */}
              {isMobile && (
                <div className="flex bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setActivePanel('products')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      activePanel === 'products'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Products
                  </button>
                  <button
                    onClick={() => setActivePanel('cart')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      activePanel === 'cart'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Cart ({cart.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex h-[calc(100vh-80px)]">
        {/* Products Panel */}
        <div className={`${
          isMobile 
            ? activePanel === 'products' ? 'flex' : 'hidden'
            : 'flex'
        } flex-col ${isMobile ? 'w-full' : 'flex-1'} ${!isMobile ? 'border-r border-slate-700' : ''}`}>
          
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="SEARCH PRODUCTS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-purple-600 rounded-lg focus:outline-none focus:border-purple-400 text-white placeholder-slate-400 uppercase tracking-wider"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Add Debt Card */}
              <div
                onClick={() => setShowAddDebt(true)}
                className="bg-red-900/20 border-2 border-red-600 rounded-lg p-4 cursor-pointer hover:bg-red-900/30 transition-colors relative group"
              >
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-red-300 uppercase">ADD DEBT</h3>
                  <p className="text-red-300 uppercase text-sm">CREDIT SALE</p>
                  <div className="mt-3">
                    <p className="text-red-300 font-medium">Cash Lending</p>
                    <p className="text-red-400 text-sm uppercase">RECORD DEBT</p>
                  </div>
                </div>
              </div>

              {/* Product Cards */}
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-slate-800 border-2 border-purple-600 rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition-colors relative group"
                >
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Plus className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-bold text-white uppercase line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-purple-300 uppercase text-sm">
                      {product.category}
                    </p>
                    
                    <div className="mt-3 space-y-1">
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(product.sellingPrice)}
                      </p>
                      <p className={`text-sm uppercase ${getStockColorClass(product.currentStock)}`}>
                        STOCK: {getStockDisplayText(product.currentStock)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Panel */}
        <div className={`${
          isMobile 
            ? activePanel === 'cart' ? 'flex' : 'hidden'
            : 'flex'
        } flex-col ${isMobile ? 'w-full' : 'w-80'} bg-slate-800/50`}>
          
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-bold uppercase">CART ({cart.length})</h2>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-300 mb-2 uppercase">CART EMPTY</h3>
                  <p className="text-slate-400">Add products to get started</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm uppercase">
                          {item.name}
                        </h4>
                        <p className="text-purple-300 text-xs uppercase">
                          {item.category}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {formatCurrency(item.sellingPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Section */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-slate-700 space-y-4">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 uppercase">
                  Customer (Optional)
                </label>
                <select
                  value={selectedCustomerId || ''}
                  onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="">Select customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 uppercase">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'mpesa', 'debt'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`px-3 py-2 rounded text-sm font-medium uppercase transition-colors ${
                        paymentMethod === method
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold uppercase">Total:</span>
                  <span className="text-xl font-bold text-purple-300">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
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
      </main>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <button
          onClick={() => setActivePanel(activePanel === 'products' ? 'cart' : 'products')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg z-50"
        >
          {activePanel === 'products' ? (
            <ShoppingCart className="h-6 w-6 text-white" />
          ) : (
            <Grid3X3 className="h-6 w-6 text-white" />
          )}
        </button>
      )}

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
