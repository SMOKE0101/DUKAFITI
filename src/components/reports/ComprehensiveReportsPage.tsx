
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useUnifiedSales } from '@/hooks/useUnifiedSales';
import { useUnifiedCustomers } from '@/hooks/useUnifiedCustomers';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { formatCurrency } from '@/utils/currency';
import { safeNumber } from '@/utils/dateUtils';

// Component imports
import TimeFramePicker, { TimeFrameData, DateRange } from './TimeFramePicker';
import EnhancedSummaryCards from './EnhancedSummaryCards';
import AdvancedCharts from './AdvancedCharts';
import DataTables from './DataTables';
import AlwaysCurrentPanels from './AlwaysCurrentPanels';

const ComprehensiveReportsPage: React.FC = () => {
  // Get initial time frame (today)
  const getInitialTimeFrame = (): TimeFrameData => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      type: 'today',
      startDate: today,
      endDate: new Date(),
      label: 'Today'
    };
  };

  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrameData>(getInitialTimeFrame());
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  // Hooks for data
  const { sales, loading: salesLoading } = useUnifiedSales();
  const { customers, loading: customersLoading } = useUnifiedCustomers();
  const { products, loading: productsLoading } = useUnifiedProducts();

  const loading = salesLoading || customersLoading || productsLoading;

  // Memoized summary data
  const summaryData = useMemo(() => {
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= selectedTimeFrame.startDate && saleDate <= selectedTimeFrame.endDate;
    });

    const totalSales = filteredSales.reduce((sum, sale) => sum + safeNumber(sale.total), 0);
    const totalOrders = filteredSales.length;

    // Calculate sales by payment method
    let cashSales = 0;
    let mpesaSales = 0;
    let creditSales = 0;

    filteredSales.forEach(sale => {
      const total = safeNumber(sale.total);
      const paymentDetails = sale.paymentDetails || { cashAmount: 0, mpesaAmount: 0, debtAmount: 0 };
      
      switch (sale.paymentMethod) {
        case 'cash':
          cashSales += total;
          break;
        case 'mpesa':
          mpesaSales += total;
          break;
        case 'debt':
          creditSales += total;
          break;
        case 'partial':
          cashSales += safeNumber(paymentDetails.cashAmount);
          mpesaSales += safeNumber(paymentDetails.mpesaAmount);
          creditSales += safeNumber(paymentDetails.debtAmount);
          break;
        default:
          cashSales += total; // Default to cash if unknown
      }
    });

    return {
      totalSales,
      totalOrders,
      cashSales,
      mpesaSales,
      creditSales
    };
  }, [sales, selectedTimeFrame]);

  // Handle time frame changes
  const handleTimeFrameChange = useCallback((timeFrame: TimeFrameData) => {
    setSelectedTimeFrame(timeFrame);
  }, []);

  const handleCustomRangeChange = useCallback((range: DateRange) => {
    setCustomRange(range);
  }, []);

  // Export functionality
  const handleExportReports = useCallback(() => {
    const reportData = {
      timeFrame: selectedTimeFrame,
      summary: summaryData,
      salesCount: sales.length,
      customersCount: customers.length,
      productsCount: products.length,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dukafiti-reports-${selectedTimeFrame.type}-${new Date().toISOString().substring(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [selectedTimeFrame, summaryData, sales.length, customers.length, products.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Time Frame Picker - Sticky Header */}
      <TimeFramePicker
        selectedTimeFrame={selectedTimeFrame}
        onTimeFrameChange={handleTimeFrameChange}
        customRange={customRange}
        onCustomRangeChange={handleCustomRangeChange}
      />

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground mb-2">
              📊 Business Reports
            </h1>
            <p className="text-muted-foreground">
              Comprehensive insights for {selectedTimeFrame.label.toLowerCase()}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleExportReports}
              className="gap-2 font-bold rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <EnhancedSummaryCards data={summaryData} loading={loading} />

        {/* Charts Section */}
        <AdvancedCharts 
          sales={sales} 
          timeFrame={selectedTimeFrame} 
          loading={loading}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Data Tables - Takes up 2/3 width on large screens */}
          <div className="xl:col-span-2">
            <DataTables 
              sales={sales} 
              timeFrame={selectedTimeFrame} 
              loading={loading}
            />
          </div>

          {/* Always Current Panels - Takes up 1/3 width on large screens */}
          <div className="xl:col-span-1">
            <div className="space-y-6">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  Live Data Panels
                </p>
                <p className="text-xs text-muted-foreground">
                  These panels show current status regardless of time filter
                </p>
              </div>
              
              <AlwaysCurrentPanels 
                products={products} 
                customers={customers} 
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center py-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Report generated on {new Date().toLocaleString()} • 
            Showing data for {selectedTimeFrame.label.toLowerCase()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveReportsPage;
