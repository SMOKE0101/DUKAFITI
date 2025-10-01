import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TutorialOverlayProps {
  isActive: boolean;
  currentStep: {
    id: string;
    title: string;
    description: string;
    targetId: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  } | null;
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
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={isLastStep ? onFinish : onNext}
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

export default TutorialOverlay;
