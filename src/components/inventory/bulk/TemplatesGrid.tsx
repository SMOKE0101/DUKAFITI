import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Package, AlertCircle } from 'lucide-react';
import { ProductTemplate } from '../../../hooks/useProductTemplates';
import { Skeleton } from '@/components/ui/skeleton';
import UnifiedProductCard from '../../ui/unified-product-card';
import BulkSelectionTools from './BulkSelectionTools';

interface TemplatesGridProps {
  templates: ProductTemplate[];
  selectedTemplates: ProductTemplate[];
  onTemplateSelect: (template: ProductTemplate) => void;
  loading: boolean;
  error: string | null;
}

const TemplatesGrid: React.FC<TemplatesGridProps> = ({
  templates,
  selectedTemplates,
  onTemplateSelect,
  loading,
  error
}) => {
  const [visibleItems, setVisibleItems] = useState(50);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleItems < templates.length) {
          setVisibleItems(prev => Math.min(prev + 50, templates.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [templates.length, visibleItems]);

  // Reset visible items when templates change
  useEffect(() => {
    setVisibleItems(50);
  }, [templates]);

  const isSelected = useCallback((template: ProductTemplate) => {
    return selectedTemplates.some(t => t.id === template.id);
  }, [selectedTemplates]);

  // Bulk selection handlers
  const handleSelectAll = useCallback(() => {
    templates.forEach(template => {
      if (!isSelected(template)) {
        onTemplateSelect(template);
      }
    });
  }, [templates, isSelected, onTemplateSelect]);

  const handleClearAll = useCallback(() => {
    selectedTemplates.forEach(template => {
      onTemplateSelect(template);
    });
  }, [selectedTemplates, onTemplateSelect]);

  const handleSelectVisible = useCallback(() => {
    const visible = templates.slice(0, visibleItems);
    visible.forEach(template => {
      if (!isSelected(template)) {
        onTemplateSelect(template);
      }
    });
  }, [templates, visibleItems, isSelected, onTemplateSelect]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-4">
        {Array.from({ length: 24 }).map((_, index) => (
          <div key={index} className="rounded-lg overflow-hidden">
            <Skeleton className="aspect-square w-full mb-2" />
            <Skeleton className="h-3 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Templates</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (templates.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Package className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
        <p className="text-muted-foreground mb-4">
          {error ? error : "Try adjusting your search criteria or check your connection."}
        </p>
        {error && (
          <p className="text-xs text-muted-foreground">
            Expected 7,000+ templates. Please check your internet connection and try again.
          </p>
        )}
      </div>
    );
  }

  const visibleTemplates = templates.slice(0, visibleItems);

  return (
    <div className="h-full flex flex-col">
      {/* Bulk Selection Tools */}
      {templates.length > 0 && (
        <div className="flex-shrink-0 p-4 pb-2">
          <BulkSelectionTools
            selectedCount={selectedTemplates.length}
            totalCount={templates.length}
            visibleCount={visibleItems}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
            onSelectVisible={handleSelectVisible}
            disabled={loading}
          />
        </div>
      )}

      {/* Templates Grid */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-4 pt-2">
        {visibleTemplates.map((template) => (
          <UnifiedProductCard
            key={template.id}
            product={{
              id: String(template.id),
              name: template.name,
              image_url: template.image_url,
              category: template.category
            }}
            variant="template"
            isSelected={isSelected(template)}
            onSelect={() => onTemplateSelect(template)}
          />
        ))}
        </div>
        
        {/* Load More Trigger */}
        {visibleItems < templates.length && (
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">
              Loading more templates... ({visibleItems.toLocaleString()} of {templates.length.toLocaleString()} shown)
            </div>
          </div>
        )}
        
        {/* Status indicator when all templates are loaded */}
        {visibleItems >= templates.length && templates.length > 50 && (
          <div className="h-16 flex items-center justify-center border-t border-border">
            <div className="text-xs text-muted-foreground">
              ✓ All {templates.length.toLocaleString()} templates loaded
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesGrid;