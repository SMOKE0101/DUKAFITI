
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateEnvironment } from './utils/buildValidation.ts';
import { setupErrorHandling, logger } from './utils/logger.ts';

// Setup global error handling
setupErrorHandling();

// Validate environment on startup
try {
  validateEnvironment();
} catch (error) {
  logger.error('Environment validation failed:', error);
  if (import.meta.env.PROD) {
    // In production, show user-friendly error
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Configuration Error</h1>
          <p style="color: #6b7280;">The application is not properly configured. Please contact support.</p>
        </div>
      </div>
    `;
    throw error;
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
