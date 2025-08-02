import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, AlertCircle } from 'lucide-react';
import ResponsiveProductGrid from '../../ui/responsive-product-grid';
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
        <ResponsiveProductGrid
          products={templates}
          variant="template"
          selectedProducts={selectedTemplates}
          onSelect={onTemplateSelect}
          gridConfig={{
            cols: { mobile: 2, tablet: 4, desktop: 6 },
            gap: 'gap-3'
          }}
          emptyStateMessage="No templates found"
          emptyStateDescription="Try adjusting your search or category filter"
        />
      </div>
    </ScrollArea>
  );
};

export default TemplatesGrid;