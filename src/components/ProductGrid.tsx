
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {displayProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-lg border border-border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:border-purple-300 overflow-hidden"
                  onClick={() => onAddToCart(product)}
                >
                  {/* Product Image Placeholder */}
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {product.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-2">
                    <h4 className="font-medium text-xs mb-1 line-clamp-2 leading-tight" title={product.name}>
                      {product.name}
                    </h4>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-green-600 font-semibold">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Stock: {product.currentStock === -1 ? 'N/A' : product.currentStock}
                      </span>
                    </div>
                  </div>
                  
                  {/* Add Button Overlay - Matching Template Style */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <div className="bg-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg hover:bg-purple-700 transition-all duration-200">
                      <Plus className="w-3 h-3 inline mr-1" />
                      Add
                    </div>
                  </div>
                </div>
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
