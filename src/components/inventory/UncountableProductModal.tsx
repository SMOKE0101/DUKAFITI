import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { PRODUCT_CATEGORIES, isCustomCategory, validateCustomCategory } from '../../constants/categories';
import TemplateSelectionModal from './TemplateSelectionModal';

interface UncountableProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const UncountableProductModal: React.FC<UncountableProductModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
  });
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        category: '',
        costPrice: 0,
        sellingPrice: 0,
      });
      setCustomCategory('');
      setShowCustomInput(false);
      setShowTemplateModal(false);
    }
  }, [isOpen]);

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

    if (formData.sellingPrice <= 0) {
      toast({
        title: "Validation Error",
        description: "Selling price must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    const finalFormData = {
      ...formData,
      category: isCustomCategory(formData.category) ? customCategory : formData.category,
      currentStock: -1, // Unspecified quantity
      lowStockThreshold: 0, // No threshold for uncountable items
      sku: '', // Optional for uncountable
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

  const handleTemplateSelect = (templateData: any) => {
    console.log('[UncountableProductModal] Template selected:', templateData);
    
    // Pre-fill form with template data
    setFormData({
      name: templateData.name || '',
      category: templateData.category || '',
      costPrice: templateData.cost_price || 0,
      sellingPrice: templateData.selling_price || 0,
    });
    
    // Handle custom category if needed
    if (isCustomCategory(templateData.category)) {
      setShowCustomInput(true);
      setCustomCategory(templateData.category);
    } else {
      setShowCustomInput(false);
      setCustomCategory('');
    }
    
    setShowTemplateModal(false);
  };

  const handleUseTemplates = () => {
    setShowTemplateModal(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[500px] max-h-[95vh] border-0 p-0 bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden flex flex-col">          
        {/* Header */}
        <div className="border-b-4 border-orange-600 bg-white dark:bg-gray-900 p-6 text-center flex-shrink-0">
          <DialogTitle className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            ADD UNCOUNTABLE ITEM
          </DialogTitle>
          <DialogDescription className="font-mono text-sm text-gray-600 dark:text-gray-400 mt-2 uppercase tracking-wider">
            Items sold by scoops, cups, portions, etc.
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
                className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                required
              />
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
                <SelectTrigger className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500">
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
                    className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                    maxLength={50}
                  />
                </div>
              )}
            </div>
            
            {/* Pricing Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                <Label htmlFor="costPrice" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                  Cost Price (KES)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-mono">
                    KES
                  </span>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                    placeholder="optional"
                    className="h-12 text-base pl-14 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>
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
                    className="h-12 text-base pl-14 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Uncountable Notice */}
            <div className="border-2 border-orange-300 dark:border-orange-600 rounded-xl p-4 bg-orange-50/50 dark:bg-orange-900/20">
              <h3 className="font-mono font-bold uppercase tracking-wider text-orange-900 dark:text-orange-100 mb-2">
                Uncountable Item Notice
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 font-mono">
                This item will be marked as "Uncountable" with unspecified quantity. Perfect for items sold by scoops, cups, portions, or other non-countable units.
              </p>
            </div>

            {/* Use Templates Button */}
            <div className="mb-6">
              <Button 
                type="button" 
                onClick={handleUseTemplates}
                className="w-full px-6 py-3 border-2 border-purple-500 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 hover:border-purple-600 rounded-lg font-mono font-bold uppercase tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Use Templates
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6">
              <Button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-mono font-bold uppercase tracking-wide transition-all duration-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="px-6 py-3 border-2 border-orange-600 bg-orange-600 text-white hover:bg-orange-700 hover:border-orange-700 rounded-lg font-mono font-bold uppercase tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Add Uncountable Item
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
      
      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onTemplateSelect={handleTemplateSelect}
        mode="uncountable"
      />
    </Dialog>
  );
};

export default UncountableProductModal;