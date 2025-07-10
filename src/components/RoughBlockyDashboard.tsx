
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
  UserPlus,
  Sync
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
      color: 'border-brand-purple',
      bgColor: 'bg-brand-purple/5',
      route: '/sales',
      details: `${todaySales.length} transactions recorded today`
    },
    {
      id: 'orders',
      title: 'ORDERS TODAY',
      value: totalOrdersToday.toString(),
      icon: ShoppingCart,
      color: 'border-brand-green',
      bgColor: 'bg-brand-green/5',
      route: '/sales',
      details: `Average: ${totalOrdersToday ? (totalSalesToday / totalOrdersToday).toFixed(2) : '0'} per order`
    },
    {
      id: 'customers',
      title: 'ACTIVE CUSTOMERS',
      value: activeCustomers.toString(),
      icon: Users,
      color: 'border-brand-purple',
      bgColor: 'bg-brand-purple/5',
      route: '/customers',
      details: `${overdueCustomers.length} with outstanding debt`
    },
    {
      id: 'stock',
      title: 'LOW STOCK ALERTS',
      value: lowStockProducts.length.toString(),
      icon: lowStockProducts.length > 0 ? AlertTriangle : Package,
      color: lowStockProducts.length > 0 ? 'border-red-500' : 'border-brand-green',
      bgColor: lowStockProducts.length > 0 ? 'bg-red-50' : 'bg-brand-green/5',
      route: '/inventory',
      details: lowStockProducts.length > 0 ? 'Immediate attention required' : 'All items well stocked'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-mono">
      {/* Compact Header */}
      <header className="h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b-4 border-brand-purple">
        <div className="flex items-center justify-between px-6 h-full">
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
            DUKASMART
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-purple border-2 border-brand-purple-dark"></div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className="p-4 max-w-7xl mx-auto">
        {/* Summary Cards - 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            const isFlipped = flippedCard === card.id;
            
            return (
              <Card 
                key={card.id}
                className={`relative overflow-hidden border-4 ${card.color} ${card.bgColor} cursor-pointer transition-all duration-200 hover:border-gray-900 dark:hover:border-white`}
                style={{ 
                  borderRadius: '0px',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 200ms'
                }}
                onClick={() => handleCardFlip(card.id)}
              >
                <CardContent className="p-4" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black tracking-widest text-gray-600 dark:text-gray-400 mb-2">
                        {card.title}
                      </p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {card.value}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-gray-900 dark:bg-white flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white dark:text-gray-900" />
                    </div>
                  </div>
                </CardContent>
                
                {/* Flipped Content */}
                <div 
                  className="absolute inset-0 p-4 flex items-center justify-center text-center"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {card.details}
                    </p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(card.route);
                      }}
                      className="bg-gray-900 hover:bg-gray-700 text-white font-bold px-4 py-2"
                      style={{ borderRadius: '0px' }}
                    >
                      VIEW MORE
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Alerts & Quick Actions Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Low Stock Alerts */}
          <Card className="border-4 border-brand-purple bg-white dark:bg-gray-800" style={{ borderRadius: '0px' }}>
            <div className="border-l-4 border-brand-purple bg-brand-purple/10 p-4">
              <h3 className="font-black text-sm tracking-widest text-gray-900 dark:text-white mb-4">
                LOW STOCK ALERTS
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 border-2 border-gray-900 dark:border-white">
                      <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {product.name}
                      </span>
                      <Badge className="bg-red-500 text-white font-bold" style={{ borderRadius: '0px' }}>
                        {product.currentStock}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">ALL STOCKED ✓</p>
                )}
              </div>
            </div>
          </Card>

          {/* Overdue Payments */}
          <Card className="border-4 border-red-500 bg-white dark:bg-gray-800" style={{ borderRadius: '0px' }}>
            <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4">
              <h3 className="font-black text-sm tracking-widest text-gray-900 dark:text-white mb-4">
                OVERDUE PAYMENTS
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {overdueCustomers.length > 0 ? (
                  overdueCustomers.slice(0, 5).map((customer) => (
                    <div key={customer.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 border-2 border-gray-900 dark:border-white">
                      <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {customer.name}
                      </span>
                      <span className="font-black text-xs text-red-600">
                        {formatCurrency(customer.outstandingDebt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">ALL PAID UP ✓</p>
                )}
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="border-4 border-brand-green bg-white dark:bg-gray-800" style={{ borderRadius: '0px' }}>
            <div className="border-l-4 border-brand-green bg-brand-green/10 p-4">
              <h3 className="font-black text-sm tracking-widest text-gray-900 dark:text-white mb-4">
                QUICK ACTIONS
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/sales')}
                  className="w-full h-12 bg-brand-green hover:bg-brand-green-dark text-white font-black flex flex-col items-center justify-center gap-1 border-2 border-gray-900"
                  style={{ borderRadius: '0px' }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="text-xs">ADD SALE</span>
                </Button>
                
                <Button
                  onClick={() => navigate('/inventory')}
                  className="w-full h-12 bg-brand-purple hover:bg-brand-purple-dark text-white font-black flex flex-col items-center justify-center gap-1 border-2 border-gray-900"
                  style={{ borderRadius: '0px' }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs">ADD PRODUCT</span>
                </Button>
                
                <Button
                  onClick={() => navigate('/customers')}
                  className="w-full h-12 bg-gray-900 hover:bg-gray-700 text-white font-black flex flex-col items-center justify-center gap-1 border-2 border-gray-900"
                  style={{ borderRadius: '0px' }}
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-xs">ADD CUSTOMER</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoughBlockyDashboard;
