
import React, { useState, useEffect } from 'react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseTransactions } from '../hooks/useSupabaseTransactions';
import EnhancedTopbar from './layout/EnhancedTopbar';
import EnhancedStatsCards from './dashboard/EnhancedStatsCards';
import DashboardBottomSection from './dashboard/DashboardBottomSection';

const EnhancedDashboard = () => {
  // Use Supabase hooks
  const { customers } = useSupabaseCustomers();
  const { products } = useSupabaseProducts();
  const { sales } = useSupabaseSales();
  const { transactions } = useSupabaseTransactions();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Topbar */}
      <EnhancedTopbar />

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-8">
        {/* Enhanced Stats Cards */}
        <div className="animate-fade-in">
          <EnhancedStatsCards 
            sales={sales}
            products={products}
            customers={customers}
          />
        </div>

        {/* Bottom Section with Alerts and Quick Actions */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <DashboardBottomSection 
            sales={sales}
            products={products}
            customers={customers}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
