
import React from 'react';
import { Product } from '../../types';
import ProductCard from './ProductCard';
import { useIsMobile } from '../../hooks/use-mobile';

interface InventoryProductGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRestock: (product: Product, quantity: number, buyingPrice: number) => Promise<void>;
}

const InventoryProductGrid: React.FC<InventoryProductGridProps> = ({
  products,
  onEdit,
  onDelete,
  onRestock,
}) => {
  const isMobile = useIsMobile();

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-2xl">📦</span>
        </div>
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className={`
      ${isMobile 
        ? 'grid grid-cols-1 gap-4' 
        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
      }
    `}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestock={onRestock}
        />
      ))}
    </div>
  );
};

export default InventoryProductGrid;
