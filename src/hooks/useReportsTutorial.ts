import { useState, useEffect } from 'react';

export const useReportsTutorial = () => {
  const [reportsTutorialCompleted, setReportsTutorialCompleted] = useState(false);

  useEffect(() => {
    const checkCompletion = () => {
      const completed = localStorage.getItem('reportsTutorialCompleted') === 'true';
      setReportsTutorialCompleted(completed);
    };

    checkCompletion();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'reportsTutorialCompleted') {
        checkCompletion();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const resetReportsTutorial = () => {
    localStorage.removeItem('reportsTutorialCompleted');
    setReportsTutorialCompleted(false);
  };

  return {
    reportsTutorialCompleted,
    resetReportsTutorial
  };
};

export default useReportsTutorial;
