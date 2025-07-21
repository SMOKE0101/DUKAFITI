
import { useState } from 'react';
import { Search, Package, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TouchFriendlyButton } from '@/components/ui/touch-friendly-button';
import EmptyState from './ui/empty-state';
import LoadingSkeleton from './ui/loading-skeleton';
import { formatCurrency } from '../utils/currency';
import { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  isLoading: boolean;
}

const ProductGrid = ({ products, onAddToCart, isLoading }: ProductGridProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (product.currentStock > 0 || product.currentStock === -1)
  );

  const displayProducts = filteredProducts.slice(0, 12);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          Select Products ({displayProducts.length} available)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              aria-label="Search products"
            />
          </div>
          
          {isLoading ? (
            <LoadingSkeleton variant="grid" count={6} />
          ) : displayProducts.length === 0 ? (
            <EmptyState
              icon={searchQuery ? Search : Package}
              title={searchQuery ? "No products found" : "No products in stock"}
              description={
                searchQuery 
                  ? "Try adjusting your search terms to find what you're looking for."
                  : "Add products to your inventory to start making sales."
              }
              variant={searchQuery ? "search" : "default"}
              actionLabel={!searchQuery ? "Add Product" : undefined}
              onAction={!searchQuery ? () => window.location.href = '#/products' : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayProducts.map((product) => (
                <TouchFriendlyButton
                  key={product.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col gap-2 text-center hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 min-h-[88px] justify-center"
                  onClick={() => onAddToCart(product)}
                  disabled={isLoading}
                >
                  <span className="font-medium text-sm sm:text-base line-clamp-2" title={product.name}>
                    {product.name}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs sm:text-sm text-green-600 font-semibold">
                      {formatCurrency(product.sellingPrice)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Stock: {product.currentStock === -1 ? 'Unspecified' : product.currentStock}
                    </span>
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                </TouchFriendlyButton>
              ))}
            </div>
          )}
          
          {filteredProducts.length > 12 && (
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing 12 of {filteredProducts.length} products. 
                <span className="block sm:inline"> Use search to find more specific items.</span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductGrid;
