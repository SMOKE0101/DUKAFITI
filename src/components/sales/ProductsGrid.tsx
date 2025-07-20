
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface Product {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  currentStock: number;
}

interface ProductsGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const ProductsGrid = ({ products, onAddToCart }: ProductsGridProps) => {
  if (!Array.isArray(products)) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="text-gray-400 dark:text-slate-500 mb-2">
          <Search className="w-12 h-12 mx-auto mb-3" />
          <p className="text-lg font-medium">No products available</p>
          <p className="text-sm">Please check your connection or try again later</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="text-gray-400 dark:text-slate-500 mb-2">
          <Search className="w-12 h-12 mx-auto mb-3" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {products.map(product => (
        <Card 
          key={product.id} 
          className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
          onClick={() => onAddToCart(product)}
        >
          <CardContent className="p-4">
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="text-2xl">📦</div>
            </div>
            
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
              {product.name}
            </h3>
            
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
              <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                {product.category}
              </span>
              <span className={`font-medium ${(product.currentStock || 0) <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                Stock: {product.currentStock || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(product.sellingPrice)}
              </span>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg"
                disabled={(product.currentStock || 0) <= 0}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default ProductsGrid;
