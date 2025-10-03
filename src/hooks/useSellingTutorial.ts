import { useState, useEffect } from 'react';

export const useSellingTutorial = (cartItems: any[] = []) => {
  const [addToCartCompleted, setAddToCartCompleted] = useState(false);
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);
  const hasCartItems = cartItems && cartItems.length > 0;

  useEffect(() => {
    const checkCompletion = () => {
      const addCompleted = localStorage.getItem('sellingAddToCartTutorialCompleted') === 'true';
      const checkoutCompleted = localStorage.getItem('sellingCheckoutTutorialCompleted') === 'true';
      setAddToCartCompleted(addCompleted);
      setCheckoutCompleted(checkoutCompleted);
    };

    checkCompletion();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sellingAddToCartTutorialCompleted' || e.key === 'sellingCheckoutTutorialCompleted') {
        checkCompletion();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const resetAddToCartTutorial = () => {
    localStorage.removeItem('sellingAddToCartTutorialCompleted');
    setAddToCartCompleted(false);
  };

  const resetCheckoutTutorial = () => {
    localStorage.removeItem('sellingCheckoutTutorialCompleted');
    setCheckoutCompleted(false);
  };

  const resetAllTutorials = () => {
    resetAddToCartTutorial();
    resetCheckoutTutorial();
  };

  return {
    addToCartCompleted,
    checkoutCompleted,
    hasCartItems,
    resetAddToCartTutorial,
    resetCheckoutTutorial,
    resetAllTutorials
  };
};
