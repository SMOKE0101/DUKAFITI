
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUnifiedSales } from '../../hooks/useUnifiedSales';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { useUnifiedCustomers } from '../../hooks/useUnifiedCustomers';
import { useUnifiedSyncManager } from '../../hooks/useUnifiedSyncManager';
import { CartItem } from '../../types/cart';
import { Customer, Sale } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface SalesCheckoutProps {
  cart: CartItem[];
  selectedCustomerId: string | null;
  paymentMethod: 'cash' | 'mpesa' | 'debt';
  customers: Customer[];
  onCheckoutComplete: () => void;
  isOnline: boolean;
}

const SalesCheckout: React.FC<SalesCheckoutProps> = ({
  cart,
  selectedCustomerId,
  paymentMethod,
  customers,
  onCheckoutComplete,
  isOnline
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { createSale } = useUnifiedSales();
  const { updateProduct } = useUnifiedProducts();
  const { updateCustomer } = useUnifiedCustomers();
  const { pendingOperations } = useUnifiedSyncManager();

  const total = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const customer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete the sale.",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'debt' && !selectedCustomerId) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for debt transactions.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('[SalesCheckout] Starting checkout process...', {
        cart,
        paymentMethod,
        selectedCustomerId,
        customer
      });

      // Calculate total debt amount for this transaction
      let totalDebtAmount = 0;

      // Process each item in the cart as a separate sale
      for (const item of cart) {
        const itemTotal = item.sellingPrice * item.quantity;
        const profit = (item.sellingPrice - item.costPrice) * item.quantity;
        
        const saleData: Omit<Sale, 'id' | 'synced'> = {
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          costPrice: item.costPrice,
          profit: profit,
          total: itemTotal,
          customerId: selectedCustomerId || undefined,
          customerName: customer?.name || undefined,
          paymentMethod: paymentMethod,
          paymentDetails: {
            cashAmount: paymentMethod === 'cash' ? itemTotal : 0,
            mpesaAmount: paymentMethod === 'mpesa' ? itemTotal : 0,
            debtAmount: paymentMethod === 'debt' ? itemTotal : 0,
          },
          timestamp: new Date().toISOString(),
        };

        // Add to total debt if this is a debt transaction
        if (paymentMethod === 'debt') {
          totalDebtAmount += itemTotal;
        }

        console.log('[SalesCheckout] Processing sale for item:', item.name, saleData);

        // Create the sale - this will handle both local updates and offline queuing
        await createSale(saleData);
        console.log('[SalesCheckout] Sale created for item:', item.name);

        // Update product stock - this will handle both local updates and offline queuing
        const currentStock = item.currentStock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        await updateProduct(item.id, { 
          currentStock: newStock,
          updatedAt: new Date().toISOString()
        });
        console.log('[SalesCheckout] Product stock updated:', item.name, 'New stock:', newStock);
      }

      // Update customer debt if this is a debt transaction
      if (paymentMethod === 'debt' && selectedCustomerId && customer && totalDebtAmount > 0) {
        console.log('[SalesCheckout] Updating customer debt:', {
          customerId: selectedCustomerId,
          currentDebt: customer.outstandingDebt,
          additionalDebt: totalDebtAmount,
          newTotalDebt: (customer.outstandingDebt || 0) + totalDebtAmount
        });

        const updates = {
          outstandingDebt: (customer.outstandingDebt || 0) + totalDebtAmount,
          totalPurchases: (customer.totalPurchases || 0) + totalDebtAmount,
          lastPurchaseDate: new Date().toISOString(),
        };
        
        await updateCustomer(selectedCustomerId, updates);
        console.log('[SalesCheckout] Customer debt updated successfully');
      }

      toast({
        title: "Sale Completed!",
        description: `Successfully processed ${cart.length} item(s) for ${formatCurrency(total)}${!isOnline ? ' (will sync when online)' : ''}.${paymentMethod === 'debt' ? ` Customer debt increased by ${formatCurrency(totalDebtAmount)}.` : ''}`,
      });

      console.log('[SalesCheckout] Checkout completed successfully');
      onCheckoutComplete();

    } catch (error) {
      console.error('[SalesCheckout] Checkout failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast({
        title: "Checkout Failed",
        description: `Unable to complete sale: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = isProcessing || 
    cart.length === 0 || 
    (paymentMethod === 'debt' && !selectedCustomerId);

  return (
    <Button
      onClick={handleCheckout}
      disabled={isDisabled}
      className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:transform-none active:scale-95 min-h-[56px]"
    >
      {isProcessing ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Processing Sale...
        </div>
      ) : (
        `💳 Complete Sale - ${formatCurrency(total)}`
      )}
    </Button>
  );
};

export default SalesCheckout;
