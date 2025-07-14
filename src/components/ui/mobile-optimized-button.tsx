import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileOptimizedButtonProps extends ButtonProps {
  mobileSize?: 'sm' | 'md' | 'lg';
  touchFriendly?: boolean;
}

const MobileOptimizedButton: React.FC<MobileOptimizedButtonProps> = ({
  children,
  className,
  mobileSize = 'md',
  touchFriendly = true,
  ...props
}) => {
  const isMobile = useIsMobile();

  const mobileSizes = {
    sm: 'h-10 px-3 text-sm',
    md: 'h-12 px-4 text-base',
    lg: 'h-14 px-6 text-lg'
  };

  const mobileClasses = isMobile ? [
    mobileSizes[mobileSize],
    touchFriendly && 'touch-manipulation',
    'active:scale-95 transition-transform duration-75'
  ].filter(Boolean).join(' ') : '';

  return (
    <Button
      className={cn(mobileClasses, className)}
      {...props}
    >
      {children}
    </Button>
  );
};

export default MobileOptimizedButton;