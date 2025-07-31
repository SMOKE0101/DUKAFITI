import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductTemplate } from '../../../hooks/useProductTemplates';

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
  const isSelected = (template: ProductTemplate) => 
    selectedTemplates.some(t => t.id === template.id);

  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NS41IDExNS41SDE0MS41VjE2NS41SDc1LjVWMTE1LjVaIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik05NS41IDc1LjVIMTIxLjVWMTE1LjVIOTUuNVY3NS41WiIgZmlsbD0iI0U1RTdFQiIvPgo8L3N2Zz4K';

  if (loading) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

  if (templates.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No templates found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or category filter
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {templates.map((template) => {
            const selected = isSelected(template);
            
            return (
              <div
                key={template.id}
                className={cn(
                  "group relative bg-card rounded-lg border-2 transition-all duration-200 hover:shadow-lg cursor-pointer",
                  selected 
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md" 
                    : "border-border hover:border-purple-300"
                )}
                onClick={() => onTemplateSelect(template)}
              >
                {/* Selection Indicator */}
                {selected && (
                  <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Product Image */}
                <div className="aspect-square rounded-t-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={template.image_url || fallbackImage}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = fallbackImage;
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="p-3">
                  <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                    {template.name}
                  </h4>
                  <p className="text-xs text-muted-foreground capitalize">
                    {template.category || 'General'}
                  </p>
                </div>

                {/* Action Button */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                  <Button
                    size="sm"
                    variant={selected ? "secondary" : "default"}
                    className={cn(
                      "shadow-lg",
                      selected 
                        ? "bg-white text-purple-600 hover:bg-gray-100" 
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
                        Select
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
};

export default TemplatesGrid;