
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class SalesErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('[SalesErrorBoundary] Error caught:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SalesErrorBoundary] Error details:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Sales Page Error
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Something went wrong while loading the sales page.
                  </p>
                  
                  {this.state.error && (
                    <details className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg text-left">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Error Details
                      </summary>
                      <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                        {this.state.error.message}
                        {this.state.error.stack && (
                          <>
                            {'\n\n'}
                            {this.state.error.stack}
                          </>
                        )}
                      </pre>
                    </details>
                  )}
                </div>

                <div className="flex gap-3 w-full max-w-sm">
                  <Button
                    onClick={this.handleRetry}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={this.handleRefresh}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Reload Page
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                  If this error persists, try refreshing the page or check your internet connection.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SalesErrorBoundary;
