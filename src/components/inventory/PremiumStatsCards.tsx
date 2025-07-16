
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface PremiumStatsCardsProps {
  products: Product[];
}

const PremiumStatsCards: React.FC<PremiumStatsCardsProps> = ({ products }) => {
  // Calculate metrics
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => {
    return sum + (product.selling_price * product.current_stock);
  }, 0);

  const lowStockCount = products.filter(product => 
    product.current_stock > 0 && product.current_stock <= (product.low_stock_threshold || 10)
  ).length;

  const outOfStockCount = products.filter(product => product.current_stock === 0).length;

  const stats = [
    {
      title: 'Total Products',
      value: totalProducts.toString(),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(totalValue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Low Stock',
      value: lowStockCount.toString(),
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Out of Stock',
      value: outOfStockCount.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={`${stat.borderColor} ${stat.bgColor} border-2`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              {stat.title === 'Low Stock' && lowStockCount > 0 && (
                <Badge variant="outline" className="mt-2 text-orange-700 border-orange-300">
                  Needs Attention
                </Badge>
              )}
              {stat.title === 'Out of Stock' && outOfStockCount > 0 && (
                <Badge variant="destructive" className="mt-2">
                  Urgent
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PremiumStatsCards;
