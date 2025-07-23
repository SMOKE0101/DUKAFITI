
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { useUnifiedSales } from '../hooks/useUnifiedSales';
import { useIsMobile } from '../hooks/use-mobile';
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
  Receipt,
  DollarSign,
  User,
  Banknote,
  X
} from 'lucide-react';

const OptimizedModernSalesPage = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'debt'>('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState(false);
  
  // Mobile panel state
  const [activePanel, setActivePanel] = useState<'search' | 'cart'>('search');
  const isMobile = useIsMobile();

  // Scroll position preservation
  const productListRef = useRef<HTMLDivElement>(null);
  const savedScrollPosition = useRef<number>(0);

  const { products, loading: productsLoading } = useUnifiedProducts();
  const { customers, loading: customersLoading, refetch: refetchCustomers } = useUnifiedCustomers();
  const { sales } = useUnifiedSales();
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

  // Calculate product sales frequency for sorting
  const productSalesFrequency = useMemo(() => {
    const frequency: Record<string, number> = {};
    sales.forEach(sale => {
      frequency[sale.productId] = (frequency[sale.productId] || 0) + sale.quantity;
    });
    return frequency;
  }, [sales]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort by sales frequency (most sold first)
    return filtered.sort((a, b) => {
      const aFreq = productSalesFrequency[a.id] || 0;
      const bFreq = productSalesFrequency[b.id] || 0;
      return bFreq - aFreq;
    });
  }, [products, searchTerm, selectedCategory, productSalesFrequency]);

  const addToCart = useCallback((product: any) => {
    // Save current scroll position before state update
    if (productListRef.current) {
      savedScrollPosition.current = productListRef.current.scrollTop;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      const isUnspecifiedQuantity = product.currentStock === -1;
      
      if (existingItem) {
        // For unspecified quantity products, allow unlimited additions
        if (!isUnspecifiedQuantity && existingItem.quantity >= product.currentStock) {
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
      
      // Allow adding unspecified quantity products to cart
      if (!isUnspecifiedQuantity && product.currentStock <= 0) {
        toast({
          title: "Out of Stock",
          description: `${product.name} is currently out of stock`,
          variant: "destructive",
        });
        return prevCart;
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });

    // Remove the automatic panel switch - let user stay on search panel
    // if (isMobile) {
    //   setActivePanel('cart');
    // }
  }, [toast]);

  // Restore scroll position after cart updates
  useEffect(() => {
    if (productListRef.current && savedScrollPosition.current > 0) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (productListRef.current) {
          productListRef.current.scrollTop = savedScrollPosition.current;
        }
      });
    }
  }, [cart]);

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      return;
    }

    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          const product = products.find(p => p.id === productId);
          const isUnspecifiedQuantity = product?.currentStock === -1;
          
          // Skip stock validation for unspecified quantity products
          if (!isUnspecifiedQuantity) {
            const maxQuantity = product?.currentStock || 0;
            if (newQuantity > maxQuantity) {
              toast({
                title: "Insufficient Stock",
                description: `Only ${maxQuantity} units available`,
                variant: "destructive",
              });
              return item;
            }
          }
          
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }, [products, toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

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
    console.log('[OptimizedModernSalesPage] Checkout completed, refreshing customer data');
    refetchCustomers();
    clearCart();
  }, [clearCart, refetchCustomers]);

  // Listen for customer debt updates and refresh data immediately
  useEffect(() => {
    const handleCustomerDebtUpdate = (event: CustomEvent) => {
      console.log('[OptimizedModernSalesPage] Customer debt updated event received:', event.detail);
      refetchCustomers();
    };

    window.addEventListener('customer-debt-updated', handleCustomerDebtUpdate as EventListener);
    
    return () => {
      window.removeEventListener('customer-debt-updated', handleCustomerDebtUpdate as EventListener);
    };
  }, [refetchCustomers]);

  // Toggle between panels on mobile with improved handling
  const togglePanel = useCallback(() => {
    setActivePanel(prev => prev === 'search' ? 'cart' : 'search');
  }, []);

  // Search Panel Component
  const SearchPanel = () => (
    <div className="flex flex-col h-full">
      {/* Search and Filters */}
      <Card className="bg-card rounded-3xl border border-border shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by name or category…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-muted rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-muted border-0 rounded-xl py-4 focus:ring-2 focus:ring-ring">
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
      <div ref={productListRef} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {/* Record Debt Card - First Card */}
          <Card 
            className="bg-card rounded-3xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
            onClick={handleAddDebt}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto group-hover:bg-emerald-700 transition-colors">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Record Debt</h3>
              <p className="text-sm text-muted-foreground mb-4">Add customer debt transaction</p>
              
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
              <Card key={index} className="bg-card rounded-3xl border border-border shadow-sm animate-pulse">
                <CardContent className="p-6">
                  <div className="w-full h-24 bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-muted-foreground mb-2">
                <Search className="w-12 h-12 mx-auto mb-3" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : (
            filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="bg-card rounded-3xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-card-foreground mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <span className="text-sm text-muted-foreground uppercase tracking-wide">
                      {product.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                      product.currentStock === -1 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : product.currentStock <= 5 
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}>
                      Stock: {product.currentStock === -1 ? 'Unspecified' : product.currentStock}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(product.sellingPrice)}
                    </span>
                    <Button 
                      onClick={() => addToCart(product)}
                      disabled={product.currentStock <= 0 && product.currentStock !== -1}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      size="sm"
                      title={product.currentStock === -1 ? 'Add unspecified quantity product' : ''}
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
    </div>
  );

  // Cart Panel Component
  const CartPanel = () => (
    <div className="h-full flex flex-col relative">
      {/* Cart Header - Fixed */}
      <div className="flex-shrink-0 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-card-foreground">Cart ({cart.length})</h2>
        </div>
        {cart.length > 0 && (
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm font-medium text-muted-foreground">Total:</span>
            <span className="text-xl font-black text-primary">
              {formatCurrency(total)}
            </span>
          </div>
        )}
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto py-4" style={{ maxHeight: 'calc(50vh - 120px)' }}>
        {cart.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Your cart is empty</p>
            <p className="text-xs">Add products to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-card-foreground text-sm leading-tight line-clamp-2">
                    {item.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.sellingPrice)} each
                  </p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 p-0 rounded-lg"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  
                  <span className="w-6 text-center text-sm font-medium text-card-foreground">
                    {item.quantity}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 p-0 rounded-lg"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="text-right shrink-0 min-w-0">
                  <p className="font-semibold text-card-foreground text-sm">
                    {formatCurrency(item.sellingPrice * item.quantity)}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFromCart(item.id)}
                  className="w-7 h-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Checkout Section - Bottom Half */}
      <div className="flex-shrink-0 bg-background border-t border-border/50 pt-4">
        <div className="space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Customer (Optional)
            </label>
            <div className="flex gap-2">
              <Select 
                value={selectedCustomerId || 'none'} 
                onValueChange={(value) => {
                  setSelectedCustomerId(value === 'none' ? null : value);
                }}
              >
                <SelectTrigger className="flex-1 bg-muted border-0 rounded-xl py-3 focus:ring-2 focus:ring-ring">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 py-2"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Selected Customer Info */}
          {selectedCustomer && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground text-sm">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
                {selectedCustomer.outstandingDebt > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Debt: {formatCurrency(selectedCustomer.outstandingDebt)}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'cash', label: 'Cash', icon: Banknote },
                { value: 'mpesa', label: 'M-Pesa', icon: Receipt },
                { value: 'debt', label: 'Debt', icon: DollarSign }
              ].map(method => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value as any)}
                  className={`p-2.5 rounded-xl border-2 transition-all text-center ${
                    paymentMethod === method.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-border/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <method.icon className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-xs font-medium">{method.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Checkout Actions */}
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
                size="sm"
                className="w-full border-2 border-border hover:border-border/60 rounded-xl"
              >
                Clear Cart
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Network Status */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Sales Point</h1>
                <p className="text-sm text-muted-foreground">Process sales and manage customers</p>
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

              {/* Cart Summary - Hidden on mobile */}
              {!isMobile && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {cart.length} items • {formatCurrency(total)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Two-Panel Layout */}
      {isMobile ? (
        <div className="relative h-[calc(100vh-64px)] overflow-hidden">
          {/* Search Panel */}
          <div 
            className={`absolute inset-0 p-6 transition-transform duration-200 ease-out ${
              activePanel === 'search' ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <SearchPanel />
          </div>

          {/* Cart Panel */}
          <div 
            className={`absolute inset-0 p-6 transition-transform duration-200 ease-out ${
              activePanel === 'cart' ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <CartPanel />
          </div>

          {/* Floating Toggle Button - Fixed positioning and single click handling */}
          <button
            onClick={togglePanel}
            className={`fixed top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all duration-200 ease-out flex items-center justify-center touch-manipulation ${
              activePanel === 'search' ? 'right-4' : 'left-4'
            }`}
            aria-label={activePanel === 'search' ? 'Go to Cart' : 'Go to Search'}
          >
            {activePanel === 'search' ? (
              <ShoppingCart className="w-6 h-6" />
            ) : (
              <Search className="w-6 h-6" />
            )}
            {cart.length > 0 && activePanel === 'search' && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {cart.length}
              </div>
            )}
          </button>
        </div>
      ) : (
        /* Desktop Layout - Keep existing two-column layout */
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <SearchPanel />
            </div>
            <div>
              <Card className="bg-card rounded-3xl border border-border shadow-sm sticky top-24">
                <CardContent className="p-6">
                  <CartPanel />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

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
