import { useState, useEffect } from 'react';

export const useInventoryTutorial = () => {
  const [addProductCompleted, setAddProductCompleted] = useState(false);
  const [productCardCompleted, setProductCardCompleted] = useState(false);
  const [productCount, setProductCount] = useState(0);

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

  // hasProducts is true when product card tutorial is completed OR when there are products
  const hasProducts = productCardCompleted || productCount > 0;

  return {
    addProductCompleted,
    productCardCompleted,
    hasProducts,
    setProductCount,
    resetAddProductTutorial,
    resetProductCardTutorial,
    resetAllTutorials
  };
};
