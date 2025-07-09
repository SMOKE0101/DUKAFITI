
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle, X } from 'lucide-react';
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
    lowStockThreshold: '',
    category: '',
    currentStock: '0'
  });

  const [isUnspecifiedQuantity, setIsUnspecifiedQuantity] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { toast } = useToast();

  const generateCode = () => {
    if (!formData.name.trim()) {
      setErrors(prev => ({ ...prev, code: 'Enter product name first' }));
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, code }));
    setErrors(prev => ({ ...prev, code: '' }));
  };

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value.trim()) newErrors.name = 'Product name is required';
        else delete newErrors.name;
        break;
      case 'code':
        if (!value.trim()) newErrors.code = 'Product code is required';
        else delete newErrors.code;
        break;
      case 'costPrice':
        if (!value || parseFloat(value) <= 0) {
          newErrors.costPrice = 'Valid buying price is required';
        } else {
          delete newErrors.costPrice;
          if (formData.sellingPrice && parseFloat(formData.sellingPrice) < parseFloat(value)) {
            newErrors.sellingPrice = 'Selling price must be ≥ buying price';
          } else if (formData.sellingPrice) {
            delete newErrors.sellingPrice;
          }
        }
        break;
      case 'sellingPrice':
        if (!value || parseFloat(value) <= 0) {
          newErrors.sellingPrice = 'Valid selling price is required';
        } else if (formData.costPrice && parseFloat(value) < parseFloat(formData.costPrice)) {
          newErrors.sellingPrice = 'Selling price must be ≥ buying price';
        } else {
          delete newErrors.sellingPrice;
        }
        break;
      case 'lowStockThreshold':
        if (!isUnspecifiedQuantity && (!value || parseInt(value) < 0)) {
          newErrors.lowStockThreshold = 'Valid threshold is required';
        } else {
          delete newErrors.lowStockThreshold;
        }
        break;
      case 'category':
        if (!value) newErrors.category = 'Category is required';
        else delete newErrors.category;
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSave = async () => {
    // Validate all required fields
    const fieldsToValidate = ['name', 'code', 'costPrice', 'sellingPrice', 'category'];
    if (!isUnspecifiedQuantity) {
      fieldsToValidate.push('lowStockThreshold');
    }

    fieldsToValidate.forEach(field => {
      validateField(field, formData[field as keyof typeof formData]);
    });

    // Check if there are any validation errors
    const hasErrors = Object.keys(errors).some(key => errors[key]);
    const hasEmptyRequired = fieldsToValidate.some(field => !formData[field as keyof typeof formData]);

    if (hasErrors || hasEmptyRequired) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
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
      
      const quantityText = isUnspecifiedQuantity ? '(Bulk / Variable)' : `, Qty ${formData.currentStock}`;
      toast({
        title: "Product Added",
        description: `${formData.name}${quantityText}`,
        duration: 4000,
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

  const handleClose = () => {
    if (loading) return;
    
    setFormData({
      name: '',
      code: '',
      costPrice: '',
      sellingPrice: '',
      lowStockThreshold: '',
      category: '',
      currentStock: '0'
    });
    setIsUnspecifiedQuantity(false);
    setErrors({});
    setFocusedField(null);
    onClose();
  };

  const isFormValid = formData.name && formData.code && formData.costPrice && 
                     formData.sellingPrice && formData.category &&
                     (isUnspecifiedQuantity || formData.lowStockThreshold) &&
                     Object.keys(errors).length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 bg-white dark:bg-gray-800 shadow-modal overflow-hidden animate-scale-in">
        {/* Header */}
        <DialogHeader className="p-8 pb-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
              Add New Product
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="w-10 h-10 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 absolute top-6 right-6"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-8 pt-6 space-y-6">
          {/* Error Banner */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            {/* Product Name - Full width */}
            <div className="lg:col-span-2">
              <Label 
                htmlFor="name" 
                className={`block text-base font-medium mb-1 transition-colors ${
                  focusedField === 'name' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                Product Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                className={`h-12 text-lg px-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary ${
                  errors.name ? 'border-red-500' : ''
                }`}
                placeholder="Enter product name"
                disabled={loading}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Product Code */}
            <div className="lg:col-span-2">
              <Label 
                htmlFor="code" 
                className={`block text-base font-medium mb-1 transition-colors ${
                  focusedField === 'code' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                Product Code *
              </Label>
              <div className="flex gap-3">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  onFocus={() => setFocusedField('code')}
                  onBlur={() => setFocusedField(null)}
                  className={`h-12 text-lg px-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary font-mono ${
                    errors.code ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter or generate code"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={generateCode}
                  className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg p-0 transition-all duration-200"
                  variant="ghost"
                  disabled={loading}
                  title="Generate Code"
                >
                  <Shuffle className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
            </div>

            {/* Category */}
            <div className="lg:col-span-2">
              <Label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                Category *
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
                disabled={loading}
              >
                <SelectTrigger className={`h-12 text-lg px-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary ${
                  errors.category ? 'border-red-500' : ''
                }`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category} className="text-lg">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium uppercase text-gray-500 mb-4">Pricing</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              {/* Buying Price */}
              <div>
                <Label 
                  htmlFor="costPrice" 
                  className={`block text-base font-medium mb-1 transition-colors ${
                    focusedField === 'costPrice' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  Buying Price *
                </Label>
                <div className="relative">
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => handleInputChange('costPrice', e.target.value)}
                    onFocus={() => setFocusedField('costPrice')}
                    onBlur={() => setFocusedField(null)}
                    className={`h-12 text-lg pl-16 pr-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary ${
                      errors.costPrice ? 'border-red-500' : ''
                    }`}
                    placeholder="0.00"
                    disabled={loading}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    KES
                  </span>
                </div>
                {errors.costPrice && <p className="text-red-500 text-sm mt-1">{errors.costPrice}</p>}
              </div>

              {/* Selling Price */}
              <div>
                <Label 
                  htmlFor="sellingPrice" 
                  className={`block text-base font-medium mb-1 transition-colors ${
                    focusedField === 'sellingPrice' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  Selling Price *
                </Label>
                <div className="relative">
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                    onFocus={() => setFocusedField('sellingPrice')}
                    onBlur={() => setFocusedField(null)}
                    className={`h-12 text-lg pl-16 pr-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary ${
                      errors.sellingPrice ? 'border-red-500' : ''
                    }`}
                    placeholder="0.00"
                    disabled={loading}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    KES
                  </span>
                </div>
                {errors.sellingPrice && <p className="text-red-500 text-sm mt-1">{errors.sellingPrice}</p>}
              </div>
            </div>
          </div>

          {/* Quantity & Threshold Section */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium uppercase text-gray-500 mb-4">Quantity & Threshold</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              {/* Low-Stock Threshold */}
              <div>
                <Label 
                  htmlFor="lowStockThreshold" 
                  className={`block text-base font-medium mb-1 transition-colors ${
                    focusedField === 'lowStockThreshold' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  Low-Stock Threshold *
                </Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
                  onFocus={() => setFocusedField('lowStockThreshold')}
                  onBlur={() => setFocusedField(null)}
                  className={`h-12 text-lg px-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary ${
                    errors.lowStockThreshold ? 'border-red-500' : ''
                  } ${isUnspecifiedQuantity ? 'opacity-50' : ''}`}
                  placeholder="10"
                  disabled={loading || isUnspecifiedQuantity}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Alert when stock ≤ this number</p>
                {errors.lowStockThreshold && <p className="text-red-500 text-sm mt-1">{errors.lowStockThreshold}</p>}
              </div>

              {/* Initial Stock */}
              <div>
                <Label 
                  htmlFor="currentStock" 
                  className={`block text-base font-medium mb-1 transition-colors ${
                    focusedField === 'currentStock' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  Initial Stock
                </Label>
                {isUnspecifiedQuantity ? (
                  <div className="h-12 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      Bulk / Variable
                    </div>
                  </div>
                ) : (
                  <Input
                    id="currentStock"
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => handleInputChange('currentStock', e.target.value)}
                    onFocus={() => setFocusedField('currentStock')}
                    onBlur={() => setFocusedField(null)}
                    className={`h-12 text-lg px-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary`}
                    placeholder="0"
                    disabled={loading}
                  />
                )}
              </div>
            </div>

            {/* Unspecified Quantity Checkbox */}
            <div className="mt-6 flex items-center space-x-3">
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
                className="w-5 h-5"
              />
              <Label 
                htmlFor="unspecified" 
                className="text-base text-gray-700 dark:text-gray-200 cursor-pointer select-none ml-1"
                title="Select for bulk items—quantities recorded later"
              >
                Unspecified quantity (sacks, tins, cups…)
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="h-12 px-6 text-lg font-medium"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || loading}
              className="w-32 h-12 text-lg font-semibold bg-green-600 text-white hover:bg-green-500 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
