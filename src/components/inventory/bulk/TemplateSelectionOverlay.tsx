import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpinningNumberInput from '@/components/ui/spinning-number-input';
import { cn } from '@/lib/utils';

interface TemplateSelectionOverlayProps {
  template: any;
  isVisible: boolean;
  onClose: () => void;
  onAddToSpreadsheet: (productData: any) => void;
  className?: string;
}

interface ProductFormData {
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
}

/**
 * Overlay that appears when a template is selected
 * Shows spinning number inputs for product configuration
 */
const TemplateSelectionOverlay: React.FC<TemplateSelectionOverlayProps> = ({
  template,
  isVisible,
  onClose,
  onAddToSpreadsheet,
  className
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    costPrice: 10,
    sellingPrice: 15,
    currentStock: 50,
    lowStockThreshold: 10
  });

  const handleFieldChange = (field: keyof ProductFormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddProduct = () => {
    const productData = {
      name: template.name,
      category: template.category,
      image_url: template.image_url,
      cost_price: formData.costPrice,
      selling_price: formData.sellingPrice,
      current_stock: formData.currentStock,
      low_stock_threshold: formData.lowStockThreshold
    };
    
    onAddToSpreadsheet(productData);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-black/60 backdrop-blur-sm",
      className
    )}>
      {/* Overlay Background */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      {/* Content Container */}
      <div className="relative z-10 bg-card/95 backdrop-blur-md rounded-2xl border border-border/50 shadow-2xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            {/* Template Image */}
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex-shrink-0">
              {template.image_url ? (
                <img 
                  src={template.image_url} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {template.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Template Info */}
            <div>
              <h3 className="font-semibold text-lg text-foreground">{template.name}</h3>
              {template.category && (
                <p className="text-sm text-muted-foreground capitalize">{template.category}</p>
              )}
            </div>
          </div>
          
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0 hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h4 className="text-xl font-semibold mb-2">Configure Product Details</h4>
            <p className="text-muted-foreground">
              Set the pricing and stock information for this product
            </p>
          </div>
          
          {/* Spinning Number Inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <SpinningNumberInput
              label="Cost Price"
              value={formData.costPrice}
              onChange={(value) => handleFieldChange('costPrice', value)}
              min={0}
              max={999999}
              step={1}
              suffix="KES"
            />
            
            <SpinningNumberInput
              label="Selling Price"
              value={formData.sellingPrice}
              onChange={(value) => handleFieldChange('sellingPrice', value)}
              min={0}
              max={999999}
              step={1}
              suffix="KES"
            />
            
            <SpinningNumberInput
              label="In Stock"
              value={formData.currentStock}
              onChange={(value) => handleFieldChange('currentStock', value)}
              min={0}
              max={999999}
              step={1}
              suffix="units"
            />
            
            <SpinningNumberInput
              label="Low Stock Alert"
              value={formData.lowStockThreshold}
              onChange={(value) => handleFieldChange('lowStockThreshold', value)}
              min={0}
              max={999999}
              step={1}
              suffix="units"
            />
          </div>
          
          {/* Profit Calculation */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated Profit per Unit:</span>
              <span className={cn(
                "font-semibold",
                formData.sellingPrice > formData.costPrice 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {(formData.sellingPrice - formData.costPrice).toLocaleString()} KES
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Profit Margin:</span>
              <span className={cn(
                "font-semibold",
                formData.sellingPrice > formData.costPrice 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {formData.costPrice > 0 
                  ? (((formData.sellingPrice - formData.costPrice) / formData.costPrice) * 100).toFixed(1)
                  : '0'
                }%
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProduct}
              className="flex-1 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Spreadsheet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionOverlay;