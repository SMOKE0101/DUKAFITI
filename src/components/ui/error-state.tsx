
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'inline' | 'page' | 'toast';
}

const ErrorState = ({ 
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again.",
  onRetry,
  className,
  variant = 'inline'
}: ErrorStateProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      <div className="p-3 rounded-full bg-red-50">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline"
          className="flex items-center space-x-2 min-h-[44px]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );

  if (variant === 'page') {
    return (
      <div className={cn("min-h-[50vh] flex items-center justify-center p-4", className)}>
        {content}
      </div>
    );
  }

  return (
    <Card className={cn("border-red-200 bg-red-50/50", className)}>
      <CardContent className="p-6">
        {content}
      </CardContent>
    </Card>
  );
};

export default ErrorState;
