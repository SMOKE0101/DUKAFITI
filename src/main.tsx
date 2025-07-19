
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('[Main] Starting React application initialization...');

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[Main] Service worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('[Main] Service worker registration failed:', error);
      });
  });
}

// Ensure React is properly loaded
if (typeof React === 'undefined') {
  throw new Error('React is not properly loaded');
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

try {
  console.log('[Main] Creating React root...');
  const root = createRoot(container);
  
  console.log('[Main] Rendering React app...');
  root.render(<App />);
  
  console.log('[Main] React app rendered successfully');
} catch (error) {
  console.error('[Main] Failed to render React app:', error);
  container.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace; max-width: 600px; margin: 50px auto;">
      <h1>App Failed to Load</h1>
      <p>There was an error initializing the React application.</p>
      <p><strong>Error:</strong> ${error.message}</p>
      <p>Please refresh the page or contact support.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Refresh Page
      </button>
    </div>
  `;
}
