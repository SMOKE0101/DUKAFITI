
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Product } from '../types';
import { Package } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddStock: (productId: string, quantity: number, buyingPrice: number, supplier?: string) => void;
}

const InventoryModal = ({ isOpen, onClose, products, onAddStock }: InventoryModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    buyingPrice: 0,
    supplier: '',
  });

  const selectedProduct = products.find(p => p.id === formData.productId);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        productId: '',
        quantity: 1,
        buyingPrice: 0,
        supplier: '',
      });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId) {
      toast({
        title: "Validation Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    if (formData.quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.buyingPrice < 0) {
      toast({
        title: "Validation Error",
        description: "Buying price cannot be negative",
        variant: "destructive",
      });
      return;
    }
    
    onAddStock(
      formData.productId,
      formData.quantity,
      formData.buyingPrice,
      formData.supplier || undefined
    );
    
    onClose();
  };

  const isFormValid = formData.productId && formData.quantity > 0 && formData.buyingPrice >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[600px] max-h-[95vh] border-0 p-0 bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden">
        
        {/* Modern Header */}
        <div className="border-b-4 border-purple-600 bg-white dark:bg-gray-900 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-purple-600" />
          </div>
          <DialogTitle className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            ADD INVENTORY
          </DialogTitle>
          <DialogDescription className="font-mono text-sm text-gray-600 dark:text-gray-400 mt-2 uppercase tracking-wider">
            Record new stock arrival
          </DialogDescription>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Product Selection */}
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
              <Label htmlFor="product" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                Product *
              </Label>
              <Select 
                value={formData.productId} 
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
              >
                <SelectTrigger className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500">
                  <SelectValue placeholder="Search and select product..." />
                </SelectTrigger>
                <SelectContent className="border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id} className="font-mono">
                      <div className="flex justify-between items-center w-full">
                        <span>{product.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          Stock: {product.current_stock === -1 ? 'Unspecified' : product.current_stock}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Quantity and Price Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Quantity */}
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                <Label htmlFor="quantity" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                  Quantity Received *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                  required
                />
              </div>
              
              {/* Buying Price */}
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
                <Label htmlFor="buyingPrice" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                  Buying Price (KES) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-mono">
                    KES
                  </span>
                  <Input
                    id="buyingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.buyingPrice}
                    onChange={(e) => setFormData({ ...formData, buyingPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="h-12 text-base pl-14 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Supplier */}
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
              <Label htmlFor="supplier" className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3 block">
                Supplier (Optional)
              </Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Enter supplier name"
                className="h-12 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent font-mono focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
              />
            </div>

            {selectedProduct && (
              <div className="border-2 border-blue-300 dark:border-blue-600 rounded-xl p-4 bg-blue-50/50 dark:bg-blue-900/20">
                <h3 className="font-mono font-bold uppercase tracking-wider text-blue-900 dark:text-blue-100 mb-3">
                  Summary
                </h3>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wide">Product:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wide">Current Stock:</span>
                    <span className="text-gray-900 dark:text-white">
                      {selectedProduct.current_stock === -1 ? 'Unspecified' : `${selectedProduct.current_stock} units`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wide">New Stock:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {selectedProduct.current_stock === -1 
                        ? 'Unspecified' 
                        : `${selectedProduct.current_stock + formData.quantity} units`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Cost:</span>
                    <span className="font-bold text-purple-600">
                      KES {(formData.buyingPrice * formData.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-6">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-mono font-bold uppercase tracking-wide bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200"
                disabled={!isFormValid}
              >
                SAVE STOCK ADDITION
              </Button>
              <Button 
                type="button" 
                onClick={onClose} 
                className="w-full h-12 text-base font-mono font-bold uppercase tracking-wide bg-transparent border-2 border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                CANCEL
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryModal;
