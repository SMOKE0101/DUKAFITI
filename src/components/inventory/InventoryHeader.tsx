
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';
import { cn } from '@/lib/utils';

interface InventoryHeaderProps {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  onAddProduct: () => void;
}

const InventoryHeader: React.FC<InventoryHeaderProps> = ({ 
  totalProducts,
  totalValue,
  lowStockCount,
  onAddProduct 
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile) {
    return (
      <div className="space-y-3 w-full">
        {/* Mobile Header - Enhanced spacing and full width utilization */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">Inventory</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Manage products</p>
            </div>
          </div>
          
          <Button 
            onClick={onAddProduct}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex-shrink-0"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Mobile Stats Grid - Enhanced with full width utilization */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-lg shadow-purple-500/5 w-full">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">Products</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-lg shadow-purple-500/5 w-full">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">Total Value</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{formatCurrency(totalValue)}</p>
          </div>
        </div>

        {/* Low Stock Alert - Enhanced design with full width */}
        {lowStockCount > 0 && (
          <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg shadow-red-500/10 w-full">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-red-900 dark:text-red-100 truncate">Low Stock Alert</p>
                <p className="text-sm text-red-700 dark:text-red-300 truncate">
                  {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} running low
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
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20 flex-shrink-0">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">Inventory</h1>
              <p className="text-gray-500 dark:text-gray-400 truncate">Manage your products and stock levels</p>
            </div>
          </div>
          
          <Button 
            onClick={onAddProduct}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex-shrink-0"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Tablet Stats Grid - Enhanced with full width and better spacing */}
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg shadow-purple-500/5 w-full">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Products</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg shadow-purple-500/5 w-full">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">{formatCurrency(totalValue)}</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg shadow-purple-500/5 w-full">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className={cn("w-5 h-5 flex-shrink-0", lowStockCount > 0 ? 'text-red-600' : 'text-gray-400')} />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Low Stock</span>
            </div>
            <p className={cn("text-2xl font-bold", lowStockCount > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white')}>
              {lowStockCount}
            </p>
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
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-bold text-foreground tracking-tight truncate">Inventory</h1>
              <p className="text-muted-foreground text-lg truncate">Manage your products and stock levels</p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={onAddProduct}
          className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 font-semibold text-lg backdrop-blur-sm border border-primary/20 hover:border-primary/30 hover:scale-105 flex-shrink-0"
          size="lg"
        >
          <div className="w-6 h-6 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          Add New Product
        </Button>
      </div>

      {/* Desktop Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">Products</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalProducts}</p>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={cn("w-4 h-4 flex-shrink-0", lowStockCount > 0 ? 'text-red-600' : 'text-muted-foreground')} />
            <span className="text-sm font-medium text-muted-foreground">Low Stock</span>
          </div>
          <p className={cn("text-2xl font-bold", lowStockCount > 0 ? 'text-red-600' : 'text-foreground')}>
            {lowStockCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryHeader;
