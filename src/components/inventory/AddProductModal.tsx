
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle } from 'lucide-react';
import { Product } from '../../types';
import { useToast } from '../../hooks/use-toast';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
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
    lowStockThreshold: '10',
    category: '',
    currentStock: '0'
  });

  const [isUnspecifiedQuantity, setIsUnspecifiedQuantity] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const generateCode = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Enter Product Name",
        description: "Please enter the product name first to generate a code.",
        variant: "destructive",
      });
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, code }));
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "Product Name Required",
        description: "Please enter a product name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.code.trim()) {
      toast({
        title: "Product Code Required",
        description: "Please enter or generate a product code.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) {
      toast({
        title: "Valid Buying Price Required",
        description: "Please enter a valid buying price greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      toast({
        title: "Valid Selling Price Required",
        description: "Please enter a valid selling price greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(formData.sellingPrice) < parseFloat(formData.costPrice)) {
      toast({
        title: "Invalid Price Range",
        description: "Selling price must be greater than or equal to buying price.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Category Required",
        description: "Please select a product category.",
        variant: "destructive",
      });
      return;
    }

    if (!isUnspecifiedQuantity && (!formData.lowStockThreshold || parseInt(formData.lowStockThreshold) < 0)) {
      toast({
        title: "Valid Threshold Required",
        description: "Please enter a valid low stock threshold.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        currentStock: isUnspecifiedQuantity ? -1 : (parseInt(formData.currentStock) || 0),
        lowStockThreshold: isUnspecifiedQuantity ? 0 : parseInt(formData.lowStockThreshold)
      };

      await onSave(productData);
      
      const quantityText = isUnspecifiedQuantity ? ' (Bulk/Variable)' : `, Qty: ${formData.currentStock}`;
      toast({
        title: "Product Added Successfully",
        description: `${formData.name}${quantityText} has been added to inventory.`,
        duration: 4000,
      });
      
      handleClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({
        title: "Error Saving Product",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setFormData({
      name: '',
      code: '',
      costPrice: '',
      sellingPrice: '',
      lowStockThreshold: '10',
      category: '',
      currentStock: '0'
    });
    setIsUnspecifiedQuantity(false);
    onClose();
  };

  // Check if form is valid for enabling save button
  const isFormValid = () => {
    // Required fields validation
    const hasRequiredFields = formData.name.trim() && 
                             formData.code.trim() && 
                             formData.costPrice && 
                             formData.sellingPrice && 
                             formData.category;

    // Price validation
    const hasValidPrices = parseFloat(formData.costPrice) > 0 && 
                          parseFloat(formData.sellingPrice) > 0 &&
                          parseFloat(formData.sellingPrice) >= parseFloat(formData.costPrice);

    // Threshold validation (only if not unspecified quantity)
    const hasValidThreshold = isUnspecifiedQuantity || 
                             (formData.lowStockThreshold && parseInt(formData.lowStockThreshold) >= 0);

    return hasRequiredFields && hasValidPrices && hasValidThreshold;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-lg h-[90vh] sm:max-h-[85vh] flex flex-col mx-auto my-auto rounded-lg p-0">
        <DialogHeader className="flex-shrink-0 p-6 border-b">
          <DialogTitle className="text-xl font-semibold">
            Add New Product
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Product Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="h-10"
                  placeholder="Enter product name"
                  disabled={loading}
                />
              </div>

              {/* Product Code */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">
                  Product Code *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className="h-10 font-mono"
                    placeholder="Enter code"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    onClick={generateCode}
                    className="w-10 h-10 p-0"
                    variant="outline"
                    disabled={loading}
                    title="Generate Code"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Category *
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-10">
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
              </div>
            </div>

            {/* Pricing Section */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium uppercase text-gray-500 mb-2">Pricing</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Buying Price */}
                <div className="space-y-2">
                  <Label htmlFor="costPrice" className="text-sm font-medium">
                    Buying Price *
                  </Label>
                  <div className="relative">
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange('costPrice', e.target.value)}
                      className="h-10 pl-12"
                      placeholder="0.00"
                      disabled={loading}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      KES
                    </span>
                  </div>
                </div>

                {/* Selling Price */}
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice" className="text-sm font-medium">
                    Selling Price *
                  </Label>
                  <div className="relative">
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                      className="h-10 pl-12"
                      placeholder="0.00"
                      disabled={loading}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      KES
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Section */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium uppercase text-gray-500 mb-2">Inventory</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Low-Stock Threshold */}
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold" className="text-sm font-medium">
                    Low-Stock Threshold *
                  </Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
                    className={`h-10 ${isUnspecifiedQuantity ? 'opacity-50' : ''}`}
                    placeholder="10"
                    disabled={loading || isUnspecifiedQuantity}
                  />
                  <p className="text-xs text-muted-foreground">Alert when stock ≤ this number</p>
                </div>

                {/* Initial Stock */}
                <div className="space-y-2">
                  <Label htmlFor="currentStock" className="text-sm font-medium">
                    Initial Stock
                  </Label>
                  {isUnspecifiedQuantity ? (
                    <div className="h-10 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-center">
                      <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        Bulk / Variable
                      </div>
                    </div>
                  ) : (
                    <Input
                      id="currentStock"
                      type="number"
                      min="0"
                      value={formData.currentStock}
                      onChange={(e) => handleInputChange('currentStock', e.target.value)}
                      className="h-10"
                      placeholder="0"
                      disabled={loading}
                    />
                  )}
                </div>
              </div>

              {/* Unspecified Quantity Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unspecified"
                  checked={isUnspecifiedQuantity}
                  onCheckedChange={(checked) => {
                    setIsUnspecifiedQuantity(checked as boolean);
                    if (checked) {
                      setFormData(prev => ({ ...prev, currentStock: '', lowStockThreshold: '0' }));
                    } else {
                      setFormData(prev => ({ ...prev, currentStock: '0', lowStockThreshold: '10' }));
                    }
                  }}
                  disabled={loading}
                  className="w-4 h-4"
                />
                <Label 
                  htmlFor="unspecified" 
                  className="text-sm cursor-pointer"
                  title="Select for bulk items—quantities recorded later"
                >
                  Unspecified quantity (sacks, tins, cups…)
                </Label>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 flex flex-col gap-2 p-6 border-t">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isFormValid() || loading}
            className="w-full h-10 font-semibold bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              'Save Product'
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose} 
            className="w-full h-10"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
