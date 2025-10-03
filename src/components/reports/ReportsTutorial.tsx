import React, { useState, useEffect, useCallback } from 'react';
import { useImprovedTutorial } from '@/hooks/useImprovedTutorial';
import ImprovedTutorialOverlay from '@/components/ImprovedTutorialOverlay';
import { Product } from '@/types';

interface ReportsTutorialProps {
  children: React.ReactNode;
  products: Product[];
  autoStart?: boolean;
}

export const ReportsTutorial: React.FC<ReportsTutorialProps> = ({
  children,
  products,
  autoStart = false
}) => {
  const [tutorialActive, setTutorialActive] = useState(false);
  
  // Reports Tutorial Steps
  const reportsSteps = [
    {
      id: 'summary-cards',
      title: 'Summary Cards',
      description: "These cards provide an overview of your business performance including total revenue, sales count, active customers, low stock products, outstanding debts, discounts given, total profit, and inventory value.",
      targetId: 'summary-cards-container'
    },
    {
      id: 'sales-trend-graph',
      title: 'Sales Trend Graph',
      description: "This graph shows your sales performance over time. You can switch between hourly, daily, and monthly views to analyze trends and identify peak sales periods.",
      targetId: 'sales-trend-chart'
    },
    {
      id: 'orders-bar-graph',
      title: 'Orders Bar Graph',
      description: "This bar chart displays the number of orders over time, helping you understand order volume patterns and identify busy periods for your business.",
      targetId: 'orders-bar-chart'
    },
    {
      id: 'sales-report-table',
      title: 'Sales Report Table',
      description: "This table shows detailed information about all your sales transactions including dates, customers, amounts, and payment methods. You can filter by time period and search for specific transactions.",
      targetId: 'sales-report-table'
    },
    {
      id: 'product-profits-table',
      title: 'Product Profits Table',
      description: "This table displays profit information for each product, showing which items are most profitable for your business. You can see quantity sold, sales amount, and profit for each product.",
      targetId: 'product-profits-table'
    },
    {
      id: 'debt-transactions-table',
      title: 'Debt Transactions Table',
      description: "This table tracks all debt-related transactions including debt sales, cash lending, payments received, and discounts given. It helps you manage customer debts effectively.",
      targetId: 'debt-transactions-table'
    },
    {
      id: 'restock-records-table',
      title: 'Restock Records Table',
      description: "This table shows your product restocking history including product names, restock dates and times, and quantities. It helps you track inventory replenishment and manage your purchasing decisions.",
      targetId: 'restock-records-table'
    }
  ];

  // Reports Tutorial
  const {
    isActive: isReportsActive,
    currentStep: reportsCurrentStep,
    currentStepIndex: reportsCurrentStepIndex,
    totalSteps: reportsTotalSteps,
    startTutorial: startReportsTutorial,
    nextStep: reportsNextStep,
    prevStep: reportsPrevStep,
    skipTutorial: reportsSkipTutorial,
    isCompleting: reportsIsCompleting,
    isTutorialCompleted: isReportsCompleted
  } = useImprovedTutorial({
    steps: reportsSteps,
    storageKey: 'reportsTutorialCompleted'
  });

  // Auto-start tutorial
  useEffect(() => {
    if (autoStart && !isReportsCompleted) {
      const timer = setTimeout(() => {
        setTutorialActive(true);
        startReportsTutorial();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, startReportsTutorial, isReportsCompleted]);

  // Handle tutorial completion
  const handleReportsComplete = useCallback(() => {
    setTutorialActive(false);
  }, []);

  // Enhanced overlay component
  const ReportsTutorialOverlay = () => (
    <ImprovedTutorialOverlay
      isActive={isReportsActive && tutorialActive}
      currentStep={reportsCurrentStep}
      currentStepIndex={reportsCurrentStepIndex}
      totalSteps={reportsTotalSteps}
      onNext={reportsNextStep}
      onPrev={reportsPrevStep}
      onSkip={() => {
        reportsSkipTutorial();
        handleReportsComplete();
      }}
      onFinish={() => {
        reportsSkipTutorial();
        handleReportsComplete();
      }}
      isCompleting={reportsIsCompleting}
    />
  );

  return (
    <>
      {children}
      
      {/* Reports Tutorial Overlay */}
      <ReportsTutorialOverlay />
    </>
  );
};

// Hook to manage tutorial state in settings
export const useReportsTutorial = () => {
  const [reportsTutorialCompleted, setReportsTutorialCompleted] = useState(false);

  useEffect(() => {
    const checkCompletion = () => {
      const completed = localStorage.getItem('reportsTutorialCompleted') === 'true';
      setReportsTutorialCompleted(completed);
    };

    checkCompletion();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'reportsTutorialCompleted') {
        checkCompletion();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const resetReportsTutorial = () => {
    localStorage.removeItem('reportsTutorialCompleted');
    setReportsTutorialCompleted(false);
  };

  return {
    reportsTutorialCompleted,
    resetReportsTutorial
  };
};

export default ReportsTutorial;
