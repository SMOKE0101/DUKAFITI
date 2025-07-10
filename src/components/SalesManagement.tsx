
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Minus, ShoppingCart, Search, X, Trash2, CreditCard, Smartphone, Banknote, UserPlus, Trash, Grid3X3, List, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../hooks/use-toast';
import { useIsMobile } from '../hooks/use-mobile';
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

  // Product Card Component
  const ProductCard = ({ product }: { product: Product }) => (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-purple-200 group h-full"
      onClick={() => addToCart(product)}
    >
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {product.name}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(product.sellingPrice)}
              </span>
              <Badge 
                variant={product.currentStock > 10 ? "default" : product.currentStock > 0 ? "secondary" : "destructive"}
                className="text-xs"
              >
                {product.currentStock === -1 ? 'Unlimited' : product.currentStock}
              </Badge>
            </div>
          </div>
        </div>
        <Button 
          className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
          disabled={product.currentStock === 0}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );

  // Cart Component
  const CartContent = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 py-4">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">Cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">Add products to get started</p>
          </div>
        ) : (
          <div className="space-y-3 px-1">
            {cart.map(item => (
              <Card key={item.product.id} className="bg-white shadow-sm border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{item.product.name}</h4>
                      <p className="text-sm text-gray-500">{formatCurrency(item.product.sellingPrice)} each</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-purple-600">
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
        <div className="border-t-2 pt-6 space-y-4 bg-white">
          {/* Customer Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-700">
                Customer {paymentMethod === 'debt' && <span className="text-red-500">*</span>}
              </label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm border"
                onClick={() => setShowCustomerModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            <Select value={selectedCustomer?.id || ""} onValueChange={handleCustomerSelect}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select customer (optional)" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{customer.name}</span>
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

          {/* Payment Method Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? "default" : "outline"}
                className={`flex flex-col items-center gap-2 h-20 ${
                  paymentMethod === 'cash' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'hover:bg-green-50 hover:border-green-300'
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-5 w-5" />
                <span className="text-xs font-semibold">Cash</span>
              </Button>
              <Button
                variant={paymentMethod === 'mpesa' ? "default" : "outline"}
                className={`flex flex-col items-center gap-2 h-20 ${
                  paymentMethod === 'mpesa' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'hover:bg-green-50 hover:border-green-300'
                }`}
                onClick={() => setPaymentMethod('mpesa')}
              >
                <Smartphone className="h-5 w-5" />
                <span className="text-xs font-semibold">M-Pesa</span>
              </Button>
              <Button
                variant={paymentMethod === 'debt' ? "default" : "outline"}
                className={`flex flex-col items-center gap-2 h-20 ${
                  paymentMethod === 'debt' 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'hover:bg-orange-50 hover:border-orange-300'
                }`}
                onClick={() => setPaymentMethod('debt')}
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-xs font-semibold">Credit</span>
              </Button>
            </div>
          </div>

          {/* Total and Actions */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-3xl font-black text-purple-600">{formatCurrency(total)}</span>
            </div>
            
            <Button
              className="w-full h-14 text-lg font-bold bg-purple-600 hover:bg-purple-700 rounded-xl"
              onClick={handleCompleteSale}
              disabled={!canCompleteSale()}
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Complete Sale - {formatCurrency(total)}
                </>
              )}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={clearCart}
              >
                <Trash className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
              {isMobile && (
                <Button
                  variant="outline"
                  className="h-12 px-4"
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
          {/* Mobile Header */}
          <div className="bg-white border-b p-4 sticky top-16 z-30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl">Point of Sale</h1>
                  <p className="text-sm text-gray-500">Process transactions</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Sheet open={showCart} onOpenChange={setShowCart}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                      <ShoppingCart className="h-4 w-4" />
                      {cart.length > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-purple-600">
                          {cart.length}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full p-6">
                    <SheetHeader className="mb-4">
                      <SheetTitle className="text-xl font-bold">Cart ({cart.length})</SheetTitle>
                    </SheetHeader>
                    <CartContent />
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Mobile Search */}
            {showMobileSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowMobileSearch(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Content */}
          <div className="p-4 space-y-6">
            {/* Quick Access Products */}
            {!searchTerm && (
              <div>
                <h2 className="text-lg font-bold mb-4">Quick Add</h2>
                <div className="grid grid-cols-2 gap-3">
                  {topProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchTerm && (
              <div>
                <h2 className="text-lg font-bold mb-4">Search Results</h2>
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <div className="flex h-screen">
          {/* Left Panel - Products */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Desktop Header */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Point of Sale</h1>
                    <p className="text-gray-500">Process sales and manage transactions</p>
                  </div>
                </div>

                {/* Search and View Toggle */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                    />
                  </div>
                  <div className="flex gap-1 border rounded-xl p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="px-3"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}`}>
                {(searchTerm ? filteredProducts : products).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Cart */}
          <div className="w-96 border-l bg-white">
            <div className="p-6 h-full">
              <h2 className="text-xl font-bold mb-4">Cart ({cart.length})</h2>
              <CartContent />
            </div>
          </div>
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
