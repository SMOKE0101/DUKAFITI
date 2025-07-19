
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Sale } from '../../types';

interface SalesStatsCardsProps {
  sales: Sale[];
  isLoading: boolean;
}

const SalesStatsCards: React.FC<SalesStatsCardsProps> = ({ sales, isLoading }) => {
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(sale => 
    sale.timestamp?.startsWith(today)
  );

  const todaysTransactions = todaySales.length;
  const todaysRevenue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const todaysProfit = todaySales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Today's Sales
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todaysTransactions}</div>
          <p className="text-xs text-gray-500">transactions recorded</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Today's Revenue
          </CardTitle>
          <DollarSign className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(todaysRevenue)}</div>
          <p className="text-xs text-gray-500">total sales amount</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Today's Profit
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(todaysProfit)}</div>
          <p className="text-xs text-gray-500">total profit earned</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesStatsCards;
