
import { useState, useEffect } from 'react';
import { CreditCard, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '../hooks/use-toast';
import { formatCurrency } from '../utils/currency';
import { Customer, Product } from '../types';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';

const DebtRecording = () => {
  const { customers } = useSupabaseCustomers();
  const { products, updateProduct } = useSupabaseProducts();
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    itemId: '',
    quantity: '1',
    notes: '',
  });
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (productSearch) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) &&
        product.current_stock > 0
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [productSearch, products]);

  useEffect(() => {
    calculateTotal();
  }, [selectedProduct, formData.quantity]);

  const calculateTotal = () => {
    if (selectedProduct && formData.quantity) {
      const quantity = parseInt(formData.quantity);
      if (!isNaN(quantity) && quantity > 0) {
        setCalculatedTotal(selectedProduct.selling_price * quantity);
        return;
      }
    }
    setCalculatedTotal(0);
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setFormData({ ...formData, itemId: productId });
      setProductSearch(product.name);
      setFilteredProducts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.itemId || !formData.quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a valid product",
        variant: "destructive",
      });
      return;
    }

    if (quantity > selectedProduct.current_stock) {
      toast({
        title: "Error",
        description: `Not enough stock. Available: ${selectedProduct.current_stock}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update product stock
      await updateProduct(formData.itemId, {
        current_stock: selectedProduct.current_stock - quantity,
        updated_at: new Date().toISOString()
      });

      // Reset form
      setFormData({ customerId: '', itemId: '', quantity: '1', notes: '' });
      setSelectedProduct(null);
      setProductSearch('');
      setCalculatedTotal(0);

      const customer = customers.find(c => c.id === formData.customerId);
      toast({
        title: "Success",
        description: `Debt recorded for ${customer?.name}. Amount: ${formatCurrency(calculatedTotal)}`,
      });
    } catch (error) {
      console.error('Failed to record debt:', error);
      toast({
        title: "Error",
        description: "Failed to record debt transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            Record New Debt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <Label htmlFor="customer">Select Customer *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData({ ...formData, customerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customers.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No customers found. Add customers in the Customer Management tab.
                </p>
              )}
            </div>

            {/* Product Search and Selection */}
            <div>
              <Label htmlFor="productSearch">Search and Select Product *</Label>
              <div className="relative">
                <Input
                  id="productSearch"
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Type to search for products..."
                />
                {filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductSelect(product.id)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(product.selling_price)}</div>
                            <div className="text-sm text-gray-500">Stock: {product.current_stock}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedProduct && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-blue-800">{selectedProduct.name}</div>
                      <div className="text-sm text-blue-600">{selectedProduct.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-blue-800">{formatCurrency(selectedProduct.selling_price)}</div>
                      <div className="text-sm text-blue-600">Stock: {selectedProduct.current_stock}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.current_stock || 1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1"
                required
              />
              {selectedProduct && parseInt(formData.quantity) > selectedProduct.current_stock && (
                <p className="text-sm text-red-500 mt-1">
                  Insufficient stock. Available: {selectedProduct.current_stock}
                </p>
              )}
            </div>

            {/* Calculation Display */}
            {calculatedTotal > 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator size={16} />
                  <span className="font-medium">Calculation</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Unit Price:</span>
                    <span>{formatCurrency(selectedProduct?.selling_price || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>{formData.quantity}</span>
                  </div>
                  <div className="border-t pt-1 flex justify-between font-bold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-red-600">{formatCurrency(calculatedTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !selectedProduct || calculatedTotal === 0}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Recording...' : `Record Debt - ${formatCurrency(calculatedTotal)}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebtRecording;
