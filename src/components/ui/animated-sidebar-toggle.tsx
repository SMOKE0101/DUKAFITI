
import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedSidebarToggleProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const AnimatedSidebarToggle: React.FC<AnimatedSidebarToggleProps> = ({
  isOpen,
  onClick,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-6 h-6 flex items-center justify-center transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-sm",
        className
      )}
      aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
    >
      <div className={cn(
        "relative w-5 h-5 transition-all duration-300 ease-in-out",
        isOpen ? "rotate-180" : "rotate-0"
      )}>
        {/* Top line */}
        <div className={cn(
          "absolute top-0 left-0 h-1 bg-current rounded-sm transition-all duration-300 ease-in-out",
          isOpen ? "w-5 rotate-45 translate-y-2" : "w-5"
        )} />
        
        {/* Middle line */}
        <div className={cn(
          "absolute top-2 left-0 h-1 bg-current rounded-sm transition-all duration-300 ease-in-out",
          isOpen ? "w-0 opacity-0" : "w-4"
        )} />
        
        {/* Bottom line */}
        <div className={cn(
          "absolute top-4 left-0 h-1 bg-current rounded-sm transition-all duration-300 ease-in-out",
          isOpen ? "w-5 -rotate-45 -translate-y-2" : "w-3"
        )} />
      </div>
    </button>
  );
};
