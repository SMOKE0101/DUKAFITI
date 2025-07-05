import { useState, useEffect } from 'react';
import { Users, Package, CreditCard, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '../utils/currency';
import { Customer, Transaction, Sale, Product } from '../types';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseTransactions } from '../hooks/useSupabaseTransactions';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDebt: 0,
    customersWithDebt: 0,
    productCount: 0,
    todayTransactions: 0,
    todaySales: 0,
    todayRevenue: 0,
    todayProfit: 0,
    lowStockItems: 0,
  });

  // Use Supabase hooks
  const { customers } = useSupabaseCustomers();
  const { products } = useSupabaseProducts();
  const { sales } = useSupabaseSales();
  const { transactions } = useSupabaseTransactions();

  useEffect(() => {
    calculateStats();
  }, [customers, products, sales, transactions]);

  const calculateStats = () => {
    // Calculate total outstanding debt
    const totalDebt = transactions
      .filter(t => !t.paid)
      .reduce((sum, t) => sum + t.totalAmount, 0);

    // Count customers with outstanding debt
    const customersWithDebt = new Set(
      transactions.filter(t => !t.paid).map(t => t.customerId)
    ).size;

    // Today's data
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(
      t => new Date(t.date).toDateString() === today
    ).length;

    const todaySalesData = sales.filter(
      s => new Date(s.timestamp).toDateString() === today
    );

    const todaySales = todaySalesData.length;
    const todayRevenue = todaySalesData.reduce((sum, s) => sum + (s.sellingPrice * s.quantity), 0);
    const todayProfit = todaySalesData.reduce((sum, s) => sum + s.profit, 0);

    // Low stock items
    const lowStockItems = products.filter(p => p.currentStock <= p.lowStockThreshold).length;

    setStats({
      totalDebt,
      customersWithDebt,
      productCount: products.length,
      todayTransactions,
      todaySales,
      todayRevenue,
      todayProfit,
      lowStockItems,
    });
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  // Recent transactions (last 5)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Recent sales (last 5)
  const recentSales = sales
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Today's Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Today's Profit</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.todayProfit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Outstanding Debt</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalDebt)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Today's Sales</p>
                <p className="text-3xl font-bold">{stats.todaySales}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Customers with Debt</p>
                <p className="text-3xl font-bold">{stats.customersWithDebt}</p>
              </div>
              <Users className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">Product Items</p>
                <p className="text-3xl font-bold">{stats.productCount}</p>
              </div>
              <Package className="h-8 w-8 text-teal-200" />
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
};

export default Dashboard;
