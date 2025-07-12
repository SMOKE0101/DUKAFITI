import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '../../hooks/use-toast';
import { Product } from '../../types';
import { Shuffle } from 'lucide-react';

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
  const [unspecifiedStock, setUnspecifiedStock] = useState(false);

  // Pre-fill form when editing a product
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        sku: editingProduct.sku || '',
        category: editingProduct.category,
        costPrice: editingProduct.costPrice,
        sellingPrice: editingProduct.sellingPrice,
        currentStock: editingProduct.currentStock === -1 ? 0 : editingProduct.currentStock,
        lowStockThreshold: editingProduct.lowStockThreshold,
      });
      setUnspecifiedStock(editingProduct.currentStock === -1);
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        sku: '',
        category: '',
        costPrice: 0,
        sellingPrice: 0,
        currentStock: 0,
        lowStockThreshold: 10,
      });
      setUnspecifiedStock(false);
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

    if (formData.sellingPrice < 0) {
      toast({
        title: "Validation Error",
        description: "Selling price cannot be negative",
        variant: "destructive",
      });
      return;
    }

    if (!unspecifiedStock) {
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
    
    // Use -1 to indicate unspecified stock, and set defaults for disabled fields
    const finalFormData = {
      ...formData,
      currentStock: unspecifiedStock ? -1 : formData.currentStock,
      costPrice: unspecifiedStock ? 0 : formData.costPrice,
      lowStockThreshold: unspecifiedStock ? 0 : formData.lowStockThreshold
    };
    
    onSave(finalFormData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const categories = [
    'Electronics',
    'Clothing',
    'Food & Beverages',
    'Health & Beauty',
    'Home & Garden',
    'Sports & Outdoors',
    'Books & Media',
    'Toys & Games',
    'Automotive',
    'Other'
  ];

  const showProfitCalculation = !unspecifiedStock && formData.costPrice > 0 && formData.sellingPrice > 0;

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[500px] h-[90vh] sm:max-h-[85vh] flex flex-col mx-auto my-auto rounded-lg border-0 p-0">
          <DialogHeader className="flex-shrink-0 text-center space-y-3 p-4 sm:p-6 border-b">
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingProduct ? 'Update product information' : 'Enter product details to add to your inventory'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm font-medium text-foreground">
                    Product SKU
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="Enter or generate SKU"
                      className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSKU}
                      className="h-12 px-3 flex-shrink-0"
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-foreground">
                    Category *
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice" className="text-sm font-medium text-foreground">
                      Cost Price (KES) *
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                            KES
                          </span>
                          <Input
                            id="costPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            value={unspecifiedStock ? '' : formData.costPrice}
                            onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className={`h-12 text-base pl-14 focus-visible:ring-2 focus-visible:ring-primary ${
                              unspecifiedStock ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : ''
                            }`}
                            disabled={unspecifiedStock}
                            required={!unspecifiedStock}
                          />
                        </div>
                      </TooltipTrigger>
                      {unspecifiedStock && (
                        <TooltipContent>
                          <p>Disabled for unspecified-quantity items</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice" className="text-sm font-medium text-foreground">
                      Selling Price (KES) *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
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
                        className="h-12 text-base pl-14 focus-visible:ring-2 focus-visible:ring-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentStock" className="text-sm font-medium text-foreground">
                      Current Stock *
                    </Label>
                    <Input
                      id="currentStock"
                      type="number"
                      min="0"
                      value={unspecifiedStock ? '' : formData.currentStock}
                      onChange={(e) => handleInputChange('currentStock', parseInt(e.target.value) || 0)}
                      placeholder={unspecifiedStock ? "Unspecified quantity" : "0"}
                      className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary"
                      disabled={unspecifiedStock}
                      required={!unspecifiedStock}
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="unspecifiedStock"
                        checked={unspecifiedStock}
                        onCheckedChange={(checked) => setUnspecifiedStock(checked as boolean)}
                      />
                      <Label htmlFor="unspecifiedStock" className="text-sm text-muted-foreground">
                        Unspecified quantity (sacks, cups, tins, gorogoro, etc.)
                      </Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold" className="text-sm font-medium text-foreground">
                      Low Stock Alert
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input
                          id="lowStockThreshold"
                          type="number"
                          min="0"
                          value={unspecifiedStock ? '' : formData.lowStockThreshold}
                          onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 10)}
                          placeholder="10"
                          className={`h-12 text-base focus-visible:ring-2 focus-visible:ring-primary ${
                            unspecifiedStock ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : ''
                          }`}
                          disabled={unspecifiedStock}
                        />
                      </TooltipTrigger>
                      {unspecifiedStock && (
                        <TooltipContent>
                          <p>Disabled for unspecified-quantity items</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                </div>

                {showProfitCalculation && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h3 className="font-medium text-foreground mb-2">Profit Summary</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit per unit:</span>
                        <span className="font-medium text-green-600">
                          KES {(formData.sellingPrice - formData.costPrice).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit margin:</span>
                        <span className="font-medium text-green-600">
                          {(((formData.sellingPrice - formData.costPrice) / formData.sellingPrice) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3 pt-6 border-t border-border">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700 focus-visible:ring-green-500"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  className="w-full h-12 text-base font-medium"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default AddProductModal;
