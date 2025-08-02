import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, ShoppingCart, Edit, Trash2, Plus, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface BaseProductData {
  id: string | number;
  name: string;
  image_url?: string;
  category?: string;
}

interface ProductCardProps {
  product: BaseProductData;
  variant: 'sales' | 'inventory' | 'template';
  
  // Sales specific
  onAddToCart?: (product: any) => void;
  price?: number;
  stock?: number;
  isInStock?: boolean;
  
  // Inventory specific
  onEdit?: (product: any) => void;
  onDelete?: (product: any) => void;
  onRestock?: (product: any) => void;
  sellingPrice?: number;
  costPrice?: number;
  currentStock?: number;
  lowStockThreshold?: number;
  
  // Template specific
  isSelected?: boolean;
  onSelect?: (product: any) => void;
  
  // Common
  className?: string;
}

// Image component with proper error handling
const ProductImage: React.FC<{ 
  src?: string; 
  alt: string; 
  productName: string;
  className?: string;
}> = ({ src, alt, productName, className }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Show fallback if no src or error occurred
  if (!src || imageError) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900", className)}>
        <div className="w-12 h-12 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {productName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      {isLoading && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900">
          <div className="w-12 h-12 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center shadow-sm animate-pulse">
            <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: imageError ? 'none' : 'block' }}
      />
    </div>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant,
  onAddToCart,
  price,
  stock,
  isInStock,
  onEdit,
  onDelete,
  onRestock,
  sellingPrice,
  costPrice,
  currentStock,
  lowStockThreshold,
  isSelected,
  onSelect,
  className
}) => {
  const getStockStatus = () => {
    if (variant !== 'inventory') return null;
    if (currentStock === undefined || currentStock === null) return { label: 'N/A', variant: 'secondary' as const };
    if (currentStock === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (lowStockThreshold && currentStock <= lowStockThreshold) return { label: 'Low Stock', variant: 'outline' as const };
    return { label: 'In Stock', variant: 'secondary' as const };
  };

  const stockStatus = getStockStatus();

  return (
    <Card
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md overflow-hidden",
        variant === 'template' && isSelected 
          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500/50" 
          : "border-border hover:border-purple-300",
        className
      )}
      onClick={() => {
        if (variant === 'template' && onSelect) {
          onSelect(product);
        } else if (variant === 'sales' && onAddToCart && isInStock !== false) {
          onAddToCart(product);
        }
      }}
    >
      {/* Selection Indicator for Templates */}
      {variant === 'template' && isSelected && (
        <div className="absolute top-1 right-1 z-10 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Product Image */}
      <div className="aspect-square overflow-hidden rounded-t-lg">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          productName={product.name}
        />
      </div>
      
      {/* Product Info */}
      <div className="p-2">
        <h4 className="font-medium text-xs mb-1 line-clamp-2 leading-tight" title={product.name}>
          {product.name}
        </h4>
        
        {/* Category */}
        {product.category && (
          <p className="text-xs text-muted-foreground capitalize mb-1">
            {product.category}
          </p>
        )}

        {/* Sales Variant Content */}
        {variant === 'sales' && (
          <div className="flex flex-col gap-1">
            {price !== undefined && (
              <span className="text-xs text-green-600 font-semibold">
                {formatCurrency(price)}
              </span>
            )}
            {stock !== undefined && (
              <span className="text-xs text-muted-foreground">
                Stock: {stock === -1 ? 'N/A' : stock}
              </span>
            )}
          </div>
        )}

        {/* Inventory Variant Content */}
        {variant === 'inventory' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              {sellingPrice !== undefined && (
                <span className="text-xs text-green-600 font-semibold">
                  {formatCurrency(sellingPrice)}
                </span>
              )}
              {stockStatus && (
                <Badge variant={stockStatus.variant} className="text-xs px-1 py-0.5 h-auto">
                  {stockStatus.label}
                </Badge>
              )}
            </div>
            
            {costPrice !== undefined && costPrice > 0 && (
              <div className="text-xs text-muted-foreground">
                Cost: {formatCurrency(costPrice)}
              </div>
            )}
            
            {currentStock !== undefined && (
              <div className="text-xs text-muted-foreground">
                Stock: {currentStock === -1 ? 'N/A' : currentStock}
              </div>
            )}

            {lowStockThreshold && currentStock !== undefined && currentStock <= lowStockThreshold && currentStock > 0 && (
              <div className="text-xs text-orange-600 font-medium">
                ⚠ Low stock
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Overlays */}
      <div className={cn(
        "absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200",
        variant === 'template' && isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        {variant === 'sales' && onAddToCart && (
          <div className="bg-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg hover:bg-purple-700 transition-all duration-200">
            <Plus className="w-3 h-3 inline mr-1" />
            Add
          </div>
        )}

        {variant === 'inventory' && (
          <div className="flex gap-1">
            {onEdit && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                className="bg-white/90 text-gray-700 px-2 py-1.5 rounded-full text-xs font-medium shadow-lg hover:bg-white transition-all duration-200 cursor-pointer"
              >
                <Edit className="w-3 h-3" />
              </div>
            )}
            {onRestock && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onRestock(product);
                }}
                className="bg-purple-600 text-white px-2 py-1.5 rounded-full text-xs font-medium shadow-lg hover:bg-purple-700 transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </div>
            )}
            {onDelete && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product);
                }}
                className="bg-red-600 text-white px-2 py-1.5 rounded-full text-xs font-medium shadow-lg hover:bg-red-700 transition-all duration-200 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </div>
            )}
          </div>
        )}

        {variant === 'template' && (
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
            isSelected 
              ? "bg-white text-purple-600 shadow-lg" 
              : "bg-purple-600 text-white shadow-lg hover:bg-purple-700"
          )}>
            {isSelected ? (
              <>
                <Check className="w-3 h-3 inline mr-1" />
                Selected
              </>
            ) : (
              <>
                <Plus className="w-3 h-3 inline mr-1" />
                Add
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;