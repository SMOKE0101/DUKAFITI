import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package,
  ShoppingCart,
  Search,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { formatCurrency } from '../utils/currency';
import { Product, Sale } from '../types';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { createSale } = useSupabaseSales();
  const { customers, loading: customersLoading, customers: customerList } = useSupabaseCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<
    { product: Product; quantity: number }[]
  >([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'credit'>(
    'cash'
  );
  const { toast } = useToast();

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.product.sellingPrice * item.quantity,
      0
    );
  }, [cartItems]);

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find((item) => item.product.id === product.id);
    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.product.id !== productId));
  };

  const handleSale = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty. Add products to get started.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare sale items
      const saleItems = cartItems.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        selling_price: item.product.sellingPrice,
        cost_price: item.product.costPrice,
        total_amount: item.product.sellingPrice * item.quantity,
        profit: (item.product.sellingPrice - item.product.costPrice) * item.quantity,
      }));

      // Calculate total amount and profit
      const totalAmount = saleItems.reduce((sum, item) => sum + item.total_amount, 0);
      const totalProfit = saleItems.reduce((sum, item) => sum + item.profit, 0);

      // Customer details
      const customer = customerList.find((c) => c.id === selectedCustomer);
      const customerId = customer ? customer.id : null;
      const customerName = customer ? customer.name : null;

      // Create sale object
      const saleData: Omit<Sale, 'id' | 'timestamp'> = {
        userId: '', // This will be populated by Supabase auth
        productId: '', // This will be populated by Supabase 
        productName: '', // This will be populated by Supabase
        customerId: customerId,
        customerName: customerName,
        quantity: 0, // This will be populated by Supabase
        sellingPrice: 0, // This will be populated by Supabase
        costPrice: 0,
        totalAmount: totalAmount,
        profit: totalProfit,
        paymentMethod: paymentMethod,
        paymentDetails: {},
        synced: true,
      };

      // Create the sale in Supabase
      await createSale(saleData, saleItems);

      // Clear cart and reset state
      setCartItems([]);
      setSelectedCustomer(null);
      setPaymentMethod('cash');

      toast({
        title: "Success",
        description: "Sale completed successfully!",
      });
    } catch (error) {
      console.error("Error completing sale:", error);
      toast({
        title: "Error",
        description: "Failed to complete sale. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
                  POS SYSTEM
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
                  Process sales quickly and efficiently
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Selection */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Select Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Products List */}
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.category}
                        </p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(product.sellingPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Stock: {product.currentStock}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {formatCurrency(item.product.sellingPrice)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="min-w-[2rem] text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {cartItems.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Cart is empty. Add products to get started.
                  </p>
                </div>
              )}

              {cartTotal > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600 dark:text-green-400">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>

                  {/* Customer Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Customer (Optional)
                    </label>
                    <select
                      value={selectedCustomer || ''}
                      onChange={(e) => setSelectedCustomer(e.target.value || null)}
                      className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="">Walk-in Customer</option>
                      {customerList.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'mpesa' | 'credit')}
                      className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleSale}
                    disabled={cartItems.length === 0}
                    className="w-full bg-green-600 hover:bg-green-500 text-white"
                  >
                    Complete Sale
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
