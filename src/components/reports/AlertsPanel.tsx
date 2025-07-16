
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, Users, TrendingDown, DollarSign } from 'lucide-react';
import { Product, Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface AlertsPanelProps {
  products: Product[];
  customers: Customer[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ products, customers }) => {
  // Calculate alerts
  const lowStockProducts = products.filter(p => 
    p.current_stock > 0 && 
    p.current_stock <= (p.low_stock_threshold || 10)
  );
  
  const outOfStockProducts = products.filter(p => p.current_stock === 0);
  
  const highDebtCustomers = customers.filter(c => 
    c.outstanding_debt && c.outstanding_debt > 0
  );

  const urgentAlerts = [
    {
      type: 'critical',
      title: 'Out of Stock',
      count: outOfStockProducts.length,
      icon: Package,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      items: outOfStockProducts.slice(0, 3),
      action: 'Restock Now'
    },
    {
      type: 'warning',
      title: 'Low Stock',
      count: lowStockProducts.length,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      items: lowStockProducts.slice(0, 3),
      action: 'Review Inventory'
    },
    {
      type: 'info',
      title: 'Outstanding Debts',
      count: highDebtCustomers.length,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      items: highDebtCustomers.slice(0, 3),
      action: 'Follow Up'
    }
  ];

  if (urgentAlerts.every(alert => alert.count === 0)) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">All Good!</h3>
          <p className="text-green-600">No urgent alerts at the moment. Your business is running smoothly.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Business Alerts
        </h2>
        <Badge variant="destructive" className="text-xs">
          {urgentAlerts.reduce((sum, alert) => sum + alert.count, 0)} Total
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {urgentAlerts.map((alert, index) => {
          if (alert.count === 0) return null;
          
          const Icon = alert.icon;
          
          return (
            <Card key={index} className={`${alert.borderColor} ${alert.bgColor} border-2`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${alert.color}`} />
                    <CardTitle className={`text-lg ${alert.color}`}>
                      {alert.title}
                    </CardTitle>
                  </div>
                  <Badge variant={alert.type === 'critical' ? 'destructive' : alert.type === 'warning' ? 'secondary' : 'default'}>
                    {alert.count}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {alert.type === 'critical' || alert.type === 'warning' ? (
                    // Product alerts
                    alert.items.map((product: Product) => (
                      <div key={product.id} className="flex justify-between items-center p-2 bg-white rounded border">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                          <p className="text-xs text-gray-600">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={product.current_stock === 0 ? 'destructive' : 'secondary'} className="text-xs">
                            {product.current_stock} left
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Threshold: {product.low_stock_threshold || 10}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Customer debt alerts
                    alert.items.map((customer: Customer) => (
                      <div key={customer.id} className="flex justify-between items-center p-2 bg-white rounded border">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{customer.name}</p>
                          <p className="text-xs text-gray-600">{customer.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600 text-sm">
                            {formatCurrency(customer.outstanding_debt || 0)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {alert.count > 3 && (
                    <p className="text-center text-xs text-gray-600 py-2">
                      And {alert.count - 3} more...
                    </p>
                  )}
                  
                  <Button 
                    size="sm" 
                    className={`w-full mt-3 ${
                      alert.type === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                      alert.type === 'warning' ? 'bg-orange-600 hover:bg-orange-700' :
                      'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {alert.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Quick Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</p>
              <p className="text-sm text-gray-600">Out of Stock</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</p>
              <p className="text-sm text-gray-600">Low Stock</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{highDebtCustomers.length}</p>
              <p className="text-sm text-gray-600">Customers with Debt</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(highDebtCustomers.reduce((sum, c) => sum + (c.outstanding_debt || 0), 0))}
              </p>
              <p className="text-sm text-gray-600">Total Outstanding</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPanel;
