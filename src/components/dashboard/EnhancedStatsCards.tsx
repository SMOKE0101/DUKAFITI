
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Sale, Product, Customer } from '../../types';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';

interface EnhancedStatsCardsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
}

const EnhancedStatsCards: React.FC<EnhancedStatsCardsProps> = ({ sales, products, customers }) => {
  const navigate = useNavigate();

  // Use centralized, deduped, and accurate metrics
  const metrics = useDashboardMetrics(sales, products, customers);
  const totalSalesToday = metrics.todaySales.totalRevenue;
  const totalOrdersToday = metrics.todaySales.orderCount;
  const activeCustomers = metrics.customers.active;
  const lowStockProducts = metrics.products.lowStock;

  const cards = [
    {
      title: 'Total Sales Today',
      value: formatCurrency(totalSalesToday),
      icon: DollarSign,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      textColor: 'text-purple-50',
      route: '/sales',
      hoverColor: 'hover:shadow-purple-200 dark:hover:shadow-purple-800/20'
    },
    {
      title: 'Orders Today',
      value: totalOrdersToday.toString(),
      icon: ShoppingCart,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      textColor: 'text-blue-50',
      route: '/sales',
      hoverColor: 'hover:shadow-blue-200 dark:hover:shadow-blue-800/20'
    },
    {
      title: 'Active Customers',
      value: activeCustomers.toString(),
      icon: Users,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      textColor: 'text-green-50',
      route: '/customers',
      hoverColor: 'hover:shadow-green-200 dark:hover:shadow-green-800/20'
    },
    {
      title: 'Low Stock Products',
      value: lowStockProducts.toString(),
      icon: lowStockProducts > 0 ? AlertTriangle : Package,
      color: lowStockProducts > 0 
        ? 'bg-gradient-to-br from-orange-500 to-red-500' 
        : 'bg-gradient-to-br from-gray-500 to-gray-600',
      textColor: lowStockProducts > 0 ? 'text-orange-50' : 'text-gray-50',
      route: '/inventory',
      hoverColor: lowStockProducts > 0 
        ? 'hover:shadow-orange-200 dark:hover:shadow-orange-800/20' 
        : 'hover:shadow-gray-200 dark:hover:shadow-gray-800/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index}
            className={`relative overflow-hidden border-0 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl ${card.hoverColor} transition-all duration-300 cursor-pointer group hover:-translate-y-1`}
            onClick={() => navigate(card.route)}
          >
            <CardContent className="p-0">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 ${card.color} rounded-full group-hover:scale-110 transition-transform backdrop-blur-sm bg-opacity-90`}>
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
