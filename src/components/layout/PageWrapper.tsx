
import React from 'react';
import { cn } from '@/lib/utils';

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageWrapper({ 
  children, 
  title, 
  subtitle, 
  actions, 
  className,
  fullWidth = false
}: PageWrapperProps) {
  return (
    <div className={cn(
      "min-h-full bg-gradient-to-br from-background via-background to-muted/30",
      className
    )}>
      {(title || subtitle || actions) && (
        <div className={cn(
          "sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50",
          fullWidth ? "px-6 py-6" : "px-6 py-6"
        )}>
          <div className={cn(
            "flex items-center justify-between",
            fullWidth ? "" : "max-w-7xl mx-auto"
          )}>
            <div>
              {title && (
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={cn(
        "p-6",
        fullWidth ? "" : "max-w-7xl mx-auto"
      )}>
        {children}
      </div>
    </div>
  );
}
