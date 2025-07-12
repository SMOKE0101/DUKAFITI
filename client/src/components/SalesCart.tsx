
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { Product } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
}

interface SalesCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdatePrice: (productId: string, price: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

const SalesCart: React.FC<SalesCartProps> = ({
  cartItems,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
  onClearCart
}) => {
  const subtotal = cartItems.reduce((sum, item) => 
    sum + (item.customPrice || item.product.sellingPrice) * item.quantity, 0
  );

  const totalProfit = cartItems.reduce((sum, item) => 
    sum + ((item.customPrice || item.product.sellingPrice) - item.product.costPrice) * item.quantity, 0
  );

  if (cartItems.length === 0) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Cart is empty</p>
          <p className="text-sm text-gray-400">Add products to start a sale</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Sales Cart ({cartItems.length})</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearCart}
            className="text-red-600 hover:text-red-700"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {cartItems.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{item.product.name}</h4>
              <p className="text-xs text-gray-500">
                Stock: {item.product.currentStock} | Cost: {formatCurrency(item.product.costPrice)}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
              >
                <Minus size={14} />
              </Button>
              <Input
                type="number"
                min="1"
                max={item.product.currentStock}
                value={item.quantity}
                onChange={(e) => onUpdateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                className="w-16 h-8 text-center text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onUpdateQuantity(item.product.id, Math.min(item.product.currentStock, item.quantity + 1))}
              >
                <Plus size={14} />
              </Button>
            </div>

            <div className="text-right min-w-[80px]">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={item.customPrice || item.product.sellingPrice}
                onChange={(e) => onUpdatePrice(item.product.id, parseFloat(e.target.value) || item.product.sellingPrice)}
                className="w-20 h-8 text-sm text-right"
              />
              <p className="text-xs text-gray-500 mt-1">
                = {formatCurrency((item.customPrice || item.product.sellingPrice) * item.quantity)}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              onClick={() => onRemoveItem(item.product.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}

        {/* Cart Summary */}
        <div className="border-t pt-3 mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-green-600">Estimated Profit:</span>
            <span className="font-medium text-green-600">{formatCurrency(totalProfit)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
            <span>Total:</span>
            <span className="text-blue-600">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesCart;
