
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';

interface NewRepaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

const NewRepaymentDrawer: React.FC<NewRepaymentDrawerProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { updateCustomer } = useSupabaseCustomers();
  const { createSales } = useSupabaseSales();
  const { toast } = useToast();
  const { user } = useAuth();

  // Reset form when customer changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setPaymentMethod('cash');
      setNotes('');
      setIsSubmitting(false);
    }
  }, [isOpen, customer.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to record repayments",
        variant: "destructive",
      });
      return;
    }

    const repaymentAmount = parseFloat(amount);
    
    if (!repaymentAmount || repaymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid repayment amount",
        variant: "destructive",
      });
      return;
    }

    if (repaymentAmount > customer.outstandingDebt) {
      toast({
        title: "Amount Too High",
        description: "Repayment amount cannot exceed outstanding debt",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate new outstanding debt
      const newOutstandingDebt = customer.outstandingDebt - repaymentAmount;

      // Start a transaction to ensure atomicity
      const { error: customerUpdateError } = await supabase
        .from('customers')
        .update({ 
          outstanding_debt: newOutstandingDebt,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      if (customerUpdateError) {
        throw customerUpdateError;
      }

      // Record the repayment as a sales entry with negative amount
      const repaymentSale = {
        user_id: user.id,
        product_id: '00000000-0000-0000-0000-000000000000', // Dummy product ID for repayments
        product_name: 'Customer Repayment',
        customer_id: customer.id,
        customer_name: customer.name,
        quantity: 1,
        selling_price: -repaymentAmount, // Negative amount for repayment
        cost_price: 0,
        total_amount: -repaymentAmount,
        profit: 0,
        payment_method: paymentMethod,
        payment_details: {
          type: 'repayment',
          notes: notes,
          original_debt: customer.outstandingDebt,
          remaining_debt: newOutstandingDebt,
          cashAmount: paymentMethod === 'cash' ? repaymentAmount : 0,
          mpesaAmount: paymentMethod === 'mpesa' ? repaymentAmount : 0,
          debtAmount: 0
        },
        timestamp: new Date().toISOString(),
        synced: true
      };

      await createSales([repaymentSale]);

      // Update the local customer state
      await updateCustomer(customer.id, {
        outstandingDebt: newOutstandingDebt
      });

      toast({
        title: "Repayment Recorded",
        description: `Successfully recorded ${formatCurrency(repaymentAmount)} repayment from ${customer.name}`,
      });

      onClose();
    } catch (error) {
      console.error('Error recording repayment:', error);
      toast({
        title: "Error",
        description: "Failed to record repayment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Record Repayment</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white">{customer.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{customer.phone}</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400 mt-2">
              Outstanding Debt: {formatCurrency(customer.outstandingDebt)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Repayment Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={customer.outstandingDebt}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Maximum: {formatCurrency(customer.outstandingDebt)}
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'mpesa')}
                className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                required
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this repayment..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-500"
                disabled={isSubmitting || !amount}
              >
                {isSubmitting ? 'Recording...' : 'Record Repayment'}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NewRepaymentDrawer;
