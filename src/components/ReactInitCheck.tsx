import * as React from 'react';

interface ReactInitCheckProps {
  children: React.ReactNode;
}

export const ReactInitCheck: React.FC<ReactInitCheckProps> = ({ children }) => {
  // Check if React and its hooks are properly available - but always call hooks first
  const [mounted, setMounted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    try {
      // Check if React is properly loaded
      if (typeof React === 'undefined') {
        setError('React is not loaded');
        return;
      }

      if (typeof React.useState === 'undefined') {
        setError('React hooks are not available');
        return;
      }

      setMounted(true);
    } catch (err) {
      console.error('React initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>React Error: {error}</div>;
  }

  if (!mounted) {
    return <div style={{ padding: '20px' }}>Initializing React...</div>;
  }

  return <>{children}</>;
};