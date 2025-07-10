
import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { formatCurrency } from '../../utils/currency';
import { Customer, Sale } from '../../types';

interface NewRepaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onRepaymentSaved: () => void;
}

const NewRepaymentDrawer: React.FC<NewRepaymentDrawerProps> = ({
  isOpen,
  onClose,
  customer,
  onRepaymentSaved
}) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'mpesa'>('cash');
  const [mpesaRef, setMpesaRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updateCustomer } = useSupabaseCustomers();
  const { createSales } = useSupabaseSales();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset form when drawer opens
      setAmount('');
      setMethod('cash');
      setMpesaRef('');
      setNotes('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid repayment amount",
        variant: "destructive",
      });
      return;
    }

    const repaymentAmount = parseFloat(amount);
    
    if (repaymentAmount > customer.outstandingDebt) {
      toast({
        title: "Amount Too Large",
        description: "Repayment amount cannot exceed outstanding debt",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create repayment sale record with proper type mapping
      const repaymentSale: Omit<Sale, 'id'> = {
        productId: 'repayment',
        productName: 'Customer Repayment',
        quantity: 1,
        sellingPrice: -repaymentAmount, // Negative to indicate repayment
        costPrice: 0,
        profit: 0,
        timestamp: new Date().toISOString(),
        synced: true,
        customerId: customer.id,
        customerName: customer.name,
        paymentMethod: method,
        paymentDetails: {
          cashAmount: method === 'cash' ? repaymentAmount : 0,
          mpesaAmount: method === 'mpesa' ? repaymentAmount : 0,
          debtAmount: 0,
          mpesaReference: method === 'mpesa' ? mpesaRef : undefined,
        },
        total: -repaymentAmount, // Negative total for repayment
      };

      // Save the repayment record
      await createSales([repaymentSale]);

      // Update customer's outstanding debt
      const newDebt = Math.max(0, customer.outstandingDebt - repaymentAmount);
      await updateCustomer(customer.id, {
        outstandingDebt: newDebt,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: `Repayment of ${formatCurrency(repaymentAmount)} recorded successfully`,
      });

      onRepaymentSaved();
      onClose();
    } catch (error) {
      console.error('Error recording repayment:', error);
      toast({
        title: "Error",
        description: "Failed to record repayment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Record Repayment</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{customer.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Customer Info */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900 dark:text-white">{customer.name}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Outstanding Debt: <span className="font-medium text-red-600">{formatCurrency(customer.outstandingDebt)}</span></p>
              <p>Phone: {customer.phone}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Repayment Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={customer.outstandingDebt}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="method">Payment Method *</Label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value as 'cash' | 'mpesa')}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                required
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
              </select>
            </div>

            {method === 'mpesa' && (
              <div>
                <Label htmlFor="mpesaRef">M-Pesa Reference</Label>
                <Input
                  id="mpesaRef"
                  value={mpesaRef}
                  onChange={(e) => setMpesaRef(e.target.value)}
                  placeholder="e.g., QEI2S4X2Z9"
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this repayment..."
                rows={3}
              />
            </div>

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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording...' : 'Record Repayment'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default NewRepaymentDrawer;
