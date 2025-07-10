
import React, { useState, useEffect } from 'react';
import { Product, Customer } from '../types';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Minus, ShoppingCart, User, Search, X, Trash2, Menu, CreditCard, Smartphone, Banknote, UserPlus, Trash } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../hooks/use-toast';
import { useIsMobile } from '../hooks/use-mobile';
import TopPicksSection from './sales/TopPicksSection';
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

  const { products } = useSupabaseProducts();
  const { customers, createCustomer } = useSupabaseCustomers();
  const { createSales } = useSupabaseSales();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const customer = customers.find(c =>c.id === customerId);
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

  // Mobile Header Component with new aesthetic
  const MobileHeader = () => (
    <div className="lg:hidden h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 h-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">
              POS
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="border border-gray-300 dark:border-gray-600"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="relative border border-gray-300 dark:border-gray-600">
                <ShoppingCart className="h-4 w-4" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600">
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96">
              <SheetHeader>
                <SheetTitle className="font-mono uppercase tracking-wide">Cart ({cart.length})</SheetTitle>
              </SheetHeader>
              <CartContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="absolute inset-x-0 top-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 border-2 border-gray-300 dark:border-gray-600"
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
        </div>
      )}
    </div>
  );

  // Search Component with new aesthetic
  const SearchSection = () => (
    <div className="hidden lg:block mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 h-12 text-base rounded-xl border-2 border-gray-300 dark:border-gray-600"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => setSearchTerm('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Search Results Dropdown */}
      {searchTerm && filteredProducts.length > 0 && (
        <Card className="absolute z-10 w-full mt-2 max-h-64 overflow-y-auto border-2 border-gray-300 dark:border-gray-600">
          <CardContent className="p-2">
            {filteredProducts.slice(0, 8).map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                onClick={() => {
                  addToCart(product);
                  setSearchTerm('');
                }}
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(product.sellingPrice)}</p>
                </div>
                <Badge variant={product.currentStock > 0 ? "default" : "destructive"} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                  {product.currentStock}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Cart Content Component with new aesthetic
  const CartContent = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 py-4">
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 font-mono">Cart is empty</p>
            <p className="text-sm text-gray-400">Add products to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map(item => (
              <Card key={item.product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium font-mono">{item.product.name}</h4>
                      <p className="text-sm text-gray-500">{formatCurrency(item.product.sellingPrice)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-2 border-gray-300 dark:border-gray-600"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-center text-sm border-2 border-gray-300 dark:border-gray-600"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-2 border-gray-300 dark:border-gray-600"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="font-medium font-mono">{formatCurrency(item.product.sellingPrice * item.quantity)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {cart.length > 0 && (
        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4 space-y-4">
          {/* Customer Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
                Customer {paymentMethod === 'debt' && <span className="text-red-500">*</span>}
              </label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm font-mono border border-gray-300 dark:border-gray-600"
                onClick={() => setShowCustomerModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            <Select value={selectedCustomer?.id || ""} onValueChange={handleCustomerSelect}>
              <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600">
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
            <label className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? "default" : "outline"}
                className={`flex flex-col items-center gap-1 h-16 border-2 ${
                  paymentMethod === 'cash' 
                    ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-4 w-4" />
                <span className="text-xs font-mono">Cash</span>
              </Button>
              <Button
                variant={paymentMethod === 'mpesa' ? "default" : "outline"}
                className={`flex flex-col items-center gap-1 h-16 border-2 ${
                  paymentMethod === 'mpesa' 
                    ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                onClick={() => setPaymentMethod('mpesa')}
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-xs font-mono">M-Pesa</span>
              </Button>
              <Button
                variant={paymentMethod === 'debt' ? "default" : "outline"}
                className={`flex flex-col items-center gap-1 h-16 border-2 ${
                  paymentMethod === 'debt' 
                    ? 'bg-orange-600 hover:bg-orange-700 border-orange-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                onClick={() => setPaymentMethod('debt')}
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-xs font-mono">Credit</span>
              </Button>
            </div>
          </div>

          {/* Total and Action Buttons */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-mono font-medium">Total:</span>
              <span className="text-2xl font-bold font-mono text-green-600">{formatCurrency(total)}</span>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full h-12 text-lg font-mono font-semibold bg-blue-600 hover:bg-blue-700"
                onClick={handleCompleteSale}
                disabled={!canCompleteSale()}
              >
                {isProcessing ? 'Processing...' : `Pay ${formatCurrency(total)}`}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 font-mono"
                  onClick={clearCart}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <MobileHeader />
      
      {/* Desktop Header */}
      <div className="hidden lg:block h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 h-full">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
                POINT OF SALE
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                Process sales and manage transactions
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="lg:flex lg:h-screen">
        {/* Left Panel - Products */}
        <div className="lg:w-3/5 lg:overflow-y-auto">
          <div className="p-4 lg:p-6">
            <SearchSection />
            <TopPicksSection products={products} onAddToCart={addToCart} />
            
            {/* All Products Grid - Mobile/Tablet */}
            {searchTerm && (
              <div className="lg:hidden mt-6">
                <h3 className="text-lg font-mono font-semibold mb-4 uppercase tracking-wide">Search Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow border-2 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-medium font-mono text-sm mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {formatCurrency(product.sellingPrice)}
                          </p>
                          <Badge variant={product.currentStock > 0 ? "default" : "destructive"} className="mb-3">
                            Stock: {product.currentStock}
                          </Badge>
                          <Button
                            onClick={() => addToCart(product)}
                            className="w-full bg-blue-600 hover:bg-blue-700 font-mono"
                            size="sm"
                            disabled={product.currentStock === 0}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart (Desktop) */}
        <div className="hidden lg:block lg:w-2/5 lg:border-l-2 lg:border-gray-200 lg:dark:border-gray-700">
          <div className="h-full p-6">
            <h2 className="text-xl font-mono font-semibold mb-4 uppercase tracking-wide">Cart ({cart.length})</h2>
            <CartContent />
          </div>
        </div>
      </div>

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
