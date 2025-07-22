
import React from 'react';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import UltraPolishedReportsPage from './UltraPolishedReportsPage';
import DebtTransactionsTable from './DebtTransactionsTable';

const CleanReportsPage = () => {
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { sales, loading: salesLoading } = useSupabaseSales();

  if (salesLoading || productsLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <UltraPolishedReportsPage />
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Debt Management</h2>
          <p className="text-gray-600">Track debt transactions and payments</p>
        </div>
        <DebtTransactionsTable />
      </div>
    </div>
  );
};

export default CleanReportsPage;
