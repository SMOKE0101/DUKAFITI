
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
  TrendingUp,
  Plus
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Customer, Product } from '../../types';

interface DashboardBottomSectionProps {
  sales: any[];
  products: Product[];
  customers: Customer[];
}

const DashboardBottomSection: React.FC<DashboardBottomSectionProps> = ({
  sales,
  products,
  customers
}) => {
  const navigate = useNavigate();

  // Calculate overdue customers and low stock products (exclude unspecified stock -1)
  const overdueCustomers = customers.filter(c => c.outstandingDebt > 0);
  const lowStockProducts = products.filter(p => p.currentStock !== -1 && p.currentStock <= (p.lowStockThreshold || 10));

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-full overflow-hidden">
      {/* Alerts & Reminders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {/* Low Stock Alerts */}
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-0 w-full">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm lg:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 overflow-hidden">
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-orange-500 flex-shrink-0" />
              <span className="truncate flex-1 min-w-0">Low Stock Alerts</span>
              {lowStockProducts.length > 0 && (
                <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs flex-shrink-0">
                  {lowStockProducts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4 lg:p-6 pt-0">
            {lowStockProducts.length > 0 ? (
              <>
                {lowStockProducts.slice(0, 3).map((product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-orange-100 dark:border-orange-900/20 bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-100/50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer w-full overflow-hidden"
                    onClick={() => navigate('/inventory')}
                  >
                    <div className="flex-1 min-w-0 mr-2 overflow-hidden">
                      <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {product.category}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge 
                        variant={product.currentStock <= 0 ? "destructive" : "secondary"}
                        className="text-xs whitespace-nowrap"
                      >
                        {product.currentStock} left
                      </Badge>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 3 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-xs sm:text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 h-8"
                    onClick={() => navigate('/inventory')}
                  >
                    View all {lowStockProducts.length} items
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-4 sm:py-8 text-gray-500 dark:text-gray-400">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">All items well stocked! 📦</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Customer Payments */}
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-0 w-full">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm lg:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 overflow-hidden">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-500 flex-shrink-0" />
              <span className="truncate flex-1 min-w-0">Overdue Payments</span>
              {overdueCustomers.length > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs flex-shrink-0">
                  {overdueCustomers.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4 lg:p-6 pt-0">
            {overdueCustomers.length > 0 ? (
              <>
                {overdueCustomers.slice(0, 3).map((customer) => (
                  <div 
                    key={customer.id} 
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors cursor-pointer w-full overflow-hidden"
                    onClick={() => navigate('/customers')}
                  >
                    <div className="flex-1 min-w-0 mr-2 overflow-hidden">
                      <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                        {customer.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {customer.phone}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-red-600 dark:text-red-400 text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency(customer.outstandingDebt)}
                      </div>
                    </div>
                  </div>
                ))}
                {overdueCustomers.length > 3 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-xs sm:text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 h-8"
                    onClick={() => navigate('/customers')}
                  >
                    View all {overdueCustomers.length} customers
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-4 sm:py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">All payments up to date! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Panel */}
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-0 w-full">
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-xs sm:text-sm lg:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-purple-500 flex-shrink-0" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Button 
              className="h-8 sm:h-10 lg:h-12 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all hover:scale-105 text-xs sm:text-sm p-1 sm:p-2"
              onClick={() => navigate('/sales')}
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Add Sale</span>
              <span className="sm:hidden truncate">Sale</span>
            </Button>
            
            <Button 
              className="h-8 sm:h-10 lg:h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all hover:scale-105 text-xs sm:text-sm p-1 sm:p-2"
              onClick={() => navigate('/inventory')}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Add Product</span>
              <span className="sm:hidden truncate">Product</span>
            </Button>
            
            <Button 
              className="h-8 sm:h-10 lg:h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all hover:scale-105 text-xs sm:text-sm p-1 sm:p-2"
              onClick={() => navigate('/customers')}
            >
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Add Customer</span>
              <span className="sm:hidden truncate">Customer</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardBottomSection;
