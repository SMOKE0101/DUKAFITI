import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  AlertTriangle,
  ShoppingBag,
  Plus,
  UserPlus
} from 'lucide-react';
import { BottomNavigation } from './layout/BottomNavigation';
import { useImprovedTutorial, TutorialStep } from '@/hooks/useImprovedTutorial';
import ImprovedTutorialOverlay from './ImprovedTutorialOverlay';

// Define tutorial steps
const TUTORIAL_STEPS: TutorialStep[] = [
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

export const TutorialCompleteExample: React.FC = () => {
  const navigate = useNavigate();

  // Initialize improved tutorial with proper cleanup and reload
  const {
    isActive: isTutorialActive,
    currentStep: currentTutorialStep,
    currentStepIndex,
    totalSteps,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    isCompleting,
    isTutorialCompleted
  } = useImprovedTutorial({
    steps: TUTORIAL_STEPS,
    storageKey: 'dashboardTutorialCompleted',
    onComplete: () => {
      console.log('Tutorial completed - page will reload');
    },
    onStart: () => {
      console.log('Tutorial started');
    }
  });

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-sale':
        navigate('/app/sales');
        break;
      case 'add-product':
        // Add product logic here
        break;
      case 'add-customer':
        // Add customer logic here
        break;
      default:
        break;
    }
  };

  // Reset tutorial for testing
  const resetTutorial = () => {
    localStorage.removeItem('dashboardTutorialCompleted');
    window.location.reload();
  };

  // Start tutorial manually
  const startTutorialManually = () => {
    localStorage.removeItem('dashboardTutorialCompleted');
    startTutorial();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="p-4">
          {/* Dashboard Summary Cards */}
          <div id="dashboard-summary-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-2 border-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">KES 125,430</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold">1,247</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold">89</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alerts */}
          <div id="low-stock-alerts-card" className="mb-6">
            <Card className="border-2 border-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold">Low Stock Alerts</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <span>Milk (1L)</span>
                    <span className="text-orange-600 font-semibold">3 left</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <span>Bread (400g)</span>
                    <span className="text-orange-600 font-semibold">5 left</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Outstanding Debts */}
          <div id="outstanding-debts-card" className="mb-6">
            <Card className="border-2 border-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold">Outstanding Debts</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span>John Doe</span>
                    <span className="text-red-600 font-semibold">KES 2,500</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span>Jane Smith</span>
                    <span className="text-red-600 font-semibold">KES 1,200</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div id="quick-actions-section">
            <Card className="border-2 border-gray-300">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    onClick={() => handleQuickAction('add-sale')}
                    className="flex flex-col items-center justify-center h-20 gap-2 bg-green-500 hover:bg-green-600"
                  >
                    <ShoppingBag className="h-6 w-6" />
                    <span className="text-xs">Record Sale</span>
                  </Button>
                  <Button 
                    onClick={() => handleQuickAction('add-product')}
                    className="flex flex-col items-center justify-center h-20 gap-2 bg-blue-500 hover:bg-blue-600"
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-xs">Add Product</span>
                  </Button>
                  <Button 
                    onClick={() => handleQuickAction('add-customer')}
                    className="flex flex-col items-center justify-center h-20 gap-2 bg-purple-500 hover:bg-purple-600"
                  >
                    <UserPlus className="h-6 w-6" />
                    <span className="text-xs">Add Customer</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tutorial Controls */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Tutorial Controls</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={startTutorialManually}
                disabled={isTutorialActive || isTutorialCompleted}
                variant="default"
                size="sm"
              >
                Start Tutorial
              </Button>
              <Button 
                onClick={resetTutorial}
                variant="outline"
                size="sm"
              >
                Reset Tutorial
              </Button>
              <span className="text-sm text-muted-foreground self-center">
                {isTutorialCompleted ? 'Tutorial Completed ✓' : 'Tutorial Not Completed'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed bottom navigation - will be made clickable after tutorial */}
      <div className="fixed bottom-0 left-0 right-0 z-40" data-bottom-nav>
        <BottomNavigation />
      </div>

      {/* Tutorial Overlay - only renders when active and not completing */}
      {isTutorialActive && !isCompleting && (
        <ImprovedTutorialOverlay
          isActive={isTutorialActive}
          currentStep={currentTutorialStep}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTutorial}
          onFinish={skipTutorial}
          isCompleting={isCompleting}
        />
      )}
    </div>
  );
};

export default TutorialCompleteExample;
