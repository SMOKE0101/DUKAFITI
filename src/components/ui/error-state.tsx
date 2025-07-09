
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  variant?: 'page' | 'inline';
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  title, 
  message, 
  onRetry, 
  variant = 'inline' 
}) => {
  const containerClass = variant === 'page' 
    ? 'flex flex-col items-center justify-center min-h-[400px] text-center' 
    : 'p-8 text-center border rounded-lg bg-red-50';

  return (
    <div className={containerClass}>
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2 text-red-900">{title}</h3>
      <p className="text-red-700 mb-4 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
