import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import EnhancedProductImage from './enhanced-product-image';

// Base product interface
interface BaseProductData {
  id: string | number;
  name: string;
  image_url?: string | null;
  category?: string | null;
}

// Card variant types
type ProductCardVariant = 'sales' | 'inventory' | 'template';

interface ProductCardProps {
  product: BaseProductData;
  variant: ProductCardVariant;
  
  // Sales specific props
  onAddToCart?: (product: any) => void;
  price?: number;
  stock?: number;
  isInStock?: boolean;
  
  // Inventory specific props
  onEdit?: (product: any) => void;
  onDelete?: (product: any) => void;
  onRestock?: (product: any) => void;
  sellingPrice?: number;
  costPrice?: number;
  currentStock?: number;
  lowStockThreshold?: number;
  
  // Template specific props
  isSelected?: boolean;
  onSelect?: (product: any) => void;
  
  // Common props
  className?: string;
}


// Main ProductCard component
const UnifiedProductCard: React.FC<ProductCardProps> = ({
  product,
  variant,
  onAddToCart,
  price,
  stock,
  isInStock = true,
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
  const [isHovered, setIsHovered] = useState(false);

  // Calculate stock status for inventory
  const getStockStatus = () => {
    if (variant !== 'inventory') return null;
    if (currentStock === undefined || currentStock === null) return { label: 'N/A', variant: 'secondary' as const };
    if (currentStock === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (lowStockThreshold && currentStock <= lowStockThreshold && currentStock > 0) return { label: 'Low Stock', variant: 'outline' as const };
    return { label: 'In Stock', variant: 'secondary' as const };
  };

  const stockStatus = getStockStatus();
  const isOutOfStock = variant === 'sales' && stock === 0;
  const isLowStock = variant === 'inventory' && currentStock !== undefined && lowStockThreshold && currentStock <= lowStockThreshold && currentStock > 0;

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (variant === 'template' && onSelect) {
      onSelect(product);
    } else if (variant === 'sales' && onAddToCart && !isOutOfStock) {
      onAddToCart(product);
    }
  }, [variant, onSelect, onAddToCart, product, isOutOfStock]);

  const handleActionClick = useCallback((e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  }, []);

  return (
    <Card
      className={cn(
        "group relative bg-card rounded-xl border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl overflow-hidden",
        // Template selection styling
        variant === 'template' && isSelected 
          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500/30 shadow-lg" 
          : "border-border hover:border-purple-300 dark:hover:border-purple-600",
        // Out of stock styling
        isOutOfStock && "opacity-75 grayscale",
        // Low stock styling
        isLowStock && "ring-1 ring-orange-300 dark:ring-orange-600",
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection indicator for templates */}
      {variant === 'template' && isSelected && (
        <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Low stock indicator */}
      {isLowStock && (
        <div className="absolute top-2 left-2 z-20">
          <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-400 text-xs px-1.5 py-0.5">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Low
          </Badge>
        </div>
      )}

      {/* Product Image */}
      <div className="aspect-square overflow-hidden rounded-t-xl">
        <EnhancedProductImage
          src={product.image_url}
          alt={product.name}
          productName={product.name}
          width={300}
          height={300}
          priority={variant === 'sales'}
        />
      </div>
      
      {/* Product Information */}
      <div className="p-3 flex flex-col gap-1.5">
        {/* Product Name */}
        <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight min-h-[2.5rem]" title={product.name}>
          {product.name}
        </h4>
        
        {/* Category */}
        {product.category && (
          <p className="text-xs text-muted-foreground capitalize truncate">
            {product.category}
          </p>
        )}

        {/* Variant-specific content */}
        <div className="mt-1 space-y-1">
          {/* Sales variant */}
          {variant === 'sales' && (
            <div className="space-y-1">
              {price !== undefined && (
                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(price)}
                </div>
              )}
              {stock !== undefined && (
                <div className="text-xs text-muted-foreground">
                  Stock: {stock === -1 ? 'Unlimited' : stock}
                </div>
              )}
              {isOutOfStock && (
                <Badge variant="destructive" className="text-xs">
                  Out of Stock
                </Badge>
              )}
            </div>
          )}

          {/* Inventory variant */}
          {variant === 'inventory' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                {sellingPrice !== undefined && (
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(sellingPrice)}
                  </div>
                )}
                {stockStatus && (
                  <Badge variant={stockStatus.variant} className="text-xs px-2 py-0.5">
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
                  Stock: {currentStock === -1 ? 'Unlimited' : currentStock}
                </div>
              )}
            </div>
          )}

          {/* Template variant */}
          {variant === 'template' && (
            <div className="text-xs text-muted-foreground">
              Click to {isSelected ? 'remove' : 'select'}
            </div>
          )}
        </div>
      </div>

      {/* Action Overlay */}
      <div className={cn(
        "absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300",
        isHovered || (variant === 'template' && isSelected) ? "opacity-100" : "opacity-0"
      )}>
        {/* Sales Actions */}
        {variant === 'sales' && onAddToCart && !isOutOfStock && (
          <div className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-medium shadow-lg transition-all duration-200 transform hover:scale-105">
            <Plus className="w-4 h-4 inline mr-2" />
            Add to Cart
          </div>
        )}

        {/* Inventory Actions */}
        {variant === 'inventory' && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={(e) => handleActionClick(e, () => onEdit(product))}
                className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
                title="Edit Product"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onRestock && (
              <button
                onClick={(e) => handleActionClick(e, () => onRestock(product))}
                className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
                title="Restock Product"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => handleActionClick(e, () => onDelete(product))}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Template Actions */}
        {variant === 'template' && (
          <div className={cn(
            "px-4 py-2 rounded-full font-medium shadow-lg transition-all duration-200 transform hover:scale-105",
            isSelected 
              ? "bg-white text-purple-600" 
              : "bg-purple-600 hover:bg-purple-700 text-white"
          )}>
            {isSelected ? (
              <>
                <Check className="w-4 h-4 inline mr-2" />
                Selected
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 inline mr-2" />
                Select
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default UnifiedProductCard;