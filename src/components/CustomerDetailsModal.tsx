
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Customer, Transaction, Sale } from '../types';
import { formatCurrency } from '../utils/currency';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  CheckCircle,
  Clock,
  X,
  History,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  customer 
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateCustomer } = useSupabaseCustomers();

  useEffect(() => {
    if (isOpen && customer && user) {
      fetchCustomerTransactions();
      fetchCustomerSales();
    }
  }, [isOpen, customer, user]);

  const fetchCustomerTransactions = async () => {
    if (!customer || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('customer_id', customer.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customer transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerSales = async () => {
    if (!customer || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .eq('customer_id', customer.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customer sales",
        variant: "destructive",
      });
    }
  };

  const handleMarkTransactionPaid = async (transactionId: string) => {
    if (!user) return;

    try {
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) return;

      const { error } = await supabase
        .from('transactions')
        .update({ 
          paid: true,
          paid_date: new Date().toISOString()
        })
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update customer debt
      if (customer) {
        const unpaidTransactions = transactions.filter(t => !t.paid && t.id !== transactionId);
        const totalUnpaidDebt = unpaidTransactions.reduce((sum, t) => sum + t.total_amount, 0);
        
        await updateCustomer(customer.id, {
          outstanding_debt: totalUnpaidDebt,
          last_purchase_date: new Date().toISOString()
        });
      }

      await fetchCustomerTransactions();
      toast({
        title: "Success",
        description: "Transaction marked as paid",
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    }
  };

  const getUnpaidDebtTotal = () => {
    const unpaidTransactions = transactions.filter(t => !t.paid);
    return unpaidTransactions.reduce((sum, t) => sum + t.total_amount, 0);
  };

  const getPaidDebtTotal = () => {
    const paidTransactions = transactions.filter(t => t.paid);
    return paidTransactions.reduce((sum, t) => sum + t.total_amount, 0);
  };

  const getTotalSalesAmount = () => {
    return sales.reduce((sum, s) => sum + s.total_amount, 0);
  };

  if (!customer) return null;

  const getRiskBadgeColor = (rating: string) => {
    switch (rating) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDebtStatusColor = () => {
    if (customer.outstanding_debt === 0) {
      return 'text-green-600';
    } else if (customer.outstanding_debt <= 1000) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                {customer.name}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Badge className={`${getRiskBadgeColor(customer.risk_rating)} border-0`}>
                  {customer.risk_rating} risk
                </Badge>
                <Badge variant={customer.outstanding_debt === 0 ? "default" : "destructive"}>
                  Balance: {formatCurrency(customer.outstanding_debt)}
                </Badge>
              </div>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Debt</p>
                    <p className={`text-lg font-semibold ${getDebtStatusColor()}`}>
                      {formatCurrency(customer.outstanding_debt)}
                    </p>
                  </div>
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(getTotalSalesAmount())}
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Credit Limit</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(customer.credit_limit)}
                    </p>
                  </div>
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Joined: {new Date(customer.created_date || '').toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Credit Limit: </span>
                  <span className="font-medium">{formatCurrency(customer.credit_limit)}</span>
                </div>
                {customer.last_purchase_date && (
                  <div>
                    <span className="text-muted-foreground">Last Purchase: </span>
                    <span className="font-medium">
                      {new Date(customer.last_purchase_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transactions and Sales Tabs */}
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Debt Transactions ({transactions.length})
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Sales History ({sales.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : transactions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Debt Transactions</h3>
                    <p className="text-muted-foreground">
                      This customer has no debt transactions recorded.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className={`${transaction.paid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {transaction.paid ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Clock className="w-5 h-5 text-red-600" />
                              )}
                              <span className="font-medium">
                                Item ID: {transaction.item_id || 'N/A'}
                              </span>
                              <Badge variant={transaction.paid ? "default" : "destructive"}>
                                {transaction.paid ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Quantity: {transaction.quantity}</p>
                              <p>Unit Price: {formatCurrency(transaction.unit_price)}</p>
                              <p>Date: {new Date(transaction.date || '').toLocaleDateString()}</p>
                              {transaction.notes && <p>Notes: {transaction.notes}</p>}
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-lg font-semibold">
                              {formatCurrency(transaction.total_amount)}
                            </div>
                            {!transaction.paid && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkTransactionPaid(transaction.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Mark as Paid
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              {sales.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Sales History</h3>
                    <p className="text-muted-foreground">
                      This customer has no sales recorded.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sales.map((sale) => (
                    <Card key={sale.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                              <span className="font-medium">
                                {sale.product_name || 'Unknown Product'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Quantity: {sale.quantity}</p>
                              <p>Unit Price: {formatCurrency(sale.selling_price)}</p>
                              <p>Date: {new Date(sale.timestamp || '').toLocaleDateString()}</p>
                              {sale.payment_method && (
                                <p>Payment: {sale.payment_method}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              {formatCurrency(sale.total_amount)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailsModal;
