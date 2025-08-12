
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUnifiedSales } from '../../hooks/useUnifiedSales';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { useUnifiedCustomers } from '../../hooks/useUnifiedCustomers';
import { useUnifiedSyncManager } from '../../hooks/useUnifiedSyncManager';
import { CartItem } from '../../types/cart';
import { Customer, Sale } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { ChevronDown } from 'lucide-react';

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
  const { updateProduct, products } = useUnifiedProducts();
  const { updateCustomer } = useUnifiedCustomers();
  const { pendingOperations } = useUnifiedSyncManager();

  const [showRefInput, setShowRefInput] = useState(false);
  const [salesReference, setSalesReference] = useState('');

  const total = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const customer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;

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

    setIsProcessing(true);

    try {
      console.log('[SalesCheckout] Starting checkout process...');
      // Generate a clientSaleId for this checkout session to ensure idempotency across items
      const clientSaleId = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // For debt sales, rely on database trigger to update customer aggregates
      // This avoids double-counting and ensures consistency


      // Process each item in the cart as a separate sale
      let salesProcessed = 0;
      for (const item of cart) {
        const itemTotal = item.sellingPrice * item.quantity;
        const profit = item.costPrice > 0 ? (item.sellingPrice - item.costPrice) * item.quantity : 0;
        
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
            saleReference: salesReference || undefined,
          },
          timestamp: new Date().toISOString(),
          clientSaleId: clientSaleId,
        };

        console.log('[SalesCheckout] Processing sale for item:', item.name);

        // Create the sale
        await createSale(saleData);
        console.log('[SalesCheckout] Sale created for item:', item.name);

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
              console.log('[SalesCheckout] Parent product stock updated for variant:', item.name, 'Parent stock reduction:', parentStockReduction, 'New parent stock:', newParentStock);
            } else {
              console.log('[SalesCheckout] Warning: Parent product not found for variant:', item.name);
            }
          } else {
            // Regular product stock update
            const currentStock = item.currentStock || 0;
            const newStock = Math.max(0, currentStock - item.quantity);
            await updateProduct(item.id, { 
              currentStock: newStock,
              updatedAt: new Date().toISOString()
            });
            console.log('[SalesCheckout] Product stock updated:', item.name, 'New stock:', newStock);
          }
        } else {
          console.log('[SalesCheckout] Skipping stock update for unspecified quantity product:', item.name);
        }

        salesProcessed++;
       }

      // Customer aggregates are updated by DB trigger; no extra client-side updates

 
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

      {/* Toggle for Sales Reference */}
      <div className="flex justify-end">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setShowRefInput(v => !v)} aria-expanded={showRefInput} aria-controls="sales-ref-input">
          <ChevronDown className={`h-4 w-4 transition-transform ${showRefInput ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      {showRefInput && (
        <Input
          id="sales-ref-input"
          placeholder="Sales reference (optional)"
          value={salesReference}
          onChange={(e) => setSalesReference(e.target.value)}
          className="w-full"
        />
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
