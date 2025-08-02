import React from 'react';
import { cn } from '@/lib/utils';
import UnifiedProductCard from './unified-product-card';

// Base product interface that all product types should extend
interface BaseProduct {
  id: string | number;
  name: string;
  image_url?: string | null;
  category?: string | null;
}

// Grid configuration
interface GridConfig {
  cols: {
    mobile: number;    // xs screens
    tablet: number;    // sm-md screens  
    desktop: number;   // lg+ screens
  };
  gap: string;
  aspectRatio?: string;
}

// Default grid configs for different variants
const GRID_CONFIGS: Record<string, GridConfig> = {
  sales: {
    cols: { mobile: 2, tablet: 3, desktop: 4 },
    gap: 'gap-3',
    aspectRatio: 'aspect-square'
  },
  inventory: {
    cols: { mobile: 2, tablet: 3, desktop: 5 },
    gap: 'gap-2',
    aspectRatio: 'aspect-square'
  },
  template: {
    cols: { mobile: 2, tablet: 4, desktop: 6 },
    gap: 'gap-2',
    aspectRatio: 'aspect-square'
  }
};

interface ResponsiveProductGridProps {
  // Data
  products: BaseProduct[];
  variant: 'sales' | 'inventory' | 'template';
  
  // Sales specific
  onAddToCart?: (product: any) => void;
  getPriceForProduct?: (product: any) => number;
  getStockForProduct?: (product: any) => number;
  getInStockStatus?: (product: any) => boolean;
  
  // Inventory specific  
  onEdit?: (product: any) => void;
  onDelete?: (product: any) => void;
  onRestock?: (product: any) => void;
  getSellingPrice?: (product: any) => number;
  getCostPrice?: (product: any) => number;
  getCurrentStock?: (product: any) => number;
  getLowStockThreshold?: (product: any) => number;
  
  // Template specific
  selectedProducts?: BaseProduct[];
  onSelect?: (product: any) => void;
  
  // Customization
  gridConfig?: Partial<GridConfig>;
  className?: string;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
}

const ResponsiveProductGrid: React.FC<ResponsiveProductGridProps> = ({
  products,
  variant,
  onAddToCart,
  getPriceForProduct,
  getStockForProduct,
  getInStockStatus,
  onEdit,
  onDelete,
  onRestock,
  getSellingPrice,
  getCostPrice,
  getCurrentStock,
  getLowStockThreshold,
  selectedProducts = [],
  onSelect,
  gridConfig,
  className,
  emptyStateMessage = "No products found",
  emptyStateDescription = "Try adjusting your search or filters"
}) => {
  // Merge default config with custom config
  const config = { ...GRID_CONFIGS[variant], ...gridConfig };
  
  // Helper to check if a product is selected (for templates)
  const isProductSelected = (product: BaseProduct) => {
    return selectedProducts.some(p => p.id === product.id);
  };

  // Empty state
  if (products.length === 0) {
    return (
      <div className="text-center py-12 w-full">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 flex items-center justify-center shadow-lg">
          <span className="text-2xl">📦</span>
        </div>
        <p className="text-lg font-medium text-foreground mb-2">{emptyStateMessage}</p>
        <p className="text-sm text-muted-foreground">{emptyStateDescription}</p>
      </div>
    );
  }

  // Build responsive grid classes
  const gridClasses = cn(
    "grid w-full",
    `grid-cols-${config.cols.mobile}`,
    `sm:grid-cols-${config.cols.tablet}`, 
    `lg:grid-cols-${config.cols.desktop}`,
    config.gap,
    className
  );

  return (
    <div className={gridClasses}>
      {products.map((product) => {
        // Build props based on variant
        const cardProps: any = {
          key: product.id,
          product,
          variant,
        };

        // Sales-specific props
        if (variant === 'sales') {
          cardProps.onAddToCart = onAddToCart;
          cardProps.price = getPriceForProduct?.(product);
          cardProps.stock = getStockForProduct?.(product);
          cardProps.isInStock = getInStockStatus?.(product) ?? true;
        }

        // Inventory-specific props
        if (variant === 'inventory') {
          cardProps.onEdit = onEdit;
          cardProps.onDelete = onDelete;
          cardProps.onRestock = onRestock;
          cardProps.sellingPrice = getSellingPrice?.(product);
          cardProps.costPrice = getCostPrice?.(product);
          cardProps.currentStock = getCurrentStock?.(product);
          cardProps.lowStockThreshold = getLowStockThreshold?.(product);
        }

        // Template-specific props
        if (variant === 'template') {
          cardProps.isSelected = isProductSelected(product);
          cardProps.onSelect = onSelect;
        }

        return <UnifiedProductCard {...cardProps} />;
      })}
    </div>
  );
};

export default ResponsiveProductGrid;