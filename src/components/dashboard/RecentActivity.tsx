
import { formatCurrency } from '../../utils/currency';
import { Card, CardContent } from '@/components/ui/card';
import { Sale, Transaction, Customer, Product } from '../../types';

interface RecentActivityProps {
  recentSales: Sale[];
  recentTransactions: Transaction[];
  customers: Customer[];
  products: Product[];
}

const RecentActivity = ({ recentSales, recentTransactions, customers, products }: RecentActivityProps) => {
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Sales */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
          {recentSales.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales recorded yet</p>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-green-50 border-l-4 border-green-500"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sale.productName}</span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        Sale
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Qty: {sale.quantity} × {formatCurrency(sale.sellingPrice)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.timestamp).toLocaleDateString('en-KE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">
                      {formatCurrency(sale.sellingPrice * sale.quantity)}
                    </p>
                    <p className="text-sm text-green-600">
                      +{formatCurrency(sale.profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Debt Transactions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Debt Transactions</h3>
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No debt transactions yet</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
                    transaction.paid
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getCustomerName(transaction.customerId)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        transaction.paid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.paid ? 'Paid' : 'Outstanding'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Item: {getProductName(transaction.itemId)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Qty: {transaction.quantity} × {formatCurrency(transaction.unitPrice)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('en-KE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">
                      {formatCurrency(transaction.totalAmount)}
                    </p>
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

export default RecentActivity;
