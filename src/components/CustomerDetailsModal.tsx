

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Phone, MapPin, Mail, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Customer, Transaction, Sale } from '../types';
import { formatCurrency } from '../utils/currency';
import { useSupabaseTransactions } from '../hooks/useSupabaseTransactions';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useToast } from '../hooks/use-toast';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => Promise<Customer>;
}

const CustomerDetailsModal = ({ isOpen, onClose, customer, onUpdateCustomer }: CustomerDetailsModalProps) => {
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const { transactions, updateTransaction } = useSupabaseTransactions();
  const { sales } = useSupabaseSales();
  const { products } = useSupabaseProducts();
  const { toast } = useToast();

  useEffect(() => {
    if (customer && isOpen) {
      // Filter transactions for this customer
      const filteredTransactions = transactions.filter(t => t.customerId === customer.id);
      setCustomerTransactions(filteredTransactions);

      // Filter sales for this customer
      const filteredSales = sales.filter(s => s.customerId === customer.id);
      setCustomerSales(filteredSales);
    }
  }, [customer, transactions, sales, isOpen]);

  if (!customer) return null;

  const handleMarkTransactionPaid = async (transactionId: string) => {
    try {
      await updateTransaction(transactionId, {
        paid: true,
        paidDate: new Date().toISOString()
      });
      
      toast({
        title: "Success",
        description: "Transaction marked as paid",
      });
    } catch (error) {
      console.error('Failed to mark transaction as paid:', error);
    }
  };

  const handleClearAllDebt = async () => {
    if (window.confirm(`Clear all debt for ${customer.name}? This will mark all unpaid transactions as paid.`)) {
      try {
        // Mark all unpaid transactions as paid
        const unpaidTransactions = customerTransactions.filter(t => !t.paid);
        for (const transaction of unpaidTransactions) {
          await updateTransaction(transaction.id, {
            paid: true,
            paidDate: new Date().toISOString()
          });
        }

        // Update customer outstanding debt
        await onUpdateCustomer(customer.id, { outstandingDebt: 0 });

        toast({
          title: "Success",
          description: "All debts cleared successfully",
        });
      } catch (error) {
        console.error('Failed to clear debt:', error);
      }
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  // Calculate totals
  const totalTransactions = customerTransactions.length;
  const totalSales = customerSales.length;
  const totalDebt = customerTransactions.filter(t => !t.paid).reduce((sum, t) => sum + t.totalAmount, 0);
  const totalPaid = customerTransactions.filter(t => t.paid).reduce((sum, t) => sum + t.totalAmount, 0);
  const totalRevenue = customerSales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = customerSales.reduce((sum, s) => sum + s.profit, 0);

  const getRiskBadgeColor = (rating: string) => {
    switch (rating) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-lg shadow-lg border z-50">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <span className="text-lg sm:text-xl font-bold truncate">{customer.name}</span>
            <Badge className={`${getRiskBadgeColor(customer.riskRating)} text-xs sm:text-sm self-start sm:self-center`}>
              {customer.riskRating.toUpperCase()} RISK
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Customer Overview - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="col-span-1">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Debt</p>
                      <p className="text-sm sm:text-lg font-bold text-red-600 truncate">{formatCurrency(totalDebt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Revenue</p>
                      <p className="text-sm sm:text-lg font-bold text-green-600 truncate">{formatCurrency(totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Profit</p>
                      <p className="text-sm sm:text-lg font-bold text-blue-600 truncate">{formatCurrency(totalProfit)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Transactions</p>
                      <p className="text-sm sm:text-lg font-bold text-purple-600">{totalTransactions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Details - Responsive Layout */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm font-medium">Phone:</span>
                      <span className="text-sm truncate">{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm font-medium">Email:</span>
                        <span className="text-sm truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm font-medium">Address:</span>
                        <span className="text-sm truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm font-medium">Since:</span>
                      <span className="text-sm">{new Date(customer.createdDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm font-medium">Credit Limit:</span>
                      <span className="text-sm">{formatCurrency(customer.creditLimit)}</span>
                    </div>
                    {customer.lastPurchaseDate && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm font-medium">Last Purchase:</span>
                        <span className="text-sm">{new Date(customer.lastPurchaseDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {totalDebt > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      onClick={handleClearAllDebt}
                      variant="outline"
                      className="w-full sm:w-auto text-green-600 hover:text-green-700 text-sm"
                      size="sm"
                    >
                      Clear All Debt ({formatCurrency(totalDebt)})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transactions and Sales - Mobile-Friendly Tabs */}
            <Tabs defaultValue="transactions" className="space-y-4">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="transactions" className="text-xs sm:text-sm">
                  Transactions ({totalTransactions})
                </TabsTrigger>
                <TabsTrigger value="sales" className="text-xs sm:text-sm">
                  Sales ({totalSales})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transactions">
                <Card>
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-base sm:text-lg">Transaction History</span>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-green-600">Paid: {formatCurrency(totalPaid)}</span>
                        <span className="text-red-600">Outstanding: {formatCurrency(totalDebt)}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {customerTransactions.length === 0 ? (
                      <p className="text-center py-8 text-gray-500 text-sm sm:text-base">No transactions found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs sm:text-sm min-w-[80px]">Date</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[120px]">Product</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[50px]">Qty</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[80px]">Price</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[80px]">Total</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[80px]">Status</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[80px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerTransactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="text-xs sm:text-sm">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  <div className="max-w-[120px] truncate" title={getProductName(transaction.itemId)}>
                                    {getProductName(transaction.itemId)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">{transaction.quantity}</TableCell>
                                <TableCell className="text-xs sm:text-sm">{formatCurrency(transaction.unitPrice)}</TableCell>
                                <TableCell className="text-xs sm:text-sm font-medium">
                                  {formatCurrency(transaction.totalAmount)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-1 sm:space-x-2">
                                    {transaction.paid ? (
                                      <>
                                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                          Paid
                                        </Badge>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                                        <Badge variant="destructive" className="text-xs">Outstanding</Badge>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {!transaction.paid && (
                                    <Button
                                      onClick={() => handleMarkTransactionPaid(transaction.id)}
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 hover:text-green-700 text-xs h-7"
                                    >
                                      Mark Paid
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sales">
                <Card>
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Sales History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {customerSales.length === 0 ? (
                      <p className="text-center py-8 text-gray-500 text-sm sm:text-base">No sales found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs sm:text-sm min-w-[80px]">Date</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[120px]">Product</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[50px]">Qty</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[80px]">Price</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[80px]">Total</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[80px]">Profit</TableHead>
                              <TableHead className="text-xs sm:text-sm min-w-[80px]">Payment</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerSales.map((sale) => (
                              <TableRow key={sale.id}>
                                <TableCell className="text-xs sm:text-sm">
                                  {new Date(sale.timestamp).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  <div className="max-w-[120px] truncate" title={sale.productName}>
                                    {sale.productName}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">{sale.quantity}</TableCell>
                                <TableCell className="text-xs sm:text-sm">{formatCurrency(sale.sellingPrice)}</TableCell>
                                <TableCell className="text-xs sm:text-sm font-medium">
                                  {formatCurrency(sale.total)}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-green-600 font-medium">
                                  {formatCurrency(sale.profit)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {sale.paymentMethod}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailsModal;
