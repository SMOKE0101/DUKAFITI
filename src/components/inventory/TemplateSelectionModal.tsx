import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Package2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLazyTemplateSearch, ProductTemplate } from '../../hooks/useLazyTemplateSearch';
import SimpleTemplateSearch from './bulk/SimpleTemplateSearch';
import VirtualizedTemplateGrid from './VirtualizedTemplateGrid';
import TemplateSelectionOverlay from './bulk/TemplateSelectionOverlay';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (templateData: any) => void;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onTemplateSelect
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [showConfigOverlay, setShowConfigOverlay] = useState(false);
  
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

  // Initialize templates when modal opens
  React.useEffect(() => {
    if (isOpen && !initialized) {
      initializeTemplates();
    }
  }, [isOpen, initialized]);

  const handleTemplateClick = React.useCallback((template: ProductTemplate) => {
    console.log('[TemplateSelectionModal] Template clicked:', template.name);
    setSelectedTemplate(template);
    setShowConfigOverlay(true);
  }, []);

  const handleConfigClose = React.useCallback(() => {
    console.log('[TemplateSelectionModal] handleConfigClose called');
    setShowConfigOverlay(false);
    setSelectedTemplate(null);
  }, []);

  const handleUseTemplate = React.useCallback((templateData: any) => {
    console.log('[TemplateSelectionModal] handleUseTemplate called with:', templateData);
    onTemplateSelect(templateData);
    setShowConfigOverlay(false);
    setSelectedTemplate(null);
    onClose();
  }, [onTemplateSelect, onClose]);


  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        console.log('[TemplateSelectionModal] Dialog onOpenChange called with:', open);
        if (!open) onClose();
      }}>
        <DialogContent className="max-w-6xl w-[98vw] max-h-[95vh] p-0 flex flex-col bg-background">
          <DialogTitle className="sr-only">Select Template</DialogTitle>
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Package2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Select Product Template</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a template to pre-fill your product details
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
        </DialogContent>
      </Dialog>

      {/* Configuration Overlay - Render as portal to avoid Dialog interference */}
      {selectedTemplate && showConfigOverlay && createPortal(
        <TemplateSelectionOverlay
          template={selectedTemplate}
          isVisible={showConfigOverlay}
          onClose={handleConfigClose}
          onAddToSpreadsheet={handleUseTemplate}
          mode="single"
          className="z-[100000]"
        />,
        document.body
      )}
    </>
  );
};

export default TemplateSelectionModal;