
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('React object:', React);
console.log('React.useEffect:', React.useEffect);
console.log('React.useState:', React.useState);

// Ensure React is properly available globally
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

console.log('Creating root with React:', React);
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
