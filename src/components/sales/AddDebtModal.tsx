import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseCustomers } from '@/hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currency';
import { DollarSign, UserPlus } from 'lucide-react';
import AddCustomerModal from './AddCustomerModal';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddDebtModal = ({ isOpen, onClose }: AddDebtModalProps) => {
  const { customers, updateCustomer } = useSupabaseCustomers();
  const { products } = useSupabaseProducts();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const totalAmount = parseFloat(unitPrice) * quantity || 0;

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setUnitPrice(product.sellingPrice.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId || !selectedProductId || !unitPrice || quantity <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
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
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          customer_id: selectedCustomerId,
          item_id: selectedProductId,
          quantity,
          unit_price: parseFloat(unitPrice),
          total_amount: totalAmount,
          notes,
          paid: false,
        });

      if (transactionError) {
        throw new Error('Failed to create transaction record');
      }

      // Update customer debt
      if (selectedCustomer) {
        const updatedDebt = selectedCustomer.outstandingDebt + totalAmount;
        const updatedPurchases = selectedCustomer.totalPurchases + totalAmount;
        
        await updateCustomer(selectedCustomer.id, {
          outstandingDebt: updatedDebt,
          totalPurchases: updatedPurchases,
          lastPurchaseDate: new Date().toISOString(),
        });
      }

      // Update product stock
      if (selectedProduct && selectedProduct.currentStock > 0) {
        const newStock = Math.max(0, selectedProduct.currentStock - quantity);
        const { error: stockError } = await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', selectedProductId);

        if (stockError) {
          console.error('Error updating stock:', stockError);
        }
      }

      toast({
        title: "Debt Recorded",
        description: `Credit sale of ${formatCurrency(totalAmount)} recorded for ${selectedCustomer?.name}`,
      });

      // Reset form and close
      setSelectedCustomerId('');
      setSelectedProductId('');
      setQuantity(1);
      setUnitPrice('');
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <DollarSign className="w-5 h-5" />
              Record Credit Sale
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddCustomer(true)}
                  title="Add new customer"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select
                value={selectedProductId}
                onValueChange={handleProductChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.sellingPrice)}
                      {product.currentStock <= 0 && " (Out of Stock)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity and Unit Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Total Amount Display */}
            {totalAmount > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-red-700 dark:text-red-300">
                    Total Credit Amount:
                  </span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this credit sale..."
                rows={3}
              />
            </div>

            {/* Customer Debt Info */}
            {selectedCustomer && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Current Debt:</span>
                    <span className="font-medium text-yellow-700 dark:text-yellow-300">
                      {formatCurrency(selectedCustomer.outstandingDebt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Total Debt:</span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">
                      {formatCurrency(selectedCustomer.outstandingDebt + totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isProcessing || !selectedCustomerId || !selectedProductId || !unitPrice || quantity <= 0}
              >
                {isProcessing ? "Recording..." : "Record Credit Sale"}
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