import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseCustomers } from '@/hooks/useSupabaseCustomers';
import { useSupabaseSales } from '@/hooks/useSupabaseSales';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/currency';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddDebtModal = ({ isOpen, onClose }: AddDebtModalProps) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const { customers, updateCustomer } = useSupabaseCustomers();
  const { user } = useAuth();
  const { toast } = useToast();

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const currentDebt = selectedCustomer?.outstandingDebt || 0;
  const newAmount = parseFloat(amount) || 0;
  const totalDebt = currentDebt + newAmount;

  const isFormValid = selectedCustomerId && amount && newAmount > 0;

  const handleSubmit = async () => {
    if (!isFormValid || !user || !selectedCustomer) return;

    setIsSubmitting(true);
    try {
      // Create a debt sale record
      const saleData = {
        user_id: user.id,
        product_id: 'debt-record', // Special product ID for debt records
        product_name: 'Credit Sale',
        quantity: 1,
        selling_price: newAmount,
        cost_price: 0,
        profit: 0,
        total_amount: newAmount,
        customer_id: selectedCustomerId,
        customer_name: selectedCustomer.name,
        payment_method: 'debt',
        payment_details: {
          debtAmount: newAmount,
          cashAmount: 0,
          mpesaAmount: 0,
        },
        timestamp: new Date().toISOString(),
      };

      const { error: saleError } = await supabase
        .from('sales')
        .insert([saleData]);

      if (saleError) {
        console.error('Error creating debt sale:', saleError);
        throw new Error('Failed to record debt sale.');
      }

      // Update customer's outstanding debt
      await updateCustomer(selectedCustomer.id, {
        outstandingDebt: totalDebt,
        lastPurchaseDate: new Date().toISOString(),
      });

      toast({
        title: "Debt Recorded",
        description: `${formatCurrency(newAmount)} debt added for ${selectedCustomer.name}`,
      });

      // Reset form and close modal
      setSelectedCustomerId('');
      setAmount('');
      onClose();

    } catch (error) {
      console.error('Error recording debt:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record debt",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCustomerId('');
    setAmount('');
    onClose();
  };

  const content = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer" className="text-sm font-medium">
            Customer
          </Label>
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} — {customer.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">
            Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-mono">
              KES
            </span>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-12 font-mono"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {selectedCustomer && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Debt Summary</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Debt:</span>
                <span className="font-mono">{formatCurrency(currentDebt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Amount:</span>
                <span className="font-mono">{formatCurrency(newAmount)}</span>
              </div>
              <div className="border-t pt-1 flex justify-between font-medium">
                <span>Total Debt:</span>
                <span className="font-mono text-red-600 dark:text-red-400">
                  {formatCurrency(totalDebt)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={handleClose}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          {isSubmitting ? 'Saving...' : 'Save Debt'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Record Credit Sale</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Credit Sale</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default AddDebtModal;