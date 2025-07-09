
import React, { useState } from 'react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import ReportsFiltersPanel from './reports/ReportsFiltersPanel';
import ReportsSummaryCards from './reports/ReportsSummaryCards';
import ReportsCharts from './reports/ReportsCharts';
import ReportsTables from './reports/ReportsTables';
import ReportsAlertsPanel from './reports/ReportsAlertsPanel';

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [filters, setFilters] = useState({
    salesType: 'all',
    category: 'all',
    customer: ''
  });

  // Use Supabase hooks
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { sales, loading: salesLoading } = useSupabaseSales();

  if (salesLoading || productsLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleExportCSV = () => {
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
      return saleDate >= dateRange.from && saleDate <= dateRange.to;
    });

    const csvData = filteredSales.map(sale => ({
      Date: new Date(sale.timestamp).toLocaleDateString(),
      'Order #': sale.id.slice(0, 8),
      Customer: sale.customerName || 'Walk-in',
      Product: sale.productName,
      'Payment Method': sale.paymentMethod,
      Total: sale.total,
    }));
    
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprehensive-report-${dateRange.from}-to-${dateRange.to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    // PDF export functionality can be implemented using libraries like jsPDF
    alert('PDF export functionality will be implemented with jsPDF library');
  };

  return (
    <div className="space-y-6">
      {/* Filters & Date Picker Panel */}
      <ReportsFiltersPanel
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Summary Metrics Cards */}
      <ReportsSummaryCards
        sales={sales}
        products={products}
        customers={customers}
        dateRange={dateRange}
      />

      {/* Charts Section */}
      <ReportsCharts
        sales={sales}
        dateRange={dateRange}
      />

      {/* Detailed Tables */}
      <ReportsTables
        sales={sales}
        dateRange={dateRange}
      />

      {/* Alerts Panel */}
      <ReportsAlertsPanel
        products={products}
        customers={customers}
      />
    </div>
  );
};

export default ReportsPage;
