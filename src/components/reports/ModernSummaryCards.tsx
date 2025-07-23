
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  CreditCard, 
  TrendingUp, 
  Warehouse 
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { Sale, Product, Customer } from '@/types';

interface ModernSummaryCardsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  dateRange: { from: string; to: string };
}

const ModernSummaryCards: React.FC<ModernSummaryCardsProps> = ({
  sales,
  products,
  customers,
  dateRange
}) => {
  // Filter sales based on date range
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
    return saleDate >= dateRange.from && saleDate <= dateRange.to;
  });

  // Calculate metrics
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalOrders = filteredSales.length;
  const activeCustomers = new Set(filteredSales.map(sale => sale.customerId).filter(Boolean)).size;
  const lowStockProducts = products.filter(product => 
    product.currentStock !== -1 && product.currentStock <= (product.lowStockThreshold || 10)
  ).length;

  // Calculate additional metrics
  const totalOutstandingDebts = customers.reduce((sum, customer) => sum + (customer.outstandingDebt || 0), 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
  const totalInventoryValue = products.reduce((sum, product) => {
    if (product.currentStock === -1) return sum;
    return sum + (product.sellingPrice * product.currentStock);
  }, 0);

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const cards = [
    {
      title: 'TOTAL SALES TODAY',
      value: formatCurrency(totalRevenue),
      subtitle: `Avg: ${formatCurrency(averageOrderValue)}`,
      icon: DollarSign,
      bgColor: 'bg-green-50 dark:bg-green-900/10',
      borderColor: 'border-green-500',
      iconBg: 'bg-green-500',
      iconColor: 'text-white'
    },
    {
      title: 'ORDERS TODAY',
      value: totalOrders.toString(),
      subtitle: `Profit: ${formatCurrency(totalProfit)}`,
      icon: ShoppingCart,
      bgColor: 'bg-blue-50 dark:bg-blue-900/10',
      borderColor: 'border-blue-500',
      iconBg: 'bg-blue-500',
      iconColor: 'text-white'
    },
    {
      title: 'ACTIVE CUSTOMERS',
      value: activeCustomers.toString(),
      subtitle: `Total: ${customers.length}`,
      icon: Users,
      bgColor: 'bg-purple-50 dark:bg-purple-900/10',
      borderColor: 'border-purple-500',
      iconBg: 'bg-purple-500',
      iconColor: 'text-white'
    },
    {
      title: 'LOW STOCK PRODUCTS',
      value: lowStockProducts.toString(),
      subtitle: lowStockProducts === 0 ? 'All stocked well' : 'Need attention',
      icon: Package,
      bgColor: 'bg-orange-50 dark:bg-orange-900/10',
      borderColor: 'border-orange-500',
      iconBg: 'bg-orange-500',
      iconColor: 'text-white'
    },
    {
      title: 'OUTSTANDING DEBTS',
      value: formatCurrency(totalOutstandingDebts),
      subtitle: `${customers.filter(c => c.outstandingDebt > 0).length} customers`,
      icon: CreditCard,
      bgColor: 'bg-red-50 dark:bg-red-900/10',
      borderColor: 'border-red-500',
      iconBg: 'bg-red-500',
      iconColor: 'text-white'
    },
    {
      title: 'TOTAL PROFIT',
      value: formatCurrency(totalProfit),
      subtitle: totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin` : '0% margin',
      icon: TrendingUp,
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
      borderColor: 'border-emerald-500',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white'
    },
    {
      title: 'INVENTORY VALUE',
      value: formatCurrency(totalInventoryValue),
      subtitle: `${products.length} products`,
      icon: Warehouse,
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/10',
      borderColor: 'border-indigo-500',
      iconBg: 'bg-indigo-500',
      iconColor: 'text-white'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-7 gap-4 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index}
            className={`
              ${card.bgColor} ${card.borderColor} 
              border-2 rounded-2xl p-4 hover:shadow-lg transition-all duration-300
              hover:-translate-y-1 cursor-pointer
            `}
          >
            <CardContent className="p-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-mono text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {card.subtitle}
                  </p>
                </div>
                <div className={`
                  w-10 h-10 ${card.iconBg} rounded-full 
                  flex items-center justify-center flex-shrink-0
                `}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ModernSummaryCards;
