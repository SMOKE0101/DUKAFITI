import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Package2, ArrowLeft, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLazyTemplateSearch, ProductTemplate } from '../../hooks/useLazyTemplateSearch';
import SimpleTemplateSearch from './bulk/SimpleTemplateSearch';
import VirtualizedTemplateGrid from './VirtualizedTemplateGrid';
import SpinningNumberInput from '../ui/spinning-number-input';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (templateData: any) => void;
  mode?: 'normal' | 'uncountable';
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onTemplateSelect,
  mode = 'normal'
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [modalStep, setModalStep] = useState<'selection' | 'configuration'>('selection');
  const [formData, setFormData] = useState({
    costPrice: 10,
    sellingPrice: 15,
    currentStock: 50,
    lowStockThreshold: 10
  });
  
  const {
    templates,
    loading,
    error,
    searchTerm,
    selectedCategory,
    categories,
    handleSearch: searchTemplates,
    handleCategoryChange: filterByCategory,
    clearFilters,
    totalTemplates,
    initializeTemplates,
    initialized
  } = useLazyTemplateSearch();

  // Reset modal state when closing
  React.useEffect(() => {
    if (!isOpen) {
      setModalStep('selection');
      setSelectedTemplate(null);
      setFormData({
        costPrice: 10,
        sellingPrice: 15,
        currentStock: 50,
        lowStockThreshold: 10
      });
    }
  }, [isOpen]);

  // Initialize templates when modal opens
  React.useEffect(() => {
    if (isOpen && !initialized) {
      initializeTemplates();
    }
  }, [isOpen, initialized]);

  const handleTemplateClick = React.useCallback((template: ProductTemplate) => {
    console.log('[TemplateSelectionModal] Template clicked:', template.name);
    setSelectedTemplate(template);
    setModalStep('configuration');
  }, []);

  const handleBackToSelection = React.useCallback(() => {
    console.log('[TemplateSelectionModal] Going back to selection');
    setModalStep('selection');
    setSelectedTemplate(null);
  }, []);

  const handleFieldChange = React.useCallback((field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleUseTemplate = React.useCallback(() => {
    if (!selectedTemplate) return;
    
    const templateData = {
      name: selectedTemplate.name,
      category: selectedTemplate.category,
      image_url: selectedTemplate.image_url,
      cost_price: formData.costPrice,
      selling_price: formData.sellingPrice,
      current_stock: formData.currentStock,
      low_stock_threshold: formData.lowStockThreshold
    };
    
    console.log('[TemplateSelectionModal] Using template with data:', templateData);
    onTemplateSelect(templateData);
    onClose();
  }, [selectedTemplate, formData, onTemplateSelect, onClose]);

  // Handle dialog open change - prevent closing during configuration
  const handleDialogOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      if (modalStep === 'configuration') {
        // Don't close during configuration, go back to selection
        handleBackToSelection();
      } else {
        onClose();
      }
    }
  }, [modalStep, onClose, handleBackToSelection]);


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-6xl w-[98vw] max-h-[95vh] p-0 flex flex-col bg-background">
        <DialogTitle className="sr-only">
          {modalStep === 'selection' ? 'Select Template' : 'Configure Template'}
        </DialogTitle>
        
        {modalStep === 'selection' ? (
          <>
            {/* Template Selection Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package2 className="w-4 h-4 text-primary" />
                </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Select {mode === 'uncountable' ? 'Uncountable Item' : 'Product'} Template
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Choose a template to pre-fill your {mode === 'uncountable' ? 'uncountable item' : 'product'} details
                    </p>
                  </div>
              </div>
              
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-border bg-muted/20">
              <SimpleTemplateSearch
                searchTerm={searchTerm}
                onSearchChange={searchTemplates}
                selectedCategory={selectedCategory}
                categories={categories}
                onCategoryChange={filterByCategory}
                onClearFilters={clearFilters}
                resultsCount={templates.length}
                totalItems={totalTemplates}
                loading={loading}
              />
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading templates...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-destructive mb-2">Error loading templates</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : templates.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Package2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No templates found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                  </div>
                </div>
              ) : (
                <VirtualizedTemplateGrid
                  templates={templates}
                  onTemplateClick={handleTemplateClick}
                  className="p-4"
                />
              )}
            </div>
          </>
        ) : (
          <>
            {/* Configuration Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleBackToSelection}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                
                {selectedTemplate && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 flex-shrink-0">
                      {selectedTemplate.image_url ? (
                        <img 
                          src={selectedTemplate.image_url} 
                          alt={selectedTemplate.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {selectedTemplate.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{selectedTemplate.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        Configure product details
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Configuration Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">
                    Configure {mode === 'uncountable' ? 'Uncountable Item' : 'Product'} Details
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Adjust the values below to customize your {mode === 'uncountable' ? 'uncountable item' : 'product'}
                  </p>
                </div>
                
                 {/* Spinning Number Inputs Grid */}
                <div className={cn(
                  "gap-6 mb-6",
                  mode === 'uncountable' 
                    ? "grid grid-cols-1 md:grid-cols-2" 
                    : "grid grid-cols-2 md:grid-cols-4"
                )}>
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
                  
                  {mode !== 'uncountable' && (
                    <>
                      <SpinningNumberInput
                        label="Current Stock"
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
                </div>
                
                {/* Uncountable Notice */}
                {mode === 'uncountable' && (
                  <div className="border-2 border-orange-300 dark:border-orange-600 rounded-xl p-4 bg-orange-50/50 dark:bg-orange-900/20 mb-6">
                    <h4 className="font-semibold uppercase tracking-wider text-orange-900 dark:text-orange-100 mb-2">
                      Uncountable Item Template
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      This template will be configured for uncountable items (sold by scoops, cups, portions, etc.).
                    </p>
                  </div>
                )}
                
                {/* Profit Calculation */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 mb-6 border border-primary/20">
                  <h4 className="font-semibold text-center mb-3">Profit Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Profit per Unit</div>
                      <div className={cn(
                        "text-lg font-semibold",
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
                        "text-lg font-semibold",
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
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    onClick={handleBackToSelection}
                    variant="outline"
                    className="w-full sm:flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Templates
                  </Button>
                  <Button
                    onClick={handleUseTemplate}
                    className="w-full sm:flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectionModal;