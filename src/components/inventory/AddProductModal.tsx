
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle } from 'lucide-react';
import { Product } from '../../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const CATEGORIES = [
  'Beverages',
  'Grains', 
  'Household',
  'Snacks',
  'Miscellaneous'
];

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    costPrice: '',
    sellingPrice: '',
    lowStockThreshold: '',
    category: '',
    currentStock: '0'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCodeShaking, setIsCodeShaking] = useState(false);

  const generateCode = () => {
    if (!formData.name.trim()) {
      setIsCodeShaking(true);
      setTimeout(() => setIsCodeShaking(false), 500);
      setErrors(prev => ({ ...prev, code: 'Enter product name first' }));
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, code }));
    setErrors(prev => ({ ...prev, code: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.code.trim()) newErrors.code = 'Product code is required';
    if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) {
      newErrors.costPrice = 'Valid buying price is required';
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = 'Valid selling price is required';
    }
    if (!formData.lowStockThreshold || parseInt(formData.lowStockThreshold) < 0) {
      newErrors.lowStockThreshold = 'Valid threshold is required';
    }
    if (!formData.category) newErrors.category = 'Category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const productData = {
      name: formData.name.trim(),
      category: formData.category,
      costPrice: parseFloat(formData.costPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      currentStock: parseInt(formData.currentStock) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold)
    };

    onSave(productData);
    
    // Reset form
    setFormData({
      name: '',
      code: '',
      costPrice: '',
      sellingPrice: '',
      lowStockThreshold: '',
      category: '',
      currentStock: '0'
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      name: '',
      code: '',
      costPrice: '',
      sellingPrice: '',
      lowStockThreshold: '',
      category: '',
      currentStock: '0'
    });
    setErrors({});
    onClose();
  };

  const isFormValid = formData.name && formData.code && formData.costPrice && 
                     formData.sellingPrice && formData.lowStockThreshold && formData.category;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg rounded-2xl p-8 bg-white dark:bg-gray-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-lg font-semibold">
              Product Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`focus-visible:ring-2 focus-visible:ring-brand-purple ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="Enter product name"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Product Code */}
          <div className="space-y-2">
            <Label htmlFor="code" className="text-lg font-semibold">
              Product Code *
            </Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className={`flex-1 focus-visible:ring-2 focus-visible:ring-brand-purple font-mono ${
                  errors.code ? 'border-red-500' : ''
                } ${isCodeShaking ? 'animate-pulse' : ''}`}
                placeholder="Enter or generate code"
              />
              <Button
                type="button"
                onClick={generateCode}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full p-0"
                variant="ghost"
              >
                <Shuffle className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
            {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
          </div>

          {/* Buying Price */}
          <div className="space-y-2">
            <Label htmlFor="costPrice" className="text-lg font-semibold">
              Buying Price (KES) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                KES
              </span>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                className={`pl-12 focus-visible:ring-2 focus-visible:ring-brand-purple ${
                  errors.costPrice ? 'border-red-500' : ''
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.costPrice && <p className="text-red-500 text-sm">{errors.costPrice}</p>}
          </div>

          {/* Selling Price */}
          <div className="space-y-2">
            <Label htmlFor="sellingPrice" className="text-lg font-semibold">
              Selling Price (KES) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                KES
              </span>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                className={`pl-12 focus-visible:ring-2 focus-visible:ring-brand-purple ${
                  errors.sellingPrice ? 'border-red-500' : ''
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.sellingPrice && <p className="text-red-500 text-sm">{errors.sellingPrice}</p>}
          </div>

          {/* Low-Stock Threshold */}
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold" className="text-lg font-semibold">
              Low-Stock Threshold *
            </Label>
            <Input
              id="lowStockThreshold"
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
              className={`focus-visible:ring-2 focus-visible:ring-brand-purple ${
                errors.lowStockThreshold ? 'border-red-500' : ''
              }`}
              placeholder="10"
            />
            <p className="text-sm text-muted-foreground">Alert when qty ≤ this value</p>
            {errors.lowStockThreshold && <p className="text-red-500 text-sm">{errors.lowStockThreshold}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-lg font-semibold">
              Category *
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className={`bg-gray-100 dark:bg-gray-700 rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-brand-purple ${
                errors.category ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
          </div>

          {/* Initial Quantity */}
          <div className="space-y-2">
            <Label htmlFor="currentStock" className="text-lg font-semibold">
              Initial Quantity
            </Label>
            <Input
              id="currentStock"
              type="number"
              value={formData.currentStock}
              onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
              className="focus-visible:ring-2 focus-visible:ring-brand-purple"
              placeholder="0"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              className="bg-green-600 text-white rounded-lg px-6 py-2 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
