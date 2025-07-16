
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ShoppingCart, User, Package } from 'lucide-react';
import { Sale, Transaction, Customer, Product } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface RecentActivityProps {
  sales: Sale[];
  transactions: Transaction[];
  customers: Customer[];
  products: Product[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ 
  sales, 
  transactions,
  customers,
  products 
}) => {
  // Combine and sort recent activities
  const recentActivities = React.useMemo(() => {
    const activities = [];

    // Add recent sales
    sales.slice(0, 5).forEach(sale => {
      activities.push({
        id: sale.id,
        type: 'sale',
        timestamp: sale.timestamp,
        description: `Sale of ${sale.quantity}x ${sale.product_name}`,
        amount: sale.total_amount,
        customer: sale.customer_name || 'Walk-in Customer',
        icon: ShoppingCart,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        badge: formatCurrency(sale.selling_price)
      });
    });

    // Add recent transactions
    transactions.slice(0, 3).forEach(transaction => {
      const customer = customers.find(c => c.id === transaction.customer_id);
      const product = products.find(p => p.id === transaction.item_id);
      
      activities.push({
        id: transaction.id,
        type: 'transaction',
        timestamp: transaction.date,
        description: transaction.paid 
          ? `Payment received from ${customer?.name || 'Unknown Customer'}`
          : `Credit transaction with ${customer?.name || 'Unknown Customer'}`,
        amount: transaction.total_amount,
        customer: customer?.name || 'Unknown Customer',
        icon: User,
        color: transaction.paid ? 'text-blue-600' : 'text-orange-600',
        bgColor: transaction.paid ? 'bg-blue-50' : 'bg-orange-50',
        badge: formatCurrency(transaction.unit_price)
      });
    });

    // Sort by timestamp (most recent first)
    return activities
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, 8);
  }, [sales, transactions, customers, products]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${activity.bgColor}`}>
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {activity.customer}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.badge}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {activity.timestamp 
                          ? new Date(activity.timestamp).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className={`text-sm font-semibold ${activity.color}`}>
                      {formatCurrency(activity.amount)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
