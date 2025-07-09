
import { formatCurrency } from '../../utils/currency';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Package, CreditCard, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalDebt: number;
    customersWithDebt: number;
    productCount: number;
    todayTransactions: number;
    todaySales: number;
    todayRevenue: number;
    todayProfit: number;
    lowStockItems: number;
  };
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
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
  );
};

export default DashboardStats;
