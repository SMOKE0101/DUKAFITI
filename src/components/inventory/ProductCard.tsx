
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, Plus } from 'lucide-react';
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
      return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', label: 'Bulk / Variable' };
    }
    if (product.currentStock === 0) return { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', label: 'Out of Stock' };
    if (product.currentStock <= product.lowStockThreshold) return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', label: 'Low Stock' };
    return { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', label: 'In Stock' };
  };

  const stockStatus = getStockStatus();

  return (
    <Card className="group relative bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:ring-2 hover:ring-primary/20 transition-all duration-200">
      <CardContent className="p-0 space-y-3">
        {/* Top: Name and Category */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
              {product.name}
            </h3>
            <Badge className="text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 rounded-full px-2 mt-1">
              {product.category}
            </Badge>
          </div>
        </div>

        {/* Middle: Code and Prices */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            CODE: {product.id.slice(0, 8).toUpperCase()}
          </div>
          <div className="flex gap-2">
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs">
              Buy: {formatCurrency(product.costPrice)}
            </Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs">
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
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
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
                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
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
                  className="h-10 w-10 p-0 rounded-full bg-green-600 hover:bg-green-500 text-white hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add stock</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
