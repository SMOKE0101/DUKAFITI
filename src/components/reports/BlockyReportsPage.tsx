
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, Package, Users, DollarSign, BarChart3, PieChart, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useOfflineManager } from '../../hooks/useOfflineManager';
import { formatCurrency } from '../../utils/currency';
import AggregatedReportsTables from './AggregatedReportsTables';
import ReportsCharts from './ReportsCharts';
import ReportsSummaryCards from './ReportsSummaryCards';
import ReportsAlertsPanel from './ReportsAlertsPanel';

const BlockyReportsPage = () => {
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    return {
      from: sevenDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  });

  const { sales, loading: salesLoading, refreshSales } = useSupabaseSales();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { syncPendingOperations, pendingOperations, isSyncing, forceSyncNow } = useOfflineManager();

  const isLoading = salesLoading || productsLoading || customersLoading;

  // Filter sales by date range
  const filteredSales = React.useMemo(() => {
    if (!sales) return [];
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
      return saleDate >= dateRange.from && saleDate <= dateRange.to;
    });
  }, [sales, dateRange]);

  // Force sync and refresh data
  const handleRefreshData = async () => {
    await forceSyncNow();
    await refreshSales();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header with Sync Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive sales and business insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {pendingOperations > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {pendingOperations} pending sync
            </Badge>
          )}
          
          <Button 
            onClick={handleRefreshData} 
            disabled={isSyncing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">From:</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">To:</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-auto"
              />
            </div>
            <Badge variant="outline" className="ml-auto">
              {filteredSales.length} sales in period
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <ReportsSummaryCards 
        sales={filteredSales} 
        products={products || []}
        customers={customers || []}
        dateRange={dateRange}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Detailed Tables
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportsCharts sales={filteredSales} dateRange={dateRange} />
            <ReportsAlertsPanel products={products || []} customers={customers || []} />
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <AggregatedReportsTables sales={filteredSales} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <ReportsCharts sales={filteredSales} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <ReportsAlertsPanel products={products || []} customers={customers || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockyReportsPage;
