import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useImprovedTutorial, TutorialStep } from '@/hooks/useImprovedTutorial';
import ImprovedTutorialOverlay from './ImprovedTutorialOverlay';

// Complete Tutorial Component
interface CompleteTutorialProps {
  steps: TutorialStep[];
  children: React.ReactNode;
  autoStart?: boolean;
  storageKey?: string;
  onComplete?: () => void;
  onStart?: () => void;
}

export const CompleteTutorial: React.FC<CompleteTutorialProps> = ({ 
  steps, 
  children,
  autoStart = false,
  storageKey = 'dashboardTutorialCompleted',
  onComplete,
  onStart
}) => {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    isCompleting,
    isTutorialCompleted
  } = useImprovedTutorial({
    steps,
    onComplete,
    onStart,
    storageKey
  });

  // Auto-start tutorial if requested and not completed
  useEffect(() => {
    if (autoStart && !isTutorialCompleted) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        startTutorial();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isTutorialCompleted, startTutorial]);

  return (
    <>
      {children}
      
      {/* Tutorial Overlay - only renders when active and not completing */}
      {isActive && !isCompleting && (
        <ImprovedTutorialOverlay
          isActive={isActive}
          currentStep={currentStep}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTutorial}
          onFinish={skipTutorial}
          isCompleting={isCompleting}
        />
      )}
    </>
  );
};

// Example usage component demonstrating the complete solution
export const TutorialWithBottomNavExample: React.FC = () => {
  const dashboardSteps: TutorialStep[] = [
    {
      id: 'summary-cards',
      title: 'Dashboard Overview',
      description: 'This is your main dashboard showing key business metrics like total revenue, sales count, and customer information.',
      targetId: 'dashboard-summary-cards'
    },
    {
      id: 'low-stock-alerts',
      title: 'Low Stock Alerts',
      description: 'This section shows products that are running low on inventory. Keep an eye on these to avoid stockouts.',
      targetId: 'low-stock-alerts-card'
    },
    {
      id: 'outstanding-debts',
      title: 'Outstanding Debts',
      description: 'Here you can see customers who have outstanding debts. This helps you track credit sales and follow up on payments.',
      targetId: 'outstanding-debts-card'
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      description: 'These buttons provide fast access to common tasks like recording sales, adding products, and adding customers.',
      targetId: 'quick-actions-section'
    }
  ];

  const handleTutorialComplete = useCallback(() => {
    console.log('Tutorial completed and page reloaded');
  }, []);

  const handleTutorialStart = useCallback(() => {
    console.log('Tutorial started');
  }, []);

  return (
    <CompleteTutorial 
      steps={dashboardSteps} 
      autoStart={true}
      storageKey="dashboardTutorialCompleted"
      onComplete={handleTutorialComplete}
      onStart={handleTutorialStart}
    >
      <div className="min-h-screen bg-background flex flex-col">
        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20">
          <div className="p-4">
            <div id="dashboard-summary-cards" className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-bold">Summary Cards</h2>
              <p>Key business metrics will appear here</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div id="low-stock-alerts-card" className="p-4 bg-orange-50 rounded-lg">
                <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
                <p>Products running low on inventory</p>
              </div>
              
              <div id="outstanding-debts-card" className="p-4 bg-red-50 rounded-lg">
                <h3 className="text-lg font-semibold">Outstanding Debts</h3>
                <p>Customer debt information</p>
              </div>
            </div>
            
            <div id="quick-actions-section" className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-2">
                <button className="p-2 bg-green-500 text-white rounded">Record Sale</button>
                <button className="p-2 bg-blue-500 text-white rounded">Add Product</button>
                <button className="p-2 bg-purple-500 text-white rounded">Add Customer</button>
              </div>
            </div>
          </div>
        </main>
        
        {/* Fixed bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-40" data-bottom-nav>
          <nav className="h-16 w-full border-t bg-white border-gray-200">
            <div className="grid grid-cols-5 h-full">
              {['Dashboard', 'Inventory', 'Sell', 'Customers', 'Reports'].map((label, index) => (
                <button
                  key={index}
                  className="flex flex-col items-center justify-center gap-1 py-2 px-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="w-5 h-5 bg-gray-300 rounded"></div>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </CompleteTutorial>
  );
};

export default CompleteTutorial;
