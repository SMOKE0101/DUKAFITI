import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, AlertTriangle, Package, Plus } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';
import RestockModal from './RestockModal';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRestock: (product: Product, quantity: number, buyingPrice: number) => Promise<void>;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, onRestock }) => {
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  const isLowStock = product.currentStock <= product.lowStockThreshold && product.currentStock !== -1;
  const isOutOfStock = product.currentStock === 0;
  const isUnspecifiedQuantity = product.currentStock === -1;

  const getStockBadge = () => {
    if (isUnspecifiedQuantity) {
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full px-3 py-1 text-xs font-medium">Unspecified</Badge>;
    }
    if (isOutOfStock) {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 rounded-full px-3 py-1 text-xs font-medium">Out of Stock</Badge>;
    }
    if (isLowStock) {
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-full px-3 py-1 text-xs font-medium">Low Stock</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 rounded-full px-3 py-1 text-xs font-medium">In Stock</Badge>;
  };

  const handleRestock = async (quantity: number, buyingPrice: number) => {
    if (!product || isUnspecifiedQuantity) return;
    
    setIsRestocking(true);
    try {
      await onRestock(product, quantity, buyingPrice);
      setShowRestockModal(false);
    } catch (error) {
      console.error('Failed to restock product:', error);
    } finally {
      setIsRestocking(false);
    }
  };

  // Mobile layout - redesigned to match desktop information exactly
  if (isMobile) {
    return (
      <>
        <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            {/* Header with name, ID and badge */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0 mr-3">
                <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-1 truncate">{product.name}</h3>
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2">#{product.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="flex-shrink-0">
                {getStockBadge()}
              </div>
            </div>

            {/* Category - exactly like desktop */}
            <div className="mb-3 flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Category:</span>
              <span className="font-medium text-gray-900 dark:text-white px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">{product.category}</span>
            </div>

            {/* Pricing Information - both prices like desktop */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Cost Price:</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{formatCurrency(product.costPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Selling Price:</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-sm">{formatCurrency(product.sellingPrice)}</span>
              </div>
            </div>

            {/* Stock Information - exactly like desktop */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Stock:</span>
                <span className={`font-bold text-sm ${isLowStock && !isUnspecifiedQuantity ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {isUnspecifiedQuantity ? 'Unspecified' : `${product.currentStock} units`}
                </span>
              </div>
              {!isUnspecifiedQuantity && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Low Stock Alert:</span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{product.lowStockThreshold} units</span>
                </div>
              )}
            </div>

            {/* Low Stock Warning - exactly like desktop */}
            {isLowStock && !isUnspecifiedQuantity && (
              <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Stock is running low!</span>
              </div>
            )}

            {/* Action Buttons - all three like desktop */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(product)}
                className="flex items-center justify-center gap-1 h-11 text-xs rounded-xl border-2 hover:shadow-md transition-all duration-200"
              >
                <Edit className="w-3 h-3" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRestockModal(true)}
                disabled={isUnspecifiedQuantity}
                className={`flex items-center justify-center gap-1 h-11 text-xs rounded-xl border-2 hover:shadow-md transition-all duration-200 ${
                  isUnspecifiedQuantity 
                    ? 'cursor-not-allowed opacity-50' 
                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                }`}
                title={isUnspecifiedQuantity ? 'Cannot restock unspecified quantity products' : 'Restock product'}
              >
                <Package className="w-3 h-3" />
                Stock
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(product)}
                className="flex items-center justify-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 h-11 text-xs rounded-xl border-2 hover:shadow-md transition-all duration-200"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <RestockModal
          isOpen={showRestockModal}
          onClose={() => setShowRestockModal(false)}
          onSave={handleRestock}
          product={product}
          isLoading={isRestocking}
        />
      </>
    );
  }

  // Tablet layout - enhanced with full desktop information
  if (isTablet) {
    return (
      <>
        <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">{product.name}</h3>
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2">#{product.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="flex-shrink-0">
                {getStockBadge()}
              </div>
            </div>

            <div className="space-y-3 text-sm flex-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Category:</span>
                <span className="font-medium text-gray-900 dark:text-white px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">{product.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Cost Price:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(product.costPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Selling Price:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(product.sellingPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {product.currentStock === -1 ? 'Unspecified' : `${product.currentStock} units`}
                </span>
              </div>
              {!isUnspecifiedQuantity && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Low Stock Alert:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{product.lowStockThreshold} units</span>
                </div>
              )}
            </div>

            {isLowStock && !isUnspecifiedQuantity && (
              <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Stock is running low!</span>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(product)}
                className="flex-1 h-10 rounded-lg border-2"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Product
              </Button>
              {!isUnspecifiedQuantity && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowRestockModal(true)}
                  className="flex-1 h-10 rounded-lg bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stock
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(product)}
                className="h-10 w-10 rounded-lg p-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <RestockModal
          isOpen={showRestockModal}
          onClose={() => setShowRestockModal(false)}
          onSave={handleRestock}
          product={product}
          isLoading={isRestocking}
        />
      </>
    );
  }

  // Desktop layout - keep existing desktop implementation
  return (
    <>
      <Card className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 ${isUnspecifiedQuantity ? 'opacity-90' : ''} flex flex-col h-full`}>
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">{product.name}</h3>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2">#{product.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="flex-shrink-0 ml-2">
              {getStockBadge()}
            </div>
          </div>
          
          <div className="space-y-3 text-sm flex-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Category:</span>
              <span className="font-medium text-gray-900 dark:text-white px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">{product.category}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Cost Price:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(product.costPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Selling Price:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(product.sellingPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Stock:</span>
              <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {product.currentStock === -1 ? 'Unspecified' : `${product.currentStock} units`}
              </span>
            </div>
            {!isUnspecifiedQuantity && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Low Stock Alert:</span>
                <span className="font-medium text-gray-900 dark:text-white">{product.lowStockThreshold} units</span>
              </div>
            )}
          </div>

          {isLowStock && !isUnspecifiedQuantity && (
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Stock is running low!</span>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(product)}
                className="flex items-center justify-center gap-1 rounded-xl border-2 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-xs px-2 py-1.5 min-h-[32px]"
              >
                <Edit className="w-3 h-3" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRestockModal(true)}
                disabled={isUnspecifiedQuantity}
                className={`flex items-center justify-center gap-1 rounded-xl border-2 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-xs px-2 py-1.5 min-h-[32px] ${isUnspecifiedQuantity ? 'cursor-not-allowed opacity-50' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}`}
                title={isUnspecifiedQuantity ? 'Cannot restock unspecified quantity products' : 'Restock product'}
              >
                <Package className="w-3 h-3" />
                <span className="hidden sm:inline">Stock</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(product)}
                className="flex items-center justify-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border-2 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-xs px-2 py-1.5 min-h-[32px]"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <RestockModal
        isOpen={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        onSave={handleRestock}
        product={product}
        isLoading={isRestocking}
      />
    </>
  );
};

export default ProductCard;
