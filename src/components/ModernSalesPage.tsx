
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Customer } from '../types';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Search, 
  Trash2, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  UserPlus, 
  Sparkles, 
  TrendingUp, 
  Zap,
  CheckCircle,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../hooks/use-toast';
import { useIsMobile } from '../hooks/use-mobile';

interface CartItem {
  product: Product;
  quantity: number;
}

type PaymentMethod = 'cash' | 'mpesa' | 'debt';

const ModernSalesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const { products } = useSupabaseProducts();
  const { customers } = useSupabaseCustomers();
  const { createSales } = useSupabaseSales();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      product.currentStock > 0
    );
  }, [products, searchTerm]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

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
      
      toast({
        title: "Sale Completed!",
        description: `Successfully processed sale of ${formatCurrency(total)}`,
      });
      
      clearCart();
      setShowCart(false);
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: "Failed to process sale. Please try again.",
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

  const ProductCard = ({ product }: { product: Product }) => (
    <Card 
      className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-100 hover:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] active:scale-95"
      onClick={() => addToCart(product)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="p-4 relative z-10">
        <div className="flex-1 mb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300 leading-tight flex-1 mr-2">
              {product.name}
            </h3>
            <Badge 
              variant={product.currentStock > 10 ? "default" : product.currentStock > 0 ? "secondary" : "destructive"}
              className="text-sm font-bold px-3 py-1 rounded-full shadow-sm flex-shrink-0"
            >
              {product.currentStock}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {formatCurrency(product.sellingPrice)}
              </span>
              <div className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                {product.category}
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 active:scale-95"
          disabled={product.currentStock === 0}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add to Cart
          <Sparkles className="h-5 w-5 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  const CartContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
      <div className="flex-1 overflow-y-auto py-4">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-purple-400" />
            </div>
            <p className="text-gray-500 text-xl font-bold mb-2">Cart is empty</p>
            <p className="text-sm text-gray-400">Add products to get started</p>
          </div>
        ) : (
          <div className="space-y-4 px-4">
            {cart.map(item => (
              <Card key={item.product.id} className="bg-white shadow-lg border-2 border-purple-100 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <h4 className="font-bold text-base text-gray-900 truncate">{item.product.name}</h4>
                      <p className="text-sm text-gray-500 font-medium">{formatCurrency(item.product.sellingPrice)} each</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full flex-shrink-0"
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
                        className="h-9 w-9 p-0 rounded-full border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                        className="w-16 h-9 text-center text-base font-bold border-2 border-purple-200 rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 rounded-full border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {formatCurrency(item.product.sellingPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t-2 border-purple-200 pt-6 space-y-6 bg-white/90 backdrop-blur-sm p-4">
          {/* Customer Selection */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-3 block">
              Customer {paymentMethod === 'debt' && <span className="text-red-500">*</span>}
            </label>
            <Select value={selectedCustomer?.id || ""} onValueChange={(value) => {
              const customer = customers.find(c => c.id === value);
              setSelectedCustomer(customer || null);
            }}>
              <SelectTrigger className="h-12 border-2 border-purple-200 rounded-xl">
                <SelectValue placeholder="Select customer (optional)" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-4 block">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={paymentMethod === 'cash' ? "default" : "outline"}
                className={`flex flex-col items-center gap-3 h-20 rounded-xl transition-all duration-300 ${
                  paymentMethod === 'cash' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg scale-105' 
                    : 'border-2 border-green-200 hover:border-green-400 hover:bg-green-50'
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-6 w-6" />
                <span className="font-bold text-sm">Cash</span>
              </Button>
              <Button
                variant={paymentMethod === 'mpesa' ? "default" : "outline"}
                className={`flex flex-col items-center gap-3 h-20 rounded-xl transition-all duration-300 ${
                  paymentMethod === 'mpesa' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg scale-105' 
                    : 'border-2 border-green-200 hover:border-green-400 hover:bg-green-50'
                }`}
                onClick={() => setPaymentMethod('mpesa')}
              >
                <Smartphone className="h-6 w-6" />
                <span className="font-bold text-sm">M-Pesa</span>
              </Button>
              <Button
                variant={paymentMethod === 'debt' ? "default" : "outline"}
                className={`flex flex-col items-center gap-3 h-20 rounded-xl transition-all duration-300 ${
                  paymentMethod === 'debt' 
                    ? 'bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg scale-105' 
                    : 'border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                }`}
                onClick={() => setPaymentMethod('debt')}
              >
                <CreditCard className="h-6 w-6" />
                <span className="font-bold text-sm">Credit</span>
              </Button>
            </div>
          </div>

          {/* Total and Actions */}
          <div className="bg-gradient-to-br from-purple-100 via-white to-blue-100 rounded-2xl p-6 space-y-6 border-2 border-purple-200/50 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-gray-700 flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Total:
              </span>
              <span className="text-3xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {formatCurrency(total)}
              </span>
            </div>
            
            <Button
              className="w-full h-16 text-lg font-black bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 rounded-2xl shadow-2xl hover:shadow-3xl transform transition-all duration-500 active:scale-95"
              onClick={handleCompleteSale}
              disabled={isProcessing || (paymentMethod === 'debt' && !selectedCustomer)}
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6" />
                  <span>Complete Sale - {formatCurrency(total)}</span>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 w-full overflow-x-hidden">
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="pb-4 w-full">
          {/* Mobile Header */}
          <div className="bg-white/80 backdrop-blur-lg border-b-2 border-purple-200/50 p-4 sticky top-0 z-30 shadow-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-black text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate">
                    Point of Sale
                  </h1>
                  <p className="text-sm text-gray-500 font-medium truncate">Modern sales experience</p>
                </div>
              </div>
              
              <Sheet open={showCart} onOpenChange={setShowCart}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="relative border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl h-12 w-12 p-0">
                    <ShoppingCart className="h-5 w-5" />
                    {cart.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse">
                        {totalItems}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full p-0 bg-gradient-to-br from-white to-purple-50 max-w-full">
                  <SheetHeader className="p-4 border-b-2 border-purple-200">
                    <SheetTitle className="text-xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Cart ({totalItems})
                    </SheetTitle>
                  </SheetHeader>
                  <div className="h-[calc(100vh-80px)]">
                    <CartContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-2xl border-2 border-purple-200 focus:border-purple-400 bg-white/80 backdrop-blur-sm text-base"
              />
            </div>
          </div>

          {/* Mobile Content */}
          <div className="p-4 space-y-6 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <div className="flex h-screen w-full overflow-hidden">
          {/* Left Panel - Products */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Desktop Header */}
              <div className="mb-8">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600 flex items-center justify-center shadow-xl">
                    <ShoppingCart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Point of Sale
                    </h1>
                    <p className="text-gray-500 text-lg font-medium">Modern sales experience</p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-purple-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-2 border-purple-200 focus:border-purple-400 bg-white/80 backdrop-blur-sm text-lg"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-xl">No products found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Cart */}
          <div className="w-96 border-l-2 border-purple-200/50 bg-white/80 backdrop-blur-lg shadow-2xl">
            <div className="p-6 h-full">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
                Cart ({totalItems})
              </h2>
              <CartContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernSalesPage;
