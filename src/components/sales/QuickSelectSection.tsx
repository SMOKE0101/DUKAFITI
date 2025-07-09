
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Search, ShoppingCart } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useFavoriteProducts } from '../../hooks/useFavoriteProducts';

interface QuickSelectSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const QuickSelectSection = ({ products, onAddToCart }: QuickSelectSectionProps) => {
  const { favorites, addToFavorites, maxFavorites } = useFavoriteProducts();
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter products for search dropdown
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !favorites.some(fav => fav.id === product.id)
  ).slice(0, 5);

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      setSearchTerm('');
      setShowDropdown(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.length > 0);
  };

  const handleAddFavorite = (product: Product) => {
    addToFavorites(product);
    setSearchTerm('');
    setShowDropdown(false);
    setIsEditMode(false);
    
    // Add bounce animation to the new tile
    setTimeout(() => {
      const newTile = document.querySelector(`[data-product-id="${product.id}"]`);
      if (newTile) {
        newTile.classList.add('animate-bounce');
        setTimeout(() => newTile.classList.remove('animate-bounce'), 600);
      }
    }, 100);
  };

  const handleFavoriteTileClick = (product: Product) => {
    if (!isEditMode) {
      onAddToCart(product);
    }
  };

  return (
    <div className="h-[28vh] p-4">
      <Card className="h-full bg-muted/30">
        <CardHeader className="flex-row justify-between items-center p-4">
          <CardTitle className="text-base">Favorites</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm"
            onClick={handleToggleEditMode}
          >
            {isEditMode ? 'Done' : 'Edit'}
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col h-full">
          {/* Search Bar - slides down when in edit mode */}
          <div 
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              isEditMode ? 'max-h-20 mb-3' : 'max-h-0'
            }`}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Add favorite product..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                disabled={!isEditMode}
              />
              
              {/* Search Dropdown */}
              {showDropdown && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      className="w-full flex items-center justify-between p-3 hover:bg-accent text-left border-b last:border-b-0 transition-colors"
                      onClick={() => handleAddFavorite(product)}
                    >
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(product.sellingPrice)}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
              
              {/* No results message */}
              {showDropdown && searchTerm.length > 0 && filteredProducts.length === 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-md shadow-lg p-3">
                  <div className="text-sm text-muted-foreground text-center">
                    No products found
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Tiles Grid */}
          <div className="flex gap-3 overflow-x-auto pb-2 flex-1">
            {favorites.map(product => (
              <div
                key={product.id}
                data-product-id={product.id}
                className={`flex-shrink-0 w-18 h-18 bg-card rounded-lg border p-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  isEditMode 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:bg-accent active:scale-95'
                }`}
                onClick={() => handleFavoriteTileClick(product)}
              >
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center mb-1">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="text-xs text-center truncate w-full">
                  {product.name}
                </span>
              </div>
            ))}
            
            {/* Plus/X Toggle Card */}
            <div
              className="flex-shrink-0 w-18 h-18 bg-card rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:bg-accent transition-all duration-200 active:scale-95"
              onClick={handleToggleEditMode}
              title={
                favorites.length >= maxFavorites 
                  ? "Max 6 favorites—new items replace oldest." 
                  : isEditMode 
                    ? "Close edit mode" 
                    : "Add favorite product"
              }
            >
              {isEditMode ? (
                <X className="w-6 h-6 text-muted-foreground" />
              ) : (
                <Plus className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickSelectSection;
