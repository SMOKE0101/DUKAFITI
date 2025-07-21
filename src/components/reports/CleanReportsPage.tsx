import React, { useState, useMemo } from 'react';
import { DollarSign, ShoppingCart, Users, Package, Search, CreditCard, Banknote, HandCoins } from 'lucide-react';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { useSupabaseDebtPayments } from '../../hooks/useSupabaseDebtPayments';
import { formatCurrency } from '../../utils/currency';
import OutlinedMetricCard from './OutlinedMetricCard';
import SalesTrendChart from './SalesTrendChart';
import OrdersPerHourChart from './OrdersPerHourChart';
import AlertsPanel from './AlertsPanel';
import { useIsMobile } from '../../hooks/use-mobile';

type DateRange = 'today' | 'week' | 'month';
type TableDateRange = 'today' | 'week' | 'month' | 'all';

const formatDateLabel = (dateStr: string, format: string): string => {
  const date = new Date(dateStr);
  switch (format) {
    case 'hour':
      return date.getHours().toString().padStart(2, '0') + ':00';
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    default:
      return date.toLocaleDateString();
  }
};

const CleanReportsPage = () => {
  const [globalDateRange, setGlobalDateRange] = useState<DateRange>('today');
  const [salesChartResolution, setSalesChartResolution] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [ordersChartView, setOrdersChartView] = useState<'daily' | '2weeks'>('daily');
  
  // Table search states
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [productProfitsSearchTerm, setProductProfitsSearchTerm] = useState('');
  const [debtTransactionsSearchTerm, setDebtTransactionsSearchTerm] = useState('');
  const [debtPaymentsSearchTerm, setDebtPaymentsSearchTerm] = useState('');

  // Independent table date range states
  const [salesTableDateRange, setSalesTableDateRange] = useState<TableDateRange>('today');
  const [productProfitsTableDateRange, setProductProfitsTableDateRange] = useState<TableDateRange>('today');
  const [debtTransactionsTableDateRange, setDebtTransactionsTableDateRange] = useState<TableDateRange>('today');
  const [debtPaymentsTableDateRange, setDebtPaymentsTableDateRange] = useState<TableDateRange>('today');

  const isMobile = useIsMobile();

  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { sales, loading: salesLoading } = useSupabaseSales();
  const { debtPayments, loading: debtPaymentsLoading } = useSupabaseDebtPayments();

  // Global date range for summary cards and charts
  const getGlobalDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (globalDateRange) {
      case 'today':
        return { from: today, to: now };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { from: weekAgo, to: now };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { from: monthAgo, to: now };
      default:
        return { from: today, to: now };
    }
  };

  // Independent table date range function
  const getTableDateRange = (range: TableDateRange) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return { from: today, to: now };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { from: weekAgo, to: now };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { from: monthAgo, to: now };
      case 'all':
        // Get earliest sale date or 1 year ago, whichever is more recent
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return { from: oneYearAgo, to: now };
      default:
        return { from: today, to: now };
    }
  };

  const { from: globalFromDate, to: globalToDate } = getGlobalDateRange();

  // Summary cards sales (uses global date range)
  const summaryCardsSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= globalFromDate && saleDate <= globalToDate;
    });
  }, [sales, globalFromDate, globalToDate]);

  const summaryMetrics = useMemo(() => {
    const totalRevenue = summaryCardsSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalOrders = summaryCardsSales.length;
    const activeCustomers = new Set(summaryCardsSales.map(sale => sale.customerId).filter(Boolean)).size;
    const lowStockProducts = products.filter(product => 
      (product.currentStock || 0) <= (product.lowStockThreshold || 10)
    ).length;

    const revenueByCash = summaryCardsSales
      .filter(sale => sale.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + (sale.total || 0), 0);
    
    const revenueByMpesa = summaryCardsSales
      .filter(sale => sale.paymentMethod === 'mpesa')
      .reduce((sum, sale) => sum + (sale.total || 0), 0);
    
    const revenueByDebt = summaryCardsSales
      .filter(sale => sale.paymentMethod === 'debt')
      .reduce((sum, sale) => sum + (sale.total || 0), 0);

    return { 
      totalRevenue, 
      totalOrders, 
      activeCustomers, 
      lowStockProducts,
      revenueByCash,
      revenueByMpesa,
      revenueByDebt
    };
  }, [summaryCardsSales, products]);

  // Ultra-accurate sales trend data calculation
  const salesTrendData = useMemo(() => {
    const now = new Date();
    let chartFromDate: Date;
    let bucketFormat: 'hour' | 'day' | 'month';
    let timePoints: string[] = [];
    
    switch (salesChartResolution) {
      case 'hourly':
        // Last 24 hours with precise hour boundaries
        chartFromDate = new Date(now);
        chartFromDate.setHours(chartFromDate.getHours() - 23, 0, 0, 0); // 24 hours ago, start of hour
        bucketFormat = 'hour';
        
        // Generate 24 precise hour buckets
        for (let i = 0; i < 24; i++) {
          const hourTime = new Date(chartFromDate);
          hourTime.setHours(chartFromDate.getHours() + i, 0, 0, 0);
          timePoints.push(hourTime.toISOString().substring(0, 13) + ':00:00.000Z');
        }
        break;
        
      case 'daily':
        // Last 30 days with precise day boundaries
        chartFromDate = new Date(now);
        chartFromDate.setDate(chartFromDate.getDate() - 29);
        chartFromDate.setHours(0, 0, 0, 0);
        bucketFormat = 'day';
        
        // Generate 30 precise day buckets
        for (let i = 0; i < 30; i++) {
          const dayTime = new Date(chartFromDate);
          dayTime.setDate(chartFromDate.getDate() + i);
          timePoints.push(dayTime.toISOString().substring(0, 10));
        }
        break;
        
      case 'monthly':
        // Last 12 months with precise month boundaries
        chartFromDate = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);
        bucketFormat = 'month';
        
        // Generate 12 precise month buckets
        for (let i = 0; i < 12; i++) {
          const monthTime = new Date(chartFromDate.getFullYear(), chartFromDate.getMonth() + i, 1);
          const monthKey = monthTime.getFullYear() + '-' + String(monthTime.getMonth() + 1).padStart(2, '0');
          timePoints.push(monthKey);
        }
        break;
        
      default:
        chartFromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        bucketFormat = 'day';
        for (let i = 0; i < 30; i++) {
          const dayTime = new Date(chartFromDate);
          dayTime.setDate(chartFromDate.getDate() + i);
          timePoints.push(dayTime.toISOString().substring(0, 10));
        }
    }

    // Filter sales within the precise timeframe
    const chartSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= chartFromDate && saleDate <= now;
    });

    // Initialize all time buckets with zero
    const groupedData: Record<string, number> = {};
    timePoints.forEach(point => {
      groupedData[point] = 0;
    });
    
    // Aggregate sales into precise time buckets
    chartSales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      let bucketKey: string;
      
      switch (bucketFormat) {
        case 'hour':
          // Round down to exact hour boundary
          const hourBucket = new Date(saleDate);
          hourBucket.setMinutes(0, 0, 0);
          bucketKey = hourBucket.toISOString().substring(0, 13) + ':00:00.000Z';
          break;
          
        case 'day':
          // Use precise date boundary (YYYY-MM-DD)
          bucketKey = saleDate.toISOString().substring(0, 10);
          break;
          
        case 'month':
          // Use precise year-month boundary (YYYY-MM)
          bucketKey = saleDate.getFullYear() + '-' + String(saleDate.getMonth() + 1).padStart(2, '0');
          break;
          
        default:
          bucketKey = saleDate.toISOString().substring(0, 10);
      }
      
      // Only add to bucket if it exists in our time points
      if (groupedData.hasOwnProperty(bucketKey)) {
        groupedData[bucketKey] += (sale.total || 0);
      }
    });
    
    // Convert to chart format with precise labels
    return timePoints.map(timePoint => {
      const revenue = groupedData[timePoint] || 0;
      let displayLabel: string;
      
      switch (bucketFormat) {
        case 'hour':
          const hourDate = new Date(timePoint);
          displayLabel = hourDate.getHours().toString().padStart(2, '0') + ':00';
          break;
          
        case 'day':
          const dayDate = new Date(timePoint + 'T00:00:00Z');
          displayLabel = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
          
        case 'month':
          const [year, month] = timePoint.split('-');
          const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          displayLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
          
        default:
          displayLabel = timePoint;
      }
      
      return {
        date: displayLabel,
        revenue
      };
    });
  }, [sales, salesChartResolution]);

  const salesTrendTotal = useMemo(() => {
    return salesTrendData.reduce((sum, item) => sum + item.revenue, 0);
  }, [salesTrendData]);

  // Ultra-accurate orders per hour/day data calculation
  const ordersPerHourData = useMemo(() => {
    const now = new Date();
    let chartFromDate: Date;
    let bucketFormat: 'hour' | 'day';
    let timePoints: string[] = [];
    
    switch (ordersChartView) {
      case 'daily':
        // Today's hours with precise hour boundaries
        chartFromDate = new Date(now);
        chartFromDate.setHours(0, 0, 0, 0); // Start of today
        bucketFormat = 'hour';
        
        // Generate 24 precise hour buckets for today
        for (let i = 0; i < 24; i++) {
          const hourTime = new Date(chartFromDate);
          hourTime.setHours(i, 0, 0, 0);
          timePoints.push(hourTime.toISOString().substring(0, 13) + ':00:00.000Z');
        }
        break;
        
      case '2weeks':
        // Last 14 days with precise day boundaries
        chartFromDate = new Date(now);
        chartFromDate.setDate(chartFromDate.getDate() - 13); // 14 days including today
        chartFromDate.setHours(0, 0, 0, 0);
        bucketFormat = 'day';
        
        // Generate 14 precise day buckets
        for (let i = 0; i < 14; i++) {
          const dayTime = new Date(chartFromDate);
          dayTime.setDate(chartFromDate.getDate() + i);
          timePoints.push(dayTime.toISOString().substring(0, 10));
        }
        break;
        
      default:
        chartFromDate = new Date(now);
        chartFromDate.setHours(0, 0, 0, 0);
        bucketFormat = 'hour';
        for (let i = 0; i < 24; i++) {
          const hourTime = new Date(chartFromDate);
          hourTime.setHours(i, 0, 0, 0);
          timePoints.push(hourTime.toISOString().substring(0, 13) + ':00:00.000Z');
        }
    }

    // Filter sales within the precise timeframe
    const chartSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= chartFromDate && saleDate <= now;
    });

    // Initialize all time buckets with zero
    const groupedData: Record<string, number> = {};
    timePoints.forEach(point => {
      groupedData[point] = 0;
    });
    
    // Aggregate orders into precise time buckets
    chartSales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      let bucketKey: string;
      
      switch (bucketFormat) {
        case 'hour':
          // Round down to exact hour boundary
          const hourBucket = new Date(saleDate);
          hourBucket.setMinutes(0, 0, 0);
          bucketKey = hourBucket.toISOString().substring(0, 13) + ':00:00.000Z';
          break;
          
        case 'day':
          // Use precise date boundary
          bucketKey = saleDate.toISOString().substring(0, 10);
          break;
          
        default:
          bucketKey = saleDate.toISOString().substring(0, 10);
      }
      
      // Only count if bucket exists in our time points
      if (groupedData.hasOwnProperty(bucketKey)) {
        groupedData[bucketKey]++;
      }
    });
    
    // Convert to chart format with precise labels
    return timePoints.map(timePoint => {
      const orders = groupedData[timePoint] || 0;
      let displayLabel: string;
      
      switch (bucketFormat) {
        case 'hour':
          const hourDate = new Date(timePoint);
          displayLabel = hourDate.getHours().toString().padStart(2, '0') + ':00';
          break;
          
        case 'day':
          const dayDate = new Date(timePoint + 'T00:00:00Z');
          displayLabel = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
          
        default:
          displayLabel = timePoint;
      }
      
      return {
        hour: displayLabel,
        orders
      };
    });
  }, [sales, ordersChartView]);

  // Ultra-accurate sales table data with independent date range
  const salesTableData = useMemo(() => {
    const { from: tableFromDate, to: tableToDate } = getTableDateRange(salesTableDateRange);
    
    return sales
      .filter(sale => {
        const saleDate = new Date(sale.timestamp);
        const isInDateRange = saleDate >= tableFromDate && saleDate <= tableToDate;
        
        const matchesSearch = !salesSearchTerm || 
          sale.customerName?.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
          sale.productName?.toLowerCase().includes(salesSearchTerm.toLowerCase());
        
        return isInDateRange && matchesSearch;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(sale => ({
        id: sale.id,
        date: new Date(sale.timestamp).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: new Date(sale.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        customer: sale.customerName || 'Walk-in Customer',
        product: sale.productName,
        quantity: sale.quantity,
        amount: sale.total || 0,
        paymentMethod: sale.paymentMethod,
        timestamp: sale.timestamp // Keep for accurate sorting
      }));
  }, [sales, salesTableDateRange, salesSearchTerm]);

  // Ultra-accurate product profits table data with independent date range
  const productProfitsTableData = useMemo(() => {
    const { from: tableFromDate, to: tableToDate } = getTableDateRange(productProfitsTableDateRange);
    
    // Filter sales within the date range
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= tableFromDate && saleDate <= tableToDate;
    });

    // Group sales by product
    const productSalesMap: Record<string, {
      productName: string;
      totalQuantity: number;
      salesAmount: number;
      profit: number;
    }> = {};

    filteredSales.forEach(sale => {
      const productKey = sale.productId;
      const productName = sale.productName;
      
      if (!productSalesMap[productKey]) {
        productSalesMap[productKey] = {
          productName,
          totalQuantity: 0,
          salesAmount: 0,
          profit: 0
        };
      }
      
      productSalesMap[productKey].totalQuantity += sale.quantity || 0;
      productSalesMap[productKey].salesAmount += sale.total || 0;
      productSalesMap[productKey].profit += sale.profit || 0;
    });

    // Convert to array and apply search filter
    return Object.values(productSalesMap)
      .filter(product => {
        if (!productProfitsSearchTerm) return true;
        return product.productName?.toLowerCase().includes(productProfitsSearchTerm.toLowerCase());
      })
      .sort((a, b) => b.profit - a.profit) // Sort by profit descending
      .map((product, index) => ({
        id: `product-${index}`,
        product: product.productName,
        totalQuantity: product.totalQuantity,
        salesAmount: product.salesAmount,
        profit: product.profit
      }));
  }, [sales, productProfitsTableDateRange, productProfitsSearchTerm]);

  // Ultra-accurate debt transactions data with independent date range
  const debtTransactionsData = useMemo(() => {
    const { from: tableFromDate, to: tableToDate } = getTableDateRange(debtTransactionsTableDateRange);
    
    return sales
      .filter(sale => {
        const saleDate = new Date(sale.timestamp);
        const isInDateRange = saleDate >= tableFromDate && saleDate <= tableToDate;
        const isDebtSale = sale.paymentMethod === 'debt';
        
        const matchesSearch = !debtTransactionsSearchTerm || 
          sale.customerName?.toLowerCase().includes(debtTransactionsSearchTerm.toLowerCase()) ||
          sale.productName?.toLowerCase().includes(debtTransactionsSearchTerm.toLowerCase());
        
        return isInDateRange && isDebtSale && matchesSearch;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(sale => ({
        id: sale.id,
        date: new Date(sale.timestamp).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: new Date(sale.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        customer: sale.customerName || 'Unknown Customer',
        product: sale.productName,
        amount: sale.total || 0,
        type: 'Debt Sale',
        timestamp: sale.timestamp // Keep for accurate sorting
      }));
  }, [sales, debtTransactionsTableDateRange, debtTransactionsSearchTerm]);

  // Ultra-accurate debt payments data with independent date range - FIXED
  const debtPaymentsData = useMemo(() => {
    if (!debtPayments || debtPayments.length === 0) return [];
    
    const { from: tableFromDate, to: tableToDate } = getTableDateRange(debtPaymentsTableDateRange);
    
    return debtPayments
      .filter(payment => {
        // Use the payment timestamp for accurate date filtering
        const paymentDate = new Date(payment.timestamp);
        const isInDateRange = paymentDate >= tableFromDate && paymentDate <= tableToDate;
        
        // Apply search filter
        const matchesSearch = !debtPaymentsSearchTerm || 
          payment.customer_name?.toLowerCase().includes(debtPaymentsSearchTerm.toLowerCase());
        
        return isInDateRange && matchesSearch;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(payment => ({
        id: payment.id,
        date: new Date(payment.timestamp).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: new Date(payment.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        customer: payment.customer_name || 'Unknown Customer',
        amount: payment.amount || 0,
        method: payment.payment_method?.charAt(0).toUpperCase() + payment.payment_method?.slice(1) || 'Unknown',
        notes: payment.reference || 'No notes',
        timestamp: payment.timestamp // Keep for accurate sorting
      }));
  }, [debtPayments, debtPaymentsTableDateRange, debtPaymentsSearchTerm]);

  const lowStockProducts = products.filter(p => (p.currentStock || 0) <= (p.lowStockThreshold || 10));
  const overdueCustomers = customers.filter(c => (c.outstandingDebt || 0) > 0);

  // Ultra-accurate CSV download functions
  const handleDownloadSalesCSV = () => {
    if (salesTableData.length === 0) return;
    
    const csvHeaders = ['Date', 'Time', 'Customer', 'Product', 'Quantity', 'Amount', 'Payment Method'];
    const csvRows = salesTableData.map(row => [
      row.date,
      row.time,
      row.customer,
      row.product,
      row.quantity.toString(),
      row.amount.toString(),
      row.paymentMethod
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${salesTableDateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadProductProfitsCSV = () => {
    if (productProfitsTableData.length === 0) return;
    
    const csvHeaders = ['Product', 'Total Quantity', 'Sales Amount', 'Profit'];
    const csvRows = productProfitsTableData.map(row => [
      row.product,
      row.totalQuantity.toString(),
      row.salesAmount.toString(),
      row.profit.toString()
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-profits-report-${productProfitsTableDateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Ultra-accurate debt transactions CSV download
  const handleDownloadDebtTransactionsCSV = () => {
    if (debtTransactionsData.length === 0) return;
    
    const csvHeaders = ['Date', 'Time', 'Customer', 'Product', 'Amount', 'Type'];
    const csvRows = debtTransactionsData.map(row => [
      row.date,
      row.time,
      row.customer,
      row.product,
      row.amount.toString(),
      row.type
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debt-transactions-report-${debtTransactionsTableDateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Ultra-accurate debt payments CSV download - FIXED
  const handleDownloadDebtPaymentsCSV = () => {
    if (debtPaymentsData.length === 0) return;
    
    const csvHeaders = ['Date', 'Time', 'Customer', 'Amount', 'Method', 'Notes'];
    const csvRows = debtPaymentsData.map(row => [
      row.date,
      row.time,
      row.customer,
      row.amount.toString(),
      row.method,
      row.notes
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debt-payments-report-${debtPaymentsTableDateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (salesLoading || productsLoading || customersLoading || debtPaymentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-600 mt-1">Analytics and insights for your business</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Timeframe Selector */}
        <div className="flex justify-center">
          <div className="inline-flex bg-gray-100 rounded-full p-1">
            {(['today', 'week', 'month'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setGlobalDateRange(range)}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  globalDateRange === range
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <OutlinedMetricCard
            title="TOTAL REVENUE"
            value={formatCurrency(summaryMetrics.totalRevenue)}
            icon={DollarSign}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            delay={0}
          />
          <OutlinedMetricCard
            title="TOTAL ORDERS"
            value={summaryMetrics.totalOrders}
            icon={ShoppingCart}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            delay={100}
          />
          <OutlinedMetricCard
            title="ACTIVE CUSTOMERS"
            value={summaryMetrics.activeCustomers}
            icon={Users}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
            delay={200}
          />
          <OutlinedMetricCard
            title="LOW STOCK"
            value={summaryMetrics.lowStockProducts}
            icon={Package}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            delay={300}
          />
          <OutlinedMetricCard
            title="CASH REVENUE"
            value={formatCurrency(summaryMetrics.revenueByCash)}
            icon={Banknote}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
            delay={400}
          />
          <OutlinedMetricCard
            title="M-PESA REVENUE"
            value={formatCurrency(summaryMetrics.revenueByMpesa)}
            icon={CreditCard}
            iconColor="text-cyan-600"
            iconBgColor="bg-cyan-100"
            delay={500}
          />
          <OutlinedMetricCard
            title="DEBT REVENUE"
            value={formatCurrency(summaryMetrics.revenueByDebt)}
            icon={HandCoins}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
            delay={600}
          />
        </div>

        {/* Charts Section - Stacked */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <SalesTrendChart
              data={salesTrendData}
              resolution={salesChartResolution}
              onResolutionChange={setSalesChartResolution}
              totalSales={salesTrendTotal}
            />
          </div>
          
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mt-6">
            <OrdersPerHourChart
              data={ordersPerHourData}
              view={ordersChartView}
              onViewChange={setOrdersChartView}
            />
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Sales Report */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Sales Report</h3>
              <div className="flex items-center gap-3">
                {/* Independent time frame selector for sales table */}
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                  {(['today', 'week', 'month', 'all'] as TableDateRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setSalesTableDateRange(range)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                        salesTableDateRange === range
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {range === 'today' ? 'Today' : 
                       range === 'week' ? 'Week' : 
                       range === 'month' ? 'Month' : 'All'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleDownloadSalesCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition"
                >
                  Download CSV
                </button>
              </div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by customer or product..."
                value={salesSearchTerm}
                onChange={(e) => setSalesSearchTerm(e.target.value)}
                className="bg-gray-100 px-4 py-2 pl-10 rounded-xl w-full max-w-md focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div className={`overflow-x-auto ${isMobile ? 'h-64' : 'h-80'}`}>
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salesTableData.slice(0, 50).map((row, index) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-900">{row.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.customer}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.product}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.quantity}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(row.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 uppercase">{row.paymentMethod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {salesTableData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No sales found for the selected time period
                </div>
              )}
            </div>
          </div>

          {/* Product Profits Report */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Product Profits</h3>
              <div className="flex items-center gap-3">
                {/* Independent time frame selector for product profits table */}
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                  {(['today', 'week', 'month', 'all'] as TableDateRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setProductProfitsTableDateRange(range)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                        productProfitsTableDateRange === range
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {range === 'today' ? 'Today' : 
                       range === 'week' ? 'Week' : 
                       range === 'month' ? 'Month' : 'All'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleDownloadProductProfitsCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition"
                >
                  Download CSV
                </button>
              </div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by product..."
                value={productProfitsSearchTerm}
                onChange={(e) => setProductProfitsSearchTerm(e.target.value)}
                className="bg-gray-100 px-4 py-2 pl-10 rounded-xl w-full max-w-md focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div className={`overflow-x-auto ${isMobile ? 'h-64' : 'h-80'}`}>
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {productProfitsTableData.slice(0, 50).map((row, index) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-900">{row.product}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.totalQuantity}</td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">{formatCurrency(row.salesAmount)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(row.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productProfitsTableData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No product sales found for the selected time period
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Debt Tables Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Debt Transactions */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Debt Transactions</h3>
              <div className="flex items-center gap-3">
                {/* Independent time frame selector for debt transactions table */}
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                  {(['today', 'week', 'month', 'all'] as TableDateRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setDebtTransactionsTableDateRange(range)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                        debtTransactionsTableDateRange === range
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {range === 'today' ? 'Today' : 
                       range === 'week' ? 'Week' : 
                       range === 'month' ? 'Month' : 'All'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleDownloadDebtTransactionsCSV}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition"
                >
                  Download CSV
                </button>
              </div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by customer or product..."
                value={debtTransactionsSearchTerm}
                onChange={(e) => setDebtTransactionsSearchTerm(e.target.value)}
                className="bg-gray-100 px-4 py-2 pl-10 rounded-xl w-full max-w-md focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div className={`overflow-x-auto ${isMobile ? 'h-64' : 'h-80'}`}>
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {debtTransactionsData.slice(0, 50).map((row, index) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-900">{row.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.customer}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.product}</td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600">{formatCurrency(row.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {debtTransactionsData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No debt transactions found for the selected time period
                </div>
              )}
            </div>
          </div>

          {/* Debt Payments - FIXED AND ULTRA ACCURATE */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Debt Payments</h3>
              <div className="flex items-center gap-3">
                {/* Independent time frame selector for debt payments table */}
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                  {(['today', 'week', 'month', 'all'] as TableDateRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setDebtPaymentsTableDateRange(range)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                        debtPaymentsTableDateRange === range
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {range === 'today' ? 'Today' : 
                       range === 'week' ? 'Week' : 
                       range === 'month' ? 'Month' : 'All'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleDownloadDebtPaymentsCSV}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                  Download CSV
                </button>
              </div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by customer..."
                value={debtPaymentsSearchTerm}
                onChange={(e) => setDebtPaymentsSearchTerm(e.target.value)}
                className="bg-gray-100 px-4 py-2 pl-10 rounded-xl w-full max-w-md focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div className={`overflow-x-auto ${isMobile ? 'h-64' : 'h-80'}`}>
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {debtPaymentsData.slice(0, 50).map((row, index) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-900">{row.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.customer}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(row.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.method}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {debtPaymentsData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No debt payments found for the selected time period
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <AlertsPanel
          lowStockProducts={lowStockProducts}
          overdueCustomers={overdueCustomers}
        />
      </div>
    </div>
  );
};

export default CleanReportsPage;
