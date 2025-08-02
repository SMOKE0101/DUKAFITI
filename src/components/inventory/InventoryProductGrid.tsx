import React from 'react';
import { Product } from '../../types';
import ProductCard from '../ui/product-card';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Create a wrapper that matches ProductCard's expected signature but only triggers modal
  const handleRestockClick = async (product: Product, quantity?: number, buyingPrice?: number) => {
    // Only trigger the modal opening, ignore the quantity and buyingPrice parameters
    // The actual restock logic will be handled by the RestockModal in InventoryPage
    onRestock(product);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 w-full">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-lg shadow-purple-500/10">
          <span className="text-2xl">📦</span>
        </div>
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
      </div>
    );
  }

  // Use unified grid layout for all screen sizes - matches template design
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 w-full">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          variant="inventory"
          onEdit={onEdit}
          onDelete={onDelete}
          onRestock={handleRestockClick}
          sellingPrice={product.sellingPrice}
          costPrice={product.costPrice}
          currentStock={product.currentStock}
          lowStockThreshold={product.lowStockThreshold}
        />
      ))}
    </div>
  );
};

export default InventoryProductGrid;
