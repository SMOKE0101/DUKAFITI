
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure React is properly initialized
if (typeof React === 'undefined') {
  throw new Error('React is not properly loaded');
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

// Add additional safety checks
try {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render React app:', error);
  // Fallback error display
  container.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h1>App Failed to Load</h1>
      <p>There was an error initializing the React application.</p>
      <p>Error: ${error.message}</p>
      <p>Please refresh the page or contact support.</p>
    </div>
  `;
}
