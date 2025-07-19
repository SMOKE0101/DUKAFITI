
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SalesService } from '../../services/salesService';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { Plus } from 'lucide-react';

interface RecordSaleModalProps {
  onSaleRecorded: () => void;
  isOnline: boolean;
}

const RecordSaleModal: React.FC<RecordSaleModalProps> = ({ onSaleRecorded, isOnline }) => {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    quantity: 1,
    paymentMethod: 'cash' as 'cash' | 'mpesa' | 'debt',
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { products } = useSupabaseProducts();
  const { customers } = useSupabaseCustomers();

  const selectedProduct = products.find(p => p.id === formData.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedProduct) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: "Sales recording requires an internet connection",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      const total = selectedProduct.sellingPrice * formData.quantity;

      await SalesService.createSale(user.id, {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: formData.quantity,
        sellingPrice: selectedProduct.sellingPrice,
        costPrice: selectedProduct.costPrice,
        customerId: formData.customerId || undefined,
        customerName: selectedCustomer?.name || undefined,
        paymentMethod: formData.paymentMethod,
        paymentDetails: {
          cashAmount: formData.paymentMethod === 'cash' ? total : 0,
          mpesaAmount: formData.paymentMethod === 'mpesa' ? total : 0,
          debtAmount: formData.paymentMethod === 'debt' ? total : 0,
        },
      });

      // Update product stock
      await SalesService.updateProductStock(selectedProduct.id, formData.quantity);

      // Update customer debt if applicable
      if (formData.paymentMethod === 'debt' && formData.customerId) {
        await SalesService.updateCustomerDebt(formData.customerId, total);
      }

      toast({
        title: "Sale Recorded",
        description: `Successfully recorded sale of ${formData.quantity} ${selectedProduct.name}`,
      });

      setOpen(false);
      setFormData({
        productId: '',
        customerId: '',
        quantity: 1,
        paymentMethod: 'cash',
      });
      onSaleRecorded();

    } catch (error) {
      console.error('Failed to record sale:', error);
      toast({
        title: "Recording Failed",
        description: "Failed to record the sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Record Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record New Sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product">Product *</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.sellingPrice} (Stock: {product.currentStock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="customer">Customer (Optional)</Label>
            <Select
              value={formData.customerId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Walk-in Customer</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={selectedProduct?.currentStock || 1}
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="payment">Payment Method *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value: 'cash' | 'mpesa' | 'debt') => 
                setFormData(prev => ({ ...prev, paymentMethod: value }))
              }
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="debt">Debt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm">
                <strong>Total: </strong>
                {(selectedProduct.sellingPrice * formData.quantity).toFixed(2)}
              </p>
              <p className="text-sm text-green-600">
                <strong>Profit: </strong>
                {((selectedProduct.sellingPrice - selectedProduct.costPrice) * formData.quantity).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing || !isOnline} className="flex-1">
              {isProcessing ? 'Recording...' : 'Record Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordSaleModal;
