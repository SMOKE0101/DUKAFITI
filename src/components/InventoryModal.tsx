
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Product } from '../types';

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

  // Reset form when modal opens/closes
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[500px] h-[90vh] sm:max-h-[85vh] flex flex-col mx-auto my-auto rounded-lg border-0 p-0">
        <DialogHeader className="flex-shrink-0 text-center space-y-3 p-4 sm:p-6 border-b">
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
            Add Inventory
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Record new stock arrival and update inventory levels.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm font-medium text-foreground">
                  Product *
                </Label>
                <Select 
                  value={formData.productId} 
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                >
                  <SelectTrigger className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary">
                    <SelectValue placeholder="Search and select product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{product.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            Stock: {product.currentStock}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium text-foreground">
                  Quantity Received *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buyingPrice" className="text-sm font-medium text-foreground">
                  Buying Price (KES) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
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
                    className="h-12 text-base pl-14 focus-visible:ring-2 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-sm font-medium text-foreground">
                  Supplier (Optional)
                </Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Enter supplier name"
                  className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              {selectedProduct && (
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <h3 className="font-medium text-foreground mb-2">Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product:</span>
                      <span className="font-medium">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Stock:</span>
                      <span>{selectedProduct.currentStock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New Stock:</span>
                      <span className="font-medium">{selectedProduct.currentStock + formData.quantity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-medium text-primary">
                        KES {(formData.buyingPrice * formData.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3 pt-6 border-t border-border">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700 focus-visible:ring-green-500"
                disabled={!formData.productId || formData.quantity <= 0}
              >
                Save Stock Addition
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="w-full h-12 text-base font-medium"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryModal;
