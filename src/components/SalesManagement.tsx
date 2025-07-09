import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Product, Customer } from '../types';
import { 
  ShoppingCart, 
  Search, 
  X, 
  Trash2, 
  Minus, 
  Plus,
  Banknote,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import AddCustomerModal from './customer/AddCustomerModal';

interface CartItem extends Product {
  quantity: number;
}

const SalesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'credit'>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  const { products } = useSupabaseProducts();
  const { customers, createCustomer } = useSupabaseCustomers();
  const { toast } = useToast();

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get top picks (first 6 products)
  const topPicks = products.slice(0, 6);

  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => total + item.sellingPrice * item.quantity, 0);

  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from cart",
    });
  };

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      const updatedCart = cartItems.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setCartItems(updatedCart);
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    toast({
      title: "Item Added",
      description: `${product.name} added to cart`,
    });
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== productId);
    setCartItems(updatedCart);
    toast({
      title: "Item Removed",
      description: "Item removed from cart",
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      toast({
        title: "Error",
        description: "Product not found",
        variant: "destructive",
      });
      return;
    }

    if (newQuantity > product.currentStock) {
      toast({
        title: "Error",
        description: "Not enough stock",
        variant: "destructive",
      });
      return;
    }

    const updatedCart = cartItems.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
  };

  const handleCustomerSelect = (customerId: string) => {
    if (!customerId) {
      setSelectedCustomer(null);
      return;
    }
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
  };

  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createCustomer(customerData);
      toast({
        title: "Customer Added",
        description: `${customerData.name} has been added.`,
      });
      setShowAddCustomer(false);
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Simulate checkout process
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Checkout Successful",
        description: `Payment of KES ${cartTotal.toFixed(2)} processed via ${paymentMethod}`,
      });
      clearCart();
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 h-14 lg:h-16">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <span className="sr-only">Menu</span>
              </Button>
            </div>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">Sales POS</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSearch(!showSearch)}
              className="lg:hidden w-8 h-8"
            >
              <Search className="w-4 h-4" />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <ShoppingCart className="w-4 h-4" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Product Selection Panel */}
        <div className="flex-1 lg:flex-none lg:w-2/5 flex flex-col bg-white border-r overflow-hidden">
          {/* Search Bar - Desktop Always Visible */}
          <div className={`p-4 border-b ${showSearch || window.innerWidth >= 1024 ? 'block' : 'hidden lg:block'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Top Picks Section */}
          <div className="flex-1 overflow-y-auto">
            {searchTerm ? (
              // Search Results
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">Search Results</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all duration-200 active:scale-95"
                    >
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                      <p className="text-green-600 font-bold">KES {product.sellingPrice}</p>
                      <p className="text-xs text-gray-500">Stock: {product.currentStock}</p>
                    </div>
                  ))}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No products found</p>
                  </div>
                )}
              </div>
            ) : (
              // Top Picks
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">Top Picks</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {topPicks.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all duration-200 active:scale-95 relative overflow-hidden"
                    >
                      <div className="absolute top-1 right-1">
                        <div className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
                          TOP
                        </div>
                      </div>
                      <h3 className="font-medium text-sm mb-1 line-clamp-2 pr-12">{product.name}</h3>
                      <p className="text-green-600 font-bold">KES {product.sellingPrice}</p>
                      <p className="text-xs text-gray-500">Stock: {product.currentStock}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart & Checkout Panel */}
        <div className="hidden lg:flex lg:w-3/5 flex-col bg-gray-50">
          {/* Cart Header */}
          <div className="bg-white p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            {cartItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Cart
              </Button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg mb-2">Your cart is empty</p>
                <p className="text-sm">Add products from the left to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 flex-1 mr-2">{item.name}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">KES {item.sellingPrice} each</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8"
                            disabled={item.quantity >= item.currentStock}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="font-bold text-green-600 min-w-[80px] text-right">
                          KES {(item.sellingPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Section */}
          {cartItems.length > 0 && (
            <div className="bg-white border-t p-4 space-y-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Customer (Optional)</Label>
                <div className="flex gap-2">
                  <Select value={selectedCustomer?.id || ''} onValueChange={handleCustomerSelect}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select customer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Customer</SelectItem>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{customer.name}</span>
                            {customer.outstandingDebt > 0 && (
                              <span className="text-xs text-red-600 ml-2">
                                Debt: KES {customer.outstandingDebt}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddCustomer(true)}
                    className="flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Method</Label>
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  {(['cash', 'mpesa', 'credit'] as const).map(method => (
                    <Button
                      key={method}
                      variant={paymentMethod === method ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 ${
                        paymentMethod === method 
                          ? 'bg-white shadow-sm' 
                          : 'hover:bg-white/50'
                      }`}
                      disabled={method === 'credit' && !selectedCustomer}
                    >
                      {method === 'cash' && <Banknote className="w-4 h-4 mr-1" />}
                      {method === 'mpesa' && <Smartphone className="w-4 h-4 mr-1" />}
                      {method === 'credit' && <CreditCard className="w-4 h-4 mr-1" />}
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                      {method === 'mpesa' && <span className="ml-1 text-xs">M-Pesa</span>}
                    </Button>
                  ))}
                </div>
                {paymentMethod === 'credit' && !selectedCustomer && (
                  <p className="text-xs text-orange-600">Please select a customer for credit sales</p>
                )}
              </div>

              {/* Total and Pay Button */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    KES {cartTotal.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={loading || (paymentMethod === 'credit' && !selectedCustomer)}
                  className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    `Pay KES ${cartTotal.toFixed(2)}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Overlay */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Cart ({cartItems.length})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-red-600 p-1 h-auto"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <span className="font-bold text-green-600">KES {cartTotal.toFixed(2)}</span>
          </div>
          <Button onClick={handleCheckout} className="w-full bg-green-600 hover:bg-green-700">
            Checkout
          </Button>
        </div>
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onSave={handleAddCustomer}
      />
    </div>
  );
};

export default SalesManagement;
