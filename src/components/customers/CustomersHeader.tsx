import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';
import { cn } from '@/lib/utils';

interface CustomersHeaderProps {
  totalCustomers: number;
  totalOutstandingDebt: number;
  pendingOperations: number;
  isOnline: boolean;
  onAddCustomer: () => void;
}

const CustomersHeader: React.FC<CustomersHeaderProps> = ({ 
  totalCustomers,
  totalOutstandingDebt,
  pendingOperations,
  isOnline,
  onAddCustomer
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  return (
    <div className="space-y-6 w-full">
      {/* Modern Top Bar - Matching Dashboard Style */}
      <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="font-mono text-lg md:text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            CUSTOMERS
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status indicators */}
          {pendingOperations > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {pendingOperations} pending
              </span>
            </div>
          )}
          
          <Button 
            onClick={onAddCustomer}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex-shrink-0"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            {isMobile ? 'Add' : 'Add Customer'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={cn(
        "grid gap-4 w-full",
        isMobile ? "grid-cols-2" : isTablet ? "grid-cols-2" : "grid-cols-2"
      )}>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">Total Customers</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">Outstanding Debt</span>
          </div>
          <p className={cn("text-2xl font-bold text-destructive", isMobile && "text-lg")}>
            {formatCurrency(totalOutstandingDebt)}
          </p>
        </div>
      </div>

      {/* Outstanding Debt Alert */}
      {totalOutstandingDebt > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 shadow-sm w-full">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-destructive truncate">Outstanding Debt Alert</p>
              <p className="text-sm text-destructive/80 truncate">
                Total debt: {formatCurrency(totalOutstandingDebt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersHeader;