

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
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">{customer.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{customer.name}</h2>
                <p className="text-sm text-gray-600">{customer.phone}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Badge className={`${getRiskBadgeColor(customer.riskRating)} text-sm px-3 py-1`}>
                {customer.riskRating.toUpperCase()} RISK
              </Badge>
              {customer.outstandingDebt > 0 && (
                <Badge variant="destructive" className="text-sm px-3 py-1 bg-red-500 text-white">
                  DEBT: {formatCurrency(customer.outstandingDebt)}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Outstanding Debt Alert */}
            {totalDebt > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-800">Outstanding Debt</h3>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleClearAllDebt}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 font-semibold"
                  >
                    Clear All Debt
                  </Button>
                </div>
              </div>
            )}

            {/* Customer Overview - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="col-span-1 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-red-700">Current Debt</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-green-700">Total Revenue</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-blue-700">Total Profit</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(totalProfit)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-purple-700">Transactions</p>
                      <p className="text-xl font-bold text-purple-600">{totalTransactions}</p>
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
