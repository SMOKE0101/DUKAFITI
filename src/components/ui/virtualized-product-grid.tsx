import React, { useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
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
  gap: number;
  cardHeight: number;
}

// Default grid configs for different variants
const GRID_CONFIGS: Record<string, GridConfig> = {
  template: {
    cols: { mobile: 2, tablet: 3, desktop: 5 },
    gap: 12,
    cardHeight: 280
  }
};

interface VirtualizedProductGridProps {
  // Data
  products: BaseProduct[];
  variant: 'template';
  height: number; // Container height
  width: number;  // Container width
  
  // Template specific
  selectedProducts?: BaseProduct[];
  onSelect?: (product: any) => void;
  
  // Customization
  gridConfig?: Partial<GridConfig>;
  className?: string;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
}

const VirtualizedProductGrid: React.FC<VirtualizedProductGridProps> = ({
  products,
  variant,
  height,
  width,
  selectedProducts = [],
  onSelect,
  gridConfig,
  className,
  emptyStateMessage = "No products found",
  emptyStateDescription = "Try adjusting your search or filters"
}) => {
  // Merge default config with custom config
  const config = { ...GRID_CONFIGS[variant], ...gridConfig };
  
  // Calculate columns based on width
  const columnCount = useMemo(() => {
    if (width < 640) return config.cols.mobile;
    if (width < 1024) return config.cols.tablet;
    return config.cols.desktop;
  }, [width, config.cols]);

  // Calculate item width
  const itemWidth = useMemo(() => {
    const totalGaps = (columnCount - 1) * config.gap;
    const availableWidth = width - totalGaps - 32; // 32px for padding
    return Math.floor(availableWidth / columnCount);
  }, [width, columnCount, config.gap]);

  // Calculate row count
  const rowCount = Math.ceil(products.length / columnCount);

  // Helper to check if a product is selected (for templates)
  const isProductSelected = useCallback((product: BaseProduct) => {
    return selectedProducts.some(p => p.id === product.id);
  }, [selectedProducts]);

  // Cell renderer
  const Cell = useCallback(({ columnIndex, rowIndex, style, data }: any) => {
    const { products, columnCount, variant, isProductSelected, onSelect } = data;
    const productIndex = rowIndex * columnCount + columnIndex;
    const product = products[productIndex];

    if (!product) {
      return <div style={style} />;
    }

    // Build props for the card
    const cardProps: any = {
      product,
      variant,
    };

    // Template-specific props
    if (variant === 'template') {
      cardProps.isSelected = isProductSelected(product);
      cardProps.onSelect = onSelect;
    }

    return (
      <div 
        style={{
          ...style,
          padding: '6px', // Add padding around each cell
        }}
      >
        <UnifiedProductCard {...cardProps} />
      </div>
    );
  }, []);

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

  return (
    <div className={cn("w-full", className)}>
      <Grid
        columnCount={columnCount}
        columnWidth={itemWidth + config.gap}
        height={height}
        rowCount={rowCount}
        rowHeight={config.cardHeight + config.gap}
        width={width}
        itemData={{ products, columnCount, variant, isProductSelected, onSelect, itemWidth, cardHeight: config.cardHeight }}
      >
        {Cell}
      </Grid>
    </div>
  );
};

export default VirtualizedProductGrid;