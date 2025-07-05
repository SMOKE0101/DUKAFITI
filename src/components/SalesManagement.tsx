import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { formatCurrency } from '../utils/currency';
import { Sale, Product, Customer } from '../types';
import SalesCart from './SalesCart';
import StatsCards from './StatsCards';
import ProductGrid from './ProductGrid';
import CheckoutSlidePanel from './CheckoutSlidePanel';
import OfflineIndicator from './OfflineIndicator';
import FeatureLimitModal from './trial/FeatureLimitModal';
import LoadingSkeleton from './ui/loading-skeleton';
import ErrorState from './ui/error-state';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useTrialSystem } from '../hooks/useTrialSystem';
import { TouchFriendlyButton } from '@/components/ui/touch-friendly-button';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';

interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
}

const SalesManagement: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeatureLimitModal, setShowFeatureLimitModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [todayStats, setTodayStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    transactionCount: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const { addPendingOperation } = useOfflineSync();
  const { trialInfo, updateFeatureUsage, checkFeatureAccess } = useTrialSystem();
  
  const { customers, loading: customersLoading, error: customersError } = useSupabaseCustomers();
  const { products, updateProduct, loading: productsLoading, error: productsError } = useSupabaseProducts();
  const { sales, createSales, loading: salesLoading, error: salesError } = useSupabaseSales();

  useEffect(() => {
    calculateTodayStats();
  }, [sales]);

  useEffect(() => {
    if (customersError || productsError || salesError) {
      setError(customersError || productsError || salesError || 'An error occurred');
    }
  }, [customersError, productsError, salesError]);

  const calculateTodayStats = () => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(sale => 
      new Date(sale.timestamp).toDateString() === today
    );

    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = todaySales.reduce((sum, sale) => sum + sale.profit, 0);

    setTodayStats({
      totalRevenue,
      totalProfit,
      transactionCount: todaySales.length,
    });
  };

  const getCartTotal = () => {
    const total = cartItems.reduce((sum, item) => 
      sum + (item.customPrice || item.product.sellingPrice) * item.quantity, 0
    );
    return Math.round(total * 100) / 100;
  };

  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }

    const existingItem = cartItems.find(item => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.currentStock) {
        toast({
          title: "Stock Limit Reached",
          description: `Only ${product.currentStock} units available`,
          variant: "destructive",
        });
        return;
      }
      updateCartQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCartItems(prev => [...prev, { product, quantity: 1 }]);
      toast({
        title: "Added to Cart",
        description: `${product.name} added to cart`,
      });
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const updateCartPrice = (productId: string, price: number) => {
    setCartItems(prev => prev.map(item => 
      item.product.id === productId ? { ...item, customPrice: price } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setShowCheckout(false);
  };

  const handlePaymentConfirm = async (paymentData: {
    method: string;
    customerId?: string;
    cashAmount?: number;
    mpesaAmount?: number;
    debtAmount?: number;
    mpesaReference?: string;
  }) => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before processing sale",
        variant: "destructive",
      });
      return;
    }

    if (trialInfo && trialInfo.isTrialActive) {
      const canCreateSale = checkFeatureAccess('sales');
      if (!canCreateSale) {
        setShowFeatureLimitModal(true);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const total = getCartTotal();
      const customerId = selectedCustomer?.id || paymentData.customerId;
      const customerName = selectedCustomer?.name || 
        (paymentData.customerId ? customers.find(c => c.id === paymentData.customerId)?.name : undefined);

      const newSales = cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        sellingPrice: item.customPrice || item.product.sellingPrice,
        costPrice: item.product.costPrice,
        profit: ((item.customPrice || item.product.sellingPrice) - item.product.costPrice) * item.quantity,
        timestamp: new Date().toISOString(),
        synced: false,
        customerId,
        customerName,
        paymentMethod: paymentData.method as 'cash' | 'mpesa' | 'debt' | 'partial',
        paymentDetails: {
          cashAmount: paymentData.cashAmount || 0,
          mpesaAmount: paymentData.mpesaAmount || 0,
          debtAmount: paymentData.debtAmount || 0,
          mpesaReference: paymentData.mpesaReference,
        },
        total: (item.customPrice || item.product.sellingPrice) * item.quantity,
      }));

      await createSales(newSales);

      for (const item of cartItems) {
        const newStock = item.product.currentStock - item.quantity;
        await updateProduct(item.product.id, {
          currentStock: newStock,
          updatedAt: new Date().toISOString()
        });
      }

      if (trialInfo && trialInfo.isTrialActive) {
        updateFeatureUsage('sales', newSales.length);
      }

      clearCart();

      toast({
        title: "Sale Completed",
        description: `Successfully processed sale for ${formatCurrency(total)}`,
      });
    } catch (error) {
      console.error('Failed to process sale:', error);
      setError('Failed to process sale. Please try again.');
      toast({
        title: "Error",
        description: "Failed to process sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    window.location.reload();
  };

  if (productsLoading || salesLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="card" className="h-32" />
        <LoadingSkeleton variant="grid" count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState 
        title="Unable to Load Sales Dashboard"
        message={error}
        onRetry={handleRetry}
        variant="page"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <OfflineIndicator />
      <StatsCards todayStats={todayStats} />
      
      {/* Floating Checkout Button - Mobile Optimized */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-4 right-4 z-30">
          <TouchFriendlyButton
            onClick={() => setShowCheckout(true)}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg px-4 sm:px-6 py-3 rounded-full flex items-center space-x-2 animate-pulse min-h-[56px]"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
            <span className="font-semibold text-sm sm:text-base">
              Checkout ({cartItems.length}) - {formatCurrency(getCartTotal())}
            </span>
          </TouchFriendlyButton>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <ProductGrid
          products={products}
          onAddToCart={addToCart}
          isLoading={isLoading}
        />

        <SalesCart
          cartItems={cartItems}
          onUpdateQuantity={updateCartQuantity}
          onUpdatePrice={updateCartPrice}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
        />
      </div>

      <CheckoutSlidePanel
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        customers={customers}
        selectedCustomer={selectedCustomer}
        onCustomerSelect={setSelectedCustomer}
        cartTotal={getCartTotal()}
        onPaymentConfirm={handlePaymentConfirm}
      />

      <FeatureLimitModal
        isOpen={showFeatureLimitModal}
        onClose={() => setShowFeatureLimitModal(false)}
        feature="sales"
        limit={trialInfo?.limits.sales || 100}
      />
    </div>
  );
};

export default SalesManagement;
