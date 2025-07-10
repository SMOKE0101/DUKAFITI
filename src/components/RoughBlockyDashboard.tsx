
import React, { useState } from 'react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  AlertTriangle,
  Plus,
  UserPlus
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useNavigate } from 'react-router-dom';

const RoughBlockyDashboard = () => {
  const navigate = useNavigate();
  const { customers } = useSupabaseCustomers();
  const { products } = useSupabaseProducts();
  const { sales } = useSupabaseSales();
  const [flippedCard, setFlippedCard] = useState<string | null>(null);

  // Calculate stats
  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
  
  const totalSalesToday = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalOrdersToday = todaySales.length;
  const activeCustomers = customers.length;
  const lowStockProducts = products.filter(p => p.currentStock !== -1 && p.currentStock <= (p.lowStockThreshold || 10));
  const overdueCustomers = customers.filter(c => c.outstandingDebt > 0);

  const handleCardFlip = (cardId: string) => {
    setFlippedCard(flippedCard === cardId ? null : cardId);
  };

  const summaryCards = [
    {
      id: 'sales',
      title: 'TOTAL SALES TODAY',
      value: formatCurrency(totalSalesToday),
      icon: DollarSign,
      bgGradient: 'from-green-500 to-emerald-600',
      route: '/sales',
      details: `${todaySales.length} transactions recorded today`
    },
    {
      id: 'orders',
      title: 'ORDERS TODAY',
      value: totalOrdersToday.toString(),
      icon: ShoppingCart,
      bgGradient: 'from-blue-500 to-blue-600',
      route: '/sales',
      details: `Average: ${totalOrdersToday ? (totalSalesToday / totalOrdersToday).toFixed(2) : '0'} per order`
    },
    {
      id: 'customers',
      title: 'ACTIVE CUSTOMERS',
      value: activeCustomers.toString(),
      icon: Users,
      bgGradient: 'from-purple-500 to-purple-600',
      route: '/customers',
      details: `${overdueCustomers.length} with outstanding debt`
    },
    {
      id: 'stock',
      title: 'LOW STOCK ALERTS',
      value: lowStockProducts.length.toString(),
      icon: lowStockProducts.length > 0 ? AlertTriangle : Package,
      bgGradient: lowStockProducts.length > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-emerald-600',
      route: '/inventory',
      details: lowStockProducts.length > 0 ? 'Immediate attention required' : 'All items well stocked'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-mono">
      {/* Header with Blocky Typography */}
      <header className="h-16 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-6 h-full">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase" 
              style={{ fontFamily: 'Space Mono, monospace', letterSpacing: '-1px' }}>
            DASHBOARD
          </h1>
          <div className="flex items-center gap-4">
            <input 
              type="search" 
              placeholder="Quick search..." 
              className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Summary Cards - 2x2 Grid with Smooth Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            const isFlipped = flippedCard === card.id;
            
            return (
              <Card 
                key={card.id}
                className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border-0"
                style={{ 
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 200ms ease-out, box-shadow 300ms ease-out'
                }}
                onClick={() => handleCardFlip(card.id)}
              >
                <CardContent className="p-6" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-black tracking-widest text-gray-600 dark:text-gray-400 mb-3 uppercase"
                         style={{ fontFamily: 'Space Mono, monospace', letterSpacing: '-0.5px' }}>
                        {card.title}
                      </p>
                      <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-2">
                        {card.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${card.bgGradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
                
                {/* Flipped Content */}
                <div 
                  className="absolute inset-0 p-6 flex items-center justify-center text-center bg-white dark:bg-gray-900"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div>
                    <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-4">
                      {card.details}
                    </p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(card.route);
                      }}
                      className={`bg-gradient-to-r ${card.bgGradient} hover:opacity-90 text-white font-semibold px-6 py-2 rounded-full shadow-lg transition-all duration-200`}
                    >
                      VIEW MORE
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Alerts & Quick Actions Panel - Smooth Containers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alerts */}
          <Card className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-0">
            <div className="p-6">
              <h3 className="font-black text-lg tracking-wide text-gray-900 dark:text-white mb-4 uppercase"
                  style={{ fontFamily: 'Space Mono, monospace', letterSpacing: '-0.5px' }}>
                LOW STOCK ALERTS
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {product.name}
                      </span>
                      <Badge className="bg-red-500 text-white font-semibold rounded-full px-2 py-1">
                        {product.currentStock}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center py-8">
                    All items well stocked! 📦
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Overdue Payments */}
          <Card className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-0">
            <div className="p-6">
              <h3 className="font-black text-lg tracking-wide text-gray-900 dark:text-white mb-4 uppercase"
                  style={{ fontFamily: 'Space Mono, monospace', letterSpacing: '-0.5px' }}>
                OVERDUE PAYMENTS
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {overdueCustomers.length > 0 ? (
                  overdueCustomers.slice(0, 5).map((customer) => (
                    <div key={customer.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {customer.name}
                      </span>
                      <span className="font-semibold text-sm text-red-600 dark:text-red-400">
                        {formatCurrency(customer.outstandingDebt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center py-8">
                    All payments up to date! 🎉
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-0">
            <div className="p-6">
              <h3 className="font-black text-lg tracking-wide text-gray-900 dark:text-white mb-4 uppercase"
                  style={{ fontFamily: 'Space Mono, monospace', letterSpacing: '-0.5px' }}>
                QUICK ACTIONS
              </h3>
              <div className="space-y-3">
                <div 
                  className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                  onClick={() => navigate('/sales')}
                >
                  <ShoppingCart className="w-5 h-5 mr-3 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    Add Sale
                  </span>
                </div>
                
                <div 
                  className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                  onClick={() => navigate('/inventory')}
                >
                  <Plus className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    Add Product
                  </span>
                </div>
                
                <div 
                  className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                  onClick={() => navigate('/customers')}
                >
                  <UserPlus className="w-5 h-5 mr-3 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    Add Customer
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoughBlockyDashboard;
