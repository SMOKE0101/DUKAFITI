
import React, { useEffect, useState } from 'react';
import EnhancedOfflineReportsPage from './reports/EnhancedOfflineReportsPage';
import ReportsTutorial from './reports/ReportsTutorial';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';

const ReportsPage = () => {
  const [autoStart, setAutoStart] = useState(false);
  const { products } = useUnifiedProducts();

  useEffect(() => {
    const shouldStartTutorial = localStorage.getItem('startReportsTutorial') === 'true';
    
    if (shouldStartTutorial) {
      setAutoStart(true);
      localStorage.removeItem('startReportsTutorial');
    }
  }, []);

  return (
    <ReportsTutorial
      products={products}
      autoStart={autoStart}
    >
      <div className="w-full h-full">
        <EnhancedOfflineReportsPage />
      </div>
    </ReportsTutorial>
  );
};

export default ReportsPage;
