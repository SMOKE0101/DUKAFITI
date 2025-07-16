
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Package } from 'lucide-react';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSave: (quantity: number, buyingPrice: number) => Promise<void>;
}

const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    quantity: 10,
    buyingPrice: product.cost_price || 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.buyingPrice < 0) {
      toast({
        title: "Validation Error",
        description: "Buying price cannot be negative",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData.quantity, formData.buyingPrice);
      
      toast({
        title: "Stock Added",
        description: `Added ${formData.quantity} units to ${product.name}`,
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to add stock:', error);
      toast({
        title: "Error",
        description: "Failed to add stock. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const newStockLevel = product.current_stock + formData.quantity;
  const totalCost = formData.quantity * formData.buyingPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Restock Product
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Product Information</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Stock:</span>
                <span className="font-medium">{product.current_stock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Cost Price:</span>
                <span className="font-medium">{formatCurrency(product.cost_price)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Add *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                placeholder="10"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyingPrice">Buying Price per Unit *</Label>
              <div className="relative">
                <Input
                  id="buyingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.buyingPrice}
                  onChange={(e) => setFormData({ ...formData, buyingPrice: parseFloat(e.target.value) || 0 })}
                  className="pl-12"
                  placeholder="0.00"
                  disabled={isLoading}
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  KES
                </span>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">New Stock Level:</span>
                  <span className="font-medium text-green-700">{newStockLevel} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Cost:</span>
                  <span className="font-medium text-green-700">{formatCurrency(totalCost)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                type="submit" 
                disabled={isLoading || formData.quantity <= 0}
                className="w-full"
              >
                {isLoading ? 'Adding Stock...' : 'Add Stock'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="w-full"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestockModal;
