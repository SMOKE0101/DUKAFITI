
import React from 'react';
import ProductionErrorHandler from '../ui/production-error-handler';

interface SalesErrorBoundaryProps {
  children: React.ReactNode;
}

interface SalesErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SalesErrorBoundary extends React.Component<SalesErrorBoundaryProps, SalesErrorBoundaryState> {
  constructor(props: SalesErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SalesErrorBoundaryState {
    console.error('[SalesErrorBoundary] Caught error:', error);
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SalesErrorBoundary] Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ProductionErrorHandler
          error={this.state.error}
          retry={() => {
            this.setState({ hasError: false, error: undefined });
            window.location.reload();
          }}
          showDetails={true}
        />
      );
    }

    return this.props.children;
  }
}

export default SalesErrorBoundary;
