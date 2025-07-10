
import React from 'react';
import { Product } from '../../types';
import ProductCard from './ProductCard';

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
  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
