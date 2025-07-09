
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, ShoppingCart, Menu, User, Minus, X, CreditCard, Smartphone, Banknote, UserPlus } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../hooks/use-toast';
import { Product, Sale, Customer } from '../types';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import TopPicksSection from './sales/TopPicksSection';
import AddCustomerModal from './sales/AddCustomerModal';
import { useIsMobile } from '../hooks/use-mobile';

interface CartItem {
  product: Product;
  quantity: number;
}

const SalesManagement = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'credit'>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { createSales } = useSupabaseSales();
  const { customers, loading: customersLoading, createCustomer } = useSupabaseCustomers();

  // Filter products for search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);

  // Add product to cart
  const addToCart = (product: Product, quantity: number = 1) => {
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
  const handlePaymentMethodChange = (method: 'cash' | 'mpesa' | 'credit') => {
    setPaymentMethod(method);
    if (method !== 'credit') {
      setSelectedCustomer(null);
    }
  };

  // Handle customer creation
  const handleCreateCustomer = async (customerData: Omit<Customer, 'id' | 'createdDate'>) => {
    try {
      const newCustomer = await createCustomer(customerData);
      if (newCustomer) {
        setSelectedCustomer(newCustomer);
        setShowAddCustomer(false);
        toast({
          title: "Customer Added",
          description: `${newCustomer.name} has been added successfully`,
        });
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  // Process payment
  const handlePay = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'credit' && !selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for credit sales",
        variant: "destructive",
      });
      return;
    }

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
          debtAmount: paymentMethod === 'credit' ? item.product.sellingPrice * item.quantity : 0,
        },
        total: item.product.sellingPrice * item.quantity,
      }));

      await createSales(salesData);

      const paymentLabels = {
        cash: 'Cash',
        mpesa: 'M-Pesa',
        credit: selectedCustomer ? `Credit (${selectedCustomer.name})` : 'Credit'
      };

      toast({
        title: "Sale Completed",
        description: `Payment received — ${formatCurrency(cartTotal)} (${paymentLabels[paymentMethod]})`,
      });

      // Clear cart and reset
      setCart([]);
      setSelectedCustomer(null);
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

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className={`${isMobile ? 'h-14' : 'h-16'} flex items-center justify-between px-4 border-b bg-card shadow-sm`}>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            POS
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isMobile && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span>{cart.length} items</span>
              </div>
              {cartTotal > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {formatCurrency(cartTotal)}
                </Badge>
              )}
            </div>
          )}
          <Button variant="ghost" size="sm">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'} overflow-hidden`}>
        {/* Left Panel - Products & Search */}
        <div className={`${isMobile ? 'flex-1' : 'w-2/5'} flex flex-col bg-gray-50 dark:bg-gray-900/50`}>
          {/* Top Picks Section */}
          <div className="flex-shrink-0">
            <TopPicksSection 
              products={products}
              onAddToCart={addToCart}
            />
          </div>

          {/* Search Section */}
          <div className="flex-shrink-0 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-12 text-base bg-white dark:bg-gray-800"
                onFocus={() => setSearchExpanded(true)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
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
              <Card className="mt-2 max-h-64 overflow-y-auto z-50 relative shadow-lg">
                <CardContent className="p-0">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border-b last:border-b-0 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          addToCart(product);
                          setSearchTerm('');
                          setSearchExpanded(false);
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-base">{product.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span>{formatCurrency(product.sellingPrice)}</span>
                            <Badge variant={product.currentStock > 0 ? "secondary" : "destructive"} className="text-xs">
                              Stock: {product.currentStock}
                            </Badge>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No products found
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Panel - Cart & Checkout */}
        <div className={`${isMobile ? 'flex-1' : 'w-3/5'} flex flex-col bg-white dark:bg-gray-800 border-l`}>
          <Card className="flex-1 rounded-none shadow-none border-0 flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Your cart is empty</p>
                    <p className="text-sm">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:shadow-sm transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-base truncate">{item.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(item.product.sellingPrice)} each
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium text-base">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-base">
                            {formatCurrency(item.product.sellingPrice * item.quantity)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
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

              {/* Checkout Section */}
              {cart.length > 0 && (
                <div className="flex-shrink-0 border-t bg-card">
                  {/* Customer Selection */}
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">Customer {paymentMethod === 'credit' && '*'}</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddCustomer(true)}
                        className="text-xs"
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Add New
                      </Button>
                    </div>
                    <Select
                      value={selectedCustomer?.id || ''}
                      onValueChange={(value) => {
                        const customer = customers.find(c => c.id === value);
                        setSelectedCustomer(customer || null);
                      }}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select customer (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{customer.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {customer.phone}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Methods */}
                  <div className="p-4 border-b">
                    <label className="text-sm font-medium mb-3 block">Payment Method</label>
                    <div className="flex gap-2">
                      <Button
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePaymentMethodChange('cash')}
                        className="flex-1 h-12"
                      >
                        <Banknote className="w-4 h-4 mr-2" />
                        Cash
                      </Button>
                      <Button
                        variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePaymentMethodChange('mpesa')}
                        className="flex-1 h-12"
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        M-Pesa
                      </Button>
                      <Button
                        variant={paymentMethod === 'credit' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePaymentMethodChange('credit')}
                        className="flex-1 h-12"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Credit
                      </Button>
                    </div>
                  </div>

                  {/* Total & Pay Button */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-medium">Total</span>
                      <span className="text-2xl font-bold">{formatCurrency(cartTotal)}</span>
                    </div>
                    <Button 
                      onClick={handlePay}
                      disabled={cart.length === 0 || (paymentMethod === 'credit' && !selectedCustomer)}
                      className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      Pay {formatCurrency(cartTotal)}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onCreateCustomer={handleCreateCustomer}
        loading={customersLoading}
      />
    </div>
  );
};

export default SalesManagement;
