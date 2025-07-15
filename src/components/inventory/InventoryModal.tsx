
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Product } from '../../types';
import { Package, Loader2 } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  product?: Product | null;
  isLoading?: boolean;
}

const InventoryModal = ({ isOpen, onClose, onSave, product, isLoading = false }: InventoryModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    lowStockThreshold: 10,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        currentStock: product.currentStock,
        lowStockThreshold: product.lowStockThreshold || 10,
      });
    } else if (!isOpen) {
      setFormData({
        name: '',
        category: '',
        costPrice: 0,
        sellingPrice: 0,
        currentStock: 0,
        lowStockThreshold: 10,
      });
    }
  }, [product, isOpen]);

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

    if (formData.costPrice < 0 || formData.sellingPrice < 0) {
      toast({
        title: "Validation Error",
        description: "Prices cannot be negative",
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
    
    onSave(formData);
  };

  const categories = [
    'Electronics',
    'Food & Beverages',
    'Clothing',
    'Home & Garden',
    'Health & Beauty',
    'Sports & Outdoors',
    'Books & Media',
    'Other'
  ];

  const isFormValid = formData.name.trim() && formData.category.trim() && 
                     formData.costPrice >= 0 && formData.sellingPrice >= 0 && 
                     formData.currentStock >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[600px] max-h-[95vh] border-0 p-0 bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden">
        
        {/* Header */}
        <div className="border-b-4 border-blue-600 bg-white dark:bg-gray-900 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <DialogTitle className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            {product ? 'EDIT PRODUCT' : 'ADD PRODUCT'}
          </DialogTitle>
          <DialogDescription className="font-mono text-sm text-gray-600 dark:text-gray-400 mt-2 uppercase tracking-wider">
            {product ? 'Update product details' : 'Create new product'}
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
                className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
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
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent className="border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                  {categories.map(category => (
                    <SelectItem key={category} value={category} className="font-mono">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Pricing Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Cost Price */}
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                <Label htmlFor="costPrice" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                  Cost Price (KES) *
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
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="h-12 text-base pl-14 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              {/* Selling Price */}
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
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="h-12 text-base pl-14 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Stock Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Current Stock */}
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                <Label htmlFor="currentStock" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                  Current Stock *
                </Label>
                <Input
                  id="currentStock"
                  type="number"
                  min="0"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  required
                />
              </div>
              
              {/* Low Stock Threshold */}
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                <Label htmlFor="lowStockThreshold" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                  Low Stock Alert
                </Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 10 })}
                  placeholder="10"
                  className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                />
              </div>
            </div>

            {/* Profit Preview */}
            {formData.sellingPrice > 0 && formData.costPrice > 0 && (
              <div className="border-2 border-green-300 dark:border-green-600 rounded-xl p-4 bg-green-50/50 dark:bg-green-900/20">
                <h3 className="font-mono font-bold uppercase tracking-wider text-green-900 dark:text-green-100 mb-3">
                  Profit Analysis
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
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total value:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      KES {(formData.currentStock * formData.costPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-6">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-mono font-bold uppercase tracking-wide bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    SAVING...
                  </>
                ) : (
                  product ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'
                )}
              </Button>
              <Button 
                type="button" 
                onClick={onClose} 
                className="w-full h-12 text-base font-mono font-bold uppercase tracking-wide bg-transparent border-2 border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                disabled={isLoading}
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

export default InventoryModal;
