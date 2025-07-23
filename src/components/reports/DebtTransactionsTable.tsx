import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Download, ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { Sale } from '@/types';
import { useSupabaseDebtPayments, DebtPayment } from '@/hooks/useSupabaseDebtPayments';

interface DebtTransactionsTableProps {
  sales: Sale[];
  loading?: boolean;
}

type TimeFrameType = 'today' | 'week' | 'month';

interface DebtTransaction {
  id: string;
  customer: string;
  amount: number;
  paymentMethod: string;
  transactionType: 'debt_created' | 'debt_payment';
  timestamp: string;
  reference?: string;
}

const DebtTransactionsTable: React.FC<DebtTransactionsTableProps> = ({
  sales,
  loading = false
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrameType>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { debtPayments, loading: paymentsLoading } = useSupabaseDebtPayments();

  // Combine debt transactions from sales and payments
  const allDebtTransactions = useMemo(() => {
    const transactions: DebtTransaction[] = [];

    // Add debt from sales (when payment method includes debt)
    sales.forEach(sale => {
      const hasDebt = sale.paymentMethod === 'debt' || 
                     (sale.paymentMethod === 'partial' && sale.paymentDetails?.debtAmount > 0);
      
      if (hasDebt) {
        const debtAmount = sale.paymentMethod === 'debt' 
          ? sale.total || (sale.sellingPrice * sale.quantity)
          : (sale.paymentDetails?.debtAmount || 0);
        
        if (debtAmount > 0) {
          transactions.push({
            id: `sale-${sale.id}`,
            customer: sale.customerName || 'Unknown Customer',
            amount: debtAmount,
            paymentMethod: sale.paymentMethod,
            transactionType: 'debt_created',
            timestamp: sale.timestamp
          });
        }
      }
    });

    // Add debt payments
    debtPayments.forEach(payment => {
      transactions.push({
        id: `payment-${payment.id}`,
        customer: payment.customer_name,
        amount: payment.amount,
        paymentMethod: payment.payment_method,
        transactionType: 'debt_payment',
        timestamp: payment.timestamp,
        reference: payment.reference
      });
    });

    return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sales, debtPayments]);

  // Filter transactions based on timeframe
  const filteredTransactionsByTime = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    
    switch (timeFrame) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      default:
        startDate = today;
    }
    
    return allDebtTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp);
      return transactionDate >= startDate;
    });
  }, [allDebtTransactions, timeFrame]);

  // Filter by search term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return filteredTransactionsByTime;
    
    return filteredTransactionsByTime.filter(transaction =>
      transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [filteredTransactionsByTime, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [timeFrame, searchTerm]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalDebtCreated = filteredTransactions
      .filter(t => t.transactionType === 'debt_created')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalDebtPayments = filteredTransactions
      .filter(t => t.transactionType === 'debt_payment')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalDebtCreated,
      totalDebtPayments,
      netDebtChange: totalDebtCreated - totalDebtPayments,
      totalTransactions: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Customer', 'Amount', 'Payment Method', 'Transaction Type', 'Reference'];
    const csvData = filteredTransactions.map(transaction => [
      new Date(transaction.timestamp).toLocaleDateString(),
      transaction.customer,
      transaction.amount,
      transaction.paymentMethod,
      transaction.transactionType === 'debt_created' ? 'Debt Created' : 'Debt Payment',
      transaction.reference || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `debt-transactions-${timeFrame}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTransactionTypeIcon = (type: string) => {
    return type === 'debt_created' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTransactionTypeBadge = (type: string) => {
    const isDebtCreated = type === 'debt_created';
    return (
      <Badge variant={isDebtCreated ? "destructive" : "secondary"} className="flex items-center gap-1">
        {getTransactionTypeIcon(type)}
        {isDebtCreated ? 'Debt Created' : 'Debt Payment'}
      </Badge>
    );
  };

  const isLoading = loading || paymentsLoading;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Debt Transactions</CardTitle>
          <Button 
            onClick={exportToCSV} 
            variant="outline" 
            size="sm"
            disabled={isLoading || filteredTransactions.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        
        {/* Time Frame Selector */}
        <div className="flex flex-wrap gap-2">
          {(['today', 'week', 'month'] as TimeFrameType[]).map((period) => (
            <Button
              key={period}
              variant={timeFrame === period ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFrame(period)}
              className="capitalize"
            >
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'Today'}
            </Button>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-lg font-semibold">{summaryStats.totalTransactions}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Debt Created</p>
            <p className="text-lg font-semibold text-destructive">{formatCurrency(summaryStats.totalDebtCreated)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Debt Payments</p>
            <p className="text-lg font-semibold text-secondary">{formatCurrency(summaryStats.totalDebtPayments)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Net Change</p>
            <p className={`text-lg font-semibold ${summaryStats.netDebtChange >= 0 ? 'text-destructive' : 'text-secondary'}`}>
              {formatCurrency(summaryStats.netDebtChange)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by customer, payment method, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Transaction Type</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.customer}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {transaction.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getTransactionTypeBadge(transaction.transactionType)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {transaction.reference || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No debt transactions found for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DebtTransactionsTable;