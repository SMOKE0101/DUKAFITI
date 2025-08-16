import React, { useEffect } from 'react';
import { useTutorialProvider } from '@/hooks/useTutorialSystem';
import { tutorialConfigs } from '@/data/tutorials';
import TutorialOverlay from './TutorialOverlay';

interface TutorialProviderProps {
  children: React.ReactNode;
}

const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const { contextValue, TutorialContext, setTutorials } = useTutorialProvider();

  // Load tutorial configurations
  useEffect(() => {
    const tutorialsMap = tutorialConfigs.reduce((acc, config) => {
      acc[config.id] = config;
      return acc;
    }, {} as Record<string, any>);
    
    setTutorials(tutorialsMap);
  }, [setTutorials]);

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
      <TutorialOverlay />
    </TutorialContext.Provider>
  );
};

export default TutorialProvider;