import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { useOfflineSales } from '../hooks/useOfflineSales';
import { Sale } from '../types';

const ModernSalesPage = () => {
  const { toast } = useToast();
  const { isOnline, pendingActions } = useOfflineManager();
  const { createOfflineSale, getOfflineSales, isCreating } = useOfflineSales();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [product, setProduct] = useState('');
  const [customer, setCustomer] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [timestamp, setTimestamp] = useState(new Date().toISOString());

  const handleCreateSale = async () => {
    if (!product || !customer || !quantity || !sellingPrice || !costPrice || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const saleData = {
      product_id: product,
      customer_id: customer,
      quantity: parseInt(quantity),
      selling_price: parseFloat(sellingPrice),
      cost_price: parseFloat(costPrice),
      payment_method: paymentMethod,
      timestamp: timestamp
    };

    try {
      await createOfflineSale(saleData);
      toast({
        title: "Success",
        description: "Sale created successfully!",
      });
      // Clear form
      setProduct('');
      setCustomer('');
      setQuantity('');
      setSellingPrice('');
      setCostPrice('');
      setPaymentMethod('');
      setTimestamp(new Date().toISOString());
      loadSales(); // Refresh sales list
    } catch (error: any) {
      console.error('Failed to create sale:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create sale.",
        variant: "destructive",
      });
    }
  };

  const loadSales = async () => {
    try {
      setIsLoading(true);
      const offlineSales = await getOfflineSales();
      setSales(offlineSales);
    } catch (error) {
      console.error('Failed to load sales:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sales Management</h1>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <Badge variant="outline" className="bg-orange-100 text-orange-700">
              Offline Mode
            </Badge>
          )}
          {pendingActions.length > 0 && (
            <Badge variant="outline" className="bg-blue-100 text-blue-700">
              {pendingActions.length} Pending
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Sale</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product">Product ID</Label>
              <Input id="product" value={product} onChange={(e) => setProduct(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="customer">Customer ID</Label>
              <Input id="customer" value={customer} onChange={(e) => setCustomer(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sellingPrice">Selling Price</Label>
              <Input id="sellingPrice" type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input id="costPrice" type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreateSale} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Sale"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading sales...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Selling Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.productId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.customerId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.sellingPrice}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.paymentMethod}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernSalesPage;
