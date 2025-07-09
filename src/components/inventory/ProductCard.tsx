
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRestock: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, onRestock }) => {
  const isUnspecifiedQuantity = product.currentStock === -1;
  
  const getStockStatus = () => {
    if (isUnspecifiedQuantity) {
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Bulk / Variable' };
    }
    if (product.currentStock === 0) return { color: 'bg-red-100 text-red-800', label: 'Out of Stock' };
    if (product.currentStock <= product.lowStockThreshold) return { color: 'bg-yellow-100 text-yellow-800', label: 'Low Stock' };
    return { color: 'bg-green-100 text-green-800', label: 'In Stock' };
  };

  const stockStatus = getStockStatus();

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:ring-2 hover:ring-brand-purple/20 transition-all duration-200 group">
      <CardContent className="p-0 space-y-3">
        {/* Top: Name and Category */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-brand-purple transition-colors truncate">
              {product.name}
            </h3>
            <Badge className="text-sm bg-purple-100 text-purple-800 rounded-full px-2 mt-1">
              {product.category}
            </Badge>
          </div>
        </div>

        {/* Middle: Code and Prices */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 font-mono">
            CODE: {product.id.slice(0, 8).toUpperCase()}
          </div>
          <div className="flex gap-2">
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              Buy: {formatCurrency(product.costPrice)}
            </Badge>
            <Badge className="bg-green-100 text-green-800 text-xs">
              Sell: {formatCurrency(product.sellingPrice)}
            </Badge>
          </div>
        </div>

        {/* Bottom: Stock and Actions */}
        <div className="flex items-center justify-between pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`text-xs ${stockStatus.color}`}>
                {isUnspecifiedQuantity ? stockStatus.label : `${product.currentStock} units`}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {isUnspecifiedQuantity 
                ? "Quantity tracked in bulk—update as needed."
                : `Current stock: ${product.currentStock} units`
              }
            </TooltipContent>
          </Tooltip>
          
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(product)}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-brand-purple"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit product</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(product)}
                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete product</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRestock(product)}
                  className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restock product</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
