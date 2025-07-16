
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Product } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants/categories';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  existingProduct?: Product | null;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingProduct
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: existingProduct?.name || '',
    category: existingProduct?.category || '',
    cost_price: existingProduct?.cost_price || 0,
    selling_price: existingProduct?.selling_price || 0,
    current_stock: existingProduct ? existingProduct.current_stock : 0,
    low_stock_threshold: existingProduct?.low_stock_threshold || 10
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      cost_price: 0,
      selling_price: 0,
      current_stock: 0,
      low_stock_threshold: 10
    });
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Validation Error", 
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    if (formData.cost_price <= 0 || formData.selling_price <= 0) {
      toast({
        title: "Validation Error",
        description: "Prices must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.selling_price <= formData.cost_price) {
      toast({
        title: "Validation Warning",
        description: "Selling price should be higher than cost price for profit",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const productData = {
        user_id: '',
        name: formData.name.trim(),
        category: formData.category,
        cost_price: formData.cost_price,
        selling_price: formData.selling_price,
        current_stock: formData.current_stock,
        low_stock_threshold: formData.low_stock_threshold
      };

      await onSave(productData);
      
      toast({
        title: "Success",
        description: existingProduct ? "Product updated successfully" : "Product added successfully",
      });
      
      handleClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price (KES) *</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                placeholder="0.00"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price (KES) *</Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                placeholder="0.00"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="current_stock">Initial Stock</Label>
              <Input
                id="current_stock"
                type="number"
                min="0"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                placeholder="10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Saving...' : existingProduct ? 'Update Product' : 'Add Product'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="w-full"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
