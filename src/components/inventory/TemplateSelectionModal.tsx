import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Package2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductTemplates, ProductTemplate } from '../../hooks/useProductTemplates';
import SimpleTemplateSearch from './bulk/SimpleTemplateSearch';
import TemplateImage from '../ui/template-image';
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
    searchTemplates,
    filterByCategory,
    clearFilters,
    totalTemplates
  } = useProductTemplates();

  const handleTemplateClick = (template: ProductTemplate) => {
    setSelectedTemplate(template);
    setShowConfigOverlay(true);
  };

  const handleConfigClose = () => {
    setShowConfigOverlay(false);
    setSelectedTemplate(null);
  };

  const handleUseTemplate = (templateData: any) => {
    onTemplateSelect(templateData);
    setShowConfigOverlay(false);
    setSelectedTemplate(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-200 cursor-pointer",
                      "hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02]"
                    )}
                  >
                    {/* Template Image */}
                    <div className="aspect-square bg-muted/30 overflow-hidden">
                      <TemplateImage
                        src={template.image_url}
                        alt={template.name}
                        productName={template.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    
                    {/* Template Info */}
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-foreground truncate mb-1">
                        {template.name}
                      </h3>
                      {template.category && (
                        <p className="text-xs text-muted-foreground capitalize truncate">
                          {template.category}
                        </p>
                      )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                        Select Template
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Configuration Overlay */}
      {selectedTemplate && (
        <TemplateSelectionOverlay
          template={selectedTemplate}
          isVisible={showConfigOverlay}
          onClose={handleConfigClose}
          onAddToSpreadsheet={handleUseTemplate}
          mode="single"
        />
      )}
    </>
  );
};

export default TemplateSelectionModal;