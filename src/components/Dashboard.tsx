
import React from 'react';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import EnhancedStatsCards from './dashboard/EnhancedStatsCards';
import DashboardBottomSection from './dashboard/DashboardBottomSection';

const Dashboard = () => {
  const { sales, loading: salesLoading } = useSupabaseSales();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();

  if (salesLoading || productsLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <EnhancedStatsCards 
        sales={sales}
        products={products}
        customers={customers}
      />

      {/* Bottom Section */}
      <DashboardBottomSection 
        sales={sales}
        products={products}
        customers={customers}
      />
    </div>
  );
};

export default Dashboard;
