
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Package, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

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
