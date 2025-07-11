import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { formatCurrency } from '../utils/currency';
import { Product, Customer } from '../types';
import { ShoppingCart, Package, UserPlus, Search, X, Minus, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import AddCustomerModal from './AddCustomerModal';
import { Clock } from 'lucide-react';

type PaymentMethod = 'cash' | 'mpesa' | 'debt';

const ModernSalesPage = () => {
  console.log('🚀 ModernSalesPage component loaded - NEW BLOCKY AESTHETIC VERSION v2.0');
  const navigate = useNavigate();
  const [cart, setCart] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const { sales, loading: salesLoading } = useSupabaseSales();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();

  const isLoading = salesLoading || productsLoading || customersLoading;

  useEffect(() => {
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Products updated:', payload);
      })
      .subscribe();

    const customersChannel = supabase
      .channel('customers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        console.log('Customers updated:', payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(customersChannel);
    };
  }, []);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      alert('This product is out of stock.');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
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
    setCart([]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setIsProcessingCheckout(true);
    try {
      const customerId = selectedCustomerId === '' ? null : selectedCustomerId;
      const customer = customers.find(c => c.id === customerId);

      for (const item of cart) {
        const saleData = {
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          total: item.selling_price * item.quantity,
          customerId: customerId,
          customerName: customer ? customer.name : null,
          paymentMethod: paymentMethod,
          timestamp: new Date().toISOString(),
        };

        const { error: saleError } = await supabase
          .from('sales')
          .insert([saleData]);

        if (saleError) {
          console.error('Error adding sale:', saleError);
          throw new Error('Failed to record sale.');
        }

        const { error: productError } = await supabase
          .from('products')
          .update({ currentStock: item.currentStock - item.quantity })
          .eq('id', item.id);

        if (productError) {
          console.error('Error updating product stock:', productError);
          throw new Error('Failed to update product stock.');
        }
      }

      alert('Sale completed successfully!');
      clearCart();
      navigate('/dashboard');
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to complete sale. Please try again.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header - Matching Dashboard Style */}
      <div className={`
        space-y-6 max-w-7xl mx-auto
        ${isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6'}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className={`
              font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white
              ${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'}
            `}>
              SALES
            </h1>
          </div>
          <div className={`
            flex items-center gap-2 text-gray-500 dark:text-gray-400
            ${isMobile ? 'text-xs' : 'text-sm'}
          `}>
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Total: {formatCurrency(total)}</span>
            <span className="sm:hidden">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`
              w-full pl-12 pr-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl 
              bg-transparent font-mono text-gray-900 dark:text-white placeholder-gray-500 
              focus:outline-none focus:border-purple-500 transition-colors
              ${isMobile ? 'text-sm' : 'text-base'}
            `}
          />
        </div>

        {/* Product Grid and Cart Layout */}
        <div className={`
          grid gap-6
          ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}
        `}>
          {/* Product Grid */}
          <div className={`${!isMobile && 'lg:col-span-2'}`}>
            <div className={`
              grid gap-4
              ${isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-2 xl:grid-cols-3'}
            `}>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`
                    border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent cursor-pointer 
                    transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-purple-500 
                    group p-4
                    ${product.currentStock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className={`
                          font-mono font-bold uppercase tracking-wide text-gray-900 dark:text-white 
                          group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors
                          ${isMobile ? 'text-xs' : 'text-sm'}
                        `}>
                          {product.name}
                        </h3>
                        <p className={`
                          text-gray-600 dark:text-gray-400 capitalize
                          ${isMobile ? 'text-xs' : 'text-sm'}
                        `}>
                          {product.category}
                        </p>
                      </div>
                      <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`
                          font-bold text-gray-900 dark:text-white
                          ${isMobile ? 'text-sm' : 'text-base'}
                        `}>
                          {formatCurrency(product.selling_price)}
                        </p>
                        <p className={`
                          text-gray-500 dark:text-gray-400
                          ${isMobile ? 'text-xs' : 'text-sm'}
                        `}>
                          Stock: {product.currentStock}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="space-y-6">
            {/* Cart Header */}
            <div className="flex items-center justify-between">
              <h2 className={`
                font-mono font-black uppercase tracking-wider text-gray-900 dark:text-white
                ${isMobile ? 'text-sm' : 'text-base'}
              `}>
                CART ({cart.length})
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className={`
                    border-2 border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 
                    rounded-xl font-mono font-bold uppercase tracking-wide transition-colors
                    ${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'}
                  `}
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Cart Items */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white/50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`
                        font-medium text-gray-900 dark:text-white
                        ${isMobile ? 'text-sm' : 'text-base'}
                      `}>
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {formatCurrency(item.selling_price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Selection */}
            {cart.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCustomerId || ''}
                    onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                    className="flex-1 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent font-mono text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="">Walk-in Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowAddCustomer(true)}
                    className={`
                      border-2 border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 
                      rounded-xl font-mono font-bold uppercase tracking-wide transition-colors flex items-center gap-2
                      ${isMobile ? 'px-3 py-3 text-xs' : 'px-4 py-3 text-sm'}
                    `}
                  >
                    <UserPlus className="w-4 h-4" />
                    {!isMobile && 'ADD'}
                  </button>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <h3 className="font-mono font-black uppercase tracking-wider text-gray-900 dark:text-white text-sm">
                    PAYMENT METHOD
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cash', 'mpesa', 'debt'] as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`
                          p-3 rounded-xl font-mono font-bold uppercase text-xs transition-all
                          ${paymentMethod === method
                            ? 'border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : 'border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                          }
                        `}
                      >
                        {method === 'mpesa' ? 'M-PESA' : method.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total and Checkout */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black uppercase tracking-wider text-gray-900 dark:text-white">
                      TOTAL:
                    </span>
                    <span className="font-bold text-xl text-gray-900 dark:text-white">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessingCheckout}
                    className={`
                      w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-mono font-black 
                      uppercase tracking-wider rounded-xl transition-all duration-300 hover:from-purple-700 
                      hover:to-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                      ${isMobile ? 'py-4 text-sm' : 'py-4 text-base'}
                    `}
                  >
                    {isProcessingCheckout ? 'PROCESSING...' : 'COMPLETE SALE'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <AddCustomerModal
          isOpen={showAddCustomer}
          onClose={() => setShowAddCustomer(false)}
          onCustomerAdded={(customer) => {
            setSelectedCustomerId(customer.id);
            setShowAddCustomer(false);
          }}
        />
      )}
    </div>
  );
};

export default ModernSalesPage;
