
import React, { useState, useEffect } from 'react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseTransactions } from '../hooks/useSupabaseTransactions';
import EnhancedTopbar from './layout/EnhancedTopbar';
import EnhancedStatsCards from './dashboard/EnhancedStatsCards';
import EnhancedCharts from './dashboard/EnhancedCharts';
import DashboardBottomSection from './dashboard/DashboardBottomSection';

const EnhancedDashboard = () => {
  const [stats, setStats] = useState({
    totalSalesToday: 0,
    totalOrdersToday: 0,
    activeCustomers: 0,
    lowStockProducts: 0,
    salesGrowth: 0,
    ordersGrowth: 0,
    customersGrowth: 0,
    stockGrowth: 0
  });

  // Use Supabase hooks
  const { customers } = useSupabaseCustomers();
  const { products } = useSupabaseProducts();
  const { sales } = useSupabaseSales();
  const { transactions } = useSupabaseTransactions();

  useEffect(() => {
    calculateStats();
  }, [customers, products, sales, transactions]);

  const calculateStats = () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    // Today's sales
    const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
    const yesterdaySales = sales.filter(s => new Date(s.timestamp).toDateString() === yesterday);
    
    const totalSalesToday = todaySales.reduce((sum, s) => sum + s.total, 0);
    const totalSalesYesterday = yesterdaySales.reduce((sum, s) => sum + s.total, 0);
    const salesGrowth = totalSalesYesterday > 0 
      ? Math.round(((totalSalesToday - totalSalesYesterday) / totalSalesYesterday) * 100)
      : 0;

    // Today's orders
    const totalOrdersToday = todaySales.length;
    const totalOrdersYesterday = yesterdaySales.length;
    const ordersGrowth = totalOrdersYesterday > 0
      ? Math.round(((totalOrdersToday - totalOrdersYesterday) / totalOrdersYesterday) * 100)
      : 0;

    // Active customers
    const activeCustomers = customers.length;

    // Low stock items
    const lowStockProducts = products.filter(p => p.currentStock <= p.lowStockThreshold).length;

    setStats({
      totalSalesToday,
      totalOrdersToday,
      activeCustomers,
      lowStockProducts,
      salesGrowth,
      ordersGrowth,
      customersGrowth: 0, // Could be calculated with historical data
      stockGrowth: 0 // Could be calculated with historical data
    });
  };

  // Get overdue customers and low stock products for bottom section
  const overdueCustomers = customers.filter(c => c.outstandingDebt > 0);
  const lowStockItems = products.filter(p => p.currentStock <= p.lowStockThreshold);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Topbar */}
      <EnhancedTopbar />

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-8">
        {/* Enhanced Stats Cards */}
        <div className="animate-fade-in">
          <EnhancedStatsCards stats={stats} />
        </div>

        {/* Enhanced Charts */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <EnhancedCharts sales={sales} />
        </div>

        {/* Bottom Section */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <DashboardBottomSection 
            overdueCustomers={overdueCustomers}
            lowStockProducts={lowStockItems}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
