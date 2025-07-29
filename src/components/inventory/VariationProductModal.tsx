import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Product } from '../../types';
import { PRODUCT_CATEGORIES, isCustomCategory, validateCustomCategory } from '../../constants/categories';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductVariant {
  id: string;
  name: string;
  multiplier: number;
  sellingPrice: number;
  costPrice: number;
  showInQuickSelect: boolean;
}

interface VariationProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  existingProducts?: Product[];
}

const VariationProductModal: React.FC<VariationProductModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  existingProducts = []
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [parentProduct, setParentProduct] = useState<{
    type: 'new' | 'existing';
    id?: string;
    name: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
    currentStock: number;
    lowStockThreshold: number;
  }>({
    type: 'new',
    name: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    lowStockThreshold: 0,
  });
  
  const [variants, setVariants] = useState<ProductVariant[]>([
    { id: '1', name: '', multiplier: 0.5, sellingPrice: 0, costPrice: 0, showInQuickSelect: true },
    { id: '2', name: '', multiplier: 1, sellingPrice: 0, costPrice: 0, showInQuickSelect: true },
  ]);
  
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep(1);
    setParentProduct({
      type: 'new',
      name: '',
      category: '',
      costPrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      lowStockThreshold: 0,
    });
    setVariants([
      { id: '1', name: '', multiplier: 0.5, sellingPrice: 0, costPrice: 0, showInQuickSelect: true },
      { id: '2', name: '', multiplier: 1, sellingPrice: 0, costPrice: 0, showInQuickSelect: true },
    ]);
    setCustomCategory('');
    setShowCustomInput(false);
  };

  const handleCategoryChange = (value: string) => {
    setParentProduct(prev => ({ ...prev, category: value }));
    if (isCustomCategory(value)) {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomCategory('');
    }
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: '',
      multiplier: 1,
      sellingPrice: 0,
      costPrice: 0,
      showInQuickSelect: true,
    };
    setVariants(prev => [...prev, newVariant]);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 2) {
      toast({
        title: "Cannot Remove",
        description: "Must have at least 2 variants",
        variant: "destructive",
      });
      return;
    }
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setVariants(prev => prev.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const validateStep1 = () => {
    if (parentProduct.type === 'new') {
      if (!parentProduct.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Parent product name is required",
          variant: "destructive",
        });
        return false;
      }
      
      if (!parentProduct.category.trim()) {
        toast({
          title: "Validation Error",
          description: "Category is required",
          variant: "destructive",
        });
        return false;
      }

      if (isCustomCategory(parentProduct.category) && !validateCustomCategory(customCategory)) {
        toast({
          title: "Validation Error",
          description: "Custom category is required and must be 50 characters or less",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    const validVariants = variants.filter(v => v.name.trim() && v.multiplier > 0 && v.sellingPrice > 0);
    
    if (validVariants.length < 2) {
      toast({
        title: "Validation Error",
        description: "Must have at least 2 valid variants",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateStep2()) return;

    const products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const finalCategory = isCustomCategory(parentProduct.category) ? customCategory : parentProduct.category;

    // Add parent product if creating new
    if (parentProduct.type === 'new') {
      products.push({
        name: parentProduct.name + ' (Parent)',
        category: finalCategory,
        costPrice: parentProduct.costPrice,
        sellingPrice: parentProduct.sellingPrice,
        currentStock: parentProduct.currentStock,
        lowStockThreshold: parentProduct.lowStockThreshold,
        sku: '', // Optional
      });
    }

    // Add variants
    const validVariants = variants.filter(v => v.name.trim() && v.multiplier > 0 && v.sellingPrice > 0);
    validVariants.forEach(variant => {
      products.push({
        name: `${parentProduct.name} - ${variant.name}`,
        category: finalCategory,
        costPrice: variant.costPrice,
        sellingPrice: variant.sellingPrice,
        currentStock: -1, // Variants don't have direct stock
        lowStockThreshold: 0,
        sku: `${parentProduct.name.substring(0, 3)}-${variant.name.substring(0, 3)}-${variant.multiplier}x`.toUpperCase(),
      });
    });

    onSave(products);
    toast({
      title: "Variation Products Created",
      description: `Created ${products.length} products (${validVariants.length} variants)`,
    });
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[800px] max-h-[95vh] border-0 p-0 bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden flex flex-col">          
        {/* Header */}
        <div className="border-b-4 border-green-600 bg-white dark:bg-gray-900 p-6 text-center flex-shrink-0">
          <DialogTitle className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            CREATE PRODUCT VARIATIONS
          </DialogTitle>
          <DialogDescription className="font-mono text-sm text-gray-600 dark:text-gray-400 mt-2 uppercase tracking-wider">
            Step {step} of 3: {step === 1 ? 'Parent Product' : step === 2 ? 'Define Variants' : 'Quick Select Options'}
          </DialogDescription>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
          
          {/* Step 1: Parent Product Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                <Label className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                  Parent Product Type
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setParentProduct(prev => ({ ...prev, type: 'new' }))}
                    className={cn(
                      "p-4 border-2 rounded-lg text-left transition-all",
                      parentProduct.type === 'new'
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    )}
                  >
                    <h3 className="font-bold">Create New Parent</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Create a new product as the parent for variations
                    </p>
                  </button>
                  <button
                    onClick={() => setParentProduct(prev => ({ ...prev, type: 'existing' }))}
                    className={cn(
                      "p-4 border-2 rounded-lg text-left transition-all",
                      parentProduct.type === 'existing'
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    )}
                  >
                    <h3 className="font-bold">Use Existing Product</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Select an existing product as the parent
                    </p>
                  </button>
                </div>
              </div>

              {parentProduct.type === 'existing' && (
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                  <Label className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                    Select Existing Product
                  </Label>
                  <Select
                    value={parentProduct.id}
                    onValueChange={(value) => {
                      const product = existingProducts.find(p => p.id === value);
                      if (product) {
                        setParentProduct({
                          type: 'existing',
                          id: product.id,
                          name: product.name,
                          category: product.category,
                          costPrice: product.costPrice,
                          sellingPrice: product.sellingPrice,
                          currentStock: product.currentStock,
                          lowStockThreshold: product.lowStockThreshold,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingProducts.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {parentProduct.type === 'new' && (
                <>
                  <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                    <Label className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                      Product Name *
                    </Label>
                    <Input
                      value={parentProduct.name}
                      onChange={(e) => setParentProduct(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter parent product name"
                      className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
                    />
                  </div>

                  <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                    <Label className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                      Category *
                    </Label>
                    <Select 
                      value={parentProduct.category} 
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                      <Label className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                        Base Cost Price (KES)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={parentProduct.costPrice}
                        onChange={(e) => setParentProduct(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
                      />
                    </div>
                    
                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                      <Label className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                        Base Selling Price (KES)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={parentProduct.sellingPrice}
                        onChange={(e) => setParentProduct(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                      <Label className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                        Parent Stock
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={parentProduct.currentStock}
                        onChange={(e) => setParentProduct(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
                      />
                    </div>
                    
                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                      <Label className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                        Low Stock Threshold
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={parentProduct.lowStockThreshold}
                        onChange={(e) => setParentProduct(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Define Variants */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  Product Variants for: {parentProduct.name}
                </h3>
                <Button
                  onClick={addVariant}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Variant
                </Button>
              </div>

              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={variant.id} className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-mono font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white">
                        Variant {index + 1}
                      </h4>
                      {variants.length > 2 && (
                        <Button
                          onClick={() => removeVariant(variant.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs font-mono uppercase tracking-wider text-gray-600 dark:text-gray-400">
                          Variant Name *
                        </Label>
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                          placeholder="e.g. Small, 500ml"
                          className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs font-mono uppercase tracking-wider text-gray-600 dark:text-gray-400">
                          Multiplier *
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={variant.multiplier}
                          onChange={(e) => updateVariant(variant.id, 'multiplier', parseFloat(e.target.value) || 0)}
                          placeholder="1.0"
                          className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs font-mono uppercase tracking-wider text-gray-600 dark:text-gray-400">
                          Sell Price *
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.sellingPrice}
                          onChange={(e) => updateVariant(variant.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs font-mono uppercase tracking-wider text-gray-600 dark:text-gray-400">
                          Cost Price
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.costPrice}
                          onChange={(e) => updateVariant(variant.id, 'costPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-2 border-blue-300 dark:border-blue-600 rounded-xl p-4 bg-blue-50/50 dark:bg-blue-900/20">
                <h3 className="font-mono font-bold uppercase tracking-wider text-blue-900 dark:text-blue-100 mb-2">
                  How Variations Work
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 font-mono space-y-1">
                  <li>• Each variant deducts (multiplier × quantity) from parent stock</li>
                  <li>• Example: Selling 2 "Small (0.5x)" deducts 1 from parent stock</li>
                  <li>• Variants show nested under parent in inventory</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Quick Select Options */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Sales Quick-Select Options
              </h3>
              
              <div className="space-y-4">
                {variants.filter(v => v.name.trim()).map((variant, index) => (
                  <div key={variant.id} className="flex items-center justify-between p-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent">
                    <div className="flex-1">
                      <h4 className="font-mono font-bold text-gray-900 dark:text-white">
                        {parentProduct.name} - {variant.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {variant.multiplier}x multiplier • KES {variant.sellingPrice}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`quickselect-${variant.id}`}
                        checked={variant.showInQuickSelect}
                        onCheckedChange={(checked) => updateVariant(variant.id, 'showInQuickSelect', checked)}
                      />
                      <Label htmlFor={`quickselect-${variant.id}`} className="text-sm font-mono">
                        Show in quick-select
                      </Label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-2 border-green-300 dark:border-green-600 rounded-xl p-4 bg-green-50/50 dark:bg-green-900/20">
                <h3 className="font-mono font-bold uppercase tracking-wider text-green-900 dark:text-green-100 mb-2">
                  Ready to Create
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 font-mono">
                  {parentProduct.type === 'new' ? '1 parent product + ' : ''}{variants.filter(v => v.name.trim()).length} variants will be created
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button 
              onClick={prevStep}
              variant="outline"
              disabled={step === 1}
            >
              Previous
            </Button>
            
            <div className="flex gap-3">
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              
              {step < 3 ? (
                <Button onClick={nextStep} className="bg-green-600 hover:bg-green-700">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  Create Variations
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariationProductModal;