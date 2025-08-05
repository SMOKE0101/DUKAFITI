import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Package2, Search, Filter, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductTemplates } from '../../../hooks/useProductTemplates';
import TemplateImage from '../../ui/template-image';
import SpinningNumberInput from '../../ui/spinning-number-input';

interface UnifiedTemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (templateData: any) => void;
  mode?: 'normal' | 'uncountable' | 'variation';
}

// Custom DialogContent without the built-in close button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
CustomDialogContent.displayName = "CustomDialogContent";

// Inline Template Configuration Form Component
interface InlineTemplateConfigurationFormProps {
  template: any;
  onSave: (productData: any) => void;
  onCancel: () => void;
  mode?: 'normal' | 'uncountable' | 'variation';
}

interface ProductFormData {
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
}

const InlineTemplateConfigurationForm: React.FC<InlineTemplateConfigurationFormProps> = ({
  template,
  onSave,
  onCancel,
  mode = 'normal'
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    costPrice: 10,
    sellingPrice: 15,
    currentStock: 50,
    lowStockThreshold: 10
  });

  const handleFieldChange = (field: keyof ProductFormData, value: number) => {
    console.log('[InlineTemplateConfigurationForm] Field change:', field, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[InlineTemplateConfigurationForm] handleSaveProduct called');
    console.log('[InlineTemplateConfigurationForm] formData:', formData);
    console.log('[InlineTemplateConfigurationForm] template:', template);
    
    const productData = {
      name: template.name,
      category: template.category,
      image_url: template.image_url,
      costPrice: formData.costPrice,
      sellingPrice: formData.sellingPrice,
      currentStock: formData.currentStock,
      lowStockThreshold: formData.lowStockThreshold
    };
    
    console.log('[InlineTemplateConfigurationForm] Calling onSave with productData:', productData);
    onSave(productData);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="text-center mb-4">
        <h4 className="text-base font-semibold mb-1 text-foreground">
          Configure Product Details
        </h4>
        <p className="text-muted-foreground text-xs">
          Scroll or tap to adjust values
        </p>
      </div>
      
      <form onSubmit={handleSaveProduct}>
        {/* Compact Spinning Number Inputs Grid */}
        <div className={cn(
          "gap-4 md:gap-6 mb-6",
          mode === 'uncountable' 
            ? "grid grid-cols-2"
            : "grid grid-cols-2 md:grid-cols-4"
        )}>
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
        </div>
        
        {/* Compact Profit Calculation */}
        <div className="bg-gradient-to-r from-primary/3 to-primary/5 rounded-lg p-3 mb-4 border border-primary/10">
          <h5 className="font-medium text-center mb-2 text-foreground text-sm">Profit Analysis</h5>
          <div className="grid grid-cols-2 gap-3">
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
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            variant="outline"
            className="w-full sm:w-auto h-10 text-sm px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:flex-1 h-12 text-base font-semibold gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Save
          </Button>
        </div>
      </form>
    </div>
  );
};

const UnifiedTemplateSelectionModal: React.FC<UnifiedTemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onTemplateSelect,
  mode = 'normal'
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  
  const {
    templates,
    loading,
    error,
    searchTerm,
    selectedCategory,
    categories,
    searchTemplates,
    filterByCategory,
    clearFilters,
    totalTemplates
  } = useProductTemplates();

  const templatesPerPage = 50;
  const totalPages = Math.ceil(templates.length / templatesPerPage);
  const startIndex = (currentPage - 1) * templatesPerPage;
  const endIndex = startIndex + templatesPerPage;
  const currentTemplates = templates.slice(startIndex, endIndex);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(1);
      setSelectedTemplate(null);
      setIsOverlayVisible(false);
      searchTemplates('');
      filterByCategory('all');
    }
  }, [isOpen]);

  const handleTemplateClick = (template: any) => {
    setSelectedTemplate(template);
    setIsOverlayVisible(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayVisible(false);
    setSelectedTemplate(null);
  };

  const handleUseTemplate = (productData: any) => {
    console.log('[UnifiedTemplateSelectionModal] handleUseTemplate called');
    console.log('[UnifiedTemplateSelectionModal] productData received:', productData);
    console.log('[UnifiedTemplateSelectionModal] mode:', mode);
    console.log('[UnifiedTemplateSelectionModal] onTemplateSelect function:', typeof onTemplateSelect);
    
    // Transform data based on mode
    let transformedData = {
      name: productData.name,
      category: productData.category,
      image_url: productData.image_url,
      cost_price: productData.costPrice,
      selling_price: productData.sellingPrice,
      current_stock: productData.currentStock,
      low_stock_threshold: productData.lowStockThreshold
    };

    // Mode-specific transformations
    if (mode === 'uncountable') {
      // Remove stock-related fields for uncountable items
      delete transformedData.current_stock;
      delete transformedData.low_stock_threshold;
    } else if (mode === 'variation') {
      // For variations, we mainly need the base info
      transformedData = {
        ...transformedData,
        current_stock: productData.currentStock,
        low_stock_threshold: productData.lowStockThreshold
      };
    }

    console.log('[UnifiedTemplateSelectionModal] transformedData:', transformedData);
    console.log('[UnifiedTemplateSelectionModal] About to call onTemplateSelect...');
    
    try {
      onTemplateSelect(transformedData);
      console.log('[UnifiedTemplateSelectionModal] onTemplateSelect called successfully');
    } catch (error) {
      console.error('[UnifiedTemplateSelectionModal] Error calling onTemplateSelect:', error);
    }
    
    console.log('[UnifiedTemplateSelectionModal] About to call onClose...');
    onClose();
    console.log('[UnifiedTemplateSelectionModal] onClose called');
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent auto-closing when overlay is visible
      if (!open && isOverlayVisible) {
        return;
      }
      onClose();
    }}>
      <CustomDialogContent className="max-w-6xl w-[98vw] max-h-[95vh] p-0 flex flex-col bg-background">
        <DialogTitle className="sr-only">Select Product Template</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Package2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Select {mode === 'uncountable' ? 'Uncountable Item' : mode === 'variation' ? 'Product Variation' : 'Product'} Template
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose a template to pre-fill your {mode === 'uncountable' ? 'uncountable item' : mode === 'variation' ? 'product variation' : 'product'} details
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

        {/* Search Bar */}
        <div className="p-3 border-b border-border bg-muted/20 flex-shrink-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${totalTemplates > 0 ? totalTemplates.toLocaleString() : '7,344+'} templates... (e.g., 'kabras', 'sugar', 'omo')`}
              value={searchTerm}
              onChange={(e) => searchTemplates(e.target.value)}
              className="pl-10 pr-10 h-10 text-sm"
              disabled={loading}
            />
            {searchTerm && (
              <Button
                onClick={() => searchTemplates('')}
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => filterByCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={cn(
                  "capitalize whitespace-nowrap flex-shrink-0 h-7 px-3 text-xs",
                  selectedCategory === category && "bg-primary text-primary-foreground"
                )}
                disabled={loading}
              >
                <Filter className="w-3 h-3 mr-1" />
                {category === 'all' ? 'All Categories' : category}
              </Button>
            ))}
          </div>
          
          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-muted-foreground">
              <span className="font-semibold text-primary">{templates.length.toLocaleString()}</span> of{' '}
              <span className="font-semibold">{totalTemplates.toLocaleString()}</span> templates
            </span>
            {(searchTerm.trim() || selectedCategory !== 'all') && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto relative">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
              {Array.from({ length: 24 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square mb-2"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 mb-1"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-2/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center p-8">
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Failed to load templates
                </div>
                <p className="text-gray-500 dark:text-gray-400">{error}</p>
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
            <>
              {/* Page Info */}
              <div className="px-4 py-1 bg-muted/10 text-xs text-muted-foreground text-center">
                Showing {startIndex + 1}-{Math.min(endIndex, templates.length)} of {templates.length.toLocaleString()} templates
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2 p-3">
                {currentTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    className="relative bg-card rounded-lg border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg overflow-hidden border-border hover:border-primary/40"
                  >
                    {/* Product Image */}
                    <div className="aspect-square overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted">
                      <TemplateImage 
                        src={template.image_url}
                        alt={template.name}
                        productName={template.name}
                        className="w-full h-full"
                      />
                    </div>
                    
                    {/* Product Information */}
                    <div className="p-2 flex flex-col gap-1">
                      <h4 className="font-medium text-xs text-foreground line-clamp-2 leading-tight min-h-[2rem]" title={template.name}>
                        {template.name}
                      </h4>
                      {template.category && (
                        <p className="text-[10px] text-muted-foreground capitalize truncate">
                          {template.category}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-3 py-4 border-t border-border/50">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {/* Previous Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="gap-1 text-xs"
                    >
                      ← Prev
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex gap-1 overflow-x-auto max-w-xs">
                      {currentPage > 3 && (
                        <>
                          <Button
                            variant={1 === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(1)}
                            className="w-8 h-8 p-0 text-xs flex-shrink-0"
                          >
                            1
                          </Button>
                          {currentPage > 4 && <span className="px-1 text-muted-foreground text-xs flex-shrink-0">...</span>}
                        </>
                      )}
                      
                      {getPageNumbers().map((page) => (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className="w-8 h-8 p-0 text-xs flex-shrink-0"
                        >
                          {page}
                        </Button>
                      ))}
                      
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && <span className="px-1 text-muted-foreground text-xs flex-shrink-0">...</span>}
                          <Button
                            variant={totalPages === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(totalPages)}
                            className="w-8 h-8 p-0 text-xs flex-shrink-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Next Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="gap-1 text-xs"
                    >
                      Next →
                    </Button>
                  </div>
                  
                  {/* Page Jump */}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Page:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          goToPage(page);
                        }
                      }}
                      className="w-12 px-1 py-1 text-xs border rounded text-center bg-background"
                    />
                    <span className="text-xs text-muted-foreground">of {totalPages}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Template Configuration Overlay - Rendered within the dialog */}
          {isOverlayVisible && selectedTemplate && (
            <div className="absolute inset-0 flex items-start justify-center pt-[10vh] bg-black/70 backdrop-blur-sm z-50">
              {/* Overlay Background */}
              <div 
                className="absolute inset-0" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCloseOverlay();
                }}
              />
              
              {/* Content Container */}
              <div 
                className="relative bg-card/98 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-border/50 shadow-2xl max-w-2xl md:max-w-3xl w-full mx-2 md:mx-4 transform transition-all duration-300 ease-out"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(var(--card) / 0.98), hsl(var(--muted) / 0.95))',
                  backdropFilter: 'blur(20px)',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {/* Elegant Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/30">
                  <div className="flex items-center gap-3 md:gap-6">
                    {/* Template Image */}
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 flex-shrink-0 ring-2 ring-primary/20">
                      {selectedTemplate.image_url ? (
                        <img 
                          src={selectedTemplate.image_url} 
                          alt={selectedTemplate.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl font-bold text-primary">
                            {selectedTemplate.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Template Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-lg md:text-xl text-foreground mb-1 truncate">{selectedTemplate.name}</h3>
                      {selectedTemplate.category && (
                        <p className="text-sm md:text-base text-muted-foreground capitalize font-medium">{selectedTemplate.category}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseOverlay}
                    className="w-8 h-8 md:w-10 md:h-10 p-0 hover:bg-muted/50 rounded-full flex-shrink-0"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </div>
                
                {/* Inline Configuration Content */}
                <InlineTemplateConfigurationForm 
                  template={selectedTemplate}
                  onSave={handleUseTemplate}
                  onCancel={handleCloseOverlay}
                  mode={mode}
                />
              </div>
            </div>
          )}
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

export default UnifiedTemplateSelectionModal;