
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register enhanced service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Unregister any existing service workers first
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      
      // Register the enhanced service worker
      const registration = await navigator.serviceWorker.register('/enhanced-robust-sw.js', {
        scope: '/'
      });
      
      console.log('[Main] Enhanced Service worker registered:', registration.scope);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Main] New service worker available');
              // Optionally show update notification to user
            }
          });
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
