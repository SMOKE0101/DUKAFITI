
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Search, ShoppingCart, Minus } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useFavoriteProducts } from '../../hooks/useFavoriteProducts';
import { useToast } from '../../hooks/use-toast';

interface QuickSelectSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const QuickSelectSection = ({ products, onAddToCart }: QuickSelectSectionProps) => {
  const { favorites, addToFavorites, removeFromFavorites, maxFavorites } = useFavoriteProducts();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter products for search dropdown with debounce
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredProducts = products.filter(product =>
    debouncedSearchTerm.length >= 2 &&
    (product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
     product.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) &&
    !favorites.some(fav => fav.id === product.id)
  ).slice(0, 5);

  const handleActionIconClick = () => {
    if (isEditMode) {
      // Exit edit mode
      setIsEditMode(false);
    } else if (isSearchMode) {
      // Exit search mode
      setIsSearchMode(false);
      setSearchTerm('');
      setShowDropdown(false);
    } else {
      // Enter search mode
      setIsSearchMode(true);
    }
  };

  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      // Entering edit mode - hide search
      setIsSearchMode(false);
      setSearchTerm('');
      setShowDropdown(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.length >= 2);
  };

  const handleAddFavorite = (product: Product) => {
    addToFavorites(product);
    setSearchTerm('');
    setShowDropdown(false);
    setIsSearchMode(false);
    
    toast({
      title: "Added to favorites",
      description: `${product.name} added to Quick Select`,
    });
    
    // Add bounce animation to the new tile
    setTimeout(() => {
      const newTile = document.querySelector(`[data-product-id="${product.id}"]`);
      if (newTile) {
        newTile.classList.add('animate-bounce');
        setTimeout(() => newTile.classList.remove('animate-bounce'), 600);
      }
    }, 100);
  };

  const handleRemoveFavorite = (product: Product) => {
    removeFromFavorites(product.id);
    toast({
      title: "Removed from favorites",
      description: `${product.name} removed from Quick Select`,
    });
  };

  const handleFavoriteTileClick = (product: Product) => {
    if (!isEditMode) {
      onAddToCart(product);
    }
  };

  const getActionIcon = () => {
    if (isEditMode) return Plus;
    if (isSearchMode) return Minus;
    return Search;
  };

  const ActionIcon = getActionIcon();

  return (
    <div className="h-[28vh] p-4">
      <Card className="h-full bg-muted/30">
        <CardHeader className="flex-row justify-between items-center p-4">
          <CardTitle className="text-base">Quick Select</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm"
              onClick={handleActionIconClick}
              aria-label={
                isEditMode ? "Add favorite product" : 
                isSearchMode ? "Hide search" : 
                "Show search"
              }
            >
              <ActionIcon className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm"
              onClick={handleEditModeToggle}
            >
              {isEditMode ? 'Done' : 'Edit'}
            </Button>
          </div>
        </CardHeader>

        {/* Edit Mode Banner */}
        {isEditMode && (
          <div className="px-4 pb-2 animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs italic text-muted-foreground text-center">
              Tap any favorite to remove
            </p>
          </div>
        )}

        <CardContent className="p-4 pt-0 flex flex-col h-full">
          {/* Search Bar - slides down when in search mode */}
          <div 
            className={`overflow-hidden transition-all duration-250 ease-out ${
              isSearchMode && !isEditMode ? 'max-h-20 mb-3' : 'max-h-0'
            }`}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products to add..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                disabled={!isSearchMode}
              />
              
              {/* Search Dropdown */}
              {showDropdown && isSearchMode && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <button
                        key={product.id}
                        className="w-full flex items-center justify-between p-3 hover:bg-accent text-left border-b last:border-b-0 transition-colors"
                        onClick={() => handleAddFavorite(product)}
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {product.category} • {formatCurrency(product.sellingPrice)}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))
                  ) : debouncedSearchTerm.length >= 2 ? (
                    <div className="p-3 text-center text-muted-foreground text-sm">
                      No products found
                    </div>
                  ) : (
                    <div className="p-3 text-center text-muted-foreground text-sm">
                      Type at least 2 characters to search
                    </div>
                  )}
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
                className={`relative flex-shrink-0 w-18 h-18 bg-card rounded-lg border p-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  isEditMode 
                    ? 'opacity-60' 
                    : 'hover:bg-accent active:scale-95'
                }`}
                onClick={() => handleFavoriteTileClick(product)}
              >
                {/* Remove button in edit mode */}
                {isEditMode && (
                  <button
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-red-500 rounded-full flex items-center justify-center animate-in fade-in-0 duration-150"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(product);
                    }}
                    aria-label={`Remove ${product.name} from favorites`}
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                )}
                
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center mb-1">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="text-xs text-center truncate w-full">
                  {product.name}
                </span>
              </div>
            ))}
            
            {/* Decorative Plus Card - only shown in normal mode */}
            {!isEditMode && !isSearchMode && (
              <div
                className="flex-shrink-0 w-18 h-18 bg-card rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
                title={
                  favorites.length >= maxFavorites 
                    ? "Max 6 favorites—new items replace oldest." 
                    : "Tap search to add favorites"
                }
              >
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickSelectSection;
