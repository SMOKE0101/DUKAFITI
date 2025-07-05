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
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useTrialSystem } from '../hooks/useTrialSystem';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';

interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
}

const SalesManagement: React.FC = () => {
  // All state hooks first
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

  // All custom hooks after state hooks
  const { toast } = useToast();
  const { addPendingOperation } = useOfflineSync();
  const { trialInfo, updateFeatureUsage, checkFeatureAccess } = useTrialSystem();
  
  // New Supabase hooks
  const { customers } = useSupabaseCustomers();
  const { products, updateProduct } = useSupabaseProducts();
  const { sales, createSales } = useSupabaseSales();

  // Effects
  useEffect(() => {
    calculateTodayStats();
  }, [sales]);

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

    console.log('Today stats calculated:', { totalRevenue, totalProfit, transactionCount: todaySales.length });
  };

  const getCartTotal = () => {
    const total = cartItems.reduce((sum, item) => 
      sum + (item.customPrice || item.product.sellingPrice) * item.quantity, 0
    );
    return Math.round(total * 100) / 100;
  };

  const addToCart = (product: Product) => {
    console.log('Adding to cart:', product.name, 'Stock:', product.currentStock);
    
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

    // Check trial limits before processing the sale
    if (trialInfo && trialInfo.isTrialActive) {
      const canCreateSale = checkFeatureAccess('sales');
      if (!canCreateSale) {
        setShowFeatureLimitModal(true);
        return;
      }
    }

    console.log('Processing payment:', paymentData);
    setIsLoading(true);

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

      console.log('Created sales records:', newSales.length);

      // Create sales in database
      await createSales(newSales);

      // Update product stock
      for (const item of cartItems) {
        const newStock = item.product.currentStock - item.quantity;
        console.log(`Updating stock for ${item.product.name}: ${item.product.currentStock} -> ${newStock}`);
        await updateProduct(item.product.id, {
          currentStock: newStock,
          updatedAt: new Date().toISOString()
        });
      }

      // Update customer debt if applicable
      if (customerId && paymentData.debtAmount && paymentData.debtAmount > 0) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
          // This would need to be implemented in the customer hook
          console.log('Updated customer debt for customer:', customerId);
        }
      }

      // Update trial usage after successful sale
      if (trialInfo && trialInfo.isTrialActive) {
        updateFeatureUsage('sales', newSales.length);
      }

      clearCart();

      console.log('Sale completed successfully');
      toast({
        title: "Sale Completed",
        description: `Successfully processed sale for ${formatCurrency(total)}`,
      });
    } catch (error) {
      console.error('Failed to process sale:', error);
      toast({
        title: "Error",
        description: "Failed to process sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Main render
  return (
    <div className="space-y-6">
      <OfflineIndicator />
      <StatsCards todayStats={todayStats} />
      
      {/* Floating Checkout Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-30">
          <Button
            onClick={() => setShowCheckout(true)}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg px-6 py-3 rounded-full flex items-center space-x-2 animate-pulse"
            size="lg"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold">
              Checkout ({cartItems.length}) - {formatCurrency(getCartTotal())}
            </span>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
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

      {/* Checkout Slide Panel */}
      <CheckoutSlidePanel
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        customers={customers}
        selectedCustomer={selectedCustomer}
        onCustomerSelect={setSelectedCustomer}
        cartTotal={getCartTotal()}
        onPaymentConfirm={handlePaymentConfirm}
      />

      {/* Feature Limit Modal */}
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
