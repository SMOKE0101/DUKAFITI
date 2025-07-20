
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ProductionErrorHandler from '../ui/production-error-handler';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
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
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ProductionErrorHandler 
          error={this.state.error}
          retry={this.handleRetry}
          showDetails={true}
        />
      );
    }

    return this.props.children;
  }
}

export default SalesErrorBoundary;
