
import React, { useEffect, useState } from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";

interface TooltipWrapperProps {
  children: React.ReactNode;
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure React is fully mounted before initializing TooltipProvider
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Render children without TooltipProvider until React is ready
  if (!isReady) {
    return <>{children}</>;
  }

  // Only render TooltipProvider when React hooks are guaranteed to be available
  try {
    return (
      <TooltipProvider>
        {children}
      </TooltipProvider>
    );
  } catch (error) {
    console.error('TooltipProvider initialization failed:', error);
    // Fallback to rendering without tooltips
    return <>{children}</>;
  }
};
