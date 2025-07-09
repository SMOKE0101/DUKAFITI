
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
          // Validate selling vs buying price
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
        if (!value || parseInt(value) < 0) {
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
    // Final validation
    Object.keys(formData).forEach(key => {
      if (key !== 'currentStock') {
        validateField(key, formData[key as keyof typeof formData]);
      }
    });

    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        currentStock: isUnspecifiedQuantity ? -1 : (parseInt(formData.currentStock) || 0),
        lowStockThreshold: parseInt(formData.lowStockThreshold)
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
      setErrors(prev => ({ ...prev, submit: 'Unable to save—please try again.' }));
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
                     formData.sellingPrice && formData.lowStockThreshold && formData.category &&
                     Object.keys(errors).length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg rounded-2xl p-0 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-8 pb-6 border-b border-border/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">
              Add New Product
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={loading}
            >
              <X className="w-4 h-4" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name - Full width */}
            <div className="md:col-span-2 space-y-2">
              <div className="relative">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className={`peer h-14 pt-6 pb-2 px-4 text-base bg-gray-50 dark:bg-gray-700 border-0 rounded-xl transition-all duration-200 ${
                    errors.name ? 'ring-2 ring-red-500' : focusedField === 'name' ? 'ring-2 ring-primary' : ''
                  }`}
                  placeholder=" "
                  disabled={loading}
                />
                <Label 
                  htmlFor="name" 
                  className={`absolute left-4 transition-all duration-200 pointer-events-none text-lg font-medium ${
                    formData.name || focusedField === 'name' 
                      ? 'top-2 text-xs text-muted-foreground' 
                      : 'top-1/2 -translate-y-1/2 text-base text-muted-foreground'
                  }`}
                >
                  Product Name *
                </Label>
              </div>
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            {/* Product Code */}
            <div className="md:col-span-2 space-y-2">
              <div className="relative">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      onFocus={() => setFocusedField('code')}
                      onBlur={() => setFocusedField(null)}
                      className={`peer h-14 pt-6 pb-2 px-4 text-base bg-gray-50 dark:bg-gray-700 border-0 rounded-xl font-mono transition-all duration-200 ${
                        errors.code ? 'ring-2 ring-red-500' : focusedField === 'code' ? 'ring-2 ring-primary' : ''
                      }`}
                      placeholder=" "
                      disabled={loading}
                    />
                    <Label 
                      htmlFor="code" 
                      className={`absolute left-4 transition-all duration-200 pointer-events-none text-lg font-medium ${
                        formData.code || focusedField === 'code' 
                          ? 'top-2 text-xs text-muted-foreground' 
                          : 'top-1/2 -translate-y-1/2 text-base text-muted-foreground'
                      }`}
                    >
                      Product Code *
                    </Label>
                  </div>
                  <Button
                    type="button"
                    onClick={generateCode}
                    className="w-14 h-14 bg-gray-200 hover:bg-gray-300 rounded-xl p-0 transition-all duration-200"
                    variant="ghost"
                    disabled={loading}
                    title="Generate Code"
                  >
                    <Shuffle className="w-5 h-5 text-gray-600" />
                  </Button>
                </div>
              </div>
              {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
            </div>

            {/* Category */}
            <div className="md:col-span-2 space-y-2">
              <Label className="text-lg font-medium">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
                disabled={loading}
              >
                <SelectTrigger className={`h-14 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl px-4 text-base transition-all duration-200 ${
                  errors.category ? 'ring-2 ring-red-500' : ''
                }`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category} className="text-base">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
            </div>

            {/* Buying Price */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => handleInputChange('costPrice', e.target.value)}
                  onFocus={() => setFocusedField('costPrice')}
                  onBlur={() => setFocusedField(null)}
                  className={`peer h-14 pt-6 pb-2 pl-16 pr-4 text-base bg-gray-50 dark:bg-gray-700 border-0 rounded-xl transition-all duration-200 ${
                    errors.costPrice ? 'ring-2 ring-red-500' : focusedField === 'costPrice' ? 'ring-2 ring-primary' : ''
                  }`}
                  placeholder=" "
                  disabled={loading}
                />
                <Label 
                  htmlFor="costPrice" 
                  className={`absolute left-16 transition-all duration-200 pointer-events-none text-lg font-medium ${
                    formData.costPrice || focusedField === 'costPrice' 
                      ? 'top-2 text-xs text-muted-foreground' 
                      : 'top-1/2 -translate-y-1/2 text-base text-muted-foreground'
                  }`}
                >
                  Buying Price *
                </Label>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  KES
                </span>
              </div>
              {errors.costPrice && <p className="text-red-500 text-sm">{errors.costPrice}</p>}
            </div>

            {/* Selling Price */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                  onFocus={() => setFocusedField('sellingPrice')}
                  onBlur={() => setFocusedField(null)}
                  className={`peer h-14 pt-6 pb-2 pl-16 pr-4 text-base bg-gray-50 dark:bg-gray-700 border-0 rounded-xl transition-all duration-200 ${
                    errors.sellingPrice ? 'ring-2 ring-red-500' : focusedField === 'sellingPrice' ? 'ring-2 ring-primary' : ''
                  }`}
                  placeholder=" "
                  disabled={loading}
                />
                <Label 
                  htmlFor="sellingPrice" 
                  className={`absolute left-16 transition-all duration-200 pointer-events-none text-lg font-medium ${
                    formData.sellingPrice || focusedField === 'sellingPrice' 
                      ? 'top-2 text-xs text-muted-foreground' 
                      : 'top-1/2 -translate-y-1/2 text-base text-muted-foreground'
                  }`}
                >
                  Selling Price *
                </Label>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  KES
                </span>
              </div>
              {errors.sellingPrice && <p className="text-red-500 text-sm">{errors.sellingPrice}</p>}
            </div>

            {/* Low-Stock Threshold */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
                  onFocus={() => setFocusedField('lowStockThreshold')}
                  onBlur={() => setFocusedField(null)}
                  className={`peer h-14 pt-6 pb-2 px-4 text-base bg-gray-50 dark:bg-gray-700 border-0 rounded-xl transition-all duration-200 ${
                    errors.lowStockThreshold ? 'ring-2 ring-red-500' : focusedField === 'lowStockThreshold' ? 'ring-2 ring-primary' : ''
                  } ${isUnspecifiedQuantity ? 'opacity-50' : ''}`}
                  placeholder=" "
                  disabled={loading || isUnspecifiedQuantity}
                />
                <Label 
                  htmlFor="lowStockThreshold" 
                  className={`absolute left-4 transition-all duration-200 pointer-events-none text-lg font-medium ${
                    formData.lowStockThreshold || focusedField === 'lowStockThreshold' 
                      ? 'top-2 text-xs text-muted-foreground' 
                      : 'top-1/2 -translate-y-1/2 text-base text-muted-foreground'
                  }`}
                >
                  Low-Stock Threshold *
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">Alert when stock ≤ this number</p>
              {errors.lowStockThreshold && <p className="text-red-500 text-sm">{errors.lowStockThreshold}</p>}
            </div>

            {/* Initial Stock */}
            <div className="space-y-2">
              <div className="relative">
                {isUnspecifiedQuantity ? (
                  <div className="h-14 px-4 py-2 bg-yellow-50 border-0 rounded-xl flex items-center transition-all duration-250">
                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      Bulk / Variable
                    </div>
                  </div>
                ) : (
                  <>
                    <Input
                      id="currentStock"
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => handleInputChange('currentStock', e.target.value)}
                      onFocus={() => setFocusedField('currentStock')}
                      onBlur={() => setFocusedField(null)}
                      className={`peer h-14 pt-6 pb-2 px-4 text-base bg-gray-50 dark:bg-gray-700 border-0 rounded-xl transition-all duration-250 ${
                        focusedField === 'currentStock' ? 'ring-2 ring-primary' : ''
                      }`}
                      placeholder=" "
                      disabled={loading}
                    />
                    <Label 
                      htmlFor="currentStock" 
                      className={`absolute left-4 transition-all duration-200 pointer-events-none text-lg font-medium ${
                        formData.currentStock || focusedField === 'currentStock' 
                          ? 'top-2 text-xs text-muted-foreground' 
                          : 'top-1/2 -translate-y-1/2 text-base text-muted-foreground'
                      }`}
                    >
                      Initial Stock
                    </Label>
                  </>
                )}
              </div>
            </div>

            {/* Unspecified Quantity Checkbox */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center space-x-3">
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
                  className="text-base text-muted-foreground cursor-pointer select-none"
                  title="Select for bulk items—quantities recorded later"
                >
                  Unspecified quantity (sacks, tins, cups…)
                </Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-3 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="md:order-1 h-12 text-base font-medium transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || loading}
              className="md:order-2 md:flex-1 h-12 text-base font-medium bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
