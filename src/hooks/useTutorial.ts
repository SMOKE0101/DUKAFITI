import { useState, useCallback, useEffect, useRef } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetId: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface UseTutorialProps {
  steps: TutorialStep[];
  onComplete?: () => void;
  onStart?: () => void;
}

export const useTutorial = ({ steps, onComplete, onStart }: UseTutorialProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const targetElementRef = useRef<HTMLElement | null>(null);

  const startTutorial = useCallback(() => {
    setIsActive(true);
    setIsVisible(true);
    setCurrentStepIndex(0);
    onStart?.();
    
    // Disable body scroll during tutorial
    document.body.style.overflow = 'hidden';
    
    // Make bottom navigation unclickable by adding overlay
    const bottomNav = document.querySelector('[data-bottom-nav]') as HTMLElement | null;
    if (bottomNav) {
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
  }, [onStart]);

  const endTutorial = useCallback((shouldReload = false) => {
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
    
    // Reload the page if requested
    if (shouldReload) {
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      endTutorial();
      onComplete?.();
    }
  }, [currentStepIndex, steps.length, endTutorial, onComplete]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const skipTutorial = useCallback(() => {
    endTutorial();
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
    skipTutorial
  };
};
