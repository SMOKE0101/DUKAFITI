import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTutorialSystem } from '@/hooks/useTutorialSystem';
import { ChevronLeft, ChevronRight, X, SkipForward } from 'lucide-react';

interface TutorialControlsProps {
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
}

const TutorialControls: React.FC<TutorialControlsProps> = ({
  canGoBack,
  canGoNext,
  isLastStep
}) => {
  const { previousStep, nextStep, skipTutorial, completeTutorial } = useTutorialSystem();

  return (
    <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto z-[10001] bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-2xl">
      <div className="flex items-center gap-2 p-4">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={previousStep}
          disabled={!canGoBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {/* Skip Tutorial Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={skipTutorial}
          className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
        >
          <X className="w-4 h-4" />
          Skip Tutorial
        </Button>

        {/* Next/Complete Button */}
        {isLastStep ? (
          <Button
            onClick={completeTutorial}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            Complete Tutorial
            <SkipForward className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            disabled={!canGoNext}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default TutorialControls;