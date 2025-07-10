
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Package, Users, DollarSign, BarChart3, Calendar } from 'lucide-react';

const ReportsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="relative z-10">
            <h1 className="font-mono text-4xl font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2">
              REPORTS
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Analyze your business performance and insights</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">TODAY'S SALES</h3>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">KES 12,450</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-xs text-green-600 mt-1">+15% from yesterday</div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">PROFIT</h3>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">KES 3,120</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-xs text-blue-600 mt-1">25% margin</div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">CUSTOMERS</h3>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">47</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-xs text-purple-600 mt-1">12 new today</div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">LOW STOCK</h3>
                <p className="text-3xl font-semibold text-red-600 dark:text-red-400 mt-2">3</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-xs text-red-600 mt-1">Needs restocking</div>
          </Card>
        </div>

        {/* Reports Content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <Tabs defaultValue="overview" className="p-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="sales" className="rounded-lg">Sales</TabsTrigger>
              <TabsTrigger value="products" className="rounded-lg">Products</TabsTrigger>
              <TabsTrigger value="customers" className="rounded-lg">Customers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                <h3 className="font-mono text-lg font-bold uppercase tracking-wider text-gray-900 dark:text-white">BUSINESS OVERVIEW</h3>
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Sales Performance
                      </CardTitle>
                      <CardDescription>Your sales trend over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Chart visualization would be displayed here</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sales" className="mt-6">
              <div className="space-y-6">
                <h3 className="font-mono text-lg font-bold uppercase tracking-wider text-gray-900 dark:text-white">SALES ANALYSIS</h3>
                <div className="grid gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-2">Top Selling Products Today</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Milk 1L</span>
                        <span className="font-semibold">24 sold - KES 2,880</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bread</span>
                        <span className="font-semibold">18 sold - KES 1,800</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sugar 2kg</span>
                        <span className="font-semibold">12 sold - KES 2,880</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="products" className="mt-6">
              <div className="space-y-6">
                <h3 className="font-mono text-lg font-bold uppercase tracking-wider text-gray-900 dark:text-white">PRODUCT ANALYSIS</h3>
                <p className="text-gray-600 dark:text-gray-400">Product performance and inventory insights</p>
              </div>
            </TabsContent>
            
            <TabsContent value="customers" className="mt-6">
              <div className="space-y-6">
                <h3 className="font-mono text-lg font-bold uppercase tracking-wider text-gray-900 dark:text-white">CUSTOMER ANALYSIS</h3>
                <p className="text-gray-600 dark:text-gray-400">Customer behavior and retention metrics</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
