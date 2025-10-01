import { useState, useEffect } from 'react';

export const useCustomersTutorial = () => {
  const [addCustomerCompleted, setAddCustomerCompleted] = useState(false);
  const [customerCardCompleted, setCustomerCardCompleted] = useState(false);
  const [hasCustomers, setHasCustomers] = useState(false);

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

  // Set hasCustomers based on external state
  const setCustomerCount = (count: number) => {
    setHasCustomers(count > 0);
  };

  return {
    addCustomerCompleted,
    customerCardCompleted,
    hasCustomers,
    setCustomerCount,
    resetAddCustomerTutorial,
    resetCustomerCardTutorial,
    resetAllTutorials
  };
};

export default useCustomersTutorial;
