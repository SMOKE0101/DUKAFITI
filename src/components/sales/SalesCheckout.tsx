
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SalesService, CreateSaleRequest } from '../../services/salesService';
import { CartItem } from '../../types/cart';
import { Customer } from '../../types';
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

    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: "Sales can only be processed when online. Please check your connection.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('[SalesCheckout] Starting checkout process...');

      // Process each item in the cart as a separate sale
      for (const item of cart) {
        const itemTotal = item.sellingPrice * item.quantity;
        
        const saleRequest: CreateSaleRequest = {
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          costPrice: item.costPrice,
          customerId: selectedCustomerId || undefined,
          customerName: customer?.name || undefined,
          paymentMethod: paymentMethod,
          paymentDetails: {
            cashAmount: paymentMethod === 'cash' ? itemTotal : 0,
            mpesaAmount: paymentMethod === 'mpesa' ? itemTotal : 0,
            debtAmount: paymentMethod === 'debt' ? itemTotal : 0,
          },
        };

        console.log('[SalesCheckout] Processing sale for item:', item.name);

        // Create the sale
        const sale = await SalesService.createSale(user.id, saleRequest);
        console.log('[SalesCheckout] Sale created:', sale.id);

        // Update product stock
        await SalesService.updateProductStock(item.id, item.quantity);

        // Update customer debt if applicable
        if (paymentMethod === 'debt' && selectedCustomerId) {
          await SalesService.updateCustomerDebt(selectedCustomerId, itemTotal);
        }
      }

      toast({
        title: "Sale Completed!",
        description: `Successfully processed ${cart.length} item(s) for ${formatCurrency(total)}.`,
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
    (paymentMethod === 'debt' && !selectedCustomerId) ||
    !isOnline;

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
