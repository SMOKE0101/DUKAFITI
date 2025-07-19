
import React from 'react';
import ComprehensiveSalesPage from './ComprehensiveSalesPage';
import SalesErrorBoundary from './sales/SalesErrorBoundary';

const SalesManagement = () => {
  console.log('🔥 SalesManagement component loaded - rendering ComprehensiveSalesPage with error boundary');
  
  return (
    <SalesErrorBoundary>
      <ComprehensiveSalesPage />
    </SalesErrorBoundary>
  );
};

export default SalesManagement;
