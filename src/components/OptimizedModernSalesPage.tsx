
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '../utils/currency';
import { CartItem } from '../types/cart';
import { Customer } from '../types';
import { useUnifiedProducts } from '../hooks/useUnifiedProducts';
import { useUnifiedCustomers } from '../hooks/useUnifiedCustomers';
import { useUnifiedSyncManager } from '../hooks/useUnifiedSyncManager';
import SalesCheckout from './sales/SalesCheckout';
import AddCustomerModal from './sales/AddCustomerModal';
import AddDebtModal from './sales/AddDebtModal';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  UserPlus, 
  WifiOff, 
  Wifi,
  RefreshCw,
  CreditCard,
  Receipt,
  AlertCircle
} from 'lucide-react';

const OptimizedModernSalesPage = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'debt'>('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState(false);
  const [customerToAddDebt, setCustomerToAddDebt] = useState<Customer | null>(null);
  const [componentError, setComponentError] = useState<string | null>(null);

  const { toast } = useToast();

  // Initialize hooks with error handling
  const productsHook = useUnifiedProducts();
  const customersHook = useUnifiedCustomers();
  const syncHook = useUnifiedSyncManager();

  const {
    products = [],
    loading: productsLoading = true,
    error: productsError
  } = productsHook || {};

  const {
    customers = [],
    loading: customersLoading = true,
    error: customersError
  } = customersHook || {};

  const {
    isOnline = false,
    pendingOperations = 0,
    syncPendingOperations
  } = syncHook || {};

  // Error handling effect
  useEffect(() => {
    if (productsError || customersError) {
      const error = productsError || customersError;
      setComponentError(error);
      console.error('[OptimizedModernSalesPage] Component error:', error);
    }
  }, [productsError, customersError]);

  const total = useMemo(() => {
    try {
      return cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
    } catch (error) {
      console.error('[OptimizedModernSalesPage] Error calculating total:', error);
      return 0;
    }
  }, [cart]);

  const categories = useMemo(() => {
    try {
      if (!Array.isArray(products)) return [];
      const categorySet = new Set<string>();
      products.forEach(product => {
        if (product?.category) {
          categorySet.add(product.category);
        }
      });
      return Array.from(categorySet).sort();
    } catch (error) {
      console.error('[OptimizedModernSalesPage] Error processing categories:', error);
      return [];
    }
  }, [products]);

  const filteredProducts = useMemo(() => {
    try {
      if (!Array.isArray(products)) return [];
      return products.filter(product => {
        if (!product) return false;
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
    } catch (error) {
      console.error('[OptimizedModernSalesPage] Error filtering products:', error);
      return [];
    }
  }, [products, searchTerm, selectedCategory]);

  const addToCart = useCallback((product: any) => {
    try {
      if (!product || !product.id) {
        toast({
          title: "Invalid Product",
          description: "Unable to add product to cart",
          variant: "destructive",
        });
        return;
      }

      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);
        if (existingItem) {
          if (existingItem.quantity >= (product.currentStock || 0)) {
            toast({
              title: "Insufficient Stock",
              description: `Only ${product.currentStock || 0} units available`,
              variant: "destructive",
            });
            return prevCart;
          }
          return prevCart.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        
        if ((product.currentStock || 0) <= 0) {
          toast({
            title: "Out of Stock",
            description: `${product.name} is currently out of stock`,
            variant: "destructive",
          });
          return prevCart;
        }

        return [...prevCart, { ...product, quantity: 1 }];
      });
    } catch (error) {
      console.error('[OptimizedModernSalesPage] Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
        return;
      }

      setCart(prevCart =>
        prevCart.map(item => {
          if (item.id === productId) {
            const maxQuantity = products.find(p => p?.id === productId)?.currentStock || 0;
            if (newQuantity > maxQuantity) {
              toast({
                title: "Insufficient Stock",
                description: `Only ${maxQuantity} units available`,
                variant: "destructive",
              });
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
      );
    } catch (error) {
      console.error('[OptimizedModernSalesPage] Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  }, [products, toast]);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomerId(null);
    setPaymentMethod('cash');
  }, []);

  const handleCustomerAdded = useCallback((newCustomer: Customer) => {
    try {
      console.log('[OptimizedModernSalesPage] Customer added:', newCustomer);
      setSelectedCustomerId(newCustomer.id);
      toast({
        title: "Customer Added & Selected",
        description: `${newCustomer.name} has been added and selected for this sale.`,
      });
    } catch (error) {
      console.error('[OptimizedModernSalesPage] Error handling customer added:', error);
    }
  }, [toast]);

  const handleAddDebt = useCallback((customer: Customer) => {
    try {
      setCustomerToAddDebt(customer);
      setIsAddDebtModalOpen(true);
    } catch (error) {
      console.error('[OptimizedModernSalesPage] Error opening debt modal:', error);
    }
  }, []);

  const handleDebtAdded = useCallback(() => {
    toast({
      title: "Debt Added",
      description: "Customer debt has been updated successfully.",
    });
  }, [toast]);

  const handleSync = async () => {
    try {
      if (!isOnline) {
        toast({
          title: "Offline Mode",
          description: "Please connect to the internet to sync data.",
          variant: "destructive",
        });
        return;
      }

      if (syncPendingOperations) {
        await syncPendingOperations();
        toast({
          title: "Sync Complete",
          description: "All offline data has been synchronized.",
        });
      }
    } catch (error) {
      console.error('[OptimizedModernSalesPage] Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync some data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show error state if there's a component error
  if (componentError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Page Error</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {componentError}
                </p>
              </div>
              <Button onClick={() => window.location.reload()} className="mt-2">
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (productsLoading || customersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loading Sales Page</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Loading products and customers...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sales Point</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Process sales and manage customers</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Network Status & Sync */}
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm font-medium">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Offline</span>
                  </div>
                )}
                
                {pendingOperations > 0 && (
                  <Button
                    onClick={handleSync}
                    disabled={!isOnline}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sync ({pendingOperations})
                  </Button>
                )}
              </div>

              {/* Cart Summary */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <ShoppingCart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {cart.length} items • {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <Card className="border-0 shadow-md bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48 border-gray-200 dark:border-slate-600 rounded-xl">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 dark:text-slate-500 mb-2">
                    <Search className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <div className="text-2xl">📦</div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                          {product.category}
                        </span>
                        <span className={`font-medium ${(product.currentStock || 0) <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                          Stock: {product.currentStock || 0}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {formatCurrency(product.sellingPrice)}
                        </span>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg"
                          disabled={(product.currentStock || 0) <= 0}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Checkout</h2>
                </div>

                {/* Customer Selection */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Customer (Optional)
                    </label>
                    <div className="flex gap-2">
                      <Select value={selectedCustomerId || ''} onValueChange={(value) => setSelectedCustomerId(value || null)}>
                        <SelectTrigger className="flex-1 border-gray-200 dark:border-slate-600 rounded-xl">
                          <SelectValue placeholder="Select customer..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No customer</SelectItem>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{customer.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {customer.phone}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => setIsAddCustomerModalOpen(true)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-3"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'cash', label: 'Cash', icon: '💵' },
                        { value: 'mpesa', label: 'Mpesa', icon: '📱' },
                        { value: 'debt', label: 'Debt', icon: '📝' }
                      ].map(method => (
                        <button
                          key={method.value}
                          onClick={() => setPaymentMethod(method.value as any)}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${
                            paymentMethod === method.value
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <div className="text-lg mb-1">{method.icon}</div>
                          <div className="text-xs font-medium">{method.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Your cart is empty</p>
                      <p className="text-xs">Add products to get started</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center text-sm">
                          📦
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {item.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatCurrency(item.sellingPrice)} each
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 p-0 rounded-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          
                          <span className="w-8 text-center text-sm font-medium text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 p-0 rounded-lg"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {formatCurrency(item.sellingPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Total and Actions */}
                {cart.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                        <span className="text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {formatCurrency(total)}
                        </span>
                      </div>

                      <SalesCheckout
                        cart={cart}
                        selectedCustomerId={selectedCustomerId}
                        paymentMethod={paymentMethod}
                        customers={customers}
                        onCheckoutComplete={clearCart}
                        isOnline={isOnline}
                      />

                      <Button
                        onClick={clearCart}
                        variant="outline"
                        className="w-full border-2 border-gray-300 hover:border-gray-400 rounded-xl"
                      >
                        Clear Cart
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-md bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => setIsAddCustomerModalOpen(true)}
                    className="w-full justify-start bg-green-600 hover:bg-green-700 text-white rounded-xl"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                  
                  {selectedCustomerId && (
                    <Button
                      onClick={() => {
                        const customer = customers.find(c => c.id === selectedCustomerId);
                        if (customer) handleAddDebt(customer);
                      }}
                      className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Record Debt
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddCustomerModal
        open={isAddCustomerModalOpen}
        onOpenChange={setIsAddCustomerModalOpen}
        onCustomerAdded={handleCustomerAdded}
      />

      <AddDebtModal
        open={isAddDebtModalOpen}
        onOpenChange={setIsAddDebtModalOpen}
        customer={customerToAddDebt}
        onDebtAdded={handleDebtAdded}
      />
    </div>
  );
};

export default OptimizedModernSalesPage;
