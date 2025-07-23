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

  if (isMobile) {
    return (
      <div className="space-y-3 w-full">
        {/* Mobile Header - Enhanced spacing and full width utilization */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-foreground truncate">Customer Management</h1>
              <p className="text-sm text-muted-foreground truncate">Manage relationships</p>
            </div>
          </div>
          
          <Button 
            onClick={onAddCustomer}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex-shrink-0"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {pendingOperations > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {pendingOperations} pending
              </span>
            </div>
          )}
          {!isOnline && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs font-medium text-red-700 dark:text-red-300">
                Offline
              </span>
            </div>
          )}
        </div>

        {/* Mobile Stats Grid - Enhanced with full width utilization */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-card rounded-xl p-4 border border-border shadow-sm w-full">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-muted-foreground truncate">Customers</span>
            </div>
            <p className="text-xl font-bold text-foreground">{totalCustomers}</p>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border shadow-sm w-full">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-destructive flex-shrink-0" />
              <span className="text-xs font-medium text-muted-foreground truncate">Outstanding</span>
            </div>
            <p className="text-lg font-bold text-destructive truncate">{formatCurrency(totalOutstandingDebt)}</p>
          </div>
        </div>

        {/* Outstanding Debt Alert - Enhanced design with full width */}
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
  }

  if (isTablet) {
    return (
      <div className="space-y-4 w-full">
        {/* Tablet Header - Enhanced layout with full width utilization */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 flex-shrink-0">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground truncate">Customer Management</h1>
              <p className="text-muted-foreground truncate">Manage your customer relationships and credit limits</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {pendingOperations > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  {pendingOperations} pending
                </span>
              </div>
            )}
            {!isOnline && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  Offline
                </span>
              </div>
            )}
            <Button 
              onClick={onAddCustomer}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex-shrink-0"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Tablet Stats Grid - Enhanced with full width and better spacing */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm w-full">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-muted-foreground truncate">Total Customers</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
          </div>
          
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm w-full">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-destructive flex-shrink-0" />
              <span className="text-sm font-medium text-muted-foreground truncate">Outstanding Debt</span>
            </div>
            <p className="text-2xl font-bold text-destructive truncate">{formatCurrency(totalOutstandingDebt)}</p>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 w-full">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-bold text-white tracking-tight truncate">Customer Management</h1>
              <p className="text-white/80 text-lg truncate">Manage your customer relationships and credit limits</p>
            </div>
          </div>

          {/* Status indicators in header for desktop */}
          <div className="flex items-center gap-4 text-white/90 flex-wrap">
            {pendingOperations > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-400/20">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-amber-100">{pendingOperations} Pending</span>
              </div>
            )}
            {!isOnline && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-400/20">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-sm font-medium text-red-100">Offline</span>
              </div>
            )}
          </div>
        </div>
        
        <Button 
          onClick={onAddCustomer}
          className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 font-semibold text-lg backdrop-blur-sm border border-white/20 hover:border-white/30 hover:scale-105 flex-shrink-0"
          size="lg"
        >
          <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          Add New Customer
        </Button>
      </div>

      {/* Desktop Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOutstandingDebt)}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomersHeader;