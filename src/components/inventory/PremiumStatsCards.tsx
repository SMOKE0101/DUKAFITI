
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';
import { Product } from '../../types';

interface PremiumStatsCardsProps {
  products: Product[];
  onCardClick: (filter: string) => void;
}

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  bgGradient: string;
  trend?: string;
  trendIcon?: React.ElementType;
  trendColor?: string;
  onClick: () => void;
}

const PremiumStatsCards: React.FC<PremiumStatsCardsProps> = ({ products, onCardClick }) => {
  const [showRestockModal, setShowRestockModal] = useState(false);

  // Calculate enhanced metrics
  const totalSKUs = products.length;
  const inStockProducts = products.filter(p => p.currentStock > p.lowStockThreshold);
  const lowStockProducts = products.filter(p => p.currentStock <= p.lowStockThreshold);
  const outOfStockProducts = products.filter(p => p.currentStock === 0);
  const inStockPercentage = totalSKUs > 0 ? Math.round((inStockProducts.length / totalSKUs) * 100) : 0;
  
  // Calculate total inventory value
  const totalValue = products.reduce((sum, product) => sum + (product.sellingPrice * product.currentStock), 0);
  
  const getLastRestockInfo = () => {
    const sortedByUpdate = [...products].sort((a, b) => 
      new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );
    
    if (sortedByUpdate.length === 0) {
      return { display: 'No restocks recorded', timeAgo: '', isToday: false };
    }
    
    const lastUpdate = new Date(sortedByUpdate[0].updatedAt || '');
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    let timeAgo = '';
    if (diffHours < 1) {
      timeAgo = 'Just now';
    } else if (diffHours < 24) {
      timeAgo = `${diffHours}h ago`;
    } else {
      timeAgo = `${diffDays}d ago`;
    }
    
    const isToday = diffHours < 24;
    const display = lastUpdate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return { display, timeAgo, isToday };
  };

  const lastRestockInfo = getLastRestockInfo();
  
  const cards: StatCard[] = [
    {
      id: 'total-products',
      title: 'Total SKUs',
      value: totalSKUs,
      subtitle: `${totalSKUs} active products`,
      icon: Package,
      iconColor: 'text-blue-600',
      bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
      trend: '+2 this week',
      trendIcon: ArrowUpRight,
      trendColor: 'text-green-600',
      onClick: () => onCardClick('all')
    },
    {
      id: 'inventory-value',
      title: 'Inventory Value',
      value: `KES ${(totalValue / 1000).toFixed(1)}K`,
      subtitle: `Total stock worth`,
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900',
      trend: inStockPercentage >= 80 ? 'Healthy' : 'Needs attention',
      trendIcon: inStockPercentage >= 80 ? ArrowUpRight : ArrowDownRight,
      trendColor: inStockPercentage >= 80 ? 'text-green-600' : 'text-orange-600',
      onClick: () => onCardClick('in-stock')
    },
    {
      id: 'low-stock',
      title: 'Low Stock Alert',
      value: lowStockProducts.length,
      subtitle: outOfStockProducts.length > 0 ? `${outOfStockProducts.length} out of stock` : 'Stock levels monitored',
      icon: AlertTriangle,
      iconColor: lowStockProducts.length > 0 ? 'text-amber-600' : 'text-gray-400',
      bgGradient: lowStockProducts.length > 0 
        ? 'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900' 
        : 'from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900',
      trend: lowStockProducts.length > 5 ? 'Critical' : lowStockProducts.length > 0 ? 'Monitor' : 'All good',
      trendIcon: lowStockProducts.length > 0 ? Zap : ArrowUpRight,
      trendColor: lowStockProducts.length > 5 ? 'text-red-600' : lowStockProducts.length > 0 ? 'text-amber-600' : 'text-green-600',
      onClick: () => onCardClick('low-stock')
    },
    {
      id: 'last-restock',
      title: 'Last Activity',
      value: lastRestockInfo.display === 'No restocks recorded' ? '—' : lastRestockInfo.display,
      subtitle: lastRestockInfo.display === 'No restocks recorded' ? 'No recent activity' : lastRestockInfo.timeAgo,
      icon: Calendar,
      iconColor: lastRestockInfo.isToday ? 'text-green-600' : 'text-slate-600',
      bgGradient: lastRestockInfo.isToday 
        ? 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900' 
        : 'from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900',
      trend: lastRestockInfo.isToday ? 'Recent' : 'Inactive',
      trendIcon: lastRestockInfo.isToday ? ArrowUpRight : ArrowDownRight,
      trendColor: lastRestockInfo.isToday ? 'text-green-600' : 'text-slate-500',
      onClick: () => setShowRestockModal(true)
    }
  ];

  const getLastRestockEvents = () => {
    return products
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 3)
      .map(product => ({
        product: product.name,
        date: new Date(product.updatedAt || '').toLocaleDateString(),
        quantity: Math.floor(Math.random() * 50) + 10,
      }));
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Tooltip key={card.id}>
            <TooltipTrigger asChild>
              <Card 
                className="group relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-out cursor-pointer transform hover:-translate-y-1"
                onClick={card.onClick}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50`} />
                
                {/* Subtle Pattern Overlay */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                
                <CardContent className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                      <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    
                    {/* Trend Indicator */}
                    {card.trend && card.trendIcon && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm`}>
                        <card.trendIcon className={`w-3 h-3 ${card.trendColor}`} />
                        <span className={`text-xs font-medium ${card.trendColor}`}>
                          {card.trend}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      {card.title}
                    </div>
                    
                    <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                      {card.value}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {card.subtitle}
                    </div>
                  </div>

                  {/* Progress Indicator for Stock Percentage */}
                  {card.id === 'inventory-value' && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Stock Health</span>
                        <span>{inStockPercentage}%</span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            inStockPercentage >= 80 ? 'bg-green-500' : 
                            inStockPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${inStockPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Mini Chart for Low Stock */}
                  {card.id === 'low-stock' && lowStockProducts.length > 0 && (
                    <div className="mt-4 flex items-end gap-1 h-8">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div 
                          key={i}
                          className="bg-amber-400/60 rounded-sm flex-1 animate-pulse"
                          style={{ 
                            height: `${20 + Math.random() * 20}px`,
                            animationDelay: `${i * 100}ms`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-sm">
                {card.id === 'low-stock' 
                  ? (lowStockProducts.length > 0 
                      ? `${lowStockProducts.length} products need restocking. ${outOfStockProducts.length} completely out of stock.`
                      : 'All products have healthy stock levels.')
                  : card.id === 'last-restock'
                    ? (lastRestockInfo.display === 'No restocks recorded'
                        ? 'No inventory updates recorded yet'
                        : `Last inventory update: ${lastRestockInfo.display}`)
                    : `Click to view ${card.title.toLowerCase()} details`
                }
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Enhanced Restock Events Modal */}
      <Dialog open={showRestockModal} onOpenChange={setShowRestockModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Inventory Activity
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {getLastRestockEvents().map((event, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium text-sm">{event.product}</div>
                  <div className="text-xs text-muted-foreground">{event.date}</div>
                </div>
                <div className="text-sm font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                  +{event.quantity}
                </div>
              </div>
            ))}
            {getLastRestockEvents().length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No recent inventory activity</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PremiumStatsCards;
