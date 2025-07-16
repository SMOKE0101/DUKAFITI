
import React, { useState } from 'react';
import { Package, TrendingUp, Users, AlertTriangle, DollarSign, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../utils/currency';
import { useOfflineAwareData } from '../hooks/useOfflineAwareData';
import { Product, Customer, Sale } from '../types';

const DashboardTopbar = () => {
  const { 
    products = [], 
    customers = [], 
    sales = [],
    loading,
    error 
  } = useOfflineAwareData();

  // Calculate metrics
  const lowStockProducts = products.filter(
    product => product.current_stock <= product.low_stock_threshold
  );
  
  const totalStock = products.reduce((total, product) => {
    return total + (product.current_stock || 0);
  }, 0);

  const totalInventoryValue = products.reduce((total, product) => {
    return total + (product.current_stock * product.selling_price);
  }, 0);

  const customersWithDebt = customers.filter(
    customer => customer.outstanding_debt > 0
  );

  const totalOutstandingDebt = customersWithDebt.reduce(
    (total, customer) => total + customer.outstanding_debt,
    0
  );

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(sale => 
    sale.timestamp?.split('T')[0] === today
  );

  const todayRevenue = todaySales.reduce(
    (total, sale) => total + sale.total_amount,
    0
  );

  const todayProfit = todaySales.reduce(
    (total, sale) => total + (sale.profit || 0),
    0
  );

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error loading dashboard data: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold text-blue-700">{products.length}</p>
                <p className="text-xs text-blue-500 mt-1">Total Stock: {totalStock.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className={`${
          lowStockProducts.length > 0 
            ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
            : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
        } hover:shadow-md transition-shadow`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${
                  lowStockProducts.length > 0 ? 'text-red-600' : 'text-green-600'
                } text-sm font-medium`}>
                  Low Stock Products
                </p>
                <p className={`text-2xl font-bold ${
                  lowStockProducts.length > 0 ? 'text-red-700' : 'text-green-700'
                }`}>
                  {lowStockProducts.length}
                </p>
                {lowStockProducts.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">Needs restocking</p>
                )}
              </div>
              <AlertTriangle className={`h-8 w-8 ${
                lowStockProducts.length > 0 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Customers</p>
                <p className="text-2xl font-bold text-purple-700">{customers.length}</p>
                <p className="text-xs text-purple-500 mt-1">
                  With Debt: {customersWithDebt.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Debt */}
        <Card className={`${
          totalOutstandingDebt > 0 
            ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' 
            : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
        } hover:shadow-md transition-shadow`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${
                  totalOutstandingDebt > 0 ? 'text-yellow-600' : 'text-green-600'
                } text-sm font-medium`}>
                  Outstanding Debt
                </p>
                <p className={`text-2xl font-bold ${
                  totalOutstandingDebt > 0 ? 'text-yellow-700' : 'text-green-700'
                }`}>
                  {formatCurrency(totalOutstandingDebt)}
                </p>
                <p className={`text-xs mt-1 ${
                  totalOutstandingDebt > 0 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {customersWithDebt.length} customers
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${
                totalOutstandingDebt > 0 ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Today's Revenue</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(todayRevenue)}</p>
                <p className="text-xs text-emerald-500 mt-1">{todaySales.length} sales</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        {/* Today's Profit */}
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">Today's Profit</p>
                <p className="text-2xl font-bold text-indigo-700">{formatCurrency(todayProfit)}</p>
                <p className="text-xs text-indigo-500 mt-1">Net earnings</p>
              </div>
              <Zap className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-600 text-sm font-medium">Inventory Value</p>
                <p className="text-2xl font-bold text-teal-700">{formatCurrency(totalInventoryValue)}</p>
                <p className="text-xs text-teal-500 mt-1">At selling price</p>
              </div>
              <Package className="h-8 w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Online</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">All systems operational</p>
              </div>
              <div className="flex flex-col gap-1">
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {(lowStockProducts.length > 0 || customersWithDebt.length > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions Needed</h3>
          <div className="space-y-3">
            {lowStockProducts.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">
                    {lowStockProducts.length} products need restocking
                  </p>
                  <p className="text-sm text-red-600">
                    Low stock products: {lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}
                    {lowStockProducts.length > 2 && ` and ${lowStockProducts.length - 2} more`}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  View All
                </Button>
              </div>
            )}
            
            {customersWithDebt.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-800">
                    {formatCurrency(totalOutstandingDebt)} in outstanding debt
                  </p>
                  <p className="text-sm text-yellow-600">
                    {customersWithDebt.length} customers have pending payments
                  </p>
                </div>
                <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                  Follow Up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTopbar;
