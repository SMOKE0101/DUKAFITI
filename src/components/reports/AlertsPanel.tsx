
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { Product, Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface AlertsPanelProps {
  products: Product[];
  customers: Customer[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ products, customers }) => {
  // Filter low stock products
  const lowStockProducts = products.filter(product => 
    product.current_stock <= (product.low_stock_threshold || 10)
  );

  // Filter customers with outstanding debt
  const overdueCustomers = customers.filter(customer => 
    customer.outstanding_debt > 0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Low Stock Alerts */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            Low Stock Alerts ({lowStockProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center py-2 border-b border-yellow-200 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={product.current_stock === 0 ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {product.current_stock} left
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      Alert: {product.low_stock_threshold || 10}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-4">
                All products are well stocked
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Debt Alerts */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <TrendingDown className="h-5 w-5" />
            Outstanding Debt ({overdueCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {overdueCustomers.length > 0 ? (
              overdueCustomers.map((customer) => (
                <div key={customer.id} className="flex justify-between items-center py-2 border-b border-red-200 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-xs">
                      {formatCurrency(customer.outstanding_debt)}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      Risk: {customer.risk_rating || 'medium'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No outstanding debt
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPanel;
