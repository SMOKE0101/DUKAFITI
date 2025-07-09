
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, ShoppingCart, DollarSign, TrendingUp, Users, Menu, User, Minus, X, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../hooks/use-toast';
import { Product, Sale, Customer } from '../types';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import TopPicksSection from './sales/TopPicksSection';

interface CartItem {
  product: Product;
  quantity: number;
}

const SalesManagement = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'debt'>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const { toast } = useToast();
  
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { sales, loading: salesLoading, createSales } = useSupabaseSales();
  const { customers, loading: customersLoading } = useSupabaseCustomers();

  console.log('SalesManagement render:', { 
    productsCount: products.length, 
    productsLoading,
    searchTerm,
    searchExpanded 
  });

  // Filter products for search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  console.log('Filtered products:', filteredProducts.length);

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);

  // Add product to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    console.log('Adding to cart:', product.name);
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  // Update cart item quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method: 'cash' | 'mpesa' | 'debt') => {
    setPaymentMethod(method);
    if (method === 'debt') {
      setShowCustomerSelect(true);
    } else {
      setShowCustomerSelect(false);
      setSelectedCustomer(null);
    }
  };

  // Process payment
  const handlePay = async () => {
    if (cart.length === 0) return;

    try {
      const salesData = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        sellingPrice: item.product.sellingPrice,
        costPrice: item.product.costPrice,
        profit: (item.product.sellingPrice - item.product.costPrice) * item.quantity,
        timestamp: new Date().toISOString(),
        synced: true,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        paymentMethod,
        paymentDetails: {
          cashAmount: paymentMethod === 'cash' ? item.product.sellingPrice * item.quantity : 0,
          mpesaAmount: paymentMethod === 'mpesa' ? item.product.sellingPrice * item.quantity : 0,
          debtAmount: paymentMethod === 'debt' ? item.product.sellingPrice * item.quantity : 0,
        },
        total: item.product.sellingPrice * item.quantity,
      }));

      await createSales(salesData);

      // Show success toast
      const paymentLabels = {
        cash: 'Cash',
        mpesa: 'M-Pesa',
        debt: selectedCustomer ? `Credit (${selectedCustomer.name})` : 'Credit'
      };

      toast({
        title: "Sale Completed",
        description: `Payment received — ${formatCurrency(cartTotal)} (${paymentLabels[paymentMethod]})`,
      });

      // Clear cart
      setCart([]);
      setSelectedCustomer(null);
      setShowCustomerSelect(false);
      setPaymentMethod('cash');
    } catch (error) {
      console.error('Payment failed:', error);
      toast({
        title: "Payment Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (productsLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b bg-card">
        <Button variant="ghost" size="sm">
          <Menu className="w-5 h-5" />
        </Button>
        <div className="text-lg font-semibold">POS</div>
        <Button variant="ghost" size="sm">
          <User className="w-5 h-5" />
        </Button>
      </header>

      {/* Top Picks Section */}
      <TopPicksSection 
        products={products}
        onAddToCart={addToCart}
      />

      {/* Search Bar */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              console.log('Search input changed:', e.target.value);
              setSearchTerm(e.target.value);
            }}
            className="pl-10 pr-10"
            onFocus={() => {
              console.log('Search input focused');
              setSearchExpanded(true);
            }}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => {
                setSearchTerm('');
                setSearchExpanded(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Search Results */}
        {searchTerm && (
          <Card className="mt-2 max-h-48 overflow-y-auto z-50 relative">
            <CardContent className="p-0">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      console.log('Product selected from search:', product.name);
                      addToCart(product);
                      setSearchTerm('');
                      setSearchExpanded(false);
                    }}
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(product.sellingPrice)} • Stock: {product.currentStock}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-muted-foreground">
                  No products found
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cart & Checkout Panel */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 rounded-t-xl shadow-lg m-0 border-t">
          <CardContent className="p-0 flex flex-col h-full">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-4" />
                  <p>Your cart is empty</p>
                  <p className="text-sm">Add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.product.sellingPrice)} each
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="font-medium">
                          {formatCurrency(item.product.sellingPrice * item.quantity)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Selection for Credit */}
            {showCustomerSelect && (
              <div className="p-4 border-t">
                <Label className="text-sm font-medium mb-2 block">Select Customer</Label>
                <Select
                  value={selectedCustomer?.id || ''}
                  onValueChange={(value) => {
                    const customer = customers.find(c => c.id === value);
                    setSelectedCustomer(customer || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Summary Bar */}
            {cart.length > 0 && (
              <div className="p-4 border-t bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xl font-bold">
                    Total: {formatCurrency(cartTotal)}
                  </div>
                </div>

                {/* Payment Method Pills */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePaymentMethodChange('cash')}
                    className="flex-1"
                  >
                    <Banknote className="w-4 h-4 mr-2" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePaymentMethodChange('mpesa')}
                    className="flex-1"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    M-Pesa
                  </Button>
                  <Button
                    variant={paymentMethod === 'debt' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePaymentMethodChange('debt')}
                    className="flex-1"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Credit
                  </Button>
                </div>

                {/* Pay Button */}
                <Button 
                  onClick={handlePay}
                  disabled={cart.length === 0 || (paymentMethod === 'debt' && !selectedCustomer)}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  Pay {formatCurrency(cartTotal)}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesManagement;
