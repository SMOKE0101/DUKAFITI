
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
  // Only show error in development
  if (import.meta.env.DEV) {
    console.error('Development environment validation failed:', error);
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  logger.error('Failed to render React app with StrictMode:', error);
  
  // Fallback render without React.StrictMode if there's an issue
  try {
    root.render(<App />);
  } catch (fallbackError) {
    logger.error('Failed to render React app completely:', fallbackError);
    
    // Last resort: show error message
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Application Error</h1>
          <p style="color: #6b7280;">Unable to start the application. Please refresh the page.</p>
        </div>
      </div>
    `;
  }
}
