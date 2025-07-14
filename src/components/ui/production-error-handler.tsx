import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductionErrorHandlerProps {
  error?: Error;
  retry?: () => void;
  showDetails?: boolean;
}

const ProductionErrorHandler: React.FC<ProductionErrorHandlerProps> = ({
  error,
  retry,
  showDetails = false
}) => {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
          
          <div className="flex flex-col gap-2">
            {retry && (
              <Button onClick={retry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>

          {(isDevelopment || showDetails) && error && (
            <details className="text-left mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                Error Details (Development Mode)
              </summary>
              <div className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-32">
                <p className="font-medium text-destructive mb-1">{error.message}</p>
                {error.stack && (
                  <pre className="text-muted-foreground whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionErrorHandler;