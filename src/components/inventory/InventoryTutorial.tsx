import React, { useState, useEffect, useCallback } from 'react';
import { useImprovedTutorial } from '@/hooks/useImprovedTutorial';
import ImprovedTutorialOverlay from '@/components/ImprovedTutorialOverlay';
import { useIsMobile } from '@/hooks/use-mobile';
import { Product } from '@/types';

// Define tutorial steps for Add Product tutorial
const useAddProductTutorialSteps = () => {
  const isMobile = useIsMobile();

  const steps: import('@/hooks/useImprovedTutorial').TutorialStep[] = [
    {
      id: 'add-product-button',
      title: 'Add Product',
      description: isMobile 
        ? "Tap the 'Add' button to open the menu and add a new product to your inventory."
        : "Click the 'Add Product' button to open the product form and add your first product.",
      targetId: 'add-product-dropdown-trigger'
    }
  ];

  return steps;
};

// Define tutorial steps for Product Card tutorial
const useProductCardTutorialSteps = (products: Product[]) => {
  const isMobile = useIsMobile();
  const hasProducts = products && products.length > 0;
  const firstProduct = hasProducts ? products[0] : null;

  const steps: import('@/hooks/useImprovedTutorial').TutorialStep[] = [
    {
      id: 'product-card-overview',
      title: 'Product Card Overview',
      description: "This is a product card showing all the important information about a product including its name, category, price, stock level, and quick action buttons.",
      targetId: firstProduct ? `product-card-${firstProduct.id}` : 'product-card-placeholder'
    },
    {
      id: 'product-details',
      title: 'Product Details',
      description: "Here you can see the product's pricing information including selling price and cost price (if profit tracking is enabled), as well as current stock levels. The color indicates the stock level - green for good stock, yellow for low stock, and red for out of stock.",
      targetId: firstProduct ? `product-card-${firstProduct.id}` : 'product-card-placeholder',
      position: isMobile ? 'bottom' : 'top'
    },
    {
      id: 'product-actions',
      title: 'Product Actions',
      description: "These buttons allow you to quickly edit product information, restock inventory, or delete the product. The restock button is only enabled when stock tracking is enabled for this product.",
      targetId: firstProduct ? `product-card-${firstProduct.id}` : 'product-card-placeholder'
    }
  ];

  return steps;
};

interface InventoryTutorialProps {
  children: React.ReactNode;
  products: Product[];
  onAddProduct: () => void;
  autoStartAddProduct?: boolean;
  autoStartProductCard?: boolean;
}

export const InventoryTutorial: React.FC<InventoryTutorialProps> = ({
  children,
  products,
  onAddProduct,
  autoStartAddProduct = false,
  autoStartProductCard = false
}) => {
  const isMobile = useIsMobile();
  const hasProducts = products && products.length > 0;
  
  // Tutorial states
  const [addProductTutorialActive, setAddProductTutorialActive] = useState(false);
  const [productCardTutorialActive, setProductCardTutorialActive] = useState(false);
  
  // Add Product Tutorial
  const addProductSteps = useAddProductTutorialSteps();
  const {
    isActive: isAddProductActive,
    currentStep: addProductCurrentStep,
    currentStepIndex: addProductCurrentStepIndex,
    totalSteps: addProductTotalSteps,
    startTutorial: startAddProductTutorial,
    nextStep: addProductNextStep,
    prevStep: addProductPrevStep,
    skipTutorial: addProductSkipTutorial,
    isCompleting: addProductIsCompleting,
    isTutorialCompleted: isAddProductCompleted
  } = useImprovedTutorial({
    steps: addProductSteps,
    storageKey: 'inventoryAddProductTutorialCompleted'
  });

  // Product Card Tutorial
  const productCardSteps = useProductCardTutorialSteps(products);
  const {
    isActive: isProductCardActive,
    currentStep: productCardCurrentStep,
    currentStepIndex: productCardCurrentStepIndex,
    totalSteps: productCardTotalSteps,
    startTutorial: startProductCardTutorial,
    nextStep: productCardNextStep,
    prevStep: productCardPrevStep,
    skipTutorial: productCardSkipTutorial,
    isCompleting: productCardIsCompleting,
    isTutorialCompleted: isProductCardCompleted
  } = useImprovedTutorial({
    steps: productCardSteps,
    storageKey: 'inventoryProductCardTutorialCompleted'
  });

  // Auto-start tutorials
  useEffect(() => {
    if (autoStartAddProduct && !isAddProductCompleted) {
      const timer = setTimeout(() => {
        setAddProductTutorialActive(true);
        startAddProductTutorial();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStartAddProduct, startAddProductTutorial, isAddProductCompleted]);

  useEffect(() => {
    if (autoStartProductCard && hasProducts && !isProductCardCompleted) {
      const timer = setTimeout(() => {
        setProductCardTutorialActive(true);
        startProductCardTutorial();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStartProductCard, hasProducts, startProductCardTutorial, isProductCardCompleted]);

  // Handle Add Product tutorial completion
  const handleAddProductComplete = useCallback(() => {
    setAddProductTutorialActive(false);
  }, []);

  // Handle Product Card tutorial completion
  const handleProductCardComplete = useCallback(() => {
    setProductCardTutorialActive(false);
  }, []);

  // Enhanced next step handlers to handle special cases
  const handleAddProductNext = useCallback(() => {
    // For the single step, we want to open the dropdown/menu and then complete
    if (addProductCurrentStepIndex === 0) {
      // Trigger the dropdown/menu to open
      const dropdownTrigger = document.getElementById('add-product-dropdown-trigger');
      if (dropdownTrigger) {
        dropdownTrigger.click();
        
        // Small delay to let the dropdown open, then complete tutorial
        setTimeout(() => {
          addProductNextStep();
        }, 300);
      } else {
        addProductNextStep();
      }
    } else {
      addProductNextStep();
    }
  }, [addProductCurrentStepIndex, addProductNextStep]);

  // Enhanced overlay components with proper positioning
  const AddProductTutorialOverlay = () => (
    <ImprovedTutorialOverlay
      isActive={isAddProductActive && addProductTutorialActive}
      currentStep={addProductCurrentStep}
      currentStepIndex={addProductCurrentStepIndex}
      totalSteps={addProductTotalSteps}
      onNext={handleAddProductNext}
      onPrev={addProductPrevStep}
      onSkip={() => {
        addProductSkipTutorial();
        handleAddProductComplete();
      }}
      onFinish={() => {
        addProductSkipTutorial();
        handleAddProductComplete();
      }}
      isCompleting={addProductIsCompleting}
    />
  );

  const ProductCardTutorialOverlay = () => (
    <ImprovedTutorialOverlay
      isActive={isProductCardActive && productCardTutorialActive}
      currentStep={productCardCurrentStep}
      currentStepIndex={productCardCurrentStepIndex}
      totalSteps={productCardTotalSteps}
      onNext={productCardNextStep}
      onPrev={productCardPrevStep}
      onSkip={() => {
        productCardSkipTutorial();
        handleProductCardComplete();
      }}
      onFinish={() => {
        productCardSkipTutorial();
        handleProductCardComplete();
      }}
      isCompleting={productCardIsCompleting}
    />
  );

  return (
    <>
      {children}
      
      {/* Add Product Tutorial Overlay */}
      <AddProductTutorialOverlay />
      
      {/* Product Card Tutorial Overlay */}
      <ProductCardTutorialOverlay />
    </>
  );
};

// Hook to manage tutorial state in settings
export const useInventoryTutorial = () => {
  const [addProductCompleted, setAddProductCompleted] = useState(false);
  const [productCardCompleted, setProductCardCompleted] = useState(false);

  useEffect(() => {
    const checkCompletion = () => {
      const addCompleted = localStorage.getItem('inventoryAddProductTutorialCompleted') === 'true';
      const cardCompleted = localStorage.getItem('inventoryProductCardTutorialCompleted') === 'true';
      setAddProductCompleted(addCompleted);
      setProductCardCompleted(cardCompleted);
    };

    checkCompletion();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inventoryAddProductTutorialCompleted' || e.key === 'inventoryProductCardTutorialCompleted') {
        checkCompletion();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const resetAddProductTutorial = () => {
    localStorage.removeItem('inventoryAddProductTutorialCompleted');
    setAddProductCompleted(false);
  };

  const resetProductCardTutorial = () => {
    localStorage.removeItem('inventoryProductCardTutorialCompleted');
    setProductCardCompleted(false);
  };

  const resetAllTutorials = () => {
    resetAddProductTutorial();
    resetProductCardTutorial();
  };

  return {
    addProductCompleted,
    productCardCompleted,
    hasProducts: productCardCompleted, // This determines if product card tutorial can be started
    resetAddProductTutorial,
    resetProductCardTutorial,
    resetAllTutorials
  };
};

export default InventoryTutorial;
