
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TouchFriendlyButtonProps extends ButtonProps {
  children: React.ReactNode;
}

const TouchFriendlyButton: React.FC<TouchFriendlyButtonProps> = ({ 
  children, 
  className, 
  ...props 
}) => {
  return (
    <Button
      className={cn(
        'min-h-[48px] touch-manipulation active:scale-95 transition-transform',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

export { TouchFriendlyButton };
