import React from 'react';
import { useAppStateManager } from '../hooks/useAppStateManager';

interface AppStateWrapperProps {
  children: React.ReactNode;
}

const AppStateWrapper = ({ children }: AppStateWrapperProps) => {
  // Initialize app state management for mobile session persistence
  useAppStateManager();

  return <>{children}</>;
};

export default AppStateWrapper;