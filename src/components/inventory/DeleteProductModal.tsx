
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Product } from '../../types';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onDelete: (id: string) => Promise<void>;
}

const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onDelete
}) => {
  const handleDelete = async () => {
    await onDelete(product.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Delete Product
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Product to Delete:</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Stock:</span>
                <span className="font-medium">{product.current_stock} {product.current_stock === 0 ? '(Out of Stock)' : 'units'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selling Price:</span>
                <span className="font-medium">KES {product.selling_price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This action cannot be undone. The product will be permanently removed from your inventory.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleDelete}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Product
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProductModal;
