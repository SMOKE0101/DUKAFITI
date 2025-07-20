
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedCustomers } from '../../hooks/useUnifiedCustomers';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { CreditCard, Loader2 } from 'lucide-react';

interface AddDebtModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  onDebtAdded?: () => void;
}

const AddDebtModal: React.FC<AddDebtModalProps> = ({
  open,
  onOpenChange,
  customer,
  onDebtAdded
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { updateCustomer } = useUnifiedCustomers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer || !amount) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const debtAmount = parseFloat(amount);
    if (isNaN(debtAmount) || debtAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await updateCustomer(customer.id, {
        outstandingDebt: (customer.outstandingDebt || 0) + debtAmount,
        totalPurchases: (customer.totalPurchases || 0) + debtAmount,
        lastPurchaseDate: new Date().toISOString(),
      });

      toast({
        title: "Debt Added",
        description: `${formatCurrency(debtAmount)} debt added to ${customer.name}`,
      });

      setAmount('');
      setDescription('');
      onDebtAdded?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding debt:', error);
      toast({
        title: "Error",
        description: "Failed to add debt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setAmount('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Add Debt - {customer?.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter debt amount"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Debt'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDebtModal;
