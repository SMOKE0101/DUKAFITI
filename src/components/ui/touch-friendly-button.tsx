
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TouchFriendlyButtonProps extends ButtonProps {
  children: React.ReactNode;
  touchOptimized?: boolean;
}

const TouchFriendlyButton = ({ 
  children, 
  className, 
  touchOptimized = true, 
  size = "default",
  ...props 
}: TouchFriendlyButtonProps) => {
  const touchClasses = touchOptimized 
    ? "min-h-[44px] min-w-[44px] touch-manipulation" 
    : "";

  return (
    <Button
      className={cn(touchClasses, className)}
      size={size}
      {...props}
    >
      {children}
    </Button>
  );
};

export { TouchFriendlyButton };
