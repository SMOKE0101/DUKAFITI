
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ShoppingCart, DollarSign, Calendar } from 'lucide-react';
import { useUnifiedSales } from '../hooks/useUnifiedSales';
import { useUnifiedProducts } from '../hooks/useUnifiedProducts';
import { useUnifiedCustomers } from '../hooks/useUnifiedCustomers';
import { Sale } from '../types';

const ModernSalesPage = () => {
  const { sales, loading, createSale, isOnline, pendingOperations } = useUnifiedSales();
  const { products } = useUnifiedProducts();
  const { customers } = useUnifiedCustomers();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    quantity: 1,
    paymentMethod: 'cash' as const,
  });

  const selectedProduct = products.find(p => p.id === formData.productId);
  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  const totalAmount = selectedProduct ? selectedProduct.sellingPrice * formData.quantity : 0;
  const profit = selectedProduct ? (selectedProduct.sellingPrice - selectedProduct.costPrice) * formData.quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;

    try {
      const saleData = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        customerId: formData.customerId || null,
        customerName: selectedCustomer?.name || null,
        quantity: formData.quantity,
        sellingPrice: selectedProduct.sellingPrice,
        costPrice: selectedProduct.costPrice,
        profit,
        totalAmount,
        paymentMethod: formData.paymentMethod,
        timestamp: new Date().toISOString(),
      };

      await createSale(saleData);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create sale:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      customerId: '',
      quantity: 1,
      paymentMethod: 'cash',
    });
  };

  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp).toDateString();
    const today = new Date().toDateString();
    return saleDate === today;
  });

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const todayProfit = todaySales.reduce((sum, sale) => sum + sale.profit, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Sales Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Record and track your sales transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingOperations > 0 && (
            <Badge variant="outline">
              {pendingOperations} pending sync
            </Badge>
          )}
          {!isOnline && (
            <Badge variant="secondary">
              Working Offline
            </Badge>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Record New Sale</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="product">Product *</Label>
                  <Select 
                    value={formData.productId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - KSh {product.sellingPrice} (Stock: {product.currentStock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customer">Customer (Optional)</Label>
                  <Select 
                    value={formData.customerId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedProduct?.currentStock || 999}
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value: 'cash' | 'mpesa' | 'card' | 'credit') => 
                        setFormData(prev => ({ ...prev, paymentMethod: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedProduct && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2">
                    <h4 className="font-medium">Sale Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Unit Price:</span>
                        <span className="ml-2 font-medium">KSh {selectedProduct.sellingPrice.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Quantity:</span>
                        <span className="ml-2 font-medium">{formData.quantity}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Total Amount:</span>
                        <span className="ml-2 font-medium">KSh {totalAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Profit:</span>
                        <span className="ml-2 font-medium text-green-600">KSh {profit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedProduct}>
                    Record Sale
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySales.length}</div>
            <p className="text-xs text-muted-foreground">
              transactions recorded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {todayRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              total sales amount
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Profit</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">KSh {todayProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              total profit earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Loading sales...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No sales recorded yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Start by recording your first sale
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.slice(0, 10).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {new Date(sale.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">{sale.productName}</TableCell>
                    <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>KSh {sale.totalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">KSh {sale.profit.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {sale.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sale.synced ? "default" : "secondary"}>
                        {sale.synced ? "Synced" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernSalesPage;
