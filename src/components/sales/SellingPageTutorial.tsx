import React, { useState, useEffect, useCallback } from 'react';
import { useImprovedTutorial } from '@/hooks/useImprovedTutorial';
import ImprovedTutorialOverlay from '@/components/ImprovedTutorialOverlay';
import { useIsMobile } from '@/hooks/use-mobile';
import { Product, Customer } from '@/types';

// Define tutorial steps for Add Product to Cart section
const useAddToCartTutorialSteps = (products: Product[], isMobile: boolean) => {
  const hasProducts = products && products.length > 0;
  const firstProduct = hasProducts ? products[0] : null;

  const steps: import('@/hooks/useImprovedTutorial').TutorialStep[] = [
    {
      id: 'add-to-cart-instruction',
      title: 'Add Product to Cart',
      description: "Tap on any product card to reveal the 'Add to Cart' button, then press the button to add the product to your cart.",
      targetId: firstProduct ? `product-card-${firstProduct.id}` : 'product-card-placeholder'
    },
    {
      id: 'record-cash-lending',
      title: 'Record Cash Lending',
      description: "You can also record cash lending to customers using the 'Record Cash Lending' card. This allows you to track customer debts without adding products to the cart.",
      targetId: 'add-debt-card'
    }
  ];

  return steps;
};

// Define tutorial steps for Checkout section
const useCheckoutTutorialSteps = (cartItems: any[], customers: Customer[]) => {
  const isMobile = useIsMobile();
  const hasCartItems = cartItems && cartItems.length > 0;
  const hasCustomers = customers && customers.length > 0;
  const firstCustomer = hasCustomers ? customers[0] : null;

  const steps: import('@/hooks/useImprovedTutorial').TutorialStep[] = [
    {
      id: 'checkout-add-customer',
      title: 'Add Customer',
      description: "Select a customer for this sale. Adding customers helps track credit, maintain records, and manage outstanding debts. You can also add a new customer if needed.",
      targetId: 'customer-selection-dropdown'
    },
    {
      id: 'checkout-payment-methods',
      title: 'Payment Methods',
      description: "Choose from available payment options: Cash, M-Pesa, Debt, or Split payments. Each method serves different business needs - cash for immediate payment, debt for credit sales, and split for mixed payments.",
      targetId: 'payment-method-cash' // First payment button as target
    },
    {
      id: 'checkout-split-payment',
      title: 'Split Payment Modal',
      description: "The split payment modal allows you to divide the total amount across multiple payment methods. This is useful when customers pay with a combination of cash, mobile money, and credit.",
      targetId: 'payment-method-split' // Split payment button
    },
    {
      id: 'checkout-sales-reference',
      title: 'Sales Reference & Complete Sale',
      description: "Add an optional sales reference for your records, then click the 'Complete Sale' button to finalize the transaction. The system will automatically update inventory and customer records.",
      targetId: 'complete-sale-button' // Complete sale button as target
    }
  ];

  return steps;
};

interface SellingPageTutorialProps {
  children: React.ReactNode;
  products: Product[];
  cartItems: any[];
  customers: Customer[];
  autoStartAddToCart?: boolean;
  autoStartCheckout?: boolean;
  onMobilePanelSwitch?: (panel: 'search' | 'cart') => void;
}

export const SellingPageTutorial: React.FC<SellingPageTutorialProps> = ({
  children,
  products,
  cartItems,
  customers,
  autoStartAddToCart = false,
  autoStartCheckout = false,
  onMobilePanelSwitch
}) => {
  const isMobile = useIsMobile();
  const hasCartItems = cartItems && cartItems.length > 0;
  
  // Tutorial states
  const [addToCartTutorialActive, setAddToCartTutorialActive] = useState(false);
  const [checkoutTutorialActive, setCheckoutTutorialActive] = useState(false);
  
  // Add to Cart Tutorial
  const addToCartSteps = useAddToCartTutorialSteps(products, isMobile);
  const {
    isActive: isAddToCartActive,
    currentStep: addToCartCurrentStep,
    currentStepIndex: addToCartCurrentStepIndex,
    totalSteps: addToCartTotalSteps,
    startTutorial: startAddToCartTutorial,
    nextStep: addToCartNextStep,
    prevStep: addToCartPrevStep,
    skipTutorial: addToCartSkipTutorial,
    isCompleting: addToCartIsCompleting,
    isTutorialCompleted: isAddToCartCompleted
  } = useImprovedTutorial({
    steps: addToCartSteps,
    storageKey: 'sellingAddToCartTutorialCompleted'
  });

  // Checkout Tutorial
  const checkoutSteps = useCheckoutTutorialSteps(cartItems, customers);
  const {
    isActive: isCheckoutActive,
    currentStep: checkoutCurrentStep,
    currentStepIndex: checkoutCurrentStepIndex,
    totalSteps: checkoutTotalSteps,
    startTutorial: startCheckoutTutorial,
    nextStep: checkoutNextStep,
    prevStep: checkoutPrevStep,
    skipTutorial: checkoutSkipTutorial,
    isCompleting: checkoutIsCompleting,
    isTutorialCompleted: isCheckoutCompleted
  } = useImprovedTutorial({
    steps: checkoutSteps,
    storageKey: 'sellingCheckoutTutorialCompleted'
  });

  // Auto-start tutorials with exclusive activation
  useEffect(() => {
    if (autoStartAddToCart && !isAddToCartCompleted && !checkoutTutorialActive) {
      const timer = setTimeout(() => {
        setAddToCartTutorialActive(true);
        setCheckoutTutorialActive(false);
        startAddToCartTutorial();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStartAddToCart, startAddToCartTutorial, isAddToCartCompleted, checkoutTutorialActive]);

  useEffect(() => {
    if (autoStartCheckout && hasCartItems && !isCheckoutCompleted && !addToCartTutorialActive) {
      const timer = setTimeout(() => {
        setCheckoutTutorialActive(true);
        setAddToCartTutorialActive(false);
        startCheckoutTutorial();
        // Switch to cart panel on mobile when checkout tutorial starts
        if (isMobile && onMobilePanelSwitch) {
          onMobilePanelSwitch('cart');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStartCheckout, hasCartItems, startCheckoutTutorial, isCheckoutCompleted, addToCartTutorialActive, isMobile, onMobilePanelSwitch]);

  // Handle tutorial completion
  const handleAddToCartComplete = useCallback(() => {
    setAddToCartTutorialActive(false);
  }, []);

  const handleCheckoutComplete = useCallback(() => {
    setCheckoutTutorialActive(false);
  }, []);

  // Enhanced next step handlers with proper exclusivity
  const handleAddToCartNext = useCallback(() => {
    // If this is the last step of add to cart tutorial, switch to checkout
    if (addToCartCurrentStepIndex === addToCartTotalSteps - 1) {
      setAddToCartTutorialActive(false);
      if (hasCartItems) {
        setCheckoutTutorialActive(true);
        startCheckoutTutorial();
        // Switch to cart panel on mobile
        if (isMobile && onMobilePanelSwitch) {
          onMobilePanelSwitch('cart');
        }
      }
    } else {
      addToCartNextStep();
    }
  }, [addToCartNextStep, addToCartCurrentStepIndex, addToCartTotalSteps, hasCartItems, startCheckoutTutorial, isMobile, onMobilePanelSwitch]);

  const handleCheckoutNext = useCallback(() => {
    checkoutNextStep();
  }, [checkoutNextStep]);

  // Enhanced overlay components with proper exclusivity
  const AddToCartTutorialOverlay = () => (
    <ImprovedTutorialOverlay
      isActive={isAddToCartActive && addToCartTutorialActive}
      currentStep={addToCartCurrentStep}
      currentStepIndex={addToCartCurrentStepIndex}
      totalSteps={addToCartTotalSteps}
      onNext={handleAddToCartNext}
      onPrev={addToCartPrevStep}
      onSkip={() => {
        addToCartSkipTutorial();
        handleAddToCartComplete();
      }}
      onFinish={() => {
        addToCartSkipTutorial();
        handleAddToCartComplete();
      }}
      isCompleting={addToCartIsCompleting}
    />
  );

  const CheckoutTutorialOverlay = () => (
    <ImprovedTutorialOverlay
      isActive={isCheckoutActive && checkoutTutorialActive}
      currentStep={checkoutCurrentStep}
      currentStepIndex={checkoutCurrentStepIndex}
      totalSteps={checkoutTotalSteps}
      onNext={handleCheckoutNext}
      onPrev={checkoutPrevStep}
      onSkip={() => {
        checkoutSkipTutorial();
        handleCheckoutComplete();
      }}
      onFinish={() => {
        checkoutSkipTutorial();
        handleCheckoutComplete();
      }}
      isCompleting={checkoutIsCompleting}
    />
  );

  return (
    <>
      {children}
      
      {/* Add to Cart Tutorial Overlay - Only show if checkout is not active */}
      {!isCheckoutActive && (
        <AddToCartTutorialOverlay />
      )}
      
      {/* Checkout Tutorial Overlay - Only show if add to cart is not active */}
      {!isAddToCartActive && (
        <CheckoutTutorialOverlay />
      )}
    </>
  );
};

export default SellingPageTutorial;
