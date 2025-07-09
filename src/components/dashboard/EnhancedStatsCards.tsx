
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
import { Sale, Product, Customer } from '../../types';

interface EnhancedStatsCardsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
}

const EnhancedStatsCards: React.FC<EnhancedStatsCardsProps> = ({ sales, products, customers }) => {
  const navigate = useNavigate();

  // Calculate stats from the data
  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
  
  const totalSalesToday = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalOrdersToday = todaySales.length;
  const activeCustomers = customers.length;
  const lowStockProducts = products.filter(p => p.currentStock <= (p.lowStockThreshold || 10)).length;

  const cards = [
    {
      title: 'Total Sales Today',
      value: formatCurrency(totalSalesToday),
      icon: DollarSign,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      textColor: 'text-green-50',
      route: '/sales'
    },
    {
      title: 'Orders Today',
      value: totalOrdersToday.toString(),
      icon: ShoppingCart,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      textColor: 'text-blue-50',
      route: '/sales'
    },
    {
      title: 'Active Customers',
      value: activeCustomers.toString(),
      icon: Users,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      textColor: 'text-purple-50',
      route: '/customers'
    },
    {
      title: 'Low Stock Products',
      value: lowStockProducts.toString(),
      icon: lowStockProducts > 0 ? AlertTriangle : Package,
      color: lowStockProducts > 0 
        ? 'bg-gradient-to-br from-orange-500 to-red-500' 
        : 'bg-gradient-to-br from-gray-500 to-gray-600',
      textColor: lowStockProducts > 0 ? 'text-orange-50' : 'text-gray-50',
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
