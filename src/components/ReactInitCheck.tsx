import * as React from 'react';

interface ReactInitCheckProps {
  children: React.ReactNode;
}

export const ReactInitCheck: React.FC<ReactInitCheckProps> = ({ children }) => {
  // Check if React and its hooks are properly available
  if (typeof React === 'undefined') {
    console.error('React is undefined');
    return <div style={{ padding: '20px', color: 'red' }}>React is not loaded</div>;
  }

  if (typeof React.useState === 'undefined') {
    console.error('React.useState is undefined');
    return <div style={{ padding: '20px', color: 'red' }}>React hooks are not available</div>;
  }

  try {
    // Try using React hooks to verify they work
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return <div style={{ padding: '20px' }}>Initializing React...</div>;
    }

    return <>{children}</>;
  } catch (error) {
    console.error('React hook error:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        React hook error: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
};