import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Search,
  Loader2,
  DollarSign,
  Percent,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { Product } from '../types';
import { ScrollArea } from "@/components/ui/scroll-area"

interface CartItem {
  productId: string;
  name: string;
  sellingPrice: number;
  quantity: number;
}

const Index = () => {
  const { products, loading: productsLoading } = useSupabaseProducts();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const changeDue = paymentAmount - total;

  const addToCart = (product: Product) => {
    const existingItemIndex = cartItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
      const updatedCartItems = [...cartItems];
      updatedCartItems[existingItemIndex].quantity += 1;
      setCartItems(updatedCartItems);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        name: product.name,
        sellingPrice: product.sellingPrice,
        quantity: 1,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateCartItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCartItems = cartItems.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setCartItems(updatedCartItems);
  };

  const removeFromCart = (productId: string) => {
    const updatedCartItems = cartItems.filter(item => item.productId !== productId);
    setCartItems(updatedCartItems);
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
    setPaymentAmount(0);
  };

  const ProductGrid = ({ products, onAddToCart, isLoading }: { products: Product[], onAddToCart: (product: Product) => void, isLoading: boolean }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No products found.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-3 flex flex-col justify-between h-40">
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {product.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {product.category}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-gray-700 dark:text-gray-300 font-bold">
                  {formatCurrency(product.sellingPrice)}
                </div>
                <Button size="sm" onClick={() => onAddToCart(product)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const SalesCart = ({ cartItems, onUpdateItem, onClearCart }: { cartItems: CartItem[], onUpdateItem: (productId: string, quantity: number) => void, onClearCart: () => void }) => {
    const hasItems = cartItems.length > 0;

    return (
      <div className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 pl-6 pr-6">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-500" />
            Sales Cart
          </CardTitle>
          {hasItems && (
            <Button variant="ghost" size="sm" onClick={onClearCart}>
              Clear Cart
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 flex-grow overflow-auto">
          {!hasItems ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
              No items in cart.
            </div>
          ) : (
            <ScrollArea className="h-[400px] rounded-md pr-2">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between">
                    <div className="flex-1 flex items-center gap-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onUpdateItem(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onUpdateItem(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-24 text-right font-bold text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.sellingPrice * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>

        {hasItems && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Subtotal:
              </div>
              <div className="font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(subtotal)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Discount ({discount}%):
              </div>
              <div className="font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(discountAmount)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total:
              </div>
              <div className="font-bold text-2xl text-green-600 dark:text-green-400">
                {formatCurrency(total)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Payment:
              </div>
              <Input
                type="number"
                placeholder="0.00"
                className="text-right"
                value={paymentAmount > 0 ? paymentAmount.toFixed(2) : ''}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
            </div>

            {paymentAmount > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Change Due:
                </div>
                <div className={`font-bold text-xl ${changeDue >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(changeDue)}
                </div>
              </div>
            )}

            <Button className="w-full bg-green-600 hover:bg-green-500 text-white">
              Complete Sale
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto py-6 px-4 lg:px-8 flex flex-col lg:flex-row gap-6">
        {/* Product Selection */}
        <div className="w-full lg:w-2/3">
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Select Products</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              
              <ProductGrid
                products={filteredProducts}
                onAddToCart={addToCart}
                isLoading={productsLoading}
              />
            </div>
          </Card>
        </div>
        
        {/* Cart Sidebar */}
        <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <SalesCart
            cartItems={cartItems}
            onUpdateItem={updateCartItem}
            onClearCart={clearCart}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
