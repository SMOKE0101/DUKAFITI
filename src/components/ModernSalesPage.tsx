
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ShoppingCart, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { useUnifiedSales } from '../hooks/useUnifiedSales';
import { useUnifiedProducts } from '../hooks/useUnifiedProducts';
import { useUnifiedCustomers } from '../hooks/useUnifiedCustomers';
import { useUnifiedSyncManager } from '../hooks/useUnifiedSyncManager';
import { useToast } from '@/hooks/use-toast';
import { Sale } from '../types';

const ModernSalesPage = () => {
  const { sales, loading, createSale } = useUnifiedSales();
  const { products } = useUnifiedProducts();
  const { customers, updateCustomer, refetch: refetchCustomers } = useUnifiedCustomers();
  const { isOnline, pendingOperations, syncPendingOperations } = useUnifiedSyncManager();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    quantity: 1,
    paymentMethod: 'cash' as 'cash' | 'mpesa' | 'debt' | 'partial',
  });

  const selectedProduct = products.find(p => p.id === formData.productId);
  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  const totalAmount = selectedProduct ? selectedProduct.sellingPrice * formData.quantity : 0;
  const profit = selectedProduct ? (selectedProduct.sellingPrice - selectedProduct.costPrice) * formData.quantity : 0;

  // Listen for customer updates and pending operations changes
  useEffect(() => {
    const handleDataRefresh = () => {
      console.log('[ModernSalesPage] Data refresh event received');
      refetchCustomers();
    };

    const handlePendingOpsChange = (event: any) => {
      console.log('[ModernSalesPage] Pending operations changed:', event.detail);
      // Force re-render to show updated pending count
    };

    const events = [
      'customer-debt-updated',
      'customer-updated-locally',
      'customer-updated-server',
      'sale-completed',
      'checkout-completed',
      'pending-operations-changed',
      'pending-operations-added',
      'pending-operations-removed',
      'pending-operations-cleared'
    ];

    events.forEach(event => {
      if (event.startsWith('pending-operations')) {
        window.addEventListener(event, handlePendingOpsChange);
      } else {
        window.addEventListener(event, handleDataRefresh);
      }
    });
    
    return () => {
      events.forEach(event => {
        if (event.startsWith('pending-operations')) {
          window.removeEventListener(event, handlePendingOpsChange);
        } else {
          window.removeEventListener(event, handleDataRefresh);
        }
      });
    };
  }, [refetchCustomers]);

  const handleManualSync = async () => {
    if (!isOnline || pendingOperations === 0 || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const success = await syncPendingOperations();
      if (success) {
        toast({
          title: "Sync Successful",
          description: "All pending operations have been synced.",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: "Some operations failed to sync. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "An error occurred during sync.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;

    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      console.log('[ModernSalesPage] Starting sale creation:', {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        customerId: formData.customerId,
        customerName: selectedCustomer?.name,
        quantity: formData.quantity,
        paymentMethod: formData.paymentMethod,
        totalAmount,
        isDebtSale: formData.paymentMethod === 'debt',
        currentCustomerDebt: selectedCustomer?.outstandingDebt
      });

      // For debt sales, validate customer exists
      if (formData.paymentMethod === 'debt' && (!formData.customerId || !selectedCustomer)) {
        toast({
          title: "Customer Required",
          description: "Please select a customer for debt transactions.",
          variant: "destructive",
        });
        return;
      }

      // For debt sales, update customer debt FIRST
      if (formData.paymentMethod === 'debt' && formData.customerId && selectedCustomer) {
        console.log('[ModernSalesPage] Processing debt sale - updating customer debt first');
        
        const debtUpdates = {
          outstandingDebt: (selectedCustomer.outstandingDebt || 0) + totalAmount,
          totalPurchases: (selectedCustomer.totalPurchases || 0) + totalAmount,
          lastPurchaseDate: new Date().toISOString(),
        };
        
        console.log('[ModernSalesPage] Customer debt update:', {
          customerId: formData.customerId,
          currentDebt: selectedCustomer.outstandingDebt,
          additionalDebt: totalAmount,
          newDebt: debtUpdates.outstandingDebt,
          updates: debtUpdates
        });

        try {
          await updateCustomer(formData.customerId, debtUpdates);
          console.log('[ModernSalesPage] Customer debt updated successfully');
        } catch (error) {
          console.error('[ModernSalesPage] Customer debt update failed:', error);
          toast({
            title: "Customer Update Failed",
            description: "Unable to update customer debt. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Create the sale
      const saleData = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        customerId: formData.customerId || undefined,
        customerName: selectedCustomer?.name || undefined,
        quantity: formData.quantity,
        sellingPrice: selectedProduct.sellingPrice,
        costPrice: selectedProduct.costPrice,
        profit,
        paymentMethod: formData.paymentMethod,
        timestamp: new Date().toISOString(),
        paymentDetails: {
          cashAmount: formData.paymentMethod === 'cash' ? totalAmount : 0,
          mpesaAmount: formData.paymentMethod === 'mpesa' ? totalAmount : 0,
          debtAmount: formData.paymentMethod === 'debt' ? totalAmount : 0,
        },
        total: totalAmount,
      };

      await createSale(saleData);
      console.log('[ModernSalesPage] Sale created successfully');

      // Show appropriate success message
      const message = formData.paymentMethod === 'debt' 
        ? `Sale recorded and customer debt increased by KSh ${totalAmount.toLocaleString()}${!isOnline ? ' (will sync when online)' : ''}.`
        : `Successfully recorded sale for KSh ${totalAmount.toLocaleString()}${!isOnline ? ' (will sync when online)' : ''}.`;

      toast({
        title: "Sale Recorded!",
        description: message,
      });

      // Dispatch events to ensure UI updates
      window.dispatchEvent(new CustomEvent('sale-completed'));
      
      setIsDialogOpen(false);
      resetForm();
      
      // Refresh customer data to show updated debt
      refetchCustomers();
      
    } catch (error) {
      console.error('[ModernSalesPage] Failed to create sale:', error);
      toast({
        title: "Sale Failed",
        description: "Unable to record sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                {pendingOperations} pending sync
              </Badge>
              {isOnline && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="h-8"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </Button>
              )}
            </div>
          )}
          {!isOnline && (
            <Badge variant="secondary" className="bg-orange-50 border-orange-200 text-orange-800">
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
                  <Label htmlFor="customer">
                    Customer {formData.paymentMethod === 'debt' ? '*' : '(Optional)'}
                  </Label>
                  <Select 
                    value={formData.customerId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        formData.paymentMethod === 'debt' 
                          ? "Select a customer (required for credit)" 
                          : "Select a customer (optional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone} (Debt: KSh {customer.outstandingDebt.toLocaleString()})
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
                      onValueChange={(value: 'cash' | 'mpesa' | 'debt' | 'partial') => 
                        setFormData(prev => ({ ...prev, paymentMethod: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="debt">Credit</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
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
                      {formData.paymentMethod === 'debt' && selectedCustomer && (
                        <>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Current Debt:</span>
                            <span className="ml-2 font-medium">KSh {selectedCustomer.outstandingDebt.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">New Debt:</span>
                            <span className="ml-2 font-medium text-orange-600">KSh {(selectedCustomer.outstandingDebt + totalAmount).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!selectedProduct || (formData.paymentMethod === 'debt' && !formData.customerId) || isSubmitting}
                  >
                    {isSubmitting ? 'Recording...' : 'Record Sale'}
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
                    <TableCell>KSh {sale.total.toLocaleString()}</TableCell>
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
