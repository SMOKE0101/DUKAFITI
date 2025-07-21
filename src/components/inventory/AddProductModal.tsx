import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '../../hooks/use-toast';
import { Product } from '../../types';
import { Shuffle } from 'lucide-react';
import { PRODUCT_CATEGORIES, isCustomCategory, validateCustomCategory } from '../../constants/categories';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingProduct?: Product | null;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  editingProduct 
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    lowStockThreshold: 10,
  });
  const [unspecifiedQuantity, setUnspecifiedQuantity] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      const isCustom = !PRODUCT_CATEGORIES.includes(editingProduct.category as any);
      setFormData({
        name: editingProduct.name,
        sku: editingProduct.sku || '',
        category: isCustom ? 'Other / Custom' : editingProduct.category,
        costPrice: editingProduct.costPrice,
        sellingPrice: editingProduct.sellingPrice,
        currentStock: editingProduct.currentStock === -1 ? 0 : editingProduct.currentStock,
        lowStockThreshold: editingProduct.lowStockThreshold,
      });
      setUnspecifiedQuantity(editingProduct.currentStock === -1);
      setCustomCategory(isCustom ? editingProduct.category : '');
      setShowCustomInput(isCustom);
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        costPrice: 0,
        sellingPrice: 0,
        currentStock: 0,
        lowStockThreshold: 10,
      });
      setUnspecifiedQuantity(false);
      setCustomCategory('');
      setShowCustomInput(false);
    }
  }, [editingProduct, isOpen]);

  const generateSKU = () => {
    const prefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : 'PRD';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const generatedSKU = `${prefix}-${timestamp}-${random}`;
    setFormData(prev => ({ ...prev, sku: generatedSKU }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category.trim()) {
      toast({
        title: "Validation Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    if (isCustomCategory(formData.category) && !validateCustomCategory(customCategory)) {
      toast({
        title: "Validation Error",
        description: "Custom category is required and must be 50 characters or less",
        variant: "destructive",
      });
      return;
    }

    if (formData.sellingPrice < 0) {
      toast({
        title: "Validation Error",
        description: "Selling price cannot be negative",
        variant: "destructive",
      });
      return;
    }

    if (!unspecifiedQuantity) {
      if (formData.costPrice < 0) {
        toast({
          title: "Validation Error",
          description: "Cost price cannot be negative",
          variant: "destructive",
        });
        return;
      }

      if (formData.currentStock < 0) {
        toast({
          title: "Validation Error",
          description: "Stock cannot be negative",
          variant: "destructive",
        });
        return;
      }
    }
    
    const finalFormData = {
      ...formData,
      category: isCustomCategory(formData.category) ? customCategory : formData.category,
      currentStock: unspecifiedQuantity ? -1 : formData.currentStock,
      costPrice: unspecifiedQuantity ? 0 : formData.costPrice,
      lowStockThreshold: unspecifiedQuantity ? 0 : formData.lowStockThreshold
    };
    
    onSave(finalFormData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (value: string) => {
    handleInputChange('category', value);
    if (isCustomCategory(value)) {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomCategory('');
    }
  };

  const showProfitCalculation = !unspecifiedQuantity && formData.costPrice > 0 && formData.sellingPrice > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[600px] max-h-[95vh] border-0 p-0 bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden flex flex-col">          
          {/* Modern Header */}
          <div className="border-b-4 border-green-600 bg-white dark:bg-gray-900 p-6 text-center flex-shrink-0">
            <DialogTitle className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
              {editingProduct ? 'EDIT PRODUCT' : 'ADD PRODUCT'}
            </DialogTitle>
            <DialogDescription className="font-mono text-sm text-gray-600 dark:text-gray-400 mt-2 uppercase tracking-wider">
              {editingProduct ? 'Update product details' : 'Create new inventory item'}
            </DialogDescription>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                <Label htmlFor="name" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                  Product Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
                  required
                />
              </div>

              {/* Product SKU */}
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                <Label htmlFor="sku" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                  Product SKU
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Enter or generate SKU"
                    className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500 flex-1"
                  />
                  <Button
                    type="button"
                    onClick={generateSKU}
                    className="h-12 px-4 border-2 border-green-600 bg-transparent text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg font-mono font-bold uppercase tracking-wide transition-all duration-200"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Category */}
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                <Label htmlFor="category" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                  Category *
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                    {PRODUCT_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category} className="font-mono">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showCustomInput && (
                  <div className="mt-3">
                    <Input
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
                      maxLength={50}
                    />
                  </div>
                )}
              </div>
              
              {/* Pricing Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                  <Label htmlFor="costPrice" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                    Cost Price (KES) *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-mono">
                          KES
                        </span>
                         <Input
                           id="costPrice"
                           type="number"
                           step="0.01"
                           min="0"
                           value={unspecifiedQuantity ? '' : formData.costPrice}
                           onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                           placeholder={unspecifiedQuantity ? "Unspecified" : "0.00"}
                           className={`h-12 text-base pl-14 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500 ${
                             unspecifiedQuantity ? 'opacity-50 cursor-not-allowed' : ''
                           }`}
                           disabled={unspecifiedQuantity}
                           required={!unspecifiedQuantity}
                         />
                      </div>
                    </TooltipTrigger>
                     {unspecifiedQuantity && (
                       <TooltipContent>
                         <p>Disabled for unspecified-quantity items</p>
                       </TooltipContent>
                     )}
                  </Tooltip>
                </div>
                
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                  <Label htmlFor="sellingPrice" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                    Selling Price (KES) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-mono">
                      KES
                    </span>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-12 text-base pl-14 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Stock Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                  <Label htmlFor="currentStock" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                    Current Stock *
                  </Label>
                   <Input
                     id="currentStock"
                     type="number"
                     min="0"
                     value={unspecifiedQuantity ? '' : formData.currentStock}
                     onChange={(e) => handleInputChange('currentStock', parseInt(e.target.value) || 0)}
                     placeholder={unspecifiedQuantity ? "Unspecified quantity" : "0"}
                     className={`h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500 ${
                       unspecifiedQuantity ? 'opacity-50 cursor-not-allowed' : ''
                     }`}
                     disabled={unspecifiedQuantity}
                     required={!unspecifiedQuantity}
                   />
                   <div className="flex items-center space-x-2 mt-3">
                     <Checkbox 
                       id="unspecifiedQuantity"
                       checked={unspecifiedQuantity}
                       onCheckedChange={(checked) => setUnspecifiedQuantity(checked as boolean)}
                       className="border-2 border-gray-300 dark:border-gray-600"
                     />
                     <Label htmlFor="unspecifiedQuantity" className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                       Unspecified quantity (sacks, cups, etc.)
                     </Label>
                   </div>
                </div>
                
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                  <Label htmlFor="lowStockThreshold" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                    Low Stock Alert
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Input
                         id="lowStockThreshold"
                         type="number"
                         min="0"
                         value={unspecifiedQuantity ? '' : formData.lowStockThreshold}
                         onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 10)}
                         placeholder={unspecifiedQuantity ? "Unspecified" : "10"}
                         className={`h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500 ${
                           unspecifiedQuantity ? 'opacity-50 cursor-not-allowed' : ''
                         }`}
                         disabled={unspecifiedQuantity}
                       />
                    </TooltipTrigger>
                     {unspecifiedQuantity && (
                       <TooltipContent>
                         <p>Disabled for unspecified-quantity items</p>
                       </TooltipContent>
                     )}
                  </Tooltip>
                </div>
              </div>

              {showProfitCalculation && (
                <div className="border-2 border-blue-300 dark:border-blue-600 rounded-xl p-4 bg-blue-50/50 dark:bg-blue-900/20">
                  <h3 className="font-mono font-bold uppercase tracking-wider text-blue-900 dark:text-blue-100 mb-3">
                    Profit Summary
                  </h3>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wide">Profit per unit:</span>
                      <span className="font-bold text-green-600">
                        KES {(formData.sellingPrice - formData.costPrice).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wide">Profit margin:</span>
                      <span className="font-bold text-green-600">
                        {(((formData.sellingPrice - formData.costPrice) / formData.sellingPrice) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-mono font-bold uppercase tracking-wide bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200"
                >
                  {editingProduct ? 'UPDATE PRODUCT' : 'ADD PRODUCT'}
                </Button>
                <Button 
                  type="button" 
                  onClick={onClose} 
                  className="w-full h-12 text-base font-mono font-bold uppercase tracking-wide bg-transparent border-2 border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                >
                  CANCEL
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
  );
};

export default AddProductModal;
