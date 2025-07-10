
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { X, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';

interface RepaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const RepaymentDrawer: React.FC<RepaymentDrawerProps> = ({ isOpen, onClose, customer }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { updateCustomer } = useSupabaseCustomers();
  const { user } = useAuth();

  const handleSavePayment = async () => {
    if (!customer || !amount || parseFloat(amount) <= 0 || !user) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentAmount = parseFloat(amount);
      const newBalance = Math.max(0, customer.outstandingDebt - paymentAmount);
      
      // Use a transaction to ensure data integrity
      const { error: transactionError } = await supabase.rpc('record_customer_payment', {
        p_customer_id: customer.id,
        p_payment_amount: paymentAmount,
        p_payment_method: method,
        p_payment_reference: reference || null,
        p_user_id: user.id,
        p_customer_name: customer.name
      });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        
        // Fallback to manual transaction handling
        console.log('Attempting manual transaction...');
        
        // Step 1: Create payment record first
        const { data: paymentData, error: salesError } = await supabase
          .from('sales')
          .insert({
            user_id: user.id,
            customer_id: customer.id,
            customer_name: customer.name,
            product_id: '00000000-0000-0000-0000-000000000000',
            product_name: 'Payment Received',
            quantity: 1,
            selling_price: -paymentAmount,
            cost_price: 0,
            total_amount: -paymentAmount,
            profit: 0,
            payment_method: method,
            payment_details: reference ? { reference } : {},
            timestamp: new Date().toISOString()
          })
          .select()
          .single();

        if (salesError) {
          console.error('Error creating payment record:', salesError);
          throw new Error(`Failed to record payment: ${salesError.message}`);
        }

        console.log('Payment record created:', paymentData);

        // Step 2: Update customer balance only after payment record is created
        const { error: updateError } = await updateCustomer(customer.id, {
          outstandingDebt: newBalance,
          lastPurchaseDate: new Date().toISOString()
        });

        if (updateError) {
          console.error('Error updating customer balance:', updateError);
          // Rollback: Delete the payment record if customer update fails
          await supabase.from('sales').delete().eq('id', paymentData.id);
          throw new Error('Failed to update customer balance. Payment not recorded.');
        }
      }

      // Reset form
      setAmount('');
      setMethod('cash');
      setReference('');
      
      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(paymentAmount)} recorded for ${customer.name}`,
      });

      onClose();
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setMethod('cash');
    setReference('');
    onClose();
  };

  const content = (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-display font-semibold">Record Payment</h3>
        {customer && (
          <div className="space-y-1 mt-2">
            <p className="text-muted-foreground">{customer.name}</p>
            <p className="text-sm text-muted-foreground">
              Outstanding: <span className="font-medium text-red-600">{formatCurrency(customer.outstandingDebt)}</span>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="amount">Payment Amount (KES)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              KES
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-12"
              placeholder="0.00"
              max={customer?.outstandingDebt || 0}
            />
          </div>
          {customer && parseFloat(amount) > customer.outstandingDebt && (
            <p className="text-sm text-yellow-600 mt-1">
              Amount exceeds outstanding debt. Excess will be credited.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="method">Payment Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="reference">Reference (Optional)</Label>
          <Input
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={method === 'mpesa' ? 'M-Pesa code' : 'Payment reference'}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="ghost"
          onClick={handleClose}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSavePayment}
          disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? 'Recording...' : 'Save Payment'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="px-6 pb-6">
          <DrawerHeader className="text-center pb-0">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4 p-2"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
            <DrawerTitle className="sr-only">Record Payment</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">Record Payment</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-4 top-4 p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default RepaymentDrawer;
