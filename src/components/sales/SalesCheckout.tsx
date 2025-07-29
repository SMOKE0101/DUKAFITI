
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
  let customer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;
  
  // If customer not found but selectedCustomerId is a temp ID, try to find by name
  if (!customer && selectedCustomerId?.startsWith('temp_')) {
    // Try to find the newest customer (most recently added) as fallback
    const sortedCustomers = [...customers].sort((a, b) => 
      new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
    );
    
    // Use the most recently added real customer if temp customer not found
    const recentRealCustomer = sortedCustomers.find(c => !c.id.startsWith('temp_'));
    if (recentRealCustomer) {
      console.log('[SalesCheckout] Using most recent real customer as fallback:', recentRealCustomer);
      customer = recentRealCustomer;
    }
  }

  // Debug customer lookup
  console.log('[SalesCheckout] Customer lookup:', {
    selectedCustomerId,
    customersCount: customers.length,
    customerFound: !!customer,
    customerData: customer ? { id: customer.id, name: customer.name, debt: customer.outstandingDebt } : null,
    allCustomerIds: customers.map(c => ({ id: c.id, name: c.name })),
    paymentMethod
  });

  const handleCheckout = async () => {
    console.log('[SalesCheckout] handleCheckout called with:', {
      cart: cart.length,
      selectedCustomerId,
      paymentMethod,
      customer: customer ? {
        id: customer.id,
        name: customer.name,
        currentDebt: customer.outstandingDebt,
        totalPurchases: customer.totalPurchases
      } : null,
      total,
      isOnline,
      pendingOperations
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

    if (paymentMethod === 'debt' && !selectedCustomerId) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for debt transactions.",
        variant: "destructive",
      });
      return;
    }

    // For debt sales, ensure customer exists before proceeding
    if (paymentMethod === 'debt' && selectedCustomerId && !customer) {
      // If customer ID is temporary, try to find by name match
      if (selectedCustomerId.startsWith('temp_')) {
        console.log('[SalesCheckout] Temporary customer ID detected, searching by name...');
        
        // Try to find a real customer with similar details in the current list
        const tempCustomerParts = selectedCustomerId.split('_');
        const possibleMatches = customers.filter(c => 
          !c.id.startsWith('temp_') && 
          (c.name.toLowerCase().includes(tempCustomerParts[1]?.toLowerCase() || '') ||
           c.phone.includes(tempCustomerParts[2] || ''))
        );
        
        if (possibleMatches.length > 0) {
          // Use the first match and update the selected customer
          const matchedCustomer = possibleMatches[0];
          console.log('[SalesCheckout] Found matching real customer:', matchedCustomer);
          
          // Update the customer reference to use the matched customer
          customer = matchedCustomer;
          
          toast({
            title: "Customer Updated",
            description: `Using customer: ${matchedCustomer.name}`,
          });
          
          console.log('[SalesCheckout] Proceeding with matched customer for debt sale');
          
        } else {
          console.error('[SalesCheckout] No matching real customer found for temp ID:', selectedCustomerId);
          toast({
            title: "Customer Not Synced",
            description: "The new customer is still syncing. Please wait a moment and try again.",
            variant: "destructive",
          });
          return;
        }
      } else {
        console.error('[SalesCheckout] Customer not found for debt sale:', {
          selectedCustomerId,
          availableCustomers: customers.map(c => ({ id: c.id, name: c.name })),
          paymentMethod,
          customersLoaded: customers.length > 0
        });
        
        toast({
          title: "Customer Not Found",
          description: "The selected customer could not be found. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }
    }

    // Add extra validation and logging for debt sales
    if (paymentMethod === 'debt') {
      console.log('[SalesCheckout] Processing debt sale with validation:', {
        hasSelectedCustomerId: !!selectedCustomerId,
        customerExists: !!customer,
        customerDetails: customer ? {
          id: customer.id,
          name: customer.name,
          currentDebt: customer.outstandingDebt,
          totalPurchases: customer.totalPurchases
        } : null
      });
    }

    setIsProcessing(true);

    try {
      console.log('[SalesCheckout] Starting checkout process...');

      // For debt sales, update customer debt FIRST to ensure it's processed
      if (paymentMethod === 'debt' && selectedCustomerId && customer) {
        // Use the actual customer ID (might be different from selectedCustomerId if we matched a temp customer)
        const actualCustomerId = customer.id;
        
        console.log('[SalesCheckout] Processing debt sale - updating customer first:', {
          selectedCustomerId,
          actualCustomerId,
          customerName: customer.name,
          currentDebt: customer.outstandingDebt,
          currentTotalPurchases: customer.totalPurchases,
          additionalDebt: total,
          newTotalDebt: (customer.outstandingDebt || 0) + total,
          newTotalPurchases: (customer.totalPurchases || 0) + total
        });

        const customerUpdates = {
          outstandingDebt: (customer.outstandingDebt || 0) + total,
          totalPurchases: (customer.totalPurchases || 0) + total,
          lastPurchaseDate: new Date().toISOString(),
        };
        
        try {
          // Update customer debt first and wait for it to complete - use actual customer ID
          await updateCustomer(actualCustomerId, customerUpdates);
          console.log('[SalesCheckout] Customer debt updated successfully before sale creation');
          
          // Dispatch immediate event to update UI
          window.dispatchEvent(new CustomEvent('customer-debt-updated', {
            detail: { 
              customerId: selectedCustomerId, 
              newDebt: customerUpdates.outstandingDebt,
              newTotalPurchases: customerUpdates.totalPurchases
            }
          }));
          
        } catch (error) {
          console.error('[SalesCheckout] Customer debt update failed:', error);
          // For debt sales, if customer update fails, we should not proceed
          throw new Error(`Failed to update customer debt: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Process each item in the cart as a separate sale
      let salesProcessed = 0;
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
          customerId: customer?.id || selectedCustomerId || undefined,
          customerName: customer?.name || undefined,
          paymentMethod: paymentMethod,
          paymentDetails: {
            cashAmount: paymentMethod === 'cash' ? itemTotal : 0,
            mpesaAmount: paymentMethod === 'mpesa' ? itemTotal : 0,
            debtAmount: paymentMethod === 'debt' ? itemTotal : 0,
          },
          timestamp: new Date().toISOString(),
        };

        console.log('[SalesCheckout] Processing sale for item:', item.name);

        // Create the sale
        await createSale(saleData);
        console.log('[SalesCheckout] Sale created for item:', item.name);

        // Update product stock (skip for unspecified quantity products)
        if (item.currentStock !== -1) {
          const currentStock = item.currentStock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          await updateProduct(item.id, { 
            currentStock: newStock,
            updatedAt: new Date().toISOString()
          });
          console.log('[SalesCheckout] Product stock updated:', item.name, 'New stock:', newStock);
        } else {
          console.log('[SalesCheckout] Skipping stock update for unspecified quantity product:', item.name);
        }

        salesProcessed++;
      }

      // Show success message
      const successMessage = paymentMethod === 'debt' 
        ? `Sale completed! Customer debt increased by ${formatCurrency(total)}.${!isOnline ? ' (will sync when online)' : ''}`
        : `Successfully processed ${salesProcessed} item(s) for ${formatCurrency(total)}.${!isOnline ? ' (will sync when online)' : ''}`;

      toast({
        title: "Sale Completed!",
        description: successMessage,
      });

      console.log('[SalesCheckout] Checkout completed successfully');
      
      // Dispatch final events to ensure all components are notified
      window.dispatchEvent(new CustomEvent('sale-completed'));
      window.dispatchEvent(new CustomEvent('checkout-completed'));
      
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
    <div className="space-y-2">
      {/* Customer required message for debt payments */}
      {paymentMethod === 'debt' && !selectedCustomerId && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
          Please select a customer for debt transactions
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
            Processing Sale...
          </div>
        ) : (
          `Complete Sale - ${formatCurrency(total)}`
        )}
      </Button>
    </div>
  );
};

export default SalesCheckout;
