import React, { useState, useEffect } from 'react';
import { X, Package2, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLazyTemplateSearch, ProductTemplate } from '../../hooks/useLazyTemplateSearch';
import { useIsMobile } from '../../hooks/use-mobile';
import MobileOptimizedModal from '../ui/mobile-optimized-modal';
import TemplateImage from '../ui/template-image';
import MobileTemplateConfigurationOverlay from './MobileTemplateConfigurationOverlay';

interface MobileOptimizedTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (templateData: any) => void;
  mode?: 'normal' | 'uncountable' | 'variation';
}

const MobileOptimizedTemplateModal: React.FC<MobileOptimizedTemplateModalProps> = ({
  isOpen,
  onClose,
  onTemplateSelect,
  mode = 'normal'
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const isMobile = useIsMobile();
  
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
  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplate(null);
      setShowConfiguration(false);
    }
  }, [isOpen]);

  // Initialize templates when modal opens
  useEffect(() => {
    if (isOpen && !initialized) {
      initializeTemplates();
    }
  }, [isOpen, initialized]);

  const handleTemplateClick = (template: ProductTemplate) => {
    console.log('[MobileOptimizedTemplateModal] Template clicked:', template.name);
    setSelectedTemplate(template);
    setShowConfiguration(true);
  };

  const handleConfigurationComplete = (templateData: any) => {
    console.log('[MobileOptimizedTemplateModal] Configuration complete:', templateData);
    onTemplateSelect(templateData);
    onClose();
  };

  const handleBackToSelection = () => {
    setShowConfiguration(false);
    setSelectedTemplate(null);
  };

  return (
    <>
      <MobileOptimizedModal
        open={isOpen}
        onOpenChange={onClose}
        title={`Select ${mode === 'uncountable' ? 'Uncountable Item' : 'Product'} Template`}
        description={`Choose a template to pre-fill your ${mode === 'uncountable' ? 'uncountable item' : 'product'} details`}
        className="max-w-6xl"
        maxHeight="95vh"
      >
        {/* Fixed Search Bar */}
        <div className="bg-muted/20 border-b border-border">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${totalTemplates > 0 ? totalTemplates.toLocaleString() : '7,344+'} templates...`}
                value={searchTerm}
                onChange={(e) => searchTemplates(e.target.value)}
                className="pl-10 pr-10 h-10"
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
          </div>

          {/* Horizontal Scrollable Categories */}
          <div className="px-3 pb-3">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  onClick={() => filterByCategory(category)}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "capitalize whitespace-nowrap flex-shrink-0 h-8 px-3 text-xs",
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
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
              {Array.from({ length: 20 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-muted rounded-lg aspect-square mb-2"></div>
                  <div className="bg-muted rounded h-4 mb-1"></div>
                  <div className="bg-muted rounded h-3 w-2/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center p-8">
                <Package2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Failed to load templates</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center p-8">
                <Package2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No templates found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  className="relative bg-card rounded-lg border border-border hover:border-primary/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg overflow-hidden"
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
          )}
        </div>
      </MobileOptimizedModal>

      {/* Configuration Overlay */}
      <MobileTemplateConfigurationOverlay
        template={selectedTemplate}
        isVisible={showConfiguration}
        onClose={handleBackToSelection}
        onComplete={handleConfigurationComplete}
        mode={mode}
      />
    </>
  );
};

export default MobileOptimizedTemplateModal;