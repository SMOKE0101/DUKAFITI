
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface EnhancedStatsCardsProps {
  stats: {
    totalSalesToday: number;
    totalOrdersToday: number;
    activeCustomers: number;
    lowStockProducts: number;
    salesGrowth?: number;
    ordersGrowth?: number;
    customersGrowth?: number;
    stockGrowth?: number;
  };
}

const EnhancedStatsCards: React.FC<EnhancedStatsCardsProps> = ({ stats }) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Total Sales Today',
      value: formatCurrency(stats.totalSalesToday),
      icon: DollarSign,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      textColor: 'text-green-50',
      growth: stats.salesGrowth,
      route: '/sales'
    },
    {
      title: 'Orders Today',
      value: stats.totalOrdersToday.toString(),
      icon: ShoppingCart,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      textColor: 'text-blue-50',
      growth: stats.ordersGrowth,
      route: '/sales'
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers.toString(),
      icon: Users,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      textColor: 'text-purple-50',
      growth: stats.customersGrowth,
      route: '/customers'
    },
    {
      title: 'Low Stock Products',
      value: stats.lowStockProducts.toString(),
      icon: stats.lowStockProducts > 0 ? AlertTriangle : Package,
      color: stats.lowStockProducts > 0 
        ? 'bg-gradient-to-br from-orange-500 to-red-500' 
        : 'bg-gradient-to-br from-gray-500 to-gray-600',
      textColor: stats.lowStockProducts > 0 ? 'text-orange-50' : 'text-gray-50',
      growth: stats.stockGrowth,
      route: '/inventory'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index}
            className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
            onClick={() => navigate(card.route)}
          >
            <div className={`absolute inset-0 ${card.color}`} />
            <CardContent className="relative p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${card.textColor} opacity-90`}>
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {card.value}
                  </p>
                  {card.growth !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className={`w-3 h-3 ${card.growth >= 0 ? 'text-green-200' : 'text-red-200'}`} />
                      <span className={`text-xs font-medium ${card.growth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                        {card.growth >= 0 ? '+' : ''}{card.growth}% from yesterday
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EnhancedStatsCards;
