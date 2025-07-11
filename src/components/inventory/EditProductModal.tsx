
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '../../types';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useToast } from '../../hooks/use-toast';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  product: Product | null;
}

const CATEGORIES = [
  'Beverages',
  'Grains', 
  'Household',
  'Snacks',
  'Miscellaneous'
];

const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: '',
    sellingPrice: '',
    lowStockThreshold: '',
    currentStock: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const { updateProduct } = useSupabaseProducts();
  const { toast } = useToast();

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name,
        category: product.category,
        costPrice: product.costPrice.toString(),
        sellingPrice: product.sellingPrice.toString(),
        lowStockThreshold: product.lowStockThreshold?.toString() || '10',
        currentStock: product.currentStock.toString()
      });
      setErrors({});
    }
  }, [product, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
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

  const handleSave = async () => {
    if (!product || !validateForm()) return;

    setLoading(true);

    try {
      const updatedProduct = {
        ...product,
        name: formData.name.trim(),
        category: formData.category,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        currentStock: parseInt(formData.currentStock),
        lowStockThreshold: parseInt(formData.lowStockThreshold)
      };

      await updateProduct(product.id, updatedProduct);
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update product:', error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setErrors({});
    onClose();
  };

  const isFormValid = formData.name && formData.costPrice && 
                     formData.sellingPrice && formData.lowStockThreshold && formData.category;

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`
        ${isMobile 
          ? 'max-w-[95vw] w-full mx-2 max-h-[90vh] overflow-y-auto' 
          : isTablet 
            ? 'max-w-[90vw] w-full max-h-[85vh] overflow-y-auto'
            : 'max-w-lg'
        } 
        rounded-2xl ${isMobile ? 'p-4' : 'p-8'} bg-white dark:bg-gray-800 shadow-xl
      `}>
        <DialogHeader>
          <DialogTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
            Edit Product
          </DialogTitle>
        </DialogHeader>
        
        <div className={`space-y-${isMobile ? '3' : '4'} ${isMobile ? 'max-h-[70vh] overflow-y-auto' : ''}`}>
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
              Product Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`${isMobile ? 'h-12 text-base' : ''} focus-visible:ring-2 focus-visible:ring-brand-purple ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="Enter product name"
              disabled={loading}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Product Code (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="code" className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
              Product Code
            </Label>
            <Input
              id="code"
              value={product.id.slice(0, 8).toUpperCase()}
              className={`${isMobile ? 'h-12 text-base' : ''} bg-gray-100 dark:bg-gray-700 font-mono`}
              disabled
              readOnly
            />
          </div>

          {/* Buying Price */}
          <div className="space-y-2">
            <Label htmlFor="costPrice" className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
              Buying Price (KES) *
            </Label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground ${
                isMobile ? 'text-base' : ''
              }`}>
                KES
              </span>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                className={`${isMobile ? 'h-12 text-base pl-14' : 'pl-12'} focus-visible:ring-2 focus-visible:ring-brand-purple ${
                  errors.costPrice ? 'border-red-500' : ''
                }`}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
            {errors.costPrice && <p className="text-red-500 text-sm">{errors.costPrice}</p>}
          </div>

          {/* Selling Price */}
          <div className="space-y-2">
            <Label htmlFor="sellingPrice" className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
              Selling Price (KES) *
            </Label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground ${
                isMobile ? 'text-base' : ''
              }`}>
                KES
              </span>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                className={`${isMobile ? 'h-12 text-base pl-14' : 'pl-12'} focus-visible:ring-2 focus-visible:ring-brand-purple ${
                  errors.sellingPrice ? 'border-red-500' : ''
                }`}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
            {errors.sellingPrice && <p className="text-red-500 text-sm">{errors.sellingPrice}</p>}
          </div>

          {/* Current Stock */}
          <div className="space-y-2">
            <Label htmlFor="currentStock" className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
              Current Stock
            </Label>
            <Input
              id="currentStock"
              type="number"
              value={formData.currentStock}
              onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
              className={`${isMobile ? 'h-12 text-base' : ''} focus-visible:ring-2 focus-visible:ring-brand-purple`}
              disabled={loading}
            />
          </div>

          {/* Low-Stock Threshold */}
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold" className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
              Low-Stock Threshold *
            </Label>
            <Input
              id="lowStockThreshold"
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
              className={`${isMobile ? 'h-12 text-base' : ''} focus-visible:ring-2 focus-visible:ring-brand-purple ${
                errors.lowStockThreshold ? 'border-red-500' : ''
              }`}
              placeholder="10"
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">Alert when qty ≤ this value</p>
            {errors.lowStockThreshold && <p className="text-red-500 text-sm">{errors.lowStockThreshold}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
              Category *
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              disabled={loading}
            >
              <SelectTrigger className={`${isMobile ? 'h-12 text-base' : ''} bg-gray-100 dark:bg-gray-700 rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-brand-purple ${
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

          {/* Actions */}
          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between'} pt-6`}>
            {isMobile ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={!isFormValid || loading}
                  className="h-12 text-base bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  className="h-12 text-base text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!isFormValid || loading}
                  className="bg-green-600 text-white rounded-lg px-6 py-2 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;
