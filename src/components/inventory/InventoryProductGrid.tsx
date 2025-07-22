import React from 'react';
import { Product } from '../../types';
import ProductCard from './ProductCard';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';

interface InventoryProductGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRestock: (quantity: number, buyingPrice: number) => Promise<void>;
}

const InventoryProductGrid: React.FC<InventoryProductGridProps> = ({
  products,
  onEdit,
  onDelete,
  onRestock,
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Create a wrapper function that matches the ProductCard expected signature
  const handleRestock = async (product: Product, quantity: number, buyingPrice: number) => {
    await onRestock(quantity, buyingPrice);
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

  // Mobile layout - Enhanced with full width utilization and minimal gaps
  if (isMobile) {
    return (
      <div className="grid grid-cols-1 gap-3 w-full">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestock={handleRestock}
          />
        ))}
      </div>
    );
  }

  // Tablet layout - Enhanced for better space utilization with optimized columns
  if (isTablet) {
    return (
      <div className="grid grid-cols-2 gap-4 w-full">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestock={handleRestock}
          />
        ))}
      </div>
    );
  }

  // Desktop layout - Keep existing responsive grid with enhanced spacing
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestock={handleRestock}
        />
      ))}
    </div>
  );
};

export default InventoryProductGrid;
