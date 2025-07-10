
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  ShoppingCart, 
  User,
  Plus,
  X,
  Check,
  Clock,
  DollarSign,
  Package
} from 'lucide-react';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { formatCurrency } from '../utils/currency';
import { Product, Customer } from '../types';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'debt'>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { createSales } = useSupabaseSales();
  const { user } = useAuth();
  const { toast } = useToast();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.currentStock) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.currentStock} units available`,
          variant: "destructive"
        });
      }
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.sellingPrice,
        quantity: 1,
        stock: product.currentStock
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.currentStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.currentStock} units available`,
        variant: "destructive"
      });
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to make sales",
        variant: "destructive"
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const sales = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) throw new Error(`Product ${item.name} not found`);

        return {
          user_id: user.id,
          product_id: item.id,
          product_name: item.name,
          customer_id: selectedCustomer?.id || null,
          customer_name: selectedCustomer?.name || null,
          quantity: item.quantity,
          selling_price: item.price,
          cost_price: product.costPrice,
          profit: (item.price - product.costPrice) * item.quantity,
          total_amount: item.price * item.quantity,
          payment_method: paymentMethod,
          payment_details: {
            cashAmount: paymentMethod === 'cash' ? cartTotal : parseFloat(cashAmount) || 0,
            mpesaAmount: paymentMethod === 'mpesa' ? cartTotal : parseFloat(mpesaAmount) || 0,
            debtAmount: paymentMethod === 'debt' ? cartTotal : 0
          },
          timestamp: new Date().toISOString(),
          synced: true
        };
      });

      await createSales(sales);

      toast({
        title: "Sale Completed",
        description: `Successfully processed sale of ${formatCurrency(cartTotal)}`,
      });

      // Reset form
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      setCashAmount('');
      setMpesaAmount('');
      setNotes('');

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Sale Failed",
        description: "Failed to process sale. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (productsLoading || customersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
                  POINT OF SALE
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
                  Make quick sales and manage transactions
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  {cart.length} items
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(cartTotal)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => addToCart(product)}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {product.currentStock} in stock
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">{formatCurrency(product.sellingPrice)}</span>
                      <Button size="sm" className="bg-green-600 hover:bg-green-500">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {product.currentStock <= (product.lowStockThreshold || 10) && (
                      <Badge variant="destructive" className="text-xs">
                        Low Stock
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart & Checkout Section */}
        <div className="space-y-6">
          {/* Cart */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({cart.length})
              </h2>
              
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Selection */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer (Optional)
              </h3>
              
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full"
                >
                  Select Customer
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Payment Method</h3>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['cash', 'mpesa', 'debt'] as const).map((method) => (
                    <Button
                      key={method}
                      variant={paymentMethod === method ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod(method)}
                      className="flex-1 capitalize"
                    >
                      {method === 'mpesa' ? 'M-Pesa' : method}
                    </Button>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add transaction notes..."
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full bg-green-600 hover:bg-green-500 py-6 text-lg"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Complete Sale ({formatCurrency(cartTotal)})
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
