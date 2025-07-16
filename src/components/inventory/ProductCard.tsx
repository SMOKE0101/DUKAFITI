
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, Package, AlertTriangle } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRestock: (product: Product, quantity: number, buyingPrice: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onEdit, 
  onDelete, 
  onRestock 
}) => {
  const isLowStock = product.current_stock <= (product.low_stock_threshold || 10) && product.current_stock > 0;
  const isOutOfStock = product.current_stock === 0;
  const isInStock = product.current_stock > (product.low_stock_threshold || 10);

  const getStockStatus = () => {
    if (isOutOfStock) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (isLowStock) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const stockStatus = getStockStatus();

  const handleQuickRestock = () => {
    const quantity = 10; // Default restock quantity
    const buyingPrice = product.cost_price || 0;
    onRestock(product, quantity, buyingPrice);
  };

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-200 hover:shadow-lg
      ${isOutOfStock ? 'border-red-200 bg-red-50/30' : ''}
      ${isLowStock ? 'border-orange-200 bg-orange-50/30' : ''}
      ${isInStock ? 'border-green-200 bg-green-50/30' : ''}
    `}>
      {/* Stock Status Indicator */}
      <div className={`
        absolute top-0 left-0 right-0 h-1
        ${isOutOfStock ? 'bg-red-500' : ''}
        ${isLowStock ? 'bg-orange-500' : ''}
        ${isInStock ? 'bg-green-500' : ''}
      `} />

      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {product.category}
            </p>
          </div>
          <Badge variant={stockStatus.variant} className="ml-2 text-xs">
            {stockStatus.label}
          </Badge>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-gray-600 text-xs font-medium">Cost Price</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(product.cost_price)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-gray-600 text-xs font-medium">Selling Price</p>
            <p className="font-semibold text-green-600">
              {formatCurrency(product.selling_price)}
            </p>
          </div>
        </div>

        {/* Stock Information */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Stock Level</span>
            </div>
            <span className={`
              text-lg font-bold
              ${isOutOfStock ? 'text-red-600' : ''}
              ${isLowStock ? 'text-orange-600' : ''}
              ${isInStock ? 'text-green-600' : ''}
            `}>
              {product.current_stock}
            </span>
          </div>
          
          {/* Stock threshold indicator */}
          <div className="text-xs text-gray-500">
            Threshold: {product.low_stock_threshold || 10} units
          </div>

          {/* Low stock warning */}
          {isLowStock && (
            <div className="flex items-center gap-1 mt-2 text-orange-600">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs font-medium">Running low on stock</span>
            </div>
          )}

          {/* Out of stock warning */}
          {isOutOfStock && (
            <div className="flex items-center gap-1 mt-2 text-red-600">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs font-medium">Needs immediate restock</span>
            </div>
          )}
        </div>

        {/* Profit Margin */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Profit Margin</span>
            <span className="text-sm font-bold text-blue-600">
              {product.selling_price > 0 
                ? (((product.selling_price - product.cost_price) / product.selling_price) * 100).toFixed(1)
                : 0
              }%
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Profit per unit: {formatCurrency(product.selling_price - product.cost_price)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(product)}
            className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          
          {(isLowStock || isOutOfStock) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickRestock}
              className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
            >
              <Plus className="w-3 h-3 mr-1" />
              Restock
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(product)}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        {/* Value Information */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Value:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(product.selling_price * product.current_stock)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
