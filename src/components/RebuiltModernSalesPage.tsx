import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
import { usePersistedCart } from '../hooks/usePersistedCart';
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
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Define types for the mixed product array
type DebtCardType = {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  currentStock: number;
  isDebtCard: true;
};

type ProductWithCheck = {
  isDebtCard?: boolean;
} & any;

type FilteredProductType = DebtCardType | ProductWithCheck;

// Fixed Mobile Search Component
const FixedMobileSearch = ({ 
  searchTerm, 
  onSearchChange,
  placeholder = "Search products..."
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [localValue, setLocalValue] = useState(searchTerm);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync local value with external value
  useEffect(() => {
    setLocalValue(searchTerm);
  }, [searchTerm]);

  // Debounced search to prevent keyboard hiding
  const debouncedSearch = useCallback((value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 100);
  }, [onSearchChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSearch(newValue);
  }, [debouncedSearch]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => setIsFocused(false), 150);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onSearchChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onSearchChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="fixed bottom-16 left-0 right-0 z-40 bg-background/98 backdrop-blur-md border-t border-border shadow-lg"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 6px)',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder={placeholder}
            value={localValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="w-full h-8 pl-9 pr-9 bg-muted/90 rounded-lg text-foreground placeholder-muted-foreground border-2 border-transparent focus:outline-none focus:border-primary/50 focus:bg-background transition-all duration-200 ease-in-out text-[16px] leading-tight"
            style={{
              fontSize: '16px', // Prevents zoom on iOS
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent',
              transform: 'translateZ(0)'
            }}
          />
          {localValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 flex items-center justify-center transition-colors duration-150"
              aria-label="Clear search"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const RebuiltModernSalesPage = () => {
  // Use persistent cart hook instead of local state
  const {
    cart,
    addToCart: addToPersistedCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    total,
    refreshCartExpiry
  } = usePersistedCart();
  
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

  const { products, loading: productsLoading, refetch: refetchProducts } = useUnifiedProducts();
  const { customers, loading: customersLoading, refetch: refetchCustomers } = useUnifiedCustomers();
  const { sales } = useUnifiedSales();
  const { isOnline, pendingOperations, syncPendingOperations } = useUnifiedSyncManager();
  const { toast } = useToast();

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

  const filteredProducts = useMemo((): FilteredProductType[] => {
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort by sales frequency (popular first), then by name
    const sorted = filtered.sort((a, b) => {
      const freqA = productSalesFrequency[a.id] || 0;
      const freqB = productSalesFrequency[b.id] || 0;
      
      if (freqA !== freqB) {
        return freqB - freqA; // Higher frequency first
      }
      
      return a.name.localeCompare(b.name); // Alphabetical as secondary sort
    });

    // Add debt card as first item
    const debtCard: DebtCardType = {
      id: 'add-debt-card',
      name: 'Record Cash Lending',
      category: 'Special',
      sellingPrice: 0,
      currentStock: 1,
      isDebtCard: true
    };

    return [debtCard, ...sorted];
  }, [products, searchTerm, selectedCategory, productSalesFrequency]);

  // Preserve scroll position when switching panels
  const handlePanelSwitch = useCallback((panel: 'search' | 'cart') => {
    if (productListRef.current && activePanel === 'search') {
      savedScrollPosition.current = productListRef.current.scrollTop;
    }
    setActivePanel(panel);
    
    // Always scroll to top when switching panels
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }, [activePanel]);

  const addToCart = useCallback((productId: string, quantity: number = 1) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Allow adding products with unspecified stock (-1)
    if (product.currentStock !== -1 && product.currentStock < quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.currentStock} units available for ${product.name}`,
        variant: "destructive",
      });
      return;
    }

    addToPersistedCart({ ...product, quantity });
    
    // Refresh cart expiry on each addition
    refreshCartExpiry();
    
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.name}`,
    });
  }, [products, addToPersistedCart, refreshCartExpiry, toast]);

  const handleQuantityChange = useCallback((productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Allow quantity changes for products with unspecified stock (-1)
    if (product.currentStock !== -1 && newQuantity > product.currentStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.currentStock} units available`,
        variant: "destructive",
      });
      return;
    }

    updateQuantity(productId, newQuantity);
  }, [products, updateQuantity, removeFromCart, toast]);

  const handleCheckoutSuccess = useCallback(() => {
    clearCart();
    setSelectedCustomerId(null);
    setPaymentMethod('cash');
    
    // Refresh products to update stock
    refetchProducts();
    
    // Switch back to search panel if on mobile
    if (isMobile) {
      setActivePanel('search');
    }
  }, [clearCart, refetchProducts, isMobile]);

  const handleAddCustomerSuccess = useCallback((customerId: string) => {
    console.log('[RebuiltModernSalesPage] Customer added successfully, ID:', customerId);
    
    // Immediately set the customer ID
    setSelectedCustomerId(customerId);
    setIsAddCustomerModalOpen(false);
    
    // Refresh the customer list to ensure the new customer is available
    setTimeout(() => {
      refetchCustomers();
    }, 100);
  }, [refetchCustomers]);

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Get cart count
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Listen for customer creation events to update selected customer properly
  useEffect(() => {
    const handleCustomerCreated = (event: any) => {
      const { customer, tempId } = event.detail;
      console.log('[RebuiltModernSalesPage] Customer created event received:', { customer, tempId, currentSelectedId: selectedCustomerId });
      
      // If we were using the temporary ID, switch to the real customer ID
      if (selectedCustomerId === tempId) {
        console.log('[RebuiltModernSalesPage] Switching from temp ID to real customer ID:', customer.id);
        setSelectedCustomerId(customer.id);
      }
    };

    window.addEventListener('customer-created', handleCustomerCreated);
    return () => window.removeEventListener('customer-created', handleCustomerCreated);
  }, [selectedCustomerId]);

  if (productsLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Sales Header - Similar to Dashboard */}
        <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="font-mono text-lg font-black uppercase tracking-widest text-gray-900 dark:text-white">
              SALES
            </h1>
          </div>
          
          {/* Network Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-2 text-green-600">
                <Wifi size={14} />
                <span className="text-xs font-medium">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600">
                <WifiOff size={14} />
                <span className="text-xs font-medium">Offline</span>
              </div>
            )}
            {pendingOperations > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingOperations}
              </Badge>
            )}
            {!isOnline && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncPendingOperations}
                className="text-xs"
              >
                <RefreshCw size={12} className="mr-1" />
                Sync
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden relative">
          {activePanel === 'search' ? (
            <>
              {/* Filters */}
              <div className="flex-shrink-0 p-4 bg-background border-b border-border">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
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

              {/* Products Grid with Side Toggle */}
              <div className="relative flex-1 overflow-hidden">
                {/* Side Toggle Button to Cart */}
                <Button
                  onClick={() => handlePanelSwitch('cart')}
                  className="fixed right-4 top-1/2 transform -translate-y-1/2 z-30 h-20 w-16 rounded-2xl shadow-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
                  size="sm"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="bg-white/20 rounded-full p-1.5">
                      <ChevronRight size={18} className="text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white">Cart</span>
                    {cartItemCount > 0 && (
                      <Badge className="absolute -top-2 -left-2 min-w-[24px] h-6 rounded-full text-xs px-1.5 bg-red-500 hover:bg-red-500 text-white border-2 border-white shadow-lg animate-pulse">
                        {cartItemCount}
                      </Badge>
                    )}
                  </div>
                </Button>
                
                 <div 
                  ref={productListRef}
                  className="h-full overflow-y-auto"
                >
                   <div className="p-3 md:p-4 lg:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 md:gap-3 lg:gap-4" 
                        style={{ paddingBottom: '120px' }} // Space for search bar + bottom nav + extra padding
                   >
                    {filteredProducts.map(product => {
                      // Special handling for debt card
                      if ('isDebtCard' in product && product.isDebtCard) {
                        return (
                          <Card key={product.id} className="overflow-hidden bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                            <CardContent className="p-3">
                              <div className="flex flex-col h-full">
                                <h3 className="font-medium text-sm mb-1 text-red-700 dark:text-red-400">Record Cash Lending</h3>
                                <p className="text-xs text-red-600 dark:text-red-500 mb-2">Add customer debt</p>
                                
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold text-sm text-red-700 dark:text-red-400">
                                    Debt Recording
                                  </span>
                                  <Badge variant="destructive" className="text-xs">
                                    Active
                                  </Badge>
                                </div>
                                
                                <Button
                                  onClick={() => setIsAddDebtModalOpen(true)}
                                  size="sm"
                                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Receipt size={14} className="mr-1" />
                                  Record Debt
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }

                      const cartItem = cart.find(item => item.id === product.id);
                      const quantity = cartItem?.quantity || 0;
                      
                      return (
                        <Card key={product.id} className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-border/50 hover:border-primary/30">
                          <CardContent className="p-2 sm:p-2.5 md:p-3 lg:p-4">
                            <div className="flex flex-col h-full min-h-[140px] sm:min-h-[160px] md:min-h-[180px]">
                              <h3 className="font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base mb-1 line-clamp-2 leading-tight">{product.name}</h3>
                              <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground mb-2 truncate">{product.category}</p>
                              
                              <div className="flex justify-between items-center mb-3 gap-1">
                                <span className="font-bold text-[10px] sm:text-xs md:text-sm lg:text-base text-primary truncate">
                                  {formatCurrency(product.sellingPrice)}
                                </span>
                                <Badge 
                                  variant={product.currentStock > 0 ? 'default' : product.currentStock === -1 ? 'secondary' : 'destructive'} 
                                  className="text-[8px] sm:text-[9px] md:text-xs px-1 py-0.5 min-w-0 max-w-[50px] sm:max-w-[60px] md:max-w-[80px] truncate whitespace-nowrap"
                                  title={product.currentStock === -1 ? "Unspecified" : `Stock: ${product.currentStock}`}
                                >
                                  {product.currentStock === -1 ? 'Unspec.' : product.currentStock}
                                </Badge>
                              </div>
                              
                              <div className="mt-auto">
                                {product.currentStock > 0 || product.currentStock === -1 ? (
                                  quantity > 0 ? (
                                    <div className="flex items-center justify-between bg-muted rounded-lg p-1.5">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 hover:bg-destructive hover:text-white"
                                        onClick={() => handleQuantityChange(product.id, quantity - 1)}
                                      >
                                        <Minus size={10} className="sm:size-3 md:size-4" />
                                      </Button>
                                      <span className="font-medium text-xs sm:text-sm md:text-base px-2">{quantity}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 hover:bg-primary hover:text-white"
                                        onClick={() => handleQuantityChange(product.id, quantity + 1)}
                                      >
                                        <Plus size={10} className="sm:size-3 md:size-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      onClick={() => addToCart(product.id)}
                                      size="sm"
                                      className="w-full text-[10px] sm:text-xs md:text-sm h-6 sm:h-7 md:h-8 lg:h-9 hover:scale-105 transition-transform"
                                    >
                                      <Plus size={10} className="sm:size-3 md:size-4 mr-1" />
                                      Add
                                    </Button>
                                  )
                                ) : (
                                  <Button disabled size="sm" className="w-full text-[10px] sm:text-xs md:text-sm h-6 sm:h-7 md:h-8">
                                    Out of Stock
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Search size={48} className="text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">No products found</h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search or category filter
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Cart Panel
            <div className="flex-1 flex flex-col relative">
              {/* Side Toggle Button to Products */}
              <Button
                onClick={() => handlePanelSwitch('search')}
                className="fixed left-4 top-1/2 transform -translate-y-1/2 z-30 h-20 w-16 rounded-2xl shadow-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
                size="sm"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="bg-white/20 rounded-full p-1.5">
                    <ChevronLeft size={18} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white">Products</span>
                </div>
              </Button>
              
              {/* Customer Selection */}
              <div className="flex-shrink-0 p-4 bg-background border-b border-border">
                <div className="space-y-4">
                  {/* Customer Selection */}
                  <div>
                    <label className="text-sm font-medium mb-3 block text-foreground">Customer Selection</label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Select value={selectedCustomerId || 'no-customer'} onValueChange={(value) => setSelectedCustomerId(value === 'no-customer' ? null : value)}>
                          <SelectTrigger className="flex-1 h-12 bg-background border border-border hover:border-primary/50 transition-colors">
                            <SelectValue>
                              {selectedCustomer ? (
                                <div className="flex flex-col items-start w-full">
                                  <div className="flex items-center gap-2">
                                    <User size={14} className="text-primary" />
                                    <span className="font-medium">{selectedCustomer.name}</span>
                                  </div>
                                  {selectedCustomer.outstandingDebt > 0 && (
                                    <span className="text-xs text-red-600 font-medium mt-1">
                                      Outstanding Debt: {formatCurrency(selectedCustomer.outstandingDebt)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <User size={14} />
                                  <span>No Customer Selected</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-customer">
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-muted-foreground" />
                                <span>No Customer</span>
                              </div>
                            </SelectItem>
                            {customers.map(customer => (
                              <SelectItem key={customer.id} value={customer.id}>
                                <div className="flex flex-col items-start w-full">
                                  <div className="flex items-center gap-2">
                                    <User size={14} className="text-primary" />
                                    <span className="font-medium">{customer.name}</span>
                                    <span className="text-xs text-muted-foreground">({customer.phone})</span>
                                  </div>
                                  {customer.outstandingDebt > 0 && (
                                    <span className="text-xs text-red-600 font-medium mt-1">
                                      Debt: {formatCurrency(customer.outstandingDebt)}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 border-border hover:border-primary/50 transition-colors"
                          onClick={() => setIsAddCustomerModalOpen(true)}
                        >
                          <UserPlus size={16} />
                        </Button>
                      </div>
                      
                      {/* Customer Debt Display */}
                      {selectedCustomer && selectedCustomer.outstandingDebt > 0 && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <Receipt size={14} />
                            <span className="text-sm font-medium">Customer has outstanding debt</span>
                          </div>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Current debt: {formatCurrency(selectedCustomer.outstandingDebt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Payment Method</label>
                    <div className="flex gap-2">
                      <Button
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('cash')}
                        className="flex-1"
                      >
                        <Banknote size={14} className="mr-1" />
                        Cash
                      </Button>
                      <Button
                        variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('mpesa')}
                        className="flex-1"
                      >
                        <DollarSign size={14} className="mr-1" />
                        M-Pesa
                      </Button>
                      <Button
                        variant={paymentMethod === 'debt' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('debt')}
                        className="flex-1"
                      >
                        <Receipt size={14} className="mr-1" />
                        Debt
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto">
                {cart.length > 0 ? (
                  <div className="p-4 space-y-3">
                    {cart.map(item => (
                      <Card key={item.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.customPrice || item.sellingPrice)} each
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              >
                                <Minus size={14} />
                              </Button>
                              <span className="font-medium text-sm w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              >
                                <Plus size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                            <span className="text-xs text-muted-foreground">Subtotal:</span>
                            <span className="font-medium text-sm">
                              {formatCurrency((item.customPrice || item.sellingPrice) * item.quantity)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <ShoppingCart size={48} className="text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Cart is empty</h3>
                    <p className="text-sm text-muted-foreground">
                      Add products from the search tab
                    </p>
                  </div>
                )}
              </div>

              {/* Cart Summary & Checkout */}
              {cart.length > 0 && (
                <div className="flex-shrink-0 p-4 bg-background border-t border-border">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-lg text-primary">{formatCurrency(total)}</span>
                    </div>
                    
                    <SalesCheckout
                      cart={cart}
                      selectedCustomerId={selectedCustomerId}
                      paymentMethod={paymentMethod}
                      customers={customers}
                      onCheckoutComplete={handleCheckoutSuccess}
                      isOnline={isOnline}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Mobile Search Bar */}
        {activePanel === 'search' && (
          <FixedMobileSearch
            searchTerm={searchTerm}
            onSearchChange={handleSearchTermChange}
            placeholder="Search products..."
          />
        )}

        {/* Modals */}
        <AddCustomerModal
          open={isAddCustomerModalOpen}
          onOpenChange={setIsAddCustomerModalOpen}
          onCustomerAdded={(customer) => handleAddCustomerSuccess(customer.id)}
        />
        
        <AddDebtModal
          isOpen={isAddDebtModalOpen}
          onClose={() => setIsAddDebtModalOpen(false)}
        />
      </div>
    );
  }

  // Desktop view remains the same as before
  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* Header */}
        <div className="flex-shrink-0 p-6 bg-background border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Sales</h1>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Wifi size={16} />
                  <span className="text-sm font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600">
                  <WifiOff size={16} />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
              {pendingOperations > 0 && (
                <Badge variant="secondary">
                  {pendingOperations} pending
                </Badge>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
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
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              // Special handling for debt card
              if ('isDebtCard' in product && product.isDebtCard) {
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                    <CardContent className="p-4">
                      <div className="flex flex-col h-full">
                        <h3 className="font-medium mb-2 text-red-700 dark:text-red-400">Record Cash Lending</h3>
                        <p className="text-sm text-red-600 dark:text-red-500 mb-2">Add customer debt</p>
                        
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-lg text-red-700 dark:text-red-400">
                            Debt Recording
                          </span>
                          <Badge variant="destructive">
                            Active
                          </Badge>
                        </div>
                        
                        <Button
                          onClick={() => setIsAddDebtModalOpen(true)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Receipt size={16} className="mr-2" />
                          Record Debt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              const cartItem = cart.find(item => item.id === product.id);
              const quantity = cartItem?.quantity || 0;
              
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full">
                      <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-lg text-primary">
                          {formatCurrency(product.sellingPrice)}
                        </span>
                        <Badge variant={product.currentStock > 0 ? 'default' : 'destructive'}>
                          Stock: {product.currentStock === -1 ? 'Unspecified' : product.currentStock}
                        </Badge>
                      </div>
                      
                      {product.currentStock > 0 || product.currentStock === -1 ? (
                        quantity > 0 ? (
                          <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(product.id, quantity - 1)}
                            >
                              <Minus size={16} />
                            </Button>
                            <span className="font-medium">{quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(product.id, quantity + 1)}
                            >
                              <Plus size={16} />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => addToCart(product.id)}
                            className="w-full"
                          >
                            <Plus size={16} className="mr-2" />
                            Add to Cart
                          </Button>
                        )
                      ) : (
                        <Button disabled className="w-full">
                          Out of Stock
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Search size={64} className="text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or category filter
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 flex flex-col bg-card">
        {/* Cart Header */}
        <div className="flex-shrink-0 p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Cart</h2>
            {cart.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearCart}>
                Clear All
              </Button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-3 block text-foreground">Customer Selection</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select value={selectedCustomerId || 'no-customer'} onValueChange={(value) => setSelectedCustomerId(value === 'no-customer' ? null : value)}>
                    <SelectTrigger className="flex-1 h-12 bg-background border border-border hover:border-primary/50 transition-colors">
                      <SelectValue>
                        {selectedCustomer ? (
                          <div className="flex flex-col items-start w-full">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-primary" />
                              <span className="font-medium">{selectedCustomer.name}</span>
                            </div>
                            {selectedCustomer.outstandingDebt > 0 && (
                              <span className="text-xs text-red-600 font-medium mt-1">
                                Outstanding Debt: {formatCurrency(selectedCustomer.outstandingDebt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User size={14} />
                            <span>No Customer Selected</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-customer">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-muted-foreground" />
                          <span>No Customer</span>
                        </div>
                      </SelectItem>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex flex-col items-start w-full">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-primary" />
                              <span className="font-medium">{customer.name}</span>
                              <span className="text-xs text-muted-foreground">({customer.phone})</span>
                            </div>
                            {customer.outstandingDebt > 0 && (
                              <span className="text-xs text-red-600 font-medium mt-1">
                                Debt: {formatCurrency(customer.outstandingDebt)}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 border-border hover:border-primary/50 transition-colors"
                    onClick={() => setIsAddCustomerModalOpen(true)}
                  >
                    <UserPlus size={16} />
                  </Button>
                </div>
                
                {/* Customer Debt Display */}
                {selectedCustomer && selectedCustomer.outstandingDebt > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <Receipt size={14} />
                      <span className="text-sm font-medium">Customer has outstanding debt</span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Current debt: {formatCurrency(selectedCustomer.outstandingDebt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <div className="flex gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('cash')}
                  className="flex-1"
                >
                  <Banknote size={14} className="mr-1" />
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('mpesa')}
                  className="flex-1"
                >
                  <DollarSign size={14} className="mr-1" />
                  M-Pesa
                </Button>
                <Button
                  variant={paymentMethod === 'debt' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('debt')}
                  className="flex-1"
                >
                  <Receipt size={14} className="mr-1" />
                  Debt
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length > 0 ? (
            <div className="p-6 space-y-4">
              {cart.map(item => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.customPrice || item.sellingPrice)} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      
                      <span className="font-medium">
                        {formatCurrency((item.customPrice || item.sellingPrice) * item.quantity)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <ShoppingCart size={64} className="text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Cart is empty</h3>
              <p className="text-muted-foreground">
                Add products to start a sale
              </p>
            </div>
          )}
        </div>

        {/* Cart Summary & Checkout */}
        {cart.length > 0 && (
          <div className="flex-shrink-0 p-6 bg-muted/50 border-t border-border">
            <div className="space-y-4">
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-xl text-primary">{formatCurrency(total)}</span>
              </div>
              
              <SalesCheckout
                cart={cart}
                selectedCustomerId={selectedCustomerId}
                paymentMethod={paymentMethod}
                customers={customers}
                onCheckoutComplete={handleCheckoutSuccess}
                isOnline={isOnline}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCustomerModal
        open={isAddCustomerModalOpen}
        onOpenChange={setIsAddCustomerModalOpen}
        onCustomerAdded={(customer) => handleAddCustomerSuccess(customer.id)}
      />
      
      <AddDebtModal
        isOpen={isAddDebtModalOpen}
        onClose={() => setIsAddDebtModalOpen(false)}
      />
    </div>
  );
};

export default RebuiltModernSalesPage;
