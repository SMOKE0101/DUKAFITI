
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register unified service worker for comprehensive offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Unregister any existing service workers to prevent conflicts
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      console.log('[Main] Cleared existing service workers');
      
      // Register the unified service worker
      const registration = await navigator.serviceWorker.register('/unified-offline-sw.js', {
        scope: '/'
      });
      
      console.log('[Main] Unified Service worker registered:', registration.scope);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Main] New service worker available');
              // Auto-reload if there's an update
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
      
      // Listen for network reconnection to sync data
      window.addEventListener('online', () => {
        console.log('[Main] Network reconnected - triggering sync');
        if (registration.active) {
          registration.active.postMessage({ type: 'SYNC_NOW' });
        }
      });
      
    } catch (error) {
      console.error('[Main] Service worker registration failed:', error);
    }
  });
}

console.log('[Main] Starting React application initialization...');

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

console.log('[Main] Creating React root...');
const root = createRoot(rootElement);

console.log('[Main] Rendering React app...');
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log('[Main] React app rendered successfully');
