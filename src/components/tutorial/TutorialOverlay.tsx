import React, { useEffect, useState, useRef } from 'react';
import { useTutorialSystem } from '@/hooks/useTutorialSystem';
import TutorialTooltip from './TutorialTooltip';
import TutorialControls from './TutorialControls';
import TutorialProgress from './TutorialProgress';
import { cn } from '@/lib/utils';

const TutorialOverlay: React.FC = () => {
  const { state, getTutorialConfig, nextStep } = useTutorialSystem();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentTutorial = state.currentTutorial ? getTutorialConfig(state.currentTutorial) : null;
  const currentStep = currentTutorial?.steps[state.currentStep];

  // Find and track target element
  useEffect(() => {
    if (!currentStep?.target || !state.isVisible) {
      setTargetElement(null);
      setTargetRect(null);
      return;
    }

    const findElement = () => {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        setTargetRect(element.getBoundingClientRect());
        
        // Scroll element into view if needed
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }
    };

    // Delay to allow for page rendering
    const timeoutId = setTimeout(findElement, currentStep.delay || 300);
    
    return () => clearTimeout(timeoutId);
  }, [currentStep, state.isVisible]);

  // Update target rect on resize
  useEffect(() => {
    if (!targetElement) return;

    const updateRect = () => {
      setTargetRect(targetElement.getBoundingClientRect());
    };

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [targetElement]);

  // Handle automatic actions
  useEffect(() => {
    if (!currentStep?.action || !targetElement) return;

    const handleAction = () => {
      switch (currentStep.action) {
        case 'click':
          // Wait for user to click the element
          const handleClick = () => {
            setTimeout(() => nextStep(), 500);
            targetElement.removeEventListener('click', handleClick);
          };
          targetElement.addEventListener('click', handleClick);
          return () => targetElement.removeEventListener('click', handleClick);
        
        case 'wait':
          // Auto-advance after delay
          const timeoutId = setTimeout(() => nextStep(), 2000);
          return () => clearTimeout(timeoutId);
        
        default:
          break;
      }
    };

    const cleanup = handleAction();
    return cleanup;
  }, [currentStep, targetElement, nextStep]);

  if (!state.isActive || !state.isVisible || !currentTutorial || !currentStep) {
    return null;
  }

  const getHighlightStyle = () => {
    if (!targetRect) return {};

    const padding = 8;
    
    return {
      top: targetRect.top - padding,
      left: targetRect.left - padding,
      width: targetRect.width + (padding * 2),
      height: targetRect.height + (padding * 2),
    };
  };

  const highlightStyle = getHighlightStyle();

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-[9999] pointer-events-none transition-all duration-300",
        state.settings.enableAnimations ? "animate-fade-in" : ""
      )}
      style={{
        background: targetRect 
          ? `radial-gradient(circle at ${targetRect.left + targetRect.width/2}px ${targetRect.top + targetRect.height/2}px, transparent ${Math.max(targetRect.width, targetRect.height)/2 + 20}px, rgba(0,0,0,0.8) ${Math.max(targetRect.width, targetRect.height)/2 + 40}px)`
          : 'rgba(0,0,0,0.8)'
      }}
    >
      {/* Highlighted Element Border */}
      {targetRect && currentStep.highlightStyle === 'border' && (
        <div
          className="absolute border-4 border-primary rounded-lg pointer-events-none animate-pulse"
          style={highlightStyle}
        />
      )}

      {/* Glow Effect */}
      {targetRect && currentStep.highlightStyle === 'glow' && (
        <div
          className="absolute border-2 border-primary rounded-lg pointer-events-none shadow-[0_0_20px_rgba(var(--primary),0.5)] animate-pulse"
          style={highlightStyle}
        />
      )}

      {/* Spotlight Effect */}
      {targetRect && currentStep.highlightStyle === 'spotlight' && (
        <div
          className="absolute bg-primary/20 rounded-lg pointer-events-none animate-pulse"
          style={highlightStyle}
        />
      )}

      {/* Tutorial Tooltip */}
      <TutorialTooltip
        step={currentStep}
        targetRect={targetRect}
        tutorialConfig={currentTutorial}
      />

      {/* Progress Indicator */}
      <TutorialProgress tutorial={currentTutorial} currentStep={state.currentStep} />

      {/* Tutorial Controls */}
      <TutorialControls 
        canGoBack={state.currentStep > 0}
        canGoNext={true}
        isLastStep={state.currentStep === currentTutorial.steps.length - 1}
      />

      {/* Make target element clickable */}
      {targetRect && (
        <div
          className="absolute pointer-events-auto cursor-pointer"
          style={highlightStyle}
          onClick={() => {
            if (currentStep.action === 'click') {
              targetElement?.click();
            }
          }}
        />
      )}
    </div>
  );
};

export default TutorialOverlay;