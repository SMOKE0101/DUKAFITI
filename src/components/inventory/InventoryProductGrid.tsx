import React from 'react';
import { Product } from '../../types';
import ResponsiveProductGrid from '../ui/responsive-product-grid';

interface InventoryProductGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRestock: (product: Product) => void;
}

const InventoryProductGrid: React.FC<InventoryProductGridProps> = ({
  products,
  onEdit,
  onDelete,
  onRestock,
}) => {
  return (
    <ResponsiveProductGrid
      products={products}
      variant="inventory"
      onEdit={onEdit}
      onDelete={onDelete}
      onRestock={onRestock}
      getSellingPrice={(product) => product.sellingPrice}
      getCostPrice={(product) => product.costPrice}
      getCurrentStock={(product) => product.currentStock}
      getLowStockThreshold={(product) => product.lowStockThreshold}
      gridConfig={{
        cols: { mobile: 2, tablet: 3, desktop: 5 },
        gap: 'gap-2'
      }}
      emptyStateMessage="No products found"
      emptyStateDescription="Try adjusting your search or filters"
    />
  );
};

export default InventoryProductGrid;
