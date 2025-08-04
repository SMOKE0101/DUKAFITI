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
      "fixed inset-0 z-50 flex items-start justify-center pt-[15vh]",
      "bg-black/70 backdrop-blur-sm",
      className
    )}>
      {/* Overlay Background */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      {/* Content Container - Positioned slightly above middle */}
      <div className="relative z-10 bg-card/98 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl max-w-3xl w-full mx-4 transform transition-all duration-300 ease-out"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--card) / 0.98), hsl(var(--muted) / 0.95))',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Elegant Header */}
        <div className="flex items-center justify-between p-8 border-b border-border/30">
          <div className="flex items-center gap-6">
            {/* Template Image */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 flex-shrink-0 ring-2 ring-primary/20">
              {template.image_url ? (
                <img 
                  src={template.image_url} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary">
                    {template.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Template Info */}
            <div>
              <h3 className="font-bold text-xl text-foreground mb-1">{template.name}</h3>
              {template.category && (
                <p className="text-muted-foreground capitalize font-medium">{template.category}</p>
              )}
            </div>
          </div>
          
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-10 h-10 p-0 hover:bg-muted/50 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-10">
            <h4 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Configure Product Details
            </h4>
            <p className="text-muted-foreground text-lg">
              Use the spinning dials to set pricing and stock information
            </p>
          </div>
          
          {/* Spinning Number Inputs - Styled like lock interface */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-10">
            <SpinningNumberInput
              label="Cost"
              value={formData.costPrice}
              onChange={(value) => handleFieldChange('costPrice', value)}
              min={0}
              max={999999}
              step={5}
              suffix="KES"
            />
            
            <SpinningNumberInput
              label="Selling"
              value={formData.sellingPrice}
              onChange={(value) => handleFieldChange('sellingPrice', value)}
              min={0}
              max={999999}
              step={5}
              suffix="KES"
            />
            
            <SpinningNumberInput
              label="In Stock"
              value={formData.currentStock}
              onChange={(value) => handleFieldChange('currentStock', value)}
              min={0}
              max={999999}
              step={10}
              suffix="units"
            />
            
            <SpinningNumberInput
              label="Low Stock Alert"
              value={formData.lowStockThreshold}
              onChange={(value) => handleFieldChange('lowStockThreshold', value)}
              min={0}
              max={999999}
              step={5}
              suffix="units"
            />
          </div>
          
          {/* Enhanced Profit Calculation */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-6 mb-8 border border-primary/20">
            <h5 className="font-semibold text-center mb-4 text-foreground">Profit Analysis</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Profit per Unit</div>
                <div className={cn(
                  "text-2xl font-bold",
                  formData.sellingPrice > formData.costPrice 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                )}>
                  {(formData.sellingPrice - formData.costPrice).toLocaleString()} KES
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Profit Margin</div>
                <div className={cn(
                  "text-2xl font-bold",
                  formData.sellingPrice > formData.costPrice 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                )}>
                  {formData.costPrice > 0 
                    ? (((formData.sellingPrice - formData.costPrice) / formData.costPrice) * 100).toFixed(1)
                    : '0'
                  }%
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 text-base"
              size="lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProduct}
              className="flex-1 h-12 text-base gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              size="lg"
            >
              <Plus className="w-5 h-5" />
              Add to Spreadsheet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionOverlay;