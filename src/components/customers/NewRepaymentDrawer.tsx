
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { DollarSign, Calendar, FileText, CreditCard } from 'lucide-react';

interface NewRepaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const NewRepaymentDrawer: React.FC<NewRepaymentDrawerProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const { toast } = useToast();
  const { updateCustomer } = useSupabaseCustomers();
  
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer || !formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (!formData.paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    const paymentAmount = parseFloat(formData.amount);
    if (paymentAmount > customer.outstandingDebt) {
      toast({
        title: "Amount Too High",
        description: "Payment amount cannot exceed outstanding debt",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update customer's outstanding debt
      const newOutstandingDebt = Math.max(0, customer.outstandingDebt - paymentAmount);
      
      await updateCustomer(customer.id, {
        outstandingDebt: newOutstandingDebt,
        lastPurchaseDate: new Date().toISOString()
      });

      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(paymentAmount)} recorded successfully`,
      });

      // Reset form
      setFormData({
        amount: '',
        paymentMethod: '',
        notes: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    setFormData({
      amount: '',
      paymentMethod: '',
      notes: ''
    });
    onClose();
  };

  if (!customer) return null;

  const remainingAfterPayment = customer.outstandingDebt - parseFloat(formData.amount || '0');

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <SheetTitle className="font-mono text-xl font-black uppercase tracking-wider text-gray-900 dark:text-white">
            RECORD PAYMENT
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Customer Info */}
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white mb-3">
              CUSTOMER DETAILS
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium text-gray-900 dark:text-white">{customer.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Outstanding:</span>
                <Badge variant="destructive" className="rounded-full">
                  {formatCurrency(customer.outstandingDebt)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                PAYMENT AMOUNT (KES) *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={customer.outstandingDebt}
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="pl-10 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  placeholder="0.00"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                PAYMENT METHOD *
              </Label>
              <Select 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:border-green-500">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <SelectValue placeholder="Select payment method" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 border-gray-300 dark:border-gray-600">
                  <SelectItem value="cash" className="rounded-lg">Cash</SelectItem>
                  <SelectItem value="mpesa" className="rounded-lg">M-Pesa</SelectItem>
                  <SelectItem value="bank_transfer" className="rounded-lg">Bank Transfer</SelectItem>
                  <SelectItem value="card" className="rounded-lg">Card Payment</SelectItem>
                  <SelectItem value="other" className="rounded-lg">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                NOTES (OPTIONAL)
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="pl-10 min-h-[80px] border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                  placeholder="Add any additional notes about this payment..."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Payment Summary */}
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <div className="border-2 border-green-300 dark:border-green-700 rounded-xl p-4 bg-green-50/50 dark:bg-green-900/10">
                <h4 className="font-mono text-sm font-bold uppercase tracking-wide text-green-800 dark:text-green-300 mb-3">
                  PAYMENT SUMMARY
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Payment Amount:</span>
                    <span className="font-medium text-green-700 dark:text-green-300">
                      {formatCurrency(parseFloat(formData.amount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Remaining Debt:</span>
                    <span className={`font-medium ${
                      remainingAfterPayment > 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {formatCurrency(Math.max(0, remainingAfterPayment))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-full font-mono font-bold uppercase tracking-wide"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                disabled={!formData.amount || !formData.paymentMethod || isSubmitting}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full font-mono font-bold uppercase tracking-wide"
              >
                {isSubmitting ? 'RECORDING...' : 'RECORD PAYMENT'}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NewRepaymentDrawer;
