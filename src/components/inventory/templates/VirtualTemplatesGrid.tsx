import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ShoppingCart, Package, AlertCircle, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductTemplate } from '../../../hooks/useProductTemplates';
import { useVirtualScrolling } from '../../../hooks/useVirtualScrolling';

interface VirtualTemplatesGridProps {
  templates: ProductTemplate[];
  selectedTemplates: ProductTemplate[];
  onTemplateSelect: (template: ProductTemplate) => void;
  loading: boolean;
  error: string | null;
  searchTerm: string;
}

const ITEM_HEIGHT = 280; // Height of each grid item
const CONTAINER_HEIGHT = window.innerHeight - 200; // Available height

const VirtualTemplatesGrid: React.FC<VirtualTemplatesGridProps> = ({
  templates,
  selectedTemplates,
  onTemplateSelect,
  loading,
  error,
  searchTerm
}) => {
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Safety checks
  const safeTemplates = Array.isArray(templates) ? templates : [];
  const safeSelectedTemplates = Array.isArray(selectedTemplates) ? selectedTemplates : [];
  
  const isSelected = (template: ProductTemplate) => 
    safeSelectedTemplates.some(t => t && template && t.id === template.id);

  // Calculate grid columns based on container width
  const [gridCols, setGridCols] = useState(5);
  
  useEffect(() => {
    const updateGridCols = () => {
      const width = window.innerWidth;
      if (width < 640) setGridCols(2);      // sm
      else if (width < 768) setGridCols(3); // md
      else if (width < 1024) setGridCols(4); // lg
      else setGridCols(5);                   // xl+
    };
    
    updateGridCols();
    window.addEventListener('resize', updateGridCols);
    return () => window.removeEventListener('resize', updateGridCols);
  }, []);

  // Use direct virtual scrolling with templates
  const {
    visibleItems: visibleTemplates,
    totalHeight,
    scrollToTop,
    onScroll
  } = useVirtualScrolling(safeTemplates, {
    itemHeight: ITEM_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    overscan: 5
  });

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowScrollToTop(scrollTop > 500);
    onScroll(e);
  }, [onScroll]);

  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NS41IDExNS41SDE0MS41VjE2NS41SDc1LjVWMTE1LjVaIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik05NS41IDc1LjVIMTIxLjVWMTE1LjVIOTUuNVY3NS41WiIgZmlsbD0iI0U1RTdFQiIvPgo8L3N2Zz4K';

  // Render loading state
  if (loading) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4">
          <div className={cn(
            "grid gap-4",
            gridCols === 2 && "grid-cols-2",
            gridCols === 3 && "grid-cols-3", 
            gridCols === 4 && "grid-cols-4",
            gridCols === 5 && "grid-cols-5"
          )}>
            {Array.from({ length: 20 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square mb-2"></div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 mb-1"></div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load templates
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (safeTemplates.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No templates found' : 'No templates available'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm 
              ? 'Try adjusting your search or category filter' 
              : 'Templates will appear here when available'
            }
          </p>
        </div>
      </div>
    );
  }

  // Highlight matching text
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const regex = new RegExp(`(${search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative h-full">
      <ScrollArea 
        className="h-full"
        ref={scrollContainerRef}
        onScrollCapture={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div className="p-4">
            <div className={cn(
              "grid gap-4",
              gridCols === 2 && "grid-cols-2",
              gridCols === 3 && "grid-cols-3", 
              gridCols === 4 && "grid-cols-4",
              gridCols === 5 && "grid-cols-5"
            )}>
              {visibleTemplates.map((item) => {
                const template = item as any; // Cast to template type
                if (!template || !template.id) return null;
                
                const selected = isSelected(template);
                
                return (
                  <div
                    key={template.id}
                    style={{
                      position: 'absolute',
                      top: Math.floor(item.virtualIndex / gridCols) * ITEM_HEIGHT,
                      left: `${(item.virtualIndex % gridCols) * (100 / gridCols)}%`,
                      width: `${100 / gridCols}%`,
                      height: ITEM_HEIGHT,
                      padding: '0.5rem'
                    }}
                  >
                    <div
                      className={cn(
                        "group relative bg-card rounded-lg border-2 transition-all duration-200 hover:shadow-lg cursor-pointer h-full",
                        selected 
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md scale-105" 
                          : "border-border hover:border-purple-300 hover:scale-102"
                      )}
                      onClick={() => onTemplateSelect(template)}
                    >
                      {/* Selection Indicator */}
                      {selected && (
                        <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="aspect-square rounded-t-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={template.image_url || fallbackImage}
                          alt={template.name}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = fallbackImage;
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="p-3">
                        <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                          {highlightText(template.name, searchTerm)}
                        </h4>
                        <p className="text-xs text-muted-foreground capitalize">
                          {highlightText(template.category || 'General', searchTerm)}
                        </p>
                      </div>

                      {/* Action Button Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <Button
                          size="sm"
                          variant={selected ? "secondary" : "default"}
                          className={cn(
                            "shadow-lg transition-all duration-200",
                            selected 
                              ? "bg-white text-purple-600 hover:bg-gray-100 scale-110" 
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          )}
                        >
                          {selected ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Selected
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 z-50 rounded-full w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          size="sm"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default VirtualTemplatesGrid;