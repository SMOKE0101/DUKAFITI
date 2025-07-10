
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarDays, TrendingUp, DollarSign, ShoppingCart, Users, Package, Download, Filter } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../hooks/useSupabaseSales';

const ReportsPage = () => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { sales, loading: salesLoading } = useSupabaseSales();

  const loading = productsLoading || customersLoading || salesLoading;

  // Calculate metrics
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalSales = sales.length;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Title - Consistent with other pages */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
              REPORTS
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
              Analyze your business performance and generate insights
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
            >
              <Download className="w-4 h-4 mr-2 stroke-2" />
              EXPORT DATA
            </Button>
            
            <Button 
              className="bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-2 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
            >
              <Filter className="w-4 h-4 mr-2 stroke-2" />
              FILTER REPORTS
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Date Range Filter */}
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-gray-500" />
                <span className="font-mono font-bold uppercase tracking-tight text-gray-700 dark:text-gray-300">
                  DATE RANGE:
                </span>
              </div>
              <div className="flex gap-4">
                <DatePicker
                  date={dateFrom}
                  onSelect={setDateFrom}
                  placeholder="From date"
                />
                <DatePicker
                  date={dateTo}
                  onSelect={setDateTo}
                  placeholder="To date"
                />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                APPLY FILTER
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-green-600 dark:text-green-400">
                    TOTAL REVENUE
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl">
                  <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400">
                    TOTAL PROFIT
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(totalProfit)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-purple-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-purple-600 dark:text-purple-400">
                    TOTAL SALES
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {totalSales}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl">
                  <ShoppingCart className="w-8 h-8 text-purple-600 dark:text-purple-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-orange-200 dark:border-orange-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-orange-600 dark:text-orange-400">
                    AVG ORDER VALUE
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(averageOrderValue)}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl">
                  <Package className="w-8 h-8 text-orange-600 dark:text-orange-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales Table */}
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white">
              RECENT SALES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-3 font-mono font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400">
                      PRODUCT
                    </th>
                    <th className="text-left p-3 font-mono font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400">
                      CUSTOMER
                    </th>
                    <th className="text-left p-3 font-mono font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400">
                      AMOUNT
                    </th>
                    <th className="text-left p-3 font-mono font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400">
                      PROFIT
                    </th>
                    <th className="text-left p-3 font-mono font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400">
                      DATE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 10).map((sale) => (
                    <tr key={sale.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3 font-medium text-gray-900 dark:text-white">
                        {sale.productName}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {sale.customerName || 'Walk-in Customer'}
                      </td>
                      <td className="p-3 font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(sale.profit)}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {new Date(sale.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
