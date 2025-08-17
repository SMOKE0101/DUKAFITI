
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Sale, Product, Customer } from '../../types';
import { useUnifiedMetrics } from '../../hooks/useUnifiedMetrics';

interface ReportsSummaryCardsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  dateRange: { from: string; to: string };
}

const ReportsSummaryCards: React.FC<ReportsSummaryCardsProps> = ({
  sales,
  products,
  customers,
  dateRange
}) => {
  // Use unified metrics for consistent data processing
  const unifiedMetrics = useUnifiedMetrics(sales, products, customers, dateRange);
  
  // Extract period metrics for the reports view
  const metrics = {
    totalRevenue: unifiedMetrics.periodSales.totalRevenue,
    totalOrders: unifiedMetrics.periodSales.orderCount,
    activeCustomers: unifiedMetrics.customers.active,
    lowStockProducts: unifiedMetrics.products.lowStock,
    totalDiscounts: unifiedMetrics.periodSales.totalDiscounts,
  };

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders.toString(),
      icon: ShoppingCart,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Active Customers',
      value: metrics.activeCustomers.toString(),
      icon: Users,
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Low Stock Products',
      value: metrics.lowStockProducts.toString(),
      icon: Package,
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400'
    }
  ];

  // Add Discounts Given card
  cards.push({
    title: 'Discounts Given',
    value: formatCurrency(metrics.totalDiscounts),
    icon: DollarSign,
    bgColor: 'bg-amber-100 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400'
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold animate-pulse">{card.value}</p>
                </div>
                <div className={`p-3 ${card.bgColor} rounded-xl`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ReportsSummaryCards;
