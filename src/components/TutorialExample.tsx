import React, { useCallback } from 'react';
import { CompleteTutorial } from './CompleteTutorial';
import { BottomNavigation } from './layout/BottomNavigation';
import { DASHBOARD_TUTORIAL_STEPS } from '@/config/dashboardTutorial';

export const TutorialExample: React.FC = () => {
  const handleTutorialComplete = useCallback(() => {
    console.log('Tutorial completed - page will reload');
  }, []);

  const handleTutorialStart = useCallback(() => {
    console.log('Tutorial started');
  }, []);

  return (
    <CompleteTutorial 
      steps={DASHBOARD_TUTORIAL_STEPS} 
      autoStart={true}
      storageKey="dashboardTutorialCompleted"
      onComplete={handleTutorialComplete}
      onStart={handleTutorialStart}
    >
      <div className="min-h-screen bg-background flex flex-col">
        {/* Main content - this would be your actual dashboard content */}
        <main className="flex-1 overflow-auto pb-20">
          <div className="p-4">
            <div id="dashboard-summary-cards" className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-bold">Dashboard Summary</h2>
              <p className="text-muted-foreground">Your business overview will appear here</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div id="low-stock-alerts-card" className="p-4 bg-orange-50 rounded-lg">
                <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
                <p className="text-muted-foreground">Monitor inventory levels</p>
              </div>
              
              <div id="outstanding-debts-card" className="p-4 bg-red-50 rounded-lg">
                <h3 className="text-lg font-semibold">Outstanding Debts</h3>
                <p className="text-muted-foreground">Track customer payments</p>
              </div>
            </div>
            
            <div id="quick-actions-section" className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-2">
                <button className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Record Sale
                </button>
                <button className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Add Product
                </button>
                <button className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </main>
        
        {/* Fixed bottom navigation - will be made clickable after tutorial */}
        <div className="fixed bottom-0 left-0 right-0 z-40" data-bottom-nav>
          <BottomNavigation />
        </div>
      </div>
    </CompleteTutorial>
  );
};

// Simple component to reset tutorial for testing
export const TutorialResetButton: React.FC = () => {
  const resetTutorial = () => {
    localStorage.removeItem('dashboardTutorialCompleted');
    window.location.reload();
  };

  return (
    <div className="p-4">
      <button
        onClick={resetTutorial}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        Reset Tutorial
      </button>
    </div>
  );
};
