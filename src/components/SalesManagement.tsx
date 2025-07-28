
import React from 'react';
import RebuiltModernSalesPage from './RebuiltModernSalesPage';
import SalesErrorBoundary from './sales/SalesErrorBoundary';

const SalesManagement = () => {
  console.log('🔥 SalesManagement component loaded - should render OptimizedModernSalesPage with error boundary');
  
  return (
    <SalesErrorBoundary>
      <RebuiltModernSalesPage />
    </SalesErrorBoundary>
  );
};

export default SalesManagement;
