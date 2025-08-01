import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductTemplate } from '../../../hooks/useProductTemplates';
import { Skeleton } from '@/components/ui/skeleton';

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="p-3 border border-border rounded-lg">
            <Skeleton className="h-32 w-full mb-3 rounded" />
            <Skeleton className="h-4 w-3/4 mb-2" />
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

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Package className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or check your connection.
        </p>
      </div>
    );
  }

  const visibleTemplates = templates.slice(0, visibleItems);

  return (
    <div 
      ref={scrollContainerRef}
      className="h-full overflow-auto"
      style={{ 
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
        {visibleTemplates.map((template) => {
          const selected = isSelected(template);
          
          return (
            <div
              key={template.id}
              className={cn(
                "group relative border border-border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer",
                selected && "ring-2 ring-primary border-primary bg-primary/5"
              )}
              onClick={() => onTemplateSelect(template)}
            >
              {/* Selection Indicator */}
              {selected && (
                <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              {/* Template Image */}
              <div className="aspect-square bg-muted flex items-center justify-center">
                {template.image_url ? (
                  <img
                    src={template.image_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Package className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              
              {/* Template Info */}
              <div className="p-3">
                <h4 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {template.name}
                </h4>
                {template.category && (
                  <p className="text-xs text-muted-foreground">
                    {template.category}
                  </p>
                )}
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          );
        })}
      </div>
      
      {/* Load More Trigger */}
      {visibleItems < templates.length && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading more templates...</div>
        </div>
      )}
    </div>
  );
};

export default TemplatesGrid;