
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';
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
  
  const isLowStock = product.currentStock <= product.lowStockThreshold && product.currentStock !== -1;
  const isOutOfStock = product.currentStock === 0;
  const isUnspecifiedQuantity = product.currentStock === -1;

  const getStockBadge = () => {
    if (isUnspecifiedQuantity) {
      return <Badge variant="secondary">Unspecified</Badge>;
    }
    if (isOutOfStock) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (isLowStock) {
      return <Badge variant="destructive">Low Stock</Badge>;
    }
    return <Badge variant="secondary">In Stock</Badge>;
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

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${isUnspecifiedQuantity ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg truncate">{product.name}</h3>
            {getStockBadge()}
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-medium">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span>Cost Price:</span>
              <span className="font-medium">{formatCurrency(product.costPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Selling Price:</span>
              <span className="font-medium">{formatCurrency(product.sellingPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Stock:</span>
              <span className="font-medium">
                {product.currentStock === -1 ? 'Unspecified' : `${product.currentStock} units`}
              </span>
            </div>
            {!isUnspecifiedQuantity && (
              <div className="flex justify-between">
                <span>Low Stock Alert:</span>
                <span className="font-medium">{product.lowStockThreshold} units</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(product)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRestockModal(true)}
              disabled={isUnspecifiedQuantity}
              className={`flex-1 ${isUnspecifiedQuantity ? 'cursor-not-allowed opacity-50' : ''}`}
              title={isUnspecifiedQuantity ? 'Cannot restock unspecified quantity products' : 'Restock product'}
            >
              <Package className="w-4 h-4 mr-1" />
              Restock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(product)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {isLowStock && !isUnspecifiedQuantity && (
            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">Stock is running low!</span>
            </div>
          )}
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
