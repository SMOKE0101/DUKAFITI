
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../../utils/currency';
import { Sale } from '../../types';
import { format } from 'date-fns';

interface SalesTableProps {
  sales: Sale[];
  isLoading: boolean;
}

const SalesTable: React.FC<SalesTableProps> = ({ sales, isLoading }) => {
  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'mpesa':
        return 'bg-blue-100 text-blue-800';
      case 'debt':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (synced: boolean) => {
    return synced 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'M/d/yyyy');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentSales = sales.slice(0, 20);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        {recentSales.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No sales recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-gray-600">Date</th>
                  <th className="pb-3 font-medium text-gray-600">Product</th>
                  <th className="pb-3 font-medium text-gray-600">Customer</th>
                  <th className="pb-3 font-medium text-gray-600">Qty</th>
                  <th className="pb-3 font-medium text-gray-600">Amount</th>
                  <th className="pb-3 font-medium text-gray-600">Profit</th>
                  <th className="pb-3 font-medium text-gray-600">Payment</th>
                  <th className="pb-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100">
                    <td className="py-3">
                      {sale.timestamp ? formatDate(sale.timestamp) : 'N/A'}
                    </td>
                    <td className="py-3 font-medium">{sale.productName}</td>
                    <td className="py-3">{sale.customerName || 'Walk-in'}</td>
                    <td className="py-3">{sale.quantity}</td>
                    <td className="py-3 font-medium">{formatCurrency(sale.total || 0)}</td>
                    <td className="py-3 font-medium text-green-600">
                      {formatCurrency(sale.profit || 0)}
                    </td>
                    <td className="py-3">
                      <Badge className={getPaymentMethodColor(sale.paymentMethod)}>
                        {sale.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge className={getStatusColor(sale.synced)}>
                        {sale.synced ? 'Synced' : 'Pending'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesTable;
