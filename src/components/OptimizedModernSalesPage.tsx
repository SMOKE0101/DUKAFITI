
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '../utils/currency';
import { CartItem } from '../types/cart';
import { Customer } from '../types';
import { useUnifiedProducts } from '../hooks/useUnifiedProducts';
import { useUnifiedCustomers } from '../hooks/useUnifiedCustomers';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
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
  DollarSign,
  User,
  Banknote
} from 'lucide-react';

const OptimizedModernSalesPage = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'debt'>('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState(false);

  const { products, loading: productsLoading } = useUnifiedProducts();
  const { customers, loading: customersLoading, refetch: refetchCustomers } = useUnifiedCustomers();
  const { isOnline, pendingOperations, syncPendingOperations } = useUnifiedSyncManager();
  const { toast } = useToast();

  const total = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const addToCart = useCallback((product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.currentStock) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${product.currentStock} units available`,
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
      
      if (product.currentStock <= 0) {
        toast({
          title: "Out of Stock",
          description: `${product.name} is currently out of stock`,
          variant: "destructive",
        });
        return prevCart;
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });
  }, [toast]);

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      return;
    }

    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          const maxQuantity = products.find(p => p.id === productId)?.currentStock || 0;
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
  }, [products, toast]);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomerId(null);
    setPaymentMethod('cash');
  }, []);

  const handleCustomerAdded = useCallback((newCustomer: Customer) => {
    console.log('[OptimizedModernSalesPage] Customer added:', newCustomer);
    
    refetchCustomers();
    
    setTimeout(() => {
      setSelectedCustomerId(newCustomer.id);
      toast({
        title: "Customer Added & Selected",
        description: `${newCustomer.name} has been added and selected for this sale.`,
      });
    }, 500);
  }, [toast, refetchCustomers]);

  const handleAddDebt = useCallback(() => {
    setIsAddDebtModalOpen(true);
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: "Please connect to the internet to sync data.",
        variant: "destructive",
      });
      return;
    }

    try {
      await syncPendingOperations();
      toast({
        title: "Sync Complete",
        description: "All offline data has been synchronized.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync some data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCheckoutComplete = useCallback(() => {
    refetchCustomers();
    clearCart();
  }, [clearCart, refetchCustomers]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Network Status */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sales Point</h1>
                <p className="text-sm text-gray-500">Process sales and manage customers</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Network Status & Sync */}
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Wifi className="w-5 h-5" />
                    <span className="text-sm font-medium">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-600">
                    <WifiOff className="w-5 h-5" />
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
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-full">
                <ShoppingCart className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">
                  {cart.length} items • {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search products by name or category…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                    />
                  </div>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48 bg-gray-100 border-0 rounded-xl py-4 focus:ring-2 focus:ring-purple-300">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Record Debt Card - First Card */}
              <Card 
                className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                onClick={handleAddDebt}
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto group-hover:bg-emerald-700 transition-colors">
                      <DollarSign className="w-8 h-8" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Record Debt</h3>
                  <p className="text-sm text-gray-500 mb-4">Add customer debt transaction</p>
                  
                  <div className="flex justify-center">
                    <div className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-2 transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Cards */}
              {productsLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="bg-white rounded-3xl border border-gray-200 shadow-sm animate-pulse">
                    <CardContent className="p-6">
                      <div className="w-full h-24 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <Search className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        <span className="text-sm text-gray-500 uppercase tracking-wide">
                          {product.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          product.currentStock <= 5 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          Stock: {product.currentStock}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-purple-600">
                          {formatCurrency(product.sellingPrice)}
                        </span>
                        <Button 
                          onClick={() => addToCart(product)}
                          disabled={product.currentStock <= 0}
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 transition-colors"
                          size="sm"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Cart Summary - Moved Above */}
            <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-gray-900">Cart ({cart.length})</h2>
                </div>

                {/* Cart Items */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Your cart is empty</p>
                      <p className="text-xs">Add products to get started</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {item.name}
                          </h4>
                          <p className="text-xs text-gray-500">
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
                          
                          <span className="w-8 text-center text-sm font-medium text-gray-900">
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
                          <p className="font-semibold text-gray-900 text-sm">
                            {formatCurrency(item.sellingPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-black text-purple-600">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </>
                )}

                {/* Customer Selection - Moved Below Cart */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Customer (Optional)
                    </label>
                    <div className="flex gap-2">
                      <Select 
                        value={selectedCustomerId || 'none'} 
                        onValueChange={(value) => {
                          setSelectedCustomerId(value === 'none' ? null : value);
                        }}
                      >
                        <SelectTrigger className="flex-1 bg-gray-100 border-0 rounded-xl py-4 focus:ring-2 focus:ring-purple-300">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <SelectValue placeholder="Select customer..." />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No customer</SelectItem>
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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Selected Customer Info */}
                  {selectedCustomer && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-800">{selectedCustomer.name}</p>
                          <p className="text-sm text-blue-600">{selectedCustomer.phone}</p>
                        </div>
                        {selectedCustomer.outstandingDebt > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Debt: {formatCurrency(selectedCustomer.outstandingDebt)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Method - Below Customer */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'cash', label: 'Cash', icon: Banknote },
                        { value: 'mpesa', label: 'M-Pesa', icon: CreditCard },
                        { value: 'debt', label: 'Debt', icon: DollarSign }
                      ].map(method => (
                        <button
                          key={method.value}
                          onClick={() => setPaymentMethod(method.value as any)}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${
                            paymentMethod === method.value
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <method.icon className="w-5 h-5 mx-auto mb-1" />
                          <div className="text-xs font-medium">{method.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {cart.length > 0 && (
                  <div className="space-y-3">
                    <SalesCheckout
                      cart={cart}
                      selectedCustomerId={selectedCustomerId}
                      paymentMethod={paymentMethod}
                      customers={customers}
                      onCheckoutComplete={handleCheckoutComplete}
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
                )}
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
        isOpen={isAddDebtModalOpen}
        onClose={() => setIsAddDebtModalOpen(false)}
      />
    </div>
  );
};

export default OptimizedModernSalesPage;
