
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, TrendingUp, Users, Package } from 'lucide-react';
import { Customer, Product, Sale } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface DashboardBottomSectionProps {
  customers: Customer[];
  products: Product[];
  sales: Sale[];
}

const DashboardBottomSection: React.FC<DashboardBottomSectionProps> = ({
  customers,
  products,
  sales
}) => {
  // Calculate key metrics
  const totalOutstandingDebt = customers.reduce((total, customer) => total + (customer.outstanding_debt || 0), 0);
  const lowStockProducts = products.filter(product => 
    product.current_stock <= (product.low_stock_threshold || 10)
  );
  const outOfStockProducts = products.filter(product => product.current_stock === 0);
  const totalInventoryValue = products.reduce((total, product) => 
    total + (product.current_stock * product.selling_price), 0
  );

  // Get top customers by debt
  const topDebtors = customers
    .filter(customer => customer.outstanding_debt > 0)
    .sort((a, b) => b.outstanding_debt - a.outstanding_debt)
    .slice(0, 5);

  // Get recent low stock alerts
  const lowStockAlerts = lowStockProducts.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Outstanding Debt Overview */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <TrendingDown className="h-5 w-5" />
            Outstanding Debt Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Outstanding</span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(totalOutstandingDebt)}
              </span>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Top Debtors</h4>
              {topDebtors.length > 0 ? (
                topDebtors.map((customer) => (
                  <div key={customer.id} className="flex justify-between items-center py-1">
                    <span className="text-sm truncate flex-1 mr-2">{customer.name}</span>
                    <Badge variant="destructive" className="text-xs">
                      {formatCurrency(customer.outstanding_debt)}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No outstanding debt</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Alerts */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            Inventory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
                <div className="text-xs text-gray-600">Out of Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
                <div className="text-xs text-gray-600">Low Stock</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recent Alerts</h4>
              {lowStockAlerts.length > 0 ? (
                lowStockAlerts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center py-1">
                    <span className="text-sm truncate flex-1 mr-2">{product.name}</span>
                    <Badge 
                      variant={product.current_stock === 0 ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {product.current_stock} left
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">All products well stocked</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Insights */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Users className="h-5 w-5" />
            Customer Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{customers.length}</div>
                <div className="text-xs text-gray-600">Total Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {customers.filter(c => c.outstanding_debt === 0).length}
                </div>
                <div className="text-xs text-gray-600">Zero Debt</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Debt vs Credit Utilization</span>
                <span>{Math.round((totalOutstandingDebt / Math.max(customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0), 1)) * 100)}%</span>
              </div>
              <Progress 
                value={(totalOutstandingDebt / Math.max(customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0), 1)) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Value */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Package className="h-5 w-5" />
            Inventory Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(totalInventoryValue)}
              </div>
              <div className="text-sm text-gray-600">Total Inventory Value</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-700">{products.length}</div>
                <div className="text-xs text-gray-600">Total Products</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-700">
                  {products.reduce((sum, p) => sum + p.current_stock, 0)}
                </div>
                <div className="text-xs text-gray-600">Total Items</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardBottomSection;
