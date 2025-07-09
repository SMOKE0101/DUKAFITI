
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, X, Check, Edit3, ShoppingCart } from 'lucide-react';
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
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Filter products for search dropdown with proper debounce
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Enhanced filtering with better matching
  const filteredProducts = products.filter(product => {
    if (debouncedSearchTerm.length < 2) return false;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    const nameMatch = product.name.toLowerCase().includes(searchLower);
    const categoryMatch = product.category.toLowerCase().includes(searchLower);
    const notInFavorites = !favorites.some(fav => fav.id === product.id);
    
    return (nameMatch || categoryMatch) && notInFavorites;
  }).slice(0, 8);

  useEffect(() => {
    setShowDropdown(debouncedSearchTerm.length >= 2 && filteredProducts.length > 0 && isSearchVisible);
  }, [debouncedSearchTerm, filteredProducts.length, isSearchVisible]);

  const handlePlusClick = () => {
    if (isEditMode) return;
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setSearchTerm('');
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      setIsSearchVisible(false);
      setSearchTerm('');
      setShowDropdown(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleAddFavorite(filteredProducts[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSearchTerm('');
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleAddFavorite = (product: Product) => {
    addToFavorites(product);
    setSearchTerm('');
    setShowDropdown(false);
    setIsSearchVisible(false);
    setSelectedIndex(-1);
    
    toast({
      title: "Added to favorites",
      description: `${product.name} added to Quick Select`,
    });
    
    setTimeout(() => {
      const newTile = document.querySelector(`[data-product-id="${product.id}"]`);
      if (newTile) {
        newTile.classList.add('animate-scale-in');
        setTimeout(() => newTile.classList.remove('animate-scale-in'), 300);
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

  const getStockBadgeColor = (stock: number, threshold: number) => {
    if (stock <= 0) return 'bg-red-500';
    if (stock <= threshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

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
              onClick={handleEditToggle}
              aria-label={isEditMode ? "Exit edit mode" : "Enter edit mode"}
            >
              {isEditMode ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Done
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {isEditMode && (
          <div className="px-4 pb-2 animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs italic text-muted-foreground text-center">
              Tap any favorite to remove
            </p>
          </div>
        )}

        <CardContent className="p-4 pt-0 flex flex-col h-full">
          <div 
            className={`overflow-hidden transition-all duration-250 ease-out ${
              isSearchVisible && !isEditMode ? 'max-h-20 mb-3' : 'max-h-0'
            }`}
          >
            <div className="relative">
              <Input
                placeholder="Search products…"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-gray-100 dark:bg-gray-700 rounded-full px-4"
                disabled={!isSearchVisible}
                autoFocus={isSearchVisible}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                  onClick={() => {
                    setSearchTerm('');
                    setShowDropdown(false);
                    setSelectedIndex(-1);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              
              {/* Enhanced Search Dropdown */}
              {showDropdown && isSearchVisible && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-xl max-h-80 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => (
                      <button
                        key={product.id}
                        className={`w-full flex items-center justify-between p-3 text-left border-b last:border-b-0 transition-all duration-150 ${
                          index === selectedIndex 
                            ? 'bg-primary/10 border-primary/20' 
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => handleAddFavorite(product)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{product.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {product.category} • {formatCurrency(product.sellingPrice)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <div className="flex items-center gap-1">
                            <div 
                              className={`w-2 h-2 rounded-full ${getStockBadgeColor(product.currentStock, product.lowStockThreshold)}`}
                              title={`Stock: ${product.currentStock}`}
                            />
                            <span className="text-xs text-muted-foreground min-w-[20px] text-right">
                              {product.currentStock}
                            </span>
                          </div>
                          <Plus className="w-4 h-4 text-muted-foreground/60" />
                        </div>
                      </button>
                    ))
                  ) : debouncedSearchTerm.length >= 2 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No products found matching "{debouncedSearchTerm}"
                    </div>
                  ) : null}
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
                className={`relative flex-shrink-0 w-18 h-18 bg-white dark:bg-gray-800 rounded-xl border shadow p-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  isEditMode 
                    ? 'opacity-60' 
                    : 'hover:shadow-lg hover:scale-105 hover:border-primary/50'
                }`}
                onClick={() => handleFavoriteTileClick(product)}
              >
                {isEditMode && (
                  <button
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-red-500 rounded-full flex items-center justify-center animate-in fade-in-0 duration-150 shadow-sm"
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
            
            {/* Plus/Minus Toggle Card */}
            <div
              className={`flex-shrink-0 w-18 h-18 rounded-xl border-2 ${
                isEditMode 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : isSearchVisible 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-dashed border-muted-foreground/30 bg-card'
              } flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105`}
              onClick={handlePlusClick}
              title={
                isEditMode 
                  ? "Exit edit mode" 
                  : isSearchVisible 
                    ? "Hide search" 
                    : favorites.length >= maxFavorites 
                      ? "Max 6 favorites—new items replace oldest." 
                      : "Search to add favorites"
              }
            >
              {isEditMode ? (
                <Check className="w-6 h-6 text-green-600" />
              ) : isSearchVisible ? (
                <Minus className="w-6 h-6 text-red-600" />
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
