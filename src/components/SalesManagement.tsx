
import React, { useState, useEffect } from 'react';
import { Product, Customer } from '../types';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, ShoppingCart, Search, X, Trash2, CreditCard, Smartphone, Banknote, UserPlus, Trash, Grid3X3, List, CheckCircle, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../hooks/use-toast';
import { useIsMobile, useIsTablet } from '../hooks/use-mobile';
import AddCustomerModal from './sales/AddCustomerModal';

interface CartItem {
  product: Product;
  quantity: number;
}

type PaymentMethod = 'cash' | 'mpesa' | 'debt';

const SalesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCart, setShowCart] = useState(false);

  const { products } = useSupabaseProducts();
  const { customers, createCustomer } = useSupabaseCustomers();
  const { createSales } = useSupabaseSales();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get top selling products (mock data for now)
  const topProducts = products.slice(0, 6);

  // Calculate total whenever cart changes
  useEffect(() => {
    const newTotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantity }]);
    }
    
    // Auto-open cart on mobile after adding item
    if (isMobile) {
      setShowCart(true);
    }
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    setCart(updatedCart);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updatedCart = cart.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    setCart(updatedCart);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
  };

  const handleCreateCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCustomer = await createCustomer(customerData);
      if (newCustomer) {
        setSelectedCustomer(newCustomer);
        toast({
          title: "Customer Added",
          description: `${customerData.name} has been added and selected.`,
        });
        setShowCustomerModal(false);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to the cart before completing the sale.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'debt' && !selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for credit sales.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const salesData = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        sellingPrice: item.product.sellingPrice,
        costPrice: item.product.costPrice,
        profit: (item.product.sellingPrice - item.product.costPrice) * item.quantity,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        paymentMethod,
        paymentDetails: {
          cashAmount: paymentMethod === 'cash' ? total : 0,
          mpesaAmount: paymentMethod === 'mpesa' ? total : 0,
          debtAmount: paymentMethod === 'debt' ? total : 0,
        },
        total: item.product.sellingPrice * item.quantity,
        timestamp: new Date().toISOString(),
        synced: true,
      }));

      await createSales(salesData);
      
      const paymentLabels = {
        cash: 'Cash',
        mpesa: 'M-Pesa',
        debt: 'Credit'
      };

      toast({
        title: "Sale Completed",
        description: `Sale recorded: ${formatCurrency(total)} (${paymentLabels[paymentMethod]})`,
      });
      
      clearCart();
      setShowCart(false);
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: "Failed to record sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    setTotal(0);
    setSelectedCustomer(null);
    setPaymentMethod('cash');
  };

  const canCompleteSale = () => {
    return cart.length > 0 && !isProcessing && (paymentMethod !== 'debt' || selectedCustomer);
  };

  // Enhanced Product Card Component with glassmorphism
  const ProductCard = ({ product }: { product: Product }) => (
    <Card 
      className="group relative overflow-hidden bg-white/70 backdrop-blur-md border border-white/30 hover:border-purple-300/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-105"
      onClick={() => addToCart(product)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-4 relative z-10">
        <div className="flex-1 mb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300">
              {product.name}
            </h3>
            <Badge 
              variant={product.currentStock > 10 ? "default" : product.currentStock > 0 ? "secondary" : "destructive"}
              className="ml-2 text-xs font-semibold px-2 py-1 rounded-full shadow-sm"
            >
              {product.currentStock === -1 ? '∞' : product.currentStock}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {formatCurrency(product.sellingPrice)}
              </span>
              <div className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-1">
                {product.category}
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 group-hover:scale-105"
          size="sm"
          disabled={product.currentStock === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Cart
          <Sparkles className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  // Enhanced Cart Component
  const CartContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
      <ScrollArea className="flex-1 py-4">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-purple-400" />
            </div>
            <p className="text-gray-500 text-xl font-bold mb-2">Cart is empty</p>
            <p className="text-sm text-gray-400">Add products to get started</p>
          </div>
        ) : (
          <div className="space-y-4 px-2">
            {cart.map(item => (
              <Card key={item.product.id} className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <h4 className="font-bold text-sm text-gray-900 truncate">{item.product.name}</h4>
                      <p className="text-sm text-gray-500 font-medium">{formatCurrency(item.product.sellingPrice)} each</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 rounded-full border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center text-sm font-bold border-2 border-purple-200 rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 rounded-full border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {formatCurrency(item.product.sellingPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {cart.length > 0 && (
        <div className="border-t-2 border-gradient-to-r from-purple-200 to-blue-200 pt-6 space-y-6 bg-white/90 backdrop-blur-sm">
          {/* Customer Selection */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customer {paymentMethod === 'debt' && <span className="text-red-500">*</span>}
              </label>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-sm border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                onClick={() => setShowCustomerModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            <Select value={selectedCustomer?.id || ""} onValueChange={handleCustomerSelect}>
              <SelectTrigger className="h-12 border-2 border-purple-200 rounded-xl">
                <SelectValue placeholder="Select customer (optional)" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{customer.name}</span>
                      {customer.outstandingDebt > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {formatCurrency(customer.outstandingDebt)}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Payment Method Selection */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-4 block flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={paymentMethod === 'cash' ? "default" : "outline"}
                className={`flex flex-col items-center gap-3 h-24 rounded-xl transition-all duration-300 ${
                  paymentMethod === 'cash' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg scale-105' 
                    : 'border-2 border-green-200 hover:border-green-400 hover:bg-green-50'
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-6 w-6" />
                <span className="text-xs font-bold">Cash</span>
              </Button>
              <Button
                variant={paymentMethod === 'mpesa' ? "default" : "outline"}
                className={`flex flex-col items-center gap-3 h-24 rounded-xl transition-all duration-300 ${
                  paymentMethod === 'mpesa' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg scale-105' 
                    : 'border-2 border-green-200 hover:border-green-400 hover:bg-green-50'
                }`}
                onClick={() => setPaymentMethod('mpesa')}
              >
                <Smartphone className="h-6 w-6" />
                <span className="text-xs font-bold">M-Pesa</span>
              </Button>
              <Button
                variant={paymentMethod === 'debt' ? "default" : "outline"}
                className={`flex flex-col items-center gap-3 h-24 rounded-xl transition-all duration-300 ${
                  paymentMethod === 'debt' 
                    ? 'bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg scale-105' 
                    : 'border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                }`}
                onClick={() => setPaymentMethod('debt')}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-xs font-bold">Credit</span>
              </Button>
            </div>
          </div>

          {/* Enhanced Total and Actions */}
          <div className="bg-gradient-to-br from-purple-100 via-white to-blue-100 rounded-3xl p-6 space-y-6 border-2 border-purple-200/50 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-gray-700 flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Total:
              </span>
              <span className="text-4xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {formatCurrency(total)}
              </span>
            </div>
            
            <Button
              className="w-full h-16 text-lg font-black bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 rounded-2xl shadow-2xl hover:shadow-3xl transform transition-all duration-500 hover:scale-105"
              onClick={handleCompleteSale}
              disabled={!canCompleteSale()}
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6" />
                  Complete Sale - {formatCurrency(total)}
                  <Zap className="h-6 w-6" />
                </div>
              )}
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 rounded-xl"
                onClick={clearCart}
              >
                <Trash className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
              {isMobile && (
                <Button
                  variant="outline"
                  className="h-12 px-4 border-2 border-gray-300 hover:border-gray-400 rounded-xl"
                  onClick={() => setShowCart(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="pb-4">
          {/* Enhanced Mobile Header */}
          <div className="bg-white/80 backdrop-blur-lg border-b border-purple-200/50 p-4 sticky top-16 z-30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-black text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Point of Sale
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">Process transactions</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl"
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Sheet open={showCart} onOpenChange={setShowCart}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="relative border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl">
                      <ShoppingCart className="h-4 w-4" />
                      {cart.length > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse">
                          {cart.length}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full p-6 bg-gradient-to-br from-white to-purple-50">
                    <SheetHeader className="mb-4">
                      <SheetTitle className="text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Cart ({cart.length})
                      </SheetTitle>
                    </SheetHeader>
                    <CartContent />
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Enhanced Mobile Search */}
            {showMobileSearch && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-12 h-14 rounded-2xl border-2 border-purple-200 focus:border-purple-400 bg-white/80 backdrop-blur-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 rounded-xl hover:bg-purple-100"
                  onClick={() => setShowMobileSearch(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Content */}
          <div className="p-4 space-y-8">
            {/* Quick Access Products */}
            {!searchTerm && (
              <div>
                <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-gray-800">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                  Quick Add
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {topProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchTerm && (
              <div>
                <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-gray-800">
                  <Search className="h-6 w-6 text-purple-500" />
                  Search Results
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Desktop & Tablet Layout */
        <div className="flex h-screen">
          {/* Left Panel - Products */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">
              {/* Enhanced Desktop Header */}
              <div className="mb-8">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600 flex items-center justify-center shadow-xl">
                    <ShoppingCart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Point of Sale
                    </h1>
                    <p className="text-gray-500 text-lg font-medium">Process sales and manage transactions</p>
                  </div>
                </div>

                {/* Enhanced Search and View Toggle */}
                <div className="flex gap-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-14 rounded-2xl border-2 border-purple-200 focus:border-purple-400 bg-white/80 backdrop-blur-sm text-lg"
                    />
                  </div>
                  <div className="flex gap-2 border-2 border-purple-200 rounded-2xl p-2 bg-white/80 backdrop-blur-sm">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 rounded-xl ${
                        viewMode === 'grid' 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                          : 'hover:bg-purple-50'
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 rounded-xl ${
                        viewMode === 'list' 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                          : 'hover:bg-purple-50'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Enhanced Products Grid */}
              <div className={`${
                viewMode === 'grid' 
                  ? `grid gap-6 ${isTablet ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}` 
                  : 'space-y-4'
              }`}>
                {(searchTerm ? filteredProducts : products).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Cart (Desktop only) */}
          {!isTablet && (
            <div className="w-96 border-l-2 border-purple-200/50 bg-white/80 backdrop-blur-lg shadow-2xl">
              <div className="p-6 h-full">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                  Cart ({cart.length})
                </h2>
                <CartContent />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        open={showCustomerModal}
        onOpenChange={setShowCustomerModal}
        onCreateCustomer={handleCreateCustomer}
      />
    </div>
  );
};

export default SalesManagement;
