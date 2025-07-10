
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';

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
      <div className="space-y-4 px-1">
        {/* Mobile Header - Enhanced spacing */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inventory</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage products</p>
            </div>
          </div>
          
          <Button 
            onClick={onAddProduct}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Mobile Stats Grid - Enhanced with better visual hierarchy */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-lg shadow-purple-500/5">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Products</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-lg shadow-purple-500/5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Value</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</p>
          </div>
        </div>

        {/* Low Stock Alert - Enhanced design */}
        {lowStockCount > 0 && (
          <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg shadow-red-500/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">Low Stock Alert</p>
                <p className="text-sm text-red-700 dark:text-red-300">
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
      <div className="space-y-6 px-2">
        {/* Tablet Header - Enhanced layout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage your products and stock levels</p>
            </div>
          </div>
          
          <Button 
            onClick={onAddProduct}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Tablet Stats Grid - Enhanced with better spacing */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg shadow-purple-500/5">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Products</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg shadow-purple-500/5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg shadow-purple-500/5">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className={`w-5 h-5 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock</span>
            </div>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {lowStockCount}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Inventory</h1>
            <p className="text-white/80 text-lg">Manage your products and stock levels</p>
          </div>
        </div>
        
        {/* Quick Stats in Header */}
        <div className="flex items-center gap-6 text-white/90">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">{totalProducts} Products</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">{formatCurrency(totalValue)} Value</span>
          </div>
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-400/20">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-100">{lowStockCount} Low Stock</span>
            </div>
          )}
        </div>
      </div>
      
      <Button 
        onClick={onAddProduct}
        className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 font-semibold text-lg backdrop-blur-sm border border-white/20 hover:border-white/30 hover:scale-105"
        size="lg"
      >
        <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </div>
        Add New Product
      </Button>
    </div>
  );
};

export default InventoryHeader;
