import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUnifiedSales } from '../../hooks/useUnifiedSales';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { useUnifiedCustomers } from '../../hooks/useUnifiedCustomers';
import { CartItem } from '../../types/cart';
import { Customer, Sale } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { User, UserPlus, Receipt, Banknote, DollarSign, AlertTriangle } from 'lucide-react';
import AddCustomerModal from './AddCustomerModal';

interface NewSalesCheckoutProps {
  cart: CartItem[];
  onCheckoutComplete: () => void;
  isOnline: boolean;
  customers: Customer[];
  onCustomersRefresh: () => void;
}

const NewSalesCheckout: React.FC<NewSalesCheckoutProps> = ({
  cart,
  onCheckoutComplete,
  isOnline,
  customers: initialCustomers,
  onCustomersRefresh
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'debt'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const { createSale } = useUnifiedSales();
  const { updateProduct } = useUnifiedProducts();
  const { updateCustomer, customers: hookCustomers, createCustomer } = useUnifiedCustomers();

  // Get all available customers (unified from hook)
  const allCustomers = useMemo(() => {
    return hookCustomers.length > 0 ? hookCustomers : initialCustomers;
  }, [hookCustomers, initialCustomers]);

  // Update selected customer when customer list changes or selection changes
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = allCustomers.find(c => c.id === selectedCustomerId);
      console.log('[NewSalesCheckout] Updating selected customer:', {
        selectedCustomerId,
        found: customer ? { id: customer.id, name: customer.name, debt: customer.outstandingDebt } : null,
        totalCustomers: allCustomers.length
      });
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [selectedCustomerId, allCustomers]);

  const total = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);

  const handleCustomerAdded = useCallback(async (newCustomer: Customer) => {
    console.log('[NewSalesCheckout] Customer added:', newCustomer);
    
    // Immediately select the new customer and update UI
    setSelectedCustomer(newCustomer);
    setSelectedCustomerId(newCustomer.id);
    setIsAddCustomerModalOpen(false);
    
    // Refresh customers from parent
    onCustomersRefresh();
    
    toast({
      title: "Customer Added",
      description: `${newCustomer.name} has been added and selected.`,
    });
  }, [onCustomersRefresh, toast]);

  const handleCheckout = async () => {
    console.log('[NewSalesCheckout] Starting checkout:', {
      cart: cart.length,
      selectedCustomerId,
      selectedCustomer: selectedCustomer ? {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        debt: selectedCustomer.outstandingDebt
      } : null,
      paymentMethod,
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

    if (paymentMethod === 'debt' && !selectedCustomerId) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for debt transactions.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'debt' && selectedCustomerId && !selectedCustomer) {
      toast({
        title: "Customer Not Found",
        description: "The selected customer could not be found. Please select a different customer.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // For debt sales, update customer debt using direct approach
      let updatedCustomer = selectedCustomer;
      if (paymentMethod === 'debt' && selectedCustomer) {
        console.log('[NewSalesCheckout] Processing debt sale - updating customer:', {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          currentDebt: selectedCustomer.outstandingDebt,
          additionalDebt: total,
          newTotalDebt: (selectedCustomer.outstandingDebt || 0) + total
        });

        const customerUpdates = {
          outstandingDebt: (selectedCustomer.outstandingDebt || 0) + total,
          totalPurchases: (selectedCustomer.totalPurchases || 0) + total,
          lastPurchaseDate: new Date().toISOString(),
        };
        
        // Update customer immediately in local state
        updatedCustomer = { ...selectedCustomer, ...customerUpdates };
        setSelectedCustomer(updatedCustomer);
        
        try {
          // Handle temp customers differently
          if (selectedCustomer.id.startsWith('temp_')) {
            console.log('[NewSalesCheckout] Temp customer - skipping database update until sync');
          } else {
            await updateCustomer(selectedCustomer.id, customerUpdates);
            console.log('[NewSalesCheckout] Customer debt updated successfully');
          }
        } catch (error) {
          console.error('[NewSalesCheckout] Customer debt update failed:', error);
          // For temp customers or sync failures, we'll proceed with the sale
          // The debt will be applied when the customer syncs
          console.log('[NewSalesCheckout] Continuing with sale despite customer update failure');
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
          customerId: updatedCustomer?.id || undefined,
          customerName: updatedCustomer?.name || undefined,
          paymentMethod: paymentMethod,
          paymentDetails: {
            cashAmount: paymentMethod === 'cash' ? itemTotal : 0,
            mpesaAmount: paymentMethod === 'mpesa' ? itemTotal : 0,
            debtAmount: paymentMethod === 'debt' ? itemTotal : 0,
          },
          timestamp: new Date().toISOString(),
        };

        console.log('[NewSalesCheckout] Creating sale for item:', item.name);
        await createSale(saleData);

        // Update product stock (skip for unspecified quantity products)
        if (item.currentStock !== -1) {
          const currentStock = item.currentStock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          await updateProduct(item.id, { 
            currentStock: newStock,
            updatedAt: new Date().toISOString()
          });
          console.log('[NewSalesCheckout] Product stock updated:', item.name, 'New stock:', newStock);
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

      console.log('[NewSalesCheckout] Checkout completed successfully');
      
      // Reset states
      setSelectedCustomerId(null);
      setPaymentMethod('cash');
      
      onCheckoutComplete();

    } catch (error) {
      console.error('[NewSalesCheckout] Checkout failed:', error);
      
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
    (paymentMethod === 'debt' && !selectedCustomer);

  return (
    <div className="space-y-6 p-6 bg-background">
      {/* Customer Selection */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-3 block text-foreground">Customer Selection</label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select 
                value={selectedCustomerId || 'no-customer'} 
                onValueChange={(value) => {
                  const newCustomerId = value === 'no-customer' ? null : value;
                  console.log('[NewSalesCheckout] Customer selection changed:', {
                    oldId: selectedCustomerId,
                    newId: newCustomerId,
                    availableCustomers: allCustomers.length
                  });
                  setSelectedCustomerId(newCustomerId);
                }}
              >
                <SelectTrigger className="flex-1 h-12 bg-background border border-border hover:border-primary/50 transition-colors">
                  <SelectValue>
                    {selectedCustomer ? (
                      <div className="flex flex-col items-start w-full">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-primary" />
                          <span className="font-medium">{selectedCustomer.name}</span>
                        </div>
                        {selectedCustomer.outstandingDebt > 0 && (
                          <span className="text-xs text-red-600 font-medium mt-1">
                            Outstanding Debt: {formatCurrency(selectedCustomer.outstandingDebt)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User size={14} />
                        <span>No Customer Selected</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-customer">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-muted-foreground" />
                      <span>No Customer</span>
                    </div>
                  </SelectItem>
                  {allCustomers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex flex-col items-start w-full">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-primary" />
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-xs text-muted-foreground">({customer.phone})</span>
                        </div>
                        {customer.outstandingDebt > 0 && (
                          <span className="text-xs text-red-600 font-medium mt-1">
                            Debt: {formatCurrency(customer.outstandingDebt)}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 border-border hover:border-primary/50 transition-colors"
                onClick={() => setIsAddCustomerModalOpen(true)}
              >
                <UserPlus size={16} />
              </Button>
            </div>
            
            {/* Customer Debt Display */}
            {selectedCustomer && selectedCustomer.outstandingDebt > 0 && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle size={14} />
                    <span className="text-sm font-medium">Customer has outstanding debt</span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Current debt: {formatCurrency(selectedCustomer.outstandingDebt)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Payment Method</label>
          <div className="flex gap-2">
            <Button
              variant={paymentMethod === 'cash' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMethod('cash')}
              className="flex-1"
            >
              <Banknote size={14} className="mr-1" />
              Cash
            </Button>
            <Button
              variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMethod('mpesa')}
              className="flex-1"
            >
              <DollarSign size={14} className="mr-1" />
              M-Pesa
            </Button>
            <Button
              variant={paymentMethod === 'debt' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMethod('debt')}
              className="flex-1"
            >
              <Receipt size={14} className="mr-1" />
              Debt
            </Button>
          </div>
        </div>
      </div>

      {/* Customer Required Warning */}
      {paymentMethod === 'debt' && !selectedCustomer && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle size={14} />
              <span className="text-sm font-medium">Customer required for debt transactions</span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Please select a customer or add a new one to proceed with debt payment.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cart Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total:</span>
            <span className="font-bold text-xl text-primary">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Button */}
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

      {/* Add Customer Modal */}
      <AddCustomerModal
        open={isAddCustomerModalOpen}
        onOpenChange={setIsAddCustomerModalOpen}
        onCustomerAdded={handleCustomerAdded}
      />
    </div>
  );
};

export default NewSalesCheckout;