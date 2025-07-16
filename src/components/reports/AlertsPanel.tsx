
import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../../utils/currency';
import { safeNumber } from '../../utils/dateUtils';
import { Product, Customer } from '../../types';

interface AlertsPanelProps {
  lowStockProducts: Product[];
  overdueCustomers: Customer[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  lowStockProducts,
  overdueCustomers
}) => {
  // Ultra-accurate low stock filtering with proper validation
  const filteredLowStockProducts = lowStockProducts.filter(product => {
    const currentStock = safeNumber(product.currentStock, 0);
    const threshold = safeNumber(product.lowStockThreshold, 10);
    
    // Exclude products with unspecified stock (-1) and ensure proper comparison
    return currentStock >= 0 && currentStock <= threshold;
  }).sort((a, b) => {
    // Sort by urgency: out of stock first, then by stock level ascending
    const aStock = safeNumber(a.currentStock, 0);
    const bStock = safeNumber(b.currentStock, 0);
    
    if (aStock === 0 && bStock > 0) return -1;
    if (bStock === 0 && aStock > 0) return 1;
    
    return aStock - bStock;
  });

  // Ultra-accurate overdue customers with proper debt validation
  const filteredOverdueCustomers = overdueCustomers.filter(customer => {
    const debt = safeNumber(customer.outstandingDebt, 0);
    return debt > 0;
  }).sort((a, b) => {
    // Sort by debt amount descending (highest debt first)
    const aDebt = safeNumber(a.outstandingDebt, 0);
    const bDebt = safeNumber(b.outstandingDebt, 0);
    return bDebt - aDebt;
  });

  const getStockStatus = (product: Product) => {
    const currentStock = safeNumber(product.currentStock, 0);
    const threshold = safeNumber(product.lowStockThreshold, 10);
    
    if (currentStock <= 0) {
      return { variant: 'destructive' as const, text: 'Out of Stock', urgency: 'critical' };
    } else if (currentStock <= Math.floor(threshold * 0.25)) {
      return { variant: 'destructive' as const, text: `${currentStock} left - Critical`, urgency: 'high' };
    } else if (currentStock <= Math.floor(threshold * 0.5)) {
      return { variant: 'secondary' as const, text: `${currentStock} left - Low`, urgency: 'medium' };
    } else {
      return { variant: 'secondary' as const, text: `${currentStock} left`, urgency: 'low' };
    }
  };

  const getRiskLevel = (debt: number) => {
    if (debt >= 10000) return 'high';
    if (debt >= 5000) return 'medium';
    return 'low';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Low Stock Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Low Stock Alerts
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredLowStockProducts.length} items
            </span>
            {filteredLowStockProducts.some(p => safeNumber(p.currentStock, 0) <= 0) && (
              <Badge variant="destructive" className="animate-pulse text-xs">
                Critical
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {filteredLowStockProducts.slice(0, 8).map((product) => {
            const status = getStockStatus(product);
            return (
              <div 
                key={product.id} 
                className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm ${
                  status.urgency === 'critical' 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                    : status.urgency === 'high'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {product.category} • Threshold: {safeNumber(product.lowStockThreshold, 10)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <Badge variant={status.variant} className="text-xs mb-1">
                    {status.text}
                  </Badge>
                  {status.urgency === 'critical' && (
                    <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredLowStockProducts.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-center text-gray-500 dark:text-gray-400">
                All products are well stocked!
              </p>
            </div>
          )}
          
          {filteredLowStockProducts.length > 8 && (
            <button className="w-full text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center justify-center gap-1 pt-2 transition-colors">
              View All ({filteredLowStockProducts.length - 8} more)
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Overdue Customer Payments */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Overdue Payments
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredOverdueCustomers.length} customers
            </span>
            {filteredOverdueCustomers.some(c => safeNumber(c.outstandingDebt, 0) >= 10000) && (
              <Badge variant="destructive" className="animate-pulse text-xs">
                High Risk
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {filteredOverdueCustomers.slice(0, 8).map((customer) => {
            const debt = safeNumber(customer.outstandingDebt, 0);
            const riskLevel = getRiskLevel(debt);
            return (
              <div 
                key={customer.id} 
                className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm ${
                  riskLevel === 'high' 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                    : riskLevel === 'medium'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {customer.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {customer.phone} • Risk: {customer.riskRating || 'medium'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className={`font-medium text-sm mb-1 ${
                    riskLevel === 'high' ? 'text-red-600 dark:text-red-400' :
                    riskLevel === 'medium' ? 'text-orange-600 dark:text-orange-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {formatCurrency(debt)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {riskLevel} risk
                  </p>
                </div>
              </div>
            );
          })}
          
          {filteredOverdueCustomers.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-center text-gray-500 dark:text-gray-400">
                No overdue payments!
              </p>
            </div>
          )}
          
          {filteredOverdueCustomers.length > 8 && (
            <button className="w-full text-red-600 hover:text-red-700 text-sm font-medium flex items-center justify-center gap-1 pt-2 transition-colors">
              View All ({filteredOverdueCustomers.length - 8} more)
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
