import React, { useState, useEffect, useCallback } from 'react';
import { useImprovedTutorial } from '@/hooks/useImprovedTutorial';
import ImprovedTutorialOverlay from '@/components/ImprovedTutorialOverlay';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePWA } from '@/hooks/usePWA';
import { Customer } from '@/types';

// Define tutorial steps for Add Customer tutorial
const useAddCustomerTutorialSteps = () => {
  const isMobile = useIsMobile();
  const { isInstalled, isRunningInBrowser } = usePWA();
  const isBrowser = isRunningInBrowser();
  const allowImportOnThisDevice = isInstalled && isMobile;

  const steps: import('@/hooks/useImprovedTutorial').TutorialStep[] = [
    {
      id: 'add-customer-button',
      title: 'Add Customer',
      description: isMobile 
        ? allowImportOnThisDevice && !isBrowser
          ? "Tap the 'Add' button to open the menu. You can choose to add a normal customer or import from your contacts."
          : "Tap the 'Add' button to open the menu and add a new customer."
        : "Click the 'Add Customer' button to open the customer form and add your first customer.",
      targetId: 'add-customer-dropdown-trigger'
    }
  ];

  return steps;
};

// Define tutorial steps for Customer Card tutorial
const useCustomerCardTutorialSteps = (customers: Customer[]) => {
  const isMobile = useIsMobile();
  const hasCustomers = customers && customers.length > 0;
  const firstCustomer = hasCustomers ? customers[0] : null;

  const steps: import('@/hooks/useImprovedTutorial').TutorialStep[] = [
    {
      id: 'customer-card-overview',
      title: 'Customer Card Overview',
      description: "This is a customer card showing all the important information about a customer including their name, contact details, outstanding debt, and quick action buttons.",
      targetId: firstCustomer ? `customer-card-${firstCustomer.id}` : 'customer-card-placeholder'
    },
    {
      id: 'customer-details',
      title: 'Customer Details',
      description: "Here you can see the customer's financial information including their total purchases, outstanding debt, and credit limit. The color indicates the debt level - green for no debt, yellow for moderate debt, and red for high debt.",
      targetId: firstCustomer ? `customer-financial-info-${firstCustomer.id}` : 'customer-details-placeholder',
      position: isMobile ? 'bottom' : 'top' as 'bottom' | 'top'
    },
    {
      id: 'customer-actions',
      title: 'Customer Actions',
      description: "These buttons allow you to quickly record payments, view purchase history, edit customer information, or delete the customer. The payment button is only enabled when the customer has outstanding debt.",
      targetId: firstCustomer ? `customer-actions-${firstCustomer.id}` : 'customer-actions-placeholder'
    }
  ];

  return steps;
};

interface CustomersTutorialProps {
  children: React.ReactNode;
  customers: Customer[];
  onAddCustomer: () => void;
  onImportFromContacts?: () => void;
  autoStartAddCustomer?: boolean;
  autoStartCustomerCard?: boolean;
}

export const CustomersTutorial: React.FC<CustomersTutorialProps> = ({
  children,
  customers,
  onAddCustomer,
  onImportFromContacts,
  autoStartAddCustomer = false,
  autoStartCustomerCard = false
}) => {
  const isMobile = useIsMobile();
  const { isInstalled, isRunningInBrowser } = usePWA();
  const hasCustomers = customers && customers.length > 0;
  
  // Tutorial states
  const [addCustomerTutorialActive, setAddCustomerTutorialActive] = useState(false);
  const [customerCardTutorialActive, setCustomerCardTutorialActive] = useState(false);
  
  // Add Customer Tutorial
  const addCustomerSteps = useAddCustomerTutorialSteps();
  const {
    isActive: isAddCustomerActive,
    currentStep: addCustomerCurrentStep,
    currentStepIndex: addCustomerCurrentStepIndex,
    totalSteps: addCustomerTotalSteps,
    startTutorial: startAddCustomerTutorial,
    nextStep: addCustomerNextStep,
    prevStep: addCustomerPrevStep,
    skipTutorial: addCustomerSkipTutorial,
    isCompleting: addCustomerIsCompleting,
    isTutorialCompleted: isAddCustomerCompleted
  } = useImprovedTutorial({
    steps: addCustomerSteps,
    storageKey: 'customersAddCustomerTutorialCompleted'
  });

  // Customer Card Tutorial
  const customerCardSteps = useCustomerCardTutorialSteps(customers);
  const {
    isActive: isCustomerCardActive,
    currentStep: customerCardCurrentStep,
    currentStepIndex: customerCardCurrentStepIndex,
    totalSteps: customerCardTotalSteps,
    startTutorial: startCustomerCardTutorial,
    nextStep: customerCardNextStep,
    prevStep: customerCardPrevStep,
    skipTutorial: customerCardSkipTutorial,
    isCompleting: customerCardIsCompleting,
    isTutorialCompleted: isCustomerCardCompleted
  } = useImprovedTutorial({
    steps: customerCardSteps,
    storageKey: 'customersCustomerCardTutorialCompleted'
  });

  // Auto-start tutorials
  useEffect(() => {
    if (autoStartAddCustomer && !isAddCustomerCompleted) {
      const timer = setTimeout(() => {
        setAddCustomerTutorialActive(true);
        startAddCustomerTutorial();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStartAddCustomer, startAddCustomerTutorial, isAddCustomerCompleted]);

  useEffect(() => {
    if (autoStartCustomerCard && hasCustomers && !isCustomerCardCompleted) {
      const timer = setTimeout(() => {
        setCustomerCardTutorialActive(true);
        startCustomerCardTutorial();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStartCustomerCard, hasCustomers, startCustomerCardTutorial, isCustomerCardCompleted]);

  // Handle Add Customer tutorial completion
  const handleAddCustomerComplete = useCallback(() => {
    setAddCustomerTutorialActive(false);
  }, []);

  // Handle Customer Card tutorial completion
  const handleCustomerCardComplete = useCallback(() => {
    setCustomerCardTutorialActive(false);
  }, []);

  // Enhanced next step handlers to handle special cases
  const handleAddCustomerNext = useCallback(() => {
    // For the single step, we want to open the dropdown/menu and then complete
    if (addCustomerCurrentStepIndex === 0) {
      // Trigger the dropdown/menu to open
      const dropdownTrigger = document.getElementById('add-customer-dropdown-trigger');
      if (dropdownTrigger) {
        dropdownTrigger.click();
        
        // Small delay to let the dropdown open, then complete tutorial
        setTimeout(() => {
          addCustomerNextStep();
        }, 300);
      } else {
        addCustomerNextStep();
      }
    } else {
      addCustomerNextStep();
    }
  }, [addCustomerCurrentStepIndex, addCustomerNextStep]);

  // Enhanced overlay components with proper positioning
  const AddCustomerTutorialOverlay = () => (
    <ImprovedTutorialOverlay
      isActive={isAddCustomerActive && addCustomerTutorialActive}
      currentStep={addCustomerCurrentStep}
      currentStepIndex={addCustomerCurrentStepIndex}
      totalSteps={addCustomerTotalSteps}
      onNext={handleAddCustomerNext}
      onPrev={addCustomerPrevStep}
      onSkip={() => {
        addCustomerSkipTutorial();
        handleAddCustomerComplete();
      }}
      onFinish={() => {
        addCustomerSkipTutorial();
        handleAddCustomerComplete();
      }}
      isCompleting={addCustomerIsCompleting}
    />
  );

  const CustomerCardTutorialOverlay = () => (
    <ImprovedTutorialOverlay
      isActive={isCustomerCardActive && customerCardTutorialActive}
      currentStep={customerCardCurrentStep}
      currentStepIndex={customerCardCurrentStepIndex}
      totalSteps={customerCardTotalSteps}
      onNext={customerCardNextStep}
      onPrev={customerCardPrevStep}
      onSkip={() => {
        customerCardSkipTutorial();
        handleCustomerCardComplete();
      }}
      onFinish={() => {
        customerCardSkipTutorial();
        handleCustomerCardComplete();
      }}
      isCompleting={customerCardIsCompleting}
    />
  );

  return (
    <>
      {children}
      
      {/* Add Customer Tutorial Overlay */}
      <AddCustomerTutorialOverlay />
      
      {/* Customer Card Tutorial Overlay */}
      <CustomerCardTutorialOverlay />
    </>
  );
};

// Hook to manage tutorial state in settings
export const useCustomersTutorial = () => {
  const [addCustomerCompleted, setAddCustomerCompleted] = useState(false);
  const [customerCardCompleted, setCustomerCardCompleted] = useState(false);

  useEffect(() => {
    const checkCompletion = () => {
      const addCompleted = localStorage.getItem('customersAddCustomerTutorialCompleted') === 'true';
      const cardCompleted = localStorage.getItem('customersCustomerCardTutorialCompleted') === 'true';
      setAddCustomerCompleted(addCompleted);
      setCustomerCardCompleted(cardCompleted);
    };

    checkCompletion();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customersAddCustomerTutorialCompleted' || e.key === 'customersCustomerCardTutorialCompleted') {
        checkCompletion();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const resetAddCustomerTutorial = () => {
    localStorage.removeItem('customersAddCustomerTutorialCompleted');
    setAddCustomerCompleted(false);
  };

  const resetCustomerCardTutorial = () => {
    localStorage.removeItem('customersCustomerCardTutorialCompleted');
    setCustomerCardCompleted(false);
  };

  const resetAllTutorials = () => {
    resetAddCustomerTutorial();
    resetCustomerCardTutorial();
  };

  return {
    addCustomerCompleted,
    customerCardCompleted,
    hasCustomers: customerCardCompleted, // This determines if customer card tutorial can be started
    resetAddCustomerTutorial,
    resetCustomerCardTutorial,
    resetAllTutorials
  };
};

export default CustomersTutorial;
