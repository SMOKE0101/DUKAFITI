
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { useSupabaseDebtPayments } from '../../hooks/useSupabaseDebtPayments';
import { formatCurrency } from '../../utils/currency';
import { DollarSign, CreditCard, TrendingDown, TrendingUp } from 'lucide-react';

const DebtTransactionsTable = () => {
  const { sales, loading: salesLoading } = useSupabaseSales();
  const { debtPayments, loading: paymentsLoading } = useSupabaseDebtPayments();

  // Filter debt transactions from sales (where payment_method is 'debt' or product_name contains 'Cash Lending')
  const debtTransactions = useMemo(() => {
    return sales.filter(sale => 
      sale.paymentMethod === 'debt' || 
      sale.productName?.includes('Cash Lending') ||
      sale.productName?.includes('Debt Transaction')
    ).map(sale => ({
      id: sale.id,
      type: 'debt_transaction' as const,
      customer_name: sale.customerName || 'Unknown Customer',
      amount: sale.totalAmount || 0,
      timestamp: sale.timestamp,
      payment_method: 'debt',
      reference: sale.paymentDetails?.notes || '',
      description: 'Cash lending to customer'
    }));
  }, [sales]);

  // Convert debt payments to consistent format
  const payments = useMemo(() => {
    return debtPayments.map(payment => ({
      id: payment.id,
      type: 'debt_payment' as const,
      customer_name: payment.customer_name,
      amount: payment.amount,
      timestamp: payment.timestamp,
      payment_method: payment.payment_method,
      reference: payment.reference || '',
      description: 'Payment received from customer'
    }));
  }, [debtPayments]);

  // Combine and sort all transactions
  const allTransactions = useMemo(() => {
    return [...debtTransactions, ...payments]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [debtTransactions, payments]);

  const loading = salesLoading || paymentsLoading;

  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              Debt Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-green-500" />
              Debt Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Debt Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            Debt Transactions
            <Badge variant="secondary" className="ml-2">
              {debtTransactions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debtTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No debt transactions found</p>
              <p className="text-sm">Cash lending transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {debtTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{transaction.customer_name}</h4>
                      <Badge variant="destructive" className="text-xs">Debt</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{transaction.description}</p>
                    {transaction.reference && (
                      <p className="text-xs text-gray-500 mt-1">Note: {transaction.reference}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.timestamp).toLocaleDateString()} at{' '}
                      {new Date(transaction.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">+{formatCurrency(transaction.amount)}</p>
                    <p className="text-xs text-gray-500">Debt Added</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debt Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-green-500" />
            Debt Payments
            <Badge variant="secondary" className="ml-2">
              {payments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No debt payments found</p>
              <p className="text-sm">Customer debt payments will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{payment.customer_name}</h4>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {payment.payment_method}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{payment.description}</p>
                    {payment.reference && (
                      <p className="text-xs text-gray-500 mt-1">Ref: {payment.reference}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(payment.timestamp).toLocaleDateString()} at{' '}
                      {new Date(payment.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">-{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-500">Debt Paid</p>
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

export default DebtTransactionsTable;
