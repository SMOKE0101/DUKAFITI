
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Calendar
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
  bgColor: string;
  trend?: string;
  onClick: () => void;
}

const PremiumStatsCards: React.FC<PremiumStatsCardsProps> = ({ products, onCardClick }) => {
  const [showRestockModal, setShowRestockModal] = useState(false);

  // Calculate metrics
  const totalSKUs = products.length;
  const inStockProducts = products.filter(p => p.currentStock > p.lowStockThreshold);
  const lowStockProducts = products.filter(p => p.currentStock <= p.lowStockThreshold); // Include qty = 0
  const inStockPercentage = totalSKUs > 0 ? Math.round((inStockProducts.length / totalSKUs) * 100) : 0;
  
  // Get most recent restock date (simulated - in real app would come from restock_date field)
  const getLastRestockInfo = () => {
    // For demo purposes, using updatedAt as proxy for restock date
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
      timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    
    const isToday = diffHours < 24;
    const display = lastUpdate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return { display, timeAgo, isToday };
  };

  const lastRestockInfo = getLastRestockInfo();
  
  const cards: StatCard[] = [
    {
      id: 'total-products',
      title: 'Total Products',
      value: totalSKUs,
      subtitle: 'SKUs in inventory',
      icon: Package,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      trend: '+2 this week',
      onClick: () => onCardClick('all')
    },
    {
      id: 'stock-percentage',
      title: 'In Stock',
      value: `${inStockPercentage}%`,
      subtitle: `${inStockProducts.length} of ${totalSKUs} products`,
      icon: TrendingUp,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: inStockPercentage >= 80 ? 'Healthy levels' : 'Needs attention',
      onClick: () => onCardClick('in-stock')
    },
    {
      id: 'low-stock',
      title: 'Low Stock Alert',
      value: lowStockProducts.length,
      subtitle: lowStockProducts.length === 0 ? 'All products well stocked' : 'Items need restocking',
      icon: AlertTriangle,
      iconColor: lowStockProducts.length > 0 ? 'text-red-600' : 'text-gray-400',
      bgColor: lowStockProducts.length > 0 ? 'bg-red-100' : 'bg-gray-100',
      trend: lowStockProducts.length > 5 ? 'High priority' : lowStockProducts.length > 0 ? 'Manageable' : 'All good',
      onClick: () => onCardClick('low-stock')
    },
    {
      id: 'last-restock',
      title: 'Last Restock',
      value: lastRestockInfo.display === 'No restocks recorded' ? 'Never' : 'Recent',
      subtitle: lastRestockInfo.display === 'No restocks recorded' ? lastRestockInfo.display : `${lastRestockInfo.display} • ${lastRestockInfo.timeAgo}`,
      icon: Calendar,
      iconColor: lastRestockInfo.isToday ? 'text-green-600' : 'text-blue-600',
      bgColor: lastRestockInfo.isToday ? 'bg-green-100' : 'bg-blue-100',
      trend: lastRestockInfo.timeAgo,
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
        quantity: Math.floor(Math.random() * 50) + 10, // Simulated quantity
      }));
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Tooltip key={card.id}>
            <TooltipTrigger asChild>
              <Card 
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer group hover:scale-105"
                onClick={card.onClick}
              >
                <CardContent className="p-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${card.bgColor} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                      <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                      {card.id === 'last-restock' && lastRestockInfo.isToday && (
                        <div className="absolute w-3 h-3 bg-green-500 rounded-full -top-1 -right-1 animate-pulse" />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase text-muted-foreground font-medium tracking-wide">
                        {card.title}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className={`text-3xl font-bold group-hover:text-primary transition-colors duration-200 ${
                      card.id === 'low-stock' && lowStockProducts.length === 0 ? 'text-gray-400' : 'text-foreground'
                    }`}>
                      {card.value}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {card.subtitle}
                    </div>

                    {card.trend && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-xs text-primary font-medium">
                          {card.trend}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Micro progress bar for stock percentage */}
                  {card.id === 'stock-percentage' && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${inStockPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Mini sparkline effect for low stock */}
                  {card.id === 'low-stock' && lowStockProducts.length > 0 && (
                    <div className="mt-3 flex items-center gap-1">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div 
                          key={i}
                          className="w-1 bg-red-300 rounded-full animate-pulse"
                          style={{ 
                            height: `${8 + Math.random() * 12}px`,
                            animationDelay: `${i * 100}ms`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {card.id === 'low-stock' 
                  ? (lowStockProducts.length > 0 
                      ? `${lowStockProducts.length} products at or below your reorder threshold.`
                      : 'All products in stock above threshold.')
                  : card.id === 'last-restock'
                    ? (lastRestockInfo.display === 'No restocks recorded'
                        ? 'No restocks recorded yet'
                        : `Last restocked: ${lastRestockInfo.display} at ${new Date().toLocaleTimeString()}`)
                    : `Click to filter inventory by ${card.title.toLowerCase()}`
                }
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Last Restock Events Modal */}
      <Dialog open={showRestockModal} onOpenChange={setShowRestockModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recent Restock Events</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {getLastRestockEvents().map((event, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{event.product}</div>
                  <div className="text-sm text-gray-500">{event.date}</div>
                </div>
                <div className="text-sm font-medium text-green-600">
                  +{event.quantity} units
                </div>
              </div>
            ))}
            {getLastRestockEvents().length === 0 && (
              <div className="text-center py-6 text-gray-500">
                No restock events recorded yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PremiumStatsCards;
