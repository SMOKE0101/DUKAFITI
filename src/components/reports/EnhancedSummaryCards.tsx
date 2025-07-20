
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Banknote, Smartphone, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/lib/utils';

interface SummaryData {
  totalSales: number;
  totalOrders: number;
  cashSales: number;
  mpesaSales: number;
  creditSales: number;
}

interface EnhancedSummaryCardsProps {
  data: SummaryData;
  loading?: boolean;
}

const EnhancedSummaryCards: React.FC<EnhancedSummaryCardsProps> = ({
  data,
  loading = false
}) => {
  const cards = [
    {
      title: 'Total Sales',
      value: formatCurrency(data.totalSales),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50',
    },
    {
      title: 'Total Orders',
      value: data.totalOrders.toString(),
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50',
    },
    {
      title: 'Cash Sales',
      value: formatCurrency(data.cashSales),
      icon: Banknote,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50',
    },
    {
      title: 'M-Pesa Sales',
      value: formatCurrency(data.mpesaSales),
      icon: Smartphone,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50',
    },
    {
      title: 'Credit Sales',
      value: formatCurrency(data.creditSales),
      icon: CreditCard,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50',
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-muted rounded-xl"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={cn(
              "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1",
              `bg-gradient-to-br ${card.bgGradient}`
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-2xl lg:text-3xl font-black text-foreground">
                    {card.value}
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-2xl shadow-lg",
                  `bg-gradient-to-br ${card.gradient}`
                )}>
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              
              <div className={cn(
                "absolute -bottom-2 -right-2 w-16 h-16 rounded-full opacity-10",
                `bg-gradient-to-br ${card.gradient}`
              )} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EnhancedSummaryCards;
