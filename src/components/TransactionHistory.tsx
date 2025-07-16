
import { useState, useEffect } from 'react';
import { History, Search, Filter, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '../hooks/use-toast';
import { formatCurrency } from '../utils/currency';
import { Customer, Product, Transaction } from '../types';
import { useSupabaseTransactions } from '../hooks/useSupabaseTransactions';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';

const TransactionHistory = () => {
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const { toast } = useToast();
  
  const { transactions, loading: transactionsLoading, updateTransaction } = useSupabaseTransactions();
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { products, loading: productsLoading } = useSupabaseProducts();

  const loading = transactionsLoading || customersLoading || productsLoading;

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterStatus, filterCustomer, dateRange]);

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      const customerMatches = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).map(c => c.id);
      
      const productMatches = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).map(p => p.id);

      filtered = filtered.filter(t => 
        customerMatches.includes(t.customer_id) ||
        productMatches.includes(t.item_id) ||
        t.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => 
        filterStatus === 'paid' ? t.paid : !t.paid
      );
    }

    // Customer filter
    if (filterCustomer !== 'all') {
      filtered = filtered.filter(t => t.customer_id === filterCustomer);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();

      switch (dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(t => new Date(t.date) >= cutoffDate);
    }

    setFilteredTransactions(filtered);
  };

  const markAsPaid = async (transactionId: string) => {
    try {
      await updateTransaction(transactionId, {
        paid: true,
        paid_date: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Transaction marked as paid",
      });
    } catch (error) {
      console.error('Failed to mark as paid:', error);
    }
  };

  const markAsUnpaid = async (transactionId: string) => {
    try {
      await updateTransaction(transactionId, {
        paid: false,
        paid_date: null
      });

      toast({
        title: "Success",
        description: "Transaction marked as unpaid",
      });
    } catch (error) {
      console.error('Failed to mark as unpaid:', error);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const getTotalStats = () => {
    const total = filteredTransactions.reduce((sum, t) => sum + t.total_amount, 0);
    const paid = filteredTransactions.filter(t => t.paid).reduce((sum, t) => sum + t.total_amount, 0);
    const outstanding = total - paid;

    return { total, paid, outstanding };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-blue-100 text-sm">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-green-100 text-sm">Paid Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.paid)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-red-100 text-sm">Outstanding</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.outstanding)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
                <SelectItem value="unpaid">Unpaid Only</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History size={20} />
            Transaction History ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm || filterStatus !== 'all' || filterCustomer !== 'all' || dateRange !== 'all'
                ? 'No transactions match your filters'
                : 'No transactions recorded yet'
              }
            </p>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    transaction.paid
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">
                          {getCustomerName(transaction.customer_id)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          transaction.paid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.paid ? 'Paid' : 'Outstanding'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <strong>Product:</strong> {getProductName(transaction.item_id)}
                        </div>
                        <div>
                          <strong>Quantity:</strong> {transaction.quantity} × {formatCurrency(transaction.unit_price)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{new Date(transaction.date).toLocaleDateString('en-KE')}</span>
                          <span>{new Date(transaction.date).toLocaleTimeString('en-KE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                        </div>
                        {transaction.notes && (
                          <div>
                            <strong>Notes:</strong> {transaction.notes}
                          </div>
                        )}
                        {transaction.paid && transaction.paid_date && (
                          <div className="text-green-600">
                            <strong>Paid on:</strong> {new Date(transaction.paid_date).toLocaleDateString('en-KE')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-800">
                          {formatCurrency(transaction.total_amount)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {transaction.paid ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsUnpaid(transaction.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <XCircle size={16} className="mr-1" />
                            Mark Unpaid
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsPaid(transaction.id)}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50"
                          >
                            <CheckCircle size={16} className="mr-1" />
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
