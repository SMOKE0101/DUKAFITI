
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface StatsCardsProps {
  todayStats: {
    totalRevenue: number;
    totalProfit: number;
    transactionCount: number;
  };
}

const StatsCards = ({ todayStats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Today's Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(todayStats.totalRevenue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Today's Profit</p>
              <p className="text-2xl font-bold">{formatCurrency(todayStats.totalProfit)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Transactions</p>
              <p className="text-2xl font-bold">{todayStats.transactionCount}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
