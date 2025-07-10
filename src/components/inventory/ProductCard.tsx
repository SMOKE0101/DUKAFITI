
import React from 'react';
import { Edit, Trash2, Package } from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRestock: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onEdit, 
  onDelete,
  onRestock
}) => {
  const isLowStock = product.currentStock !== -1 && product.currentStock <= product.lowStockThreshold;
  const isUnspecifiedStock = product.currentStock === -1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {product.category}
          </p>
        </div>
        
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => onRestock(product)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
            title="Restock"
          >
            <Package size={16} />
          </button>
          <button
            onClick={() => onEdit(product)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Cost:</span>
          <span className="font-medium">KES {product.costPrice.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Selling:</span>
          <span className="font-medium text-green-600">KES {product.sellingPrice.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Stock:</span>
          {isUnspecifiedStock ? (
            <span className="font-medium text-blue-600">Unspecified</span>
          ) : (
            <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {product.currentStock} units
            </span>
          )}
        </div>

        {!isUnspecifiedStock && isLowStock && (
          <div className="mt-2 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded">
            Low Stock Alert
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
