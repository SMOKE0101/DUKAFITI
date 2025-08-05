import React, { useState } from 'react';
import { X, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpinningNumberInput from '@/components/ui/spinning-number-input';
import { cn } from '@/lib/utils';
import { useIsMobile } from '../../hooks/use-mobile';

interface MobileTemplateConfigurationOverlayProps {
  template: any;
  isVisible: boolean;
  onClose: () => void;
  onComplete: (productData: any) => void;
  mode?: 'normal' | 'uncountable' | 'variation';
}

interface ProductFormData {
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
}

const MobileTemplateConfigurationOverlay: React.FC<MobileTemplateConfigurationOverlayProps> = ({
  template,
  isVisible,
  onClose,
  onComplete,
  mode = 'normal'
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    costPrice: 10,
    sellingPrice: 15,
    currentStock: 50,
    lowStockThreshold: 10
  });
  const isMobile = useIsMobile();

  const handleFieldChange = (field: keyof ProductFormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComplete = () => {
    if (!template) return;
    
    const productData = {
      name: template.name,
      category: template.category,
      image_url: template.image_url,
      cost_price: formData.costPrice,
      selling_price: formData.sellingPrice,
      current_stock: mode === 'uncountable' ? -1 : formData.currentStock,
      low_stock_threshold: mode === 'uncountable' ? 0 : formData.lowStockThreshold
    };
    
    onComplete(productData);
  };

  if (!isVisible || !template) return null;

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Overlay Background */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      {/* Content Container */}
      <div 
        className={cn(
          "relative bg-card/98 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl w-full mx-4 transform transition-all duration-300 ease-out max-h-[90vh] overflow-auto",
          isMobile ? "max-w-sm" : "max-w-2xl"
        )}
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--card) / 0.98), hsl(var(--muted) / 0.95))',
          backdropFilter: 'blur(20px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            {/* Template Image */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 flex-shrink-0 ring-2 ring-primary/20">
              {template.image_url ? (
                <img 
                  src={template.image_url} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {template.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Template Info */}
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-foreground mb-1 truncate">{template.name}</h3>
              {template.category && (
                <p className="text-sm text-muted-foreground capitalize">{template.category}</p>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0 hover:bg-muted/50 rounded-full flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="text-center mb-4">
            <h4 className="text-base font-semibold mb-1 text-foreground">
              Configure Product Details
            </h4>
            <p className="text-muted-foreground text-xs">
              Scroll or tap to adjust values
            </p>
          </div>
          
          {/* Spinning Number Inputs Grid */}
          <div className={cn(
            "gap-4 mb-6",
            mode === 'uncountable' 
              ? "grid grid-cols-1"
              : mode === 'variation'
              ? "grid grid-cols-1"
              : isMobile
              ? "grid grid-cols-2"
              : "grid grid-cols-4"
          )}>
            {mode === 'variation' ? (
              <>
                <SpinningNumberInput
                  label="Parent Stock Quantity"
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
              </>
            ) : (
              <>
                <SpinningNumberInput
                  label="Cost"
                  value={formData.costPrice}
                  onChange={(value) => handleFieldChange('costPrice', value)}
                  min={0}
                  max={999999}
                  step={1}
                  suffix="KES"
                />
                
                <SpinningNumberInput
                  label="Selling"
                  value={formData.sellingPrice}
                  onChange={(value) => handleFieldChange('sellingPrice', value)}
                  min={0}
                  max={999999}
                  step={1}
                  suffix="KES"
                />
                
                {mode !== 'uncountable' && (
                  <>
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
                  </>
                )}
              </>
            )}
          </div>
          
          {/* Mode-specific Notices */}
          {mode === 'uncountable' && (
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-3 mb-4 border border-orange-200 dark:border-orange-800">
              <h5 className="font-semibold text-orange-900 dark:text-orange-100 mb-1 text-sm">
                Uncountable Item Template
              </h5>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                This template will be configured for uncountable items (sold by scoops, cups, portions, etc.).
              </p>
            </div>
          )}
          
          {mode === 'variation' && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 mb-4 border border-green-200 dark:border-green-800">
              <h5 className="font-semibold text-green-900 dark:text-green-100 mb-1 text-sm">
                Variation Product Template
              </h5>
              <p className="text-xs text-green-700 dark:text-green-300">
                This template will be used as the base for your product variations.
              </p>
            </div>
          )}

          {/* Profit Calculation - Only show for non-variation modes */}
          {mode !== 'variation' && (
            <div className="bg-gradient-to-r from-primary/3 to-primary/5 rounded-lg p-3 mb-4 border border-primary/10">
              <h5 className="font-medium text-center mb-2 text-foreground text-sm">Profit Analysis</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Profit per Unit</div>
                  <div className={cn(
                    "text-base font-semibold",
                    formData.sellingPrice > formData.costPrice 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {(formData.sellingPrice - formData.costPrice).toLocaleString()} KES
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Profit Margin</div>
                  <div className={cn(
                    "text-base font-semibold",
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
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full h-10 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
            <Button
              onClick={handleComplete}
              className="w-full h-12 text-base font-semibold gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Use Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTemplateConfigurationOverlay;