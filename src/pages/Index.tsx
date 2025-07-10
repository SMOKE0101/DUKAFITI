
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSupabaseProducts } from "../hooks/useSupabaseProducts";
import { useSupabaseCustomers } from "../hooks/useSupabaseCustomers";
import ProductGrid from "../components/ProductGrid";
import SalesCart from "../components/SalesCart";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingCart } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const { products, loading } = useSupabaseProducts();
  const { customers } = useSupabaseCustomers();
  const [cartItems, setCartItems] = useState<any[]>([]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Welcome to Your Store
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Please sign in to access your dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const addToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const updateCartItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.id !== productId));
    } else {
      setCartItems(cartItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Title - Consistent with other pages */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
                  POINT OF SALE
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
                  Process sales and manage transactions
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Package className="w-4 h-4" />
                  <span>{products.length} Products Available</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ShoppingCart className="w-4 h-4" />
                  <span>{cartItems.length} Items in Cart</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Grid - Takes up 2/3 of the space */}
          <div className="lg:col-span-2">
            <ProductGrid 
              products={products} 
              onAddToCart={addToCart}
            />
          </div>
          
          {/* Sales Cart - Takes up 1/3 of the space */}
          <div className="lg:col-span-1">
            <SalesCart
              cartItems={cartItems}
              customers={customers}
              onUpdateItem={updateCartItem}
              onClearCart={clearCart}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
