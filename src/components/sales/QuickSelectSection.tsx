
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Edit3, Check, ShoppingCart } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useFavoriteProducts } from '../../hooks/useFavoriteProducts';
import { useToast } from '../../hooks/use-toast';

interface QuickSelectSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const QuickSelectSection = ({ products, onAddToCart }: QuickSelectSectionProps) => {
  const { favorites, addToFavorites, removeFromFavorites } = useFavoriteProducts();
  const { toast } = useToast();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter products for search dropdown
  const filteredProducts = products.filter(product =>
    debouncedSearchTerm.length >= 2 &&
    (product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
     product.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) &&
    !favorites.some(fav => fav.id === product.id)
  ).slice(0, 8);

  useEffect(() => {
    setShowDropdown(debouncedSearchTerm.length >= 2 && filteredProducts.length > 0);
  }, [debouncedSearchTerm, filteredProducts.length]);

  // Focus search input when visible
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  const getStockBadgeColor = (stock: number, threshold: number) => {
    if (stock <= 0) return 'bg-red-500';
    if (stock <= threshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProductInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handlePlusClick = () => {
    if (isEditMode) {
      // Exit edit mode
      setIsEditMode(false);
    } else {
      // Open search
      setIsSearchVisible(true);
      setSearchTerm('');
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      // Entering edit mode - hide search
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
    if (!showDropdown) {
      if (e.key === 'Escape') {
        setIsSearchVisible(false);
        setSearchTerm('');
      }
      return;
    }

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
        setIsSearchVisible(false);
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
    
    // Add scale animation to the new tile
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

  return (
    <div className="h-[28vh] p-4">
      <Card className="h-full bg-muted/30">
        <CardHeader className="flex-row justify-between items-center p-4">
          <CardTitle className="text-base">Quick Select</CardTitle>
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
        </CardHeader>

        <CardContent className="p-4 pt-0 flex flex-col h-full">
          {/* Search Bar - slides down when visible */}
          <div 
            className={`overflow-hidden transition-all duration-250 ease-out ${
              isSearchVisible && !isEditMode ? 'max-h-20 mb-3' : 'max-h-0'
            }`}
          >
            <div className="relative">
              <Input
                ref={searchInputRef}
                placeholder="Search products…"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-gray-100 dark:bg-gray-700 rounded-full px-4"
              />
              
              {/* Search Dropdown */}
              {showDropdown && isSearchVisible && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredProducts.map((product, index) => (
                    <button
                      key={product.id}
                      className={`w-full flex items-center justify-between p-3 text-left border-b last:border-b-0 transition-colors ${
                        index === selectedIndex 
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleAddFavorite(product)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.category} • {formatCurrency(product.sellingPrice)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-2 h-2 rounded-full ${getStockBadgeColor(product.currentStock, product.lowStockThreshold)}`}
                          title={`Stock: ${product.currentStock}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {product.currentStock}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Tiles Strip */}
          <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
            {favorites.map(product => (
              <div
                key={product.id}
                data-product-id={product.id}
                className={`relative flex-shrink-0 w-20 h-20 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all duration-150 p-3 flex flex-col items-center justify-center cursor-pointer ${
                  isEditMode 
                    ? 'opacity-75' 
                    : 'hover:-translate-y-1'
                }`}
                onClick={() => handleFavoriteTileClick(product)}
                title={product.name}
              >
                {/* Stock Badge */}
                <div 
                  className={`absolute top-1 left-1 w-2 h-2 rounded-full ${getStockBadgeColor(product.currentStock, product.lowStockThreshold)}`}
                  title={`Stock: ${product.currentStock}`}
                />
                
                {/* Remove button in edit mode */}
                {isEditMode && (
                  <button
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(product);
                    }}
                    title="Remove favorite"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                
                {/* Product Initial */}
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-1">
                  <span className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                    {getProductInitial(product.name)}
                  </span>
                </div>
                
                {/* Product Name */}
                <span className="text-xs font-medium text-center truncate w-full">
                  {product.name}
                </span>
              </div>
            ))}
            
            {/* Plus/Done Tile */}
            {favorites.length < 6 && (
              <div
                className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed transition-all duration-150 flex items-center justify-center cursor-pointer ${
                  isEditMode 
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
                onClick={handlePlusClick}
                title={isEditMode ? "Done editing" : "Add favorite"}
              >
                {isEditMode ? (
                  <Check className="w-10 h-10 text-green-600" />
                ) : (
                  <Plus className="w-10 h-10 text-gray-400 hover:text-purple-600 transition-colors" />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickSelectSection;
