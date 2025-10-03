import { useState, useCallback, useEffect, useRef } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetId: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface UseImprovedTutorialProps {
  steps: TutorialStep[];
  onComplete?: () => void;
  onStart?: () => void;
  storageKey?: string;
}

export const useImprovedTutorial = ({ 
  steps, 
  onComplete, 
  onStart,
  storageKey = 'tutorialCompleted'
}: UseImprovedTutorialProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void)[]>([]);

  const isTutorialCompleted = useCallback(() => {
    return localStorage.getItem(storageKey) === 'true';
  }, [storageKey]);

  const markTutorialCompleted = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
  }, [storageKey]);

  const startTutorial = useCallback(() => {
    if (isTutorialCompleted()) {
      return;
    }
    
    setIsActive(true);
    setIsVisible(true);
    setCurrentStepIndex(0);
    setIsCompleting(false);
    onStart?.();
    
    // Disable body scroll during tutorial
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Store cleanup function
    cleanupRef.current.push(() => {
      document.body.style.overflow = originalOverflow;
    });
    
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
      
      // Store cleanup function
      cleanupRef.current.push(() => {
        overlay.remove();
        bottomNav.style.zIndex = '';
        bottomNav.style.position = '';
      });
    }
  }, [isTutorialCompleted, onStart]);

  const endTutorial = useCallback((shouldReload = false) => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    
    // Execute all cleanup functions
    cleanupRef.current.forEach(cleanup => cleanup());
    cleanupRef.current = [];
    
    // Remove highlight from target element
    if (targetElementRef.current) {
      targetElementRef.current.style.outline = '';
      targetElementRef.current.style.outlineOffset = '';
      targetElementRef.current.style.zIndex = '';
      targetElementRef.current = null;
    }
    
    // Mark tutorial as completed
    markTutorialCompleted();
    
    // Reload the page after a short delay to ensure cleanup
    if (shouldReload) {
      setTimeout(() => {
        // Use location.reload() which works offline and online
        window.location.reload();
      }, 100);
    } else {
      // Clean up state after a short delay
      setTimeout(() => {
        setIsActive(false);
        setIsVisible(false);
        setCurrentStepIndex(0);
        setIsCompleting(false);
        onComplete?.();
      }, 100);
    }
  }, [isCompleting, markTutorialCompleted, onComplete]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      endTutorial(true); // Reload on completion
      onComplete?.();
    }
  }, [currentStepIndex, steps.length, endTutorial, onComplete]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const skipTutorial = useCallback(() => {
    endTutorial(true); // Reload on skip
    onComplete?.();
  }, [endTutorial, onComplete]);

  const getCurrentStep = useCallback(() => {
    return steps[currentStepIndex] || null;
  }, [steps, currentStepIndex]);

  // Auto-scroll to target element and highlight it
  useEffect(() => {
    if (!isActive || !isVisible || isCompleting) return;

    const step = getCurrentStep();
    if (!step) return;

    // Remove previous highlight
    if (targetElementRef.current) {
      targetElementRef.current.style.outline = '';
      targetElementRef.current.style.outlineOffset = '';
      targetElementRef.current.style.zIndex = '';
    }

    // Find and highlight target element
    const targetElement = document.getElementById(step.targetId);
    if (targetElement) {
      targetElementRef.current = targetElement;
      
      // Add highlight - but don't highlight add-debt-card in checkout tutorial on mobile
      const isMobile = window.innerWidth < 768;
      const shouldSkipHighlight = step.targetId === 'add-debt-card' && 
        step.id !== 'record-cash-lending'; // Only highlight for the specific record cash lending step
      
      if (!shouldSkipHighlight) {
        targetElement.style.outline = '3px solid #3b82f6';
        targetElement.style.outlineOffset = '2px';
        targetElement.style.zIndex = '50';
      }
      
      // Scroll to element
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [currentStepIndex, isActive, isVisible, isCompleting, getCurrentStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Execute all cleanup functions
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
      
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
    skipTutorial,
    isCompleting,
    isTutorialCompleted: isTutorialCompleted()
  };
};
