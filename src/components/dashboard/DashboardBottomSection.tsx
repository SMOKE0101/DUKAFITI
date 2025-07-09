
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  AlertTriangle, 
  ShoppingCart, 
  UserPlus, 
  Package,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Customer, Product } from '../../types';

interface DashboardBottomSectionProps {
  overdueCustomers: Customer[];
  lowStockProducts: Product[];
}

const DashboardBottomSection: React.FC<DashboardBottomSectionProps> = ({
  overdueCustomers,
  lowStockProducts
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overdue Customers */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            Overdue Customers
            {overdueCustomers.length > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {overdueCustomers.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {overdueCustomers.length > 0 ? (
            <>
              {overdueCustomers.slice(0, 5).map((customer) => (
                <div 
                  key={customer.id} 
                  className="flex items-center justify-between p-3 rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  onClick={() => navigate('/customers')}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {customer.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {customer.phone}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600 dark:text-red-400 text-sm">
                      {formatCurrency(customer.outstandingDebt)}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs mt-1 h-6 px-2 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle remind action
                      }}
                    >
                      Remind
                    </Button>
                  </div>
                </div>
              ))}
              {overdueCustomers.length > 5 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-sm text-gray-600 hover:text-gray-900"
                  onClick={() => navigate('/customers')}
                >
                  View all {overdueCustomers.length} overdue customers
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All payments up to date! 🎉</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Low Stock Alerts
            {lowStockProducts.length > 0 && (
              <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800">
                {lowStockProducts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lowStockProducts.length > 0 ? (
            <>
              {lowStockProducts.slice(0, 5).map((product) => (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between p-3 rounded-xl border border-orange-100 dark:border-orange-900/20 bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-100/50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer"
                  onClick={() => navigate('/inventory')}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {product.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={product.currentStock <= 0 ? "destructive" : "secondary"}
                      className="text-xs mb-1"
                    >
                      {product.currentStock} left
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-6 px-2 border-orange-200 text-orange-600 hover:bg-orange-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle restock action
                      }}
                    >
                      Restock
                    </Button>
                  </div>
                </div>
              ))}
              {lowStockProducts.length > 5 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-sm text-gray-600 hover:text-gray-900"
                  onClick={() => navigate('/inventory')}
                >
                  View all {lowStockProducts.length} low stock items
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All items well stocked! 📦</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            onClick={() => navigate('/sales')}
          >
            <ShoppingCart className="w-5 h-5" />
            New Sale
          </Button>
          
          <Button 
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            onClick={() => navigate('/customers')}
          >
            <UserPlus className="w-5 h-5" />
            Add Customer
          </Button>
          
          <Button 
            className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            onClick={() => navigate('/inventory')}
          >
            <Package className="w-5 h-5" />
            Add Product
          </Button>
          
          <Button 
            variant="outline"
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
            onClick={() => navigate('/reports')}
          >
            <TrendingUp className="w-5 h-5" />
            View Reports
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardBottomSection;
