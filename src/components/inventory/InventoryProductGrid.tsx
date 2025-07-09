
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';
import { Product } from '../../types';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

interface InventoryProductGridProps {
  products: Product[];
  loading: boolean;
  searchQuery: string;
  filterCategory: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRestock: (product: Product) => void;
  onAddProduct: () => void;
}

const InventoryProductGrid: React.FC<InventoryProductGridProps> = ({
  products,
  loading,
  searchQuery,
  filterCategory,
  onEdit,
  onDelete,
  onRestock,
  onAddProduct
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-8 text-center">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No products found</h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery || filterCategory !== 'all' 
            ? 'Try adjusting your search or filters.' 
            : 'Start by adding your first product.'
          }
        </p>
        {!searchQuery && filterCategory === 'all' && (
          <Button onClick={onAddProduct} className="bg-accent hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryProductGrid;
