
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
  Plus,
  FileUp,
  RefreshCw
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
    <div className="space-y-8">
      {/* Alerts & Reminders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Low Stock Alerts
              {lowStockProducts.length > 0 && (
                <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
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
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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

        {/* Overdue Customer Payments */}
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" />
              Overdue Payments
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
                    </div>
                  </div>
                ))}
                {overdueCustomers.length > 5 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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
      </div>

      {/* Quick Actions Panel */}
      <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Button 
              className="h-12 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-105"
              onClick={() => navigate('/sales')}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Add Sale</span>
            </Button>
            
            <Button 
              className="h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-105"
              onClick={() => navigate('/inventory')}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Product</span>
            </Button>
            
            <Button 
              className="h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-105"
              onClick={() => navigate('/customers')}
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Customer</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-12 rounded-lg flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all hover:scale-105"
            >
              <FileUp className="w-5 h-5" />
              <span className="hidden sm:inline">Import CSV</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-12 rounded-lg flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all hover:scale-105"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline">Sync Now</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardBottomSection;
