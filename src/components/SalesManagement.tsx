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
import { Plus, Minus, ShoppingCart, User, Search, X, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../hooks/use-toast';
import AddCustomerModal from './customers/AddCustomerModal';

interface CartItem {
  product: Product;
  quantity: number;
}

const SalesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const { products } = useSupabaseProducts();
  const { customers } = useSupabaseCustomers();
  const { createSale } = useSupabaseSales();
  const { toast } = useToast();

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total whenever cart changes
  useEffect(() => {
    const newTotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    setCart(updatedCart);
  };

  const increaseQuantity = (productId: string) => {
    const updatedCart = cart.map(item =>
      item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item
    );
    setCart(updatedCart);
  };

  const decreaseQuantity = (productId: string) => {
    const updatedCart = cart.map(item =>
      item.product.id === productId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
    );
    setCart(updatedCart);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleCreateCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Placeholder for createCustomer function
    console.log('Creating customer:', customerData);
    toast({
      title: "Customer Added",
      description: `${customerData.name} has been added successfully.`,
    });
    setShowCustomerModal(false);
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

    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for this sale.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Payment Amount Required",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    const saleItems = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      sellingPrice: item.product.sellingPrice,
    }));

    const saleData = {
      customerId: selectedCustomer.id,
      items: saleItems,
      total: total,
      paymentAmount: parseFloat(paymentAmount),
      timestamp: new Date().toISOString(),
    };

    try {
      await createSale(saleData);
      toast({
        title: "Sale Completed",
        description: "Sale recorded successfully!",
      });
      clearCart();
      setIsPaymentComplete(true);
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: "Failed to record sale. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearCart = () => {
    setCart([]);
    setTotal(0);
    setSelectedCustomer(null);
    setPaymentAmount('');
    setIsPaymentComplete(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Product List */}
      <div className="w-1/2 p-4">
        <Card className="h-full shadow-md">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Products</CardTitle>
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100vh-150px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <div className="text-center">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(product.sellingPrice)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Stock: {product.currentStock}
                        </p>
                      </div>
                      <Button onClick={() => addToCart(product)} className="mt-3 w-full">
                        <Plus className="mr-2 h-4 w-4" /> Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Sales Cart */}
      <div className="w-1/2 p-4">
        <Card className="h-full shadow-md">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Sales Cart</CardTitle>
            <Button variant="outline" onClick={clearCart}>
              Clear Cart
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <ScrollArea className="flex-grow">
              {cart.length === 0 ? (
                <div className="text-center p-4">
                  <ShoppingCart className="mx-auto h-6 w-6 text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between p-3 rounded-md bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(item.product.sellingPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => decreaseQuantity(item.product.id)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button size="icon" variant="ghost" onClick={() => increaseQuantity(item.product.id)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => removeFromCart(item.product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-4" />

            {/* Customer Selection */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Customer</h4>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 rounded-md bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    <div>
                      <p className="font-medium">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedCustomer.phone}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setShowCustomerModal(true)}>
                    <User className="mr-2 h-4 w-4" /> Select Customer
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCustomerModal(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Customer
                  </Button>
                </div>
              )}
            </div>

            {/* Payment Section */}
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Total:</h4>
                <span className="text-xl font-semibold">{formatCurrency(total)}</span>
              </div>
              <Input
                type="number"
                placeholder="Payment Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mb-3"
              />
              <Button className="w-full" onClick={handleCompleteSale} disabled={isPaymentComplete}>
                {isPaymentComplete ? "Sale Completed" : "Complete Sale"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSave={handleCreateCustomer}
      />
    </div>
  );
};

export default SalesManagement;
