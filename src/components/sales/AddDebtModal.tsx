import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useSupabaseCustomers } from '@/hooks/useSupabaseCustomers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currency';
import { DollarSign, UserPlus, AlertTriangle, TrendingUp } from 'lucide-react';
import AddCustomerModal from './AddCustomerModal';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddDebtModal = ({ isOpen, onClose }: AddDebtModalProps) => {
  const { customers, updateCustomer } = useSupabaseCustomers();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const totalAmount = parseFloat(debtAmount) || 0;

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedCustomerId('');
      setDebtAmount('');
      setNotes('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId || !debtAmount || totalAmount <= 0) {
      toast({
        title: "Missing Information",
        description: "Please select a customer and enter a valid debt amount.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to record debt.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create transaction record for cash lending
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          customer_id: selectedCustomerId,
          item_id: null, // No product for cash lending
          quantity: 1,
          unit_price: totalAmount,
          total_amount: totalAmount,
          notes: notes || 'Cash lending transaction',
          paid: false,
        });

      if (transactionError) {
        throw new Error('Failed to create transaction record');
      }

      // Update customer debt
      if (selectedCustomer) {
        const currentDebt = selectedCustomer.outstandingDebt || 0;
        const updatedDebt = currentDebt + totalAmount;
        
        await updateCustomer(selectedCustomer.id, {
          outstandingDebt: updatedDebt,
          lastPurchaseDate: new Date().toISOString(),
        });
      }

      toast({
        title: "Cash Lending Recorded",
        description: `Debt of ${formatCurrency(totalAmount)} recorded for ${selectedCustomer?.name}`,
      });

      // Reset form and close
      setSelectedCustomerId('');
      setDebtAmount('');
      setNotes('');
      onClose();
      
    } catch (error) {
      console.error('Error recording debt:', error);
      toast({
        title: "Error",
        description: "Failed to record debt transaction.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[95vh] w-[95vw] overflow-y-auto">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              Record Cash Lending
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Record a cash loan to a customer that will be tracked as debt
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-4" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span>Customer</span>
                <Badge variant="destructive" className="text-xs">Required</Badge>
              </Label>
              <div className="flex gap-2">
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                >
                  <SelectTrigger className="flex-1 h-11">
                    <SelectValue placeholder="Choose a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        No customers found. Add a customer first.
                      </div>
                    ) : (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {customer.phone}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddCustomer(true)}
                  className="h-11 w-11 shrink-0"
                  title="Add new customer"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Debt Amount */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span>Debt Amount</span>
                <Badge variant="destructive" className="text-xs">Required</Badge>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="debtAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 h-11 text-lg font-semibold"
                />
              </div>
            </div>

            {/* Amount Summary */}
            {totalAmount > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="font-semibold text-red-700 dark:text-red-300 text-sm">
                    Debt Summary
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600 dark:text-red-400">
                      Amount to lend:
                    </span>
                    <span className="text-xl font-bold text-red-700 dark:text-red-300">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Debt Info */}
            {selectedCustomer && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-amber-700 dark:text-amber-300 text-sm">
                    Customer Debt Analysis
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-600 dark:text-amber-400">Current debt:</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      {formatCurrency(selectedCustomer.outstandingDebt || 0)}
                    </span>
                  </div>
                  <Separator className="bg-amber-200 dark:bg-amber-800" />
                  <div className="flex justify-between items-center">
                    <span className="text-amber-600 dark:text-amber-400">New total debt:</span>
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                      {formatCurrency((selectedCustomer.outstandingDebt || 0) + totalAmount)}
                    </span>
                  </div>
                  {selectedCustomer.creditLimit && (selectedCustomer.outstandingDebt || 0) + totalAmount > selectedCustomer.creditLimit && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-2 mt-2">
                      <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Warning: This will exceed the customer's credit limit of {formatCurrency(selectedCustomer.creditLimit)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this cash lending transaction..."
                rows={3}
                className="resize-none"
              />
            </div>

            <Separator className="my-6" />

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold"
                disabled={isProcessing || !selectedCustomerId || !debtAmount || totalAmount <= 0}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Recording...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Record Cash Lending
                  </div>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <AddCustomerModal
          open={showAddCustomer}
          onOpenChange={setShowAddCustomer}
          onCustomerAdded={(customer) => {
            setSelectedCustomerId(customer.id);
            setShowAddCustomer(false);
          }}
        />
      )}
    </>
  );
};

export default AddDebtModal;