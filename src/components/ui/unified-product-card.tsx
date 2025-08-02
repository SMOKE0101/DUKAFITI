import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ShoppingCart, Edit, Trash2, Plus, Package } from 'lucide-react';

interface BaseProductData {
  id: string;
  name: string;
  image_url?: string;
  category?: string;
}

interface UnifiedProductCardProps {
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

const UnifiedProductCard: React.FC<UnifiedProductCardProps> = ({
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
  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NS41IDExNS41SDE0MS41VjE2NS41SDc1LjVWMTE1LjVaIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik05NS41IDc1LjVIMTIxLjVWMTE1LjVIOTUuNVY3NS41WiIgZmlsbD0iI0U1RTdFQiIvPgo8L3N2Zz4K';

  const getStockStatus = () => {
    if (variant !== 'inventory') return null;
    if (currentStock === undefined || currentStock === null) return { label: 'N/A', variant: 'secondary' as const };
    if (currentStock === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (lowStockThreshold && currentStock <= lowStockThreshold) return { label: 'Low Stock', variant: 'outline' as const };
    return { label: 'In Stock', variant: 'secondary' as const };
  };

  const stockStatus = getStockStatus();
  const isLowStock = variant === 'inventory' && lowStockThreshold && currentStock !== undefined && currentStock <= lowStockThreshold && currentStock > 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer",
        variant === 'template' && isSelected 
          ? "border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md" 
          : "border border-border hover:border-purple-300",
        className
      )}
      onClick={() => {
        if (variant === 'template' && onSelect) {
          onSelect(product);
        }
      }}
    >
      {/* Selection Indicator for Templates */}
      {variant === 'template' && isSelected && (
        <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Product Image */}
      <div className="aspect-square bg-muted overflow-hidden">
        <img
          src={product.image_url || fallbackImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = fallbackImage;
          }}
        />
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Product Name */}
        <h4 className="font-medium text-sm leading-tight line-clamp-2">
          {product.name}
        </h4>

        {/* Category */}
        {product.category && (
          <p className="text-xs text-muted-foreground capitalize">
            {product.category}
          </p>
        )}

        {/* Sales Variant Content */}
        {variant === 'sales' && (
          <>
            {price !== undefined && (
              <p className="text-sm font-semibold text-green-600">
                KSh {price.toLocaleString()}
              </p>
            )}
            {stock !== undefined && (
              <p className="text-xs text-muted-foreground">
                Stock: {stock === -1 ? 'N/A' : stock}
              </p>
            )}
          </>
        )}

        {/* Inventory Variant Content */}
        {variant === 'inventory' && (
          <>
            <div className="flex items-center justify-between">
              {sellingPrice !== undefined && (
                <p className="text-sm font-semibold text-green-600">
                  KSh {sellingPrice.toLocaleString()}
                </p>
              )}
              {stockStatus && (
                <Badge variant={stockStatus.variant} className="text-xs">
                  {stockStatus.label}
                </Badge>
              )}
            </div>
            
            {costPrice !== undefined && (
              <p className="text-xs text-muted-foreground">
                Cost: KSh {costPrice.toLocaleString()}
              </p>
            )}
            
            {currentStock !== undefined && (
              <p className="text-xs text-muted-foreground">
                Stock: {currentStock === -1 ? 'N/A' : currentStock}
              </p>
            )}

            {isLowStock && (
              <p className="text-xs text-orange-600 font-medium">
                ⚠ Low stock warning
              </p>
            )}
          </>
        )}
      </div>

      {/* Action Overlays */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        {variant === 'sales' && onAddToCart && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
            disabled={isInStock === false}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}

        {variant === 'inventory' && (
          <div className="flex gap-2">
            {onEdit && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                className="bg-white/90 text-gray-700 hover:bg-white shadow-lg"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onRestock && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestock(product);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product);
                }}
                className="shadow-lg"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {variant === 'template' && (
          <Button
            size="sm"
            variant={isSelected ? "secondary" : "default"}
            className={cn(
              "shadow-lg",
              isSelected 
                ? "bg-white text-purple-600 hover:bg-gray-100" 
                : "bg-purple-600 hover:bg-purple-700 text-white"
            )}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Selected
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1" />
                Select
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default UnifiedProductCard;