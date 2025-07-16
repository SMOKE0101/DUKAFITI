
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Product, Customer } from '../../types';

interface ReportsAlertsPanelProps {
  products: Product[];
  customers: Customer[];
}

const ReportsAlertsPanel: React.FC<ReportsAlertsPanelProps> = ({ products, customers }) => {
  const lowStockProducts = useMemo(() => {
    return products.filter(product => 
      product.current_stock <= (product.low_stock_threshold || 10)
    );
  }, [products]);

  const overdueCustomers = useMemo(() => {
    return customers.filter(customer => customer.outstanding_debt > 0);
  }, [customers]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Low Stock Alerts */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Package className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Low Stock Alerts
                {lowStockProducts.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {lowStockProducts.length}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Products running low on inventory</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-muted-foreground">All products are well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="mb-1">
                      {product.current_stock} left
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Threshold: {product.low_stock_threshold || 10}
                    </p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-red-500 ml-3" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Customer Payments */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Overdue Payments
                {overdueCustomers.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {overdueCustomers.length}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Customers with outstanding debt</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {overdueCustomers.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-muted-foreground">No overdue payments!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {overdueCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{customer.name}</h4>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="mb-1">
                      {formatCurrency(customer.outstanding_debt)}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Risk: {customer.risk_rating}
                    </p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-orange-500 ml-3" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsAlertsPanel;
