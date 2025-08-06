import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUnifiedSales } from '../../hooks/useUnifiedSales';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { useUnifiedCustomers } from '../../hooks/useUnifiedCustomers';
import { CartItem } from '../../types/cart';
import { Customer, Sale } from '../../types';
import { formatCurrency } from '../../utils/currency';
import SplitPaymentSelector, { PaymentMethodType, PaymentSplit } from './SplitPaymentSelector';

interface EnhancedSalesCheckoutProps {
  cart: CartItem[];
  selectedCustomerId: string | null;
  customers: Customer[];
  onCheckoutComplete: () => void;
  isOnline: boolean;
}

const EnhancedSalesCheckout: React.FC<EnhancedSalesCheckoutProps> = ({
  cart,
  selectedCustomerId,
  customers,
  onCheckoutComplete,
  isOnline
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethodType[]>(['cash']);
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();
  const { createSale } = useUnifiedSales();
  const { updateProduct, products } = useUnifiedProducts();
  const { updateCustomer } = useUnifiedCustomers();

  const total = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const customer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;

  const handlePaymentSplitChange = useCallback((splits: PaymentSplit[]) => {
    console.log('[EnhancedSalesCheckout] Payment split changed:', splits);
    setPaymentSplits(splits);
  }, []);

  const handleMethodsChange = useCallback((methods: PaymentMethodType[]) => {
    console.log('[EnhancedSalesCheckout] Payment methods changed:', methods);
    setSelectedMethods(methods);
  }, []);

  const handleCheckout = async () => {
    console.log('[EnhancedSalesCheckout] Starting checkout with split payment:', {
      cart: cart.length,
      selectedCustomerId,
      customer: customer ? {
        id: customer.id,
        name: customer.name,
        currentDebt: customer.outstandingDebt,
      } : null,
      selectedMethods,
      paymentSplits,
      total,
      isOnline
    });

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

    // Validate payment splits
    if (paymentSplits.length === 0) {
      toast({
        title: "Payment Method Required",
        description: "Please select at least one payment method.",
        variant: "destructive",
      });
      return;
    }

    // Check if debt payment requires customer
    const hasDebtPayment = paymentSplits.some(split => split.method === 'debt' && split.amount > 0);
    if (hasDebtPayment && !selectedCustomerId) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for debt transactions.",
        variant: "destructive",
      });
      return;
    }

    // Validate total amounts match
    const splitTotal = paymentSplits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(splitTotal - total) > 0.01) {
      toast({
        title: "Payment Split Error",
        description: "Payment amounts don't add up to the total. Please adjust the split.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('[EnhancedSalesCheckout] Starting checkout process...');

      // For debt sales, update customer debt FIRST
      const debtSplit = paymentSplits.find(split => split.method === 'debt');
      if (debtSplit && debtSplit.amount > 0 && selectedCustomerId && customer) {
        console.log('[EnhancedSalesCheckout] Processing debt portion - updating customer first:', {
          customerId: selectedCustomerId,
          customerName: customer.name,
          currentDebt: customer.outstandingDebt,
          currentTotalPurchases: customer.totalPurchases,
          additionalDebt: debtSplit.amount,
          newTotalDebt: (customer.outstandingDebt || 0) + debtSplit.amount,
          newTotalPurchases: (customer.totalPurchases || 0) + total
        });

        const customerUpdates = {
          outstandingDebt: (customer.outstandingDebt || 0) + debtSplit.amount,
          totalPurchases: (customer.totalPurchases || 0) + total,
          lastPurchaseDate: new Date().toISOString(),
        };
        
        try {
          await updateCustomer(selectedCustomerId, customerUpdates);
          console.log('[EnhancedSalesCheckout] Customer debt updated successfully before sale creation');
          
          // Dispatch immediate event to update UI
          window.dispatchEvent(new CustomEvent('customer-debt-updated', {
            detail: { 
              customerId: selectedCustomerId, 
              newDebt: customerUpdates.outstandingDebt,
              newTotalPurchases: customerUpdates.totalPurchases
            }
          }));
          
        } catch (error) {
          console.error('[EnhancedSalesCheckout] Customer debt update failed:', error);
          throw new Error(`Failed to update customer debt: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Process each item in the cart as a separate sale
      let salesProcessed = 0;
      for (const item of cart) {
        const itemTotal = item.sellingPrice * item.quantity;
        const profit = (item.sellingPrice - item.costPrice) * item.quantity;
        
        // Calculate payment details based on splits proportionally
        const paymentDetails = {
          cashAmount: 0,
          mpesaAmount: 0,
          debtAmount: 0,
          mpesaReference: undefined as string | undefined,
        };

        // Distribute item total across payment methods proportionally
        paymentSplits.forEach(split => {
          const itemPortion = (itemTotal * split.percentage) / 100;
          
          switch (split.method) {
            case 'cash':
              paymentDetails.cashAmount += itemPortion;
              break;
            case 'mpesa':
              paymentDetails.mpesaAmount += itemPortion;
              break;
            case 'debt':
              paymentDetails.debtAmount += itemPortion;
              break;
          }
        });

        // Determine primary payment method for the sale record
        const primarySplit = paymentSplits.reduce((max, split) => 
          split.amount > max.amount ? split : max
        );
        const finalPaymentMethod = paymentSplits.length === 1 ? paymentSplits[0].method : 'partial';
        
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
          paymentMethod: finalPaymentMethod as 'cash' | 'mpesa' | 'debt' | 'partial',
          paymentDetails,
          timestamp: new Date().toISOString(),
        };

        console.log('[EnhancedSalesCheckout] Processing sale for item:', item.name, {
          paymentMethod: finalPaymentMethod,
          paymentDetails,
          itemTotal
        });

        // Create the sale
        await createSale(saleData);
        console.log('[EnhancedSalesCheckout] Sale created for item:', item.name);

        // Update product stock (skip for unspecified quantity products)
        if (item.currentStock !== -1) {
          // Check if this is a variant product
          if (item.parent_id) {
            // For variants, update parent stock using multiplier calculation
            const variantMultiplier = item.variant_multiplier || 1;
            const stockDerivationQty = item.stock_derivation_quantity || 1;
            const parentStockReduction = item.quantity * variantMultiplier * stockDerivationQty;
            
            // Get current parent product from products array
            const parentProduct = products.find(p => p.id === item.parent_id);
            
            if (parentProduct) {
              const currentParentStock = parentProduct.currentStock || 0;
              const newParentStock = Math.max(0, currentParentStock - parentStockReduction);
              
              await updateProduct(item.parent_id, { 
                currentStock: newParentStock,
                updatedAt: new Date().toISOString()
              });
              console.log('[EnhancedSalesCheckout] Parent product stock updated for variant:', item.name, 'Parent stock reduction:', parentStockReduction, 'New parent stock:', newParentStock);
            } else {
              console.log('[EnhancedSalesCheckout] Warning: Parent product not found for variant:', item.name);
            }
          } else {
            // Regular product stock update
            const currentStock = item.currentStock || 0;
            const newStock = Math.max(0, currentStock - item.quantity);
            await updateProduct(item.id, { 
              currentStock: newStock,
              updatedAt: new Date().toISOString()
            });
            console.log('[EnhancedSalesCheckout] Product stock updated:', item.name, 'New stock:', newStock);
          }
        } else {
          console.log('[EnhancedSalesCheckout] Skipping stock update for unspecified quantity product:', item.name);
        }

        salesProcessed++;
      }

      // Show success message
      const successMessage = hasDebtPayment 
        ? `Sale completed with split payment! Customer debt increased by ${formatCurrency(paymentSplits.find(s => s.method === 'debt')?.amount || 0)}.${!isOnline ? ' (will sync when online)' : ''}`
        : `Successfully processed ${salesProcessed} item(s) with split payment for ${formatCurrency(total)}.${!isOnline ? ' (will sync when online)' : ''}`;

      toast({
        title: "Sale Completed!",
        description: successMessage,
      });

      console.log('[EnhancedSalesCheckout] Checkout completed successfully');
      
      // Dispatch final events to ensure all components are notified
      window.dispatchEvent(new CustomEvent('sale-completed'));
      window.dispatchEvent(new CustomEvent('checkout-completed'));
      
      onCheckoutComplete();

    } catch (error) {
      console.error('[EnhancedSalesCheckout] Checkout failed:', error);
      
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
    paymentSplits.length === 0 ||
    (paymentSplits.some(split => split.method === 'debt') && !selectedCustomerId);

  return (
    <div className="space-y-4">
      {/* Split Payment Selector */}
      <SplitPaymentSelector
        total={total}
        selectedMethods={selectedMethods}
        onPaymentSplitChange={handlePaymentSplitChange}
        onMethodsChange={handleMethodsChange}
        requiresCustomer={!selectedCustomerId}
      />

      {/* Customer required message for debt payments */}
      {paymentSplits.some(split => split.method === 'debt') && !selectedCustomerId && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <span>⚠️</span>
            <span>Please select a customer to enable debt payments</span>
          </div>
        </div>
      )}
      
      <Button
        onClick={handleCheckout}
        disabled={isDisabled}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:transform-none active:scale-95 min-h-[56px]"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing Split Payment...
          </div>
        ) : (
          `Complete Sale - ${formatCurrency(total)}`
        )}
      </Button>
    </div>
  );
};

export default EnhancedSalesCheckout;