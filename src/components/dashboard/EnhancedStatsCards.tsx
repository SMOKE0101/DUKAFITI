
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react';
import { Sale, Product, Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface EnhancedStatsCardsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
}

const EnhancedStatsCards: React.FC<EnhancedStatsCardsProps> = ({ sales, products, customers }) => {
  // Calculate metrics
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const lowStockProducts = products.filter(p => p.current_stock <= (p.low_stock_threshold || 10));
  
  // Calculate today's sales
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(sale => sale.timestamp?.startsWith(today));
  const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  
  // Calculate yesterday's sales for comparison
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdaySales = sales.filter(sale => sale.timestamp?.startsWith(yesterdayStr));
  const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
  const isRevenueUp = revenueChange > 0;

  const statsCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(todayRevenue),
      icon: DollarSign,
      change: revenueChange,
      isPositive: isRevenueUp,
      subtitle: `${todaySales.length} sales today`
    },
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      subtitle: `From ${sales.length} total sales`
    },
    {
      title: "Total Profit",
      value: formatCurrency(totalProfit),
      icon: TrendingUp,
      subtitle: `${((totalProfit / Math.max(totalRevenue, 1)) * 100).toFixed(1)}% margin`
    },
    {
      title: "Products",
      value: totalProducts.toString(),
      icon: Package,
      subtitle: lowStockProducts.length > 0 ? `${lowStockProducts.length} low stock` : "All well stocked",
      hasAlert: lowStockProducts.length > 0
    },
    {
      title: "Customers",
      value: totalCustomers.toString(),
      icon: Users,
      subtitle: `${customers.filter(c => c.outstanding_debt > 0).length} with debt`
    },
    {
      title: "Orders",
      value: sales.length.toString(),
      icon: ShoppingCart,
      subtitle: `${sales.filter(s => s.timestamp?.startsWith(today)).length} today`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="relative">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              {stat.hasAlert && (
                <AlertTriangle className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change !== undefined && (
                <Badge 
                  variant={stat.isPositive ? "default" : "destructive"}
                  className="text-xs"
                >
                  {stat.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(stat.change).toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EnhancedStatsCards;
