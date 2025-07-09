
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Product } from '../../types';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quantity: number, buyingPrice: number) => void;
  product: Product | null;
}

const RestockModal: React.FC<RestockModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const [quantity, setQuantity] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!quantity || parseInt(quantity) <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (!buyingPrice || parseFloat(buyingPrice) <= 0) {
      newErrors.buyingPrice = 'Valid buying price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSave(parseInt(quantity), parseFloat(buyingPrice));
    
    // Reset form
    setQuantity('');
    setBuyingPrice('');
    setErrors({});
  };

  const handleClose = () => {
    setQuantity('');
    setBuyingPrice('');
    setErrors({});
    onClose();
  };

  const isFormValid = quantity && buyingPrice;
  const newTotal = product ? product.currentStock + (parseInt(quantity) || 0) : 0;
  const totalCost = parseFloat(buyingPrice) * parseInt(quantity) || 0;

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Restock Product
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-foreground">{product.name}</h3>
            <p className="text-sm text-muted-foreground">
              Current Stock: {product.currentStock} units
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                Quantity to Add *
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`focus-visible:ring-2 focus-visible:ring-brand-purple ${
                  errors.quantity ? 'border-red-500' : ''
                }`}
                placeholder="0"
              />
              {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
            </div>

            {/* Buying Price */}
            <div className="space-y-2">
              <Label htmlFor="buyingPrice" className="text-sm font-medium">
                Buying Price (KES) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                  KES
                </span>
                <Input
                  id="buyingPrice"
                  type="number"
                  step="0.01"
                  value={buyingPrice}
                  onChange={(e) => setBuyingPrice(e.target.value)}
                  className={`pl-12 focus-visible:ring-2 focus-visible:ring-brand-purple ${
                    errors.buyingPrice ? 'border-red-500' : ''
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.buyingPrice && <p className="text-red-500 text-sm">{errors.buyingPrice}</p>}
            </div>

            {/* Summary */}
            {quantity && buyingPrice && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-2">
                <h4 className="font-medium text-green-800 dark:text-green-300">Restock Summary</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New Total Stock:</span>
                    <span className="font-medium">{newTotal} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Cost:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="flex-1 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid}
                className="flex-1 bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Restock
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestockModal;
