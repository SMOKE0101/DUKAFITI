
import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../../utils/currency';
import { Product, Customer } from '../../types';

interface AlertsPanelProps {
  lowStockProducts: Product[];
  overdueCustomers: Customer[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  lowStockProducts,
  overdueCustomers
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Low Stock Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Low Stock Alerts
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {lowStockProducts.length} items
          </span>
        </div>
        
        <div className="space-y-3">
          {lowStockProducts.slice(0, 5).map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {product.category}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={product.currentStock <= 0 ? "destructive" : "secondary"} className="text-xs">
                  {product.currentStock <= 0 ? 'Out of Stock' : `${product.currentStock} left`}
                </Badge>
              </div>
            </div>
          ))}
          
          {lowStockProducts.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No low stock alerts
            </p>
          )}
          
          {lowStockProducts.length > 5 && (
            <button className="w-full text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center justify-center gap-1 pt-2">
              View All ({lowStockProducts.length - 5} more)
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
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {overdueCustomers.length} customers
          </span>
        </div>
        
        <div className="space-y-3">
          {overdueCustomers.slice(0, 5).map((customer) => (
            <div key={customer.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {customer.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {customer.phone}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-red-600 dark:text-red-400 text-sm">
                  {formatCurrency(customer.outstandingDebt)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  overdue
                </p>
              </div>
            </div>
          ))}
          
          {overdueCustomers.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No overdue payments
            </p>
          )}
          
          {overdueCustomers.length > 5 && (
            <button className="w-full text-red-600 hover:text-red-700 text-sm font-medium flex items-center justify-center gap-1 pt-2">
              View All ({overdueCustomers.length - 5} more)
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
