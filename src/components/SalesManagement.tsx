
import React from 'react';
import OptimizedModernSalesPage from './OptimizedModernSalesPage';
import SalesErrorBoundary from './sales/SalesErrorBoundary';

const SalesManagement = () => {
  console.log('🔥 SalesManagement component loaded - should render OptimizedModernSalesPage with error boundary');
  
  return (
    <SalesErrorBoundary>
      <OptimizedModernSalesPage />
    </SalesErrorBoundary>
  );
};

export default SalesManagement;
