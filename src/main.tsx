
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Enhanced service worker registration for robust offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Unregister any existing service workers to prevent conflicts
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      console.log('[Main] Cleared existing service workers');
      
      // Register the unified service worker
      const registration = await navigator.serviceWorker.register('/unified-offline-sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });
      
      console.log('[Main] Unified Service worker registered:', registration.scope);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[Main] Service worker is ready');
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Main] New service worker available');
              // Auto-reload for updates
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
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
      
      // Preload critical resources
      if ('caches' in window) {
        const cache = await caches.open('dukafiti-static-v2');
        try {
          await cache.addAll([
            '/',
            '/index.html',
            '/src/main.tsx',
            '/manifest.json'
          ]);
          console.log('[Main] Critical resources preloaded');
        } catch (error) {
          console.warn('[Main] Failed to preload some resources:', error);
        }
      }
      
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
