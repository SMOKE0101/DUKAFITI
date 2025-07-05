
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    product.currentStock > 0
  ).slice(0, 12);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search size={20} />
          Select Products ({filteredProducts.length} available)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No products found matching your search.' : 'No products in stock.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="h-20 flex-col gap-1 text-center hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => onAddToCart(product)}
                  disabled={isLoading}
                >
                  <span className="font-medium text-sm">{product.name}</span>
                  <span className="text-xs text-green-600">{formatCurrency(product.sellingPrice)}</span>
                  <span className="text-xs text-gray-500">Stock: {product.currentStock}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductGrid;
