import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Define tutorial step interface
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetId: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

// Tutorial hook
export const useDashboardTutorial = (steps: TutorialStep[], onComplete?: () => void) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const startTutorial = useCallback(() => {
    // Check if tutorial was already completed
    const tutorialCompleted = localStorage.getItem('dashboardTutorialCompleted');
    if (tutorialCompleted === 'true') {
      return;
    }
    
    setIsActive(true);
    setIsVisible(true);
    setCurrentStepIndex(0);
    
    // Disable body scroll during tutorial
    document.body.style.overflow = 'hidden';
    
    // Make bottom navigation unclickable by adding overlay
    const bottomNav = document.querySelector('[data-bottom-nav]') as HTMLElement | null;
    if (bottomNav) {
      // Remove any existing overlay first
      const existingOverlay = document.getElementById('tutorial-bottom-nav-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      
      const overlay = document.createElement('div');
      overlay.id = 'tutorial-bottom-nav-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        z-index: 1000;
        pointer-events: auto;
      `;
      bottomNav.style.position = 'relative';
      bottomNav.style.zIndex = '40';
      bottomNav.appendChild(overlay);
    }
  }, []);

  const endTutorial = useCallback((shouldReload = true) => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    setIsActive(false);
    setIsVisible(false);
    setCurrentStepIndex(0);
    
    // Re-enable body scroll
    document.body.style.overflow = '';
    
    // Remove bottom navigation overlay
    const overlay = document.getElementById('tutorial-bottom-nav-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    // Reset bottom navigation z-index and position
    const bottomNav = document.querySelector('[data-bottom-nav]') as HTMLElement | null;
    if (bottomNav) {
      bottomNav.style.zIndex = '';
      bottomNav.style.position = '';
    }
    
    // Remove highlight from target element
    if (targetElementRef.current) {
      targetElementRef.current.style.outline = '';
      targetElementRef.current.style.outlineOffset = '';
      targetElementRef.current.style.zIndex = '';
      targetElementRef.current = null;
    }
    
    // Mark tutorial as completed
    localStorage.setItem('dashboardTutorialCompleted', 'true');
    
    // Reload the page after a short delay to ensure cleanup
    if (shouldReload) {
      setTimeout(() => {
        // Use location.reload() which works offline and online
        window.location.reload();
      }, 100);
    } else {
      setIsCompleting(false);
    }
  }, [isCompleting]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      endTutorial(true);
      onComplete?.();
    }
  }, [currentStepIndex, steps.length, endTutorial, onComplete]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const skipTutorial = useCallback(() => {
    endTutorial(true);
    onComplete?.();
  }, [endTutorial, onComplete]);

  const getCurrentStep = useCallback(() => {
    return steps[currentStepIndex];
  }, [steps, currentStepIndex]);

  // Auto-scroll to target element and highlight it
  useEffect(() => {
    if (!isActive || !isVisible) return;

    const step = getCurrentStep();
    if (!step) return;

    // Remove previous highlight
    if (targetElementRef.current) {
      targetElementRef.current.style.outline = '';
      targetElementRef.current.style.outlineOffset = '';
    }

    // Find and highlight target element
    const targetElement = document.getElementById(step.targetId);
    if (targetElement) {
      targetElementRef.current = targetElement;
      
      // Add highlight
      targetElement.style.outline = '3px solid #3b82f6';
      targetElement.style.outlineOffset = '2px';
      targetElement.style.zIndex = '50';
      
      // Scroll to element
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [currentStepIndex, isActive, isVisible, getCurrentStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (targetElementRef.current) {
        targetElementRef.current.style.outline = '';
        targetElementRef.current.style.outlineOffset = '';
        targetElementRef.current.style.zIndex = '';
      }
      document.body.style.overflow = '';
      
      // Ensure bottom navigation is restored
      const bottomNav = document.querySelector('[data-bottom-nav]') as HTMLElement | null;
      if (bottomNav) {
        bottomNav.style.zIndex = '';
        bottomNav.style.position = '';
      }
      
      // Remove overlay if it exists
      const overlay = document.getElementById('tutorial-bottom-nav-overlay');
      if (overlay) {
        overlay.remove();
      }
    };
  }, []);

  return {
    isActive,
    isVisible,
    currentStepIndex,
    currentStep: getCurrentStep(),
    totalSteps: steps.length,
    startTutorial,
    endTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    isCompleting
  };
};

// Tutorial overlay component
interface TutorialOverlayProps {
  isActive: boolean;
  currentStep: TutorialStep | null;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
  isCompleting?: boolean;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isActive,
  currentStep,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  isCompleting = false
}) => {
  const isMobile = useIsMobile();
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Calculate tooltip position based on target element and mobile status
  useEffect(() => {
    if (!isActive || !currentStep) return;

    // For mobile Steps 3 (Outstanding Debts) and 4 (Quick Actions), position at top
    const shouldPositionAtTop = isMobile && (currentStepIndex === 2 || currentStepIndex === 3);

    if (shouldPositionAtTop) {
      // Position at top for mobile steps 3 and 4
      setTooltipPosition({ 
        top: 10, 
        left: (window.innerWidth - Math.min(300, window.innerWidth - 20)) / 2 
      });
      return;
    }

    const targetElement = document.getElementById(currentStep.targetId);
    if (!targetElement) {
      // If target element not found, center the tooltip
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      setTooltipPosition({
        top: windowHeight / 2 - 100,
        left: windowWidth / 2 - 150
      });
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 300;
    const tooltipHeight = 200;
    const offset = 20;

    let top = rect.bottom + offset;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;

    // Adjust for viewport boundaries
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    if (top + tooltipHeight > window.innerHeight - 10) {
      top = rect.top - tooltipHeight - offset;
    }
    if (top < 10) {
      top = 10;
    }

    setTooltipPosition({ top, left });
  }, [currentStep, isActive, currentStepIndex, isMobile]);

  if (!isActive || !currentStep || isCompleting) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay backdrop - transparent but blocks interactions */}
      <div className="absolute inset-0 bg-black/0 pointer-events-auto" />
      
      {/* Tooltip/Description card */}
      <Card 
        className="fixed z-50 w-80 pointer-events-auto shadow-xl border-2 border-blue-500"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          maxWidth: 'calc(100vw - 20px)'
        }}
      >
        <CardContent className="p-4">
          {/* Header with step counter and close button */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-600">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="h-6 w-6 p-0 hover:bg-gray-100"
              disabled={isCompleting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Title and description */}
          <h3 className="font-semibold text-lg mb-2 text-foreground">
            {currentStep.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {currentStep.description}
          </p>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={currentStepIndex === 0 || isCompleting}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={isLastStep ? onFinish : onNext}
              disabled={isCompleting}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Complete Dashboard Tutorial Component
interface DashboardTutorialProps {
  steps: TutorialStep[];
  children: React.ReactNode;
  autoStart?: boolean;
}

export const DashboardTutorial: React.FC<DashboardTutorialProps> = ({ 
  steps, 
  children,
  autoStart = false 
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
    isCompleting
  } = useDashboardTutorial(steps);

  // Auto-start tutorial if requested
  useEffect(() => {
    if (autoStart) {
      const tutorialCompleted = localStorage.getItem('dashboardTutorialCompleted');
      if (tutorialCompleted !== 'true') {
        // Small delay to ensure page is fully loaded
        const timer = setTimeout(() => {
          startTutorial();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [autoStart, startTutorial]);

  return (
    <>
      {children}
      
      {/* Tutorial Overlay */}
      <TutorialOverlay
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
    </>
  );
};

// Example usage component
export const DashboardTutorialExample: React.FC = () => {
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

  return (
    <DashboardTutorial steps={dashboardSteps} autoStart={true}>
      <div className="min-h-screen bg-background pb-20">
        {/* Your dashboard content here */}
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
      </div>
    </DashboardTutorial>
  );
};

export default TutorialOverlay;
