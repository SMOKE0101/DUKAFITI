
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  // Calculate metrics
  const totalSKUs = products.length;
  const inStockProducts = products.filter(p => p.currentStock > p.lowStockThreshold);
  const lowStockProducts = products.filter(p => p.currentStock <= p.lowStockThreshold && p.currentStock > 0);
  const inStockPercentage = totalSKUs > 0 ? Math.round((inStockProducts.length / totalSKUs) * 100) : 0;
  
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
      subtitle: 'Items need restocking',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-100',
      trend: lowStockProducts.length > 5 ? 'High priority' : 'Manageable',
      onClick: () => onCardClick('low-stock')
    },
    {
      id: 'last-restock',
      title: 'Last Restock',
      value: 'Today',
      subtitle: 'July 9, 2025',
      icon: Calendar,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '2 hours ago',
      onClick: () => onCardClick('recent')
    }
  ];

  return (
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
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase text-muted-foreground font-medium tracking-wide">
                      {card.title}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">
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
                        className="w-1 bg-amber-300 rounded-full animate-pulse"
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
            <p>Click to filter inventory by {card.title.toLowerCase()}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

export default PremiumStatsCards;
