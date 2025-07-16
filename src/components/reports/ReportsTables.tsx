
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { Sale } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface ReportsTablesProps {
  sales: Sale[];
  dateRange: { from: string; to: string };
}

const ReportsTables: React.FC<ReportsTablesProps> = ({ sales, dateRange }) => {
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
      return saleDate >= dateRange.from && saleDate <= dateRange.to;
    });
  }, [sales, dateRange]);

  const recentSales = useMemo(() => {
    return filteredSales
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(sale => ({
        id: sale.id,
        product: sale.product_name,
        customer: sale.customer_name || 'Walk-in Customer',
        amount: sale.total_amount,
        payment: sale.payment_method,
        date: new Date(sale.timestamp).toLocaleDateString()
      }));
  }, [filteredSales]);

  const paymentSummary = useMemo(() => {
    const summary = filteredSales.reduce((acc, sale) => {
      const method = sale.payment_method;
      acc[method] = (acc[method] || 0) + sale.total_amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(summary).map(([method, amount]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      amount,
      count: filteredSales.filter(sale => sale.payment_method === method).length
    }));
  }, [filteredSales]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Sales Table */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Sales</CardTitle>
          <Download className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Customer</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Payment</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, index) => (
                  <tr key={sale.id} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : ''}>
                    <td className="py-3 text-sm text-gray-900 dark:text-white">{sale.product}</td>
                    <td className="py-3 text-sm text-gray-900 dark:text-white">{sale.customer}</td>
                    <td className="py-3 text-sm font-medium text-green-600">
                      {formatCurrency(sale.amount)}
                    </td>
                    <td className="py-3">
                      <Badge variant={sale.payment === 'cash' ? 'default' : 'secondary'}>
                        {sale.payment}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-500">{sale.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary Table */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Payment Summary</CardTitle>
          <Download className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentSummary.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{payment.method}</p>
                  <p className="text-sm text-gray-500">{payment.count} transactions</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {((payment.amount / filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTables;
