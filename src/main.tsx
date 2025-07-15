
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// PWA and offline-first initialization
const initializePWA = async () => {
  // Initialize IndexedDB
  try {
    const { offlineDB } = await import('./utils/indexedDB');
    await offlineDB.init();
    console.log('[PWA] IndexedDB initialized successfully');
  } catch (error) {
    console.error('[PWA] Failed to initialize IndexedDB:', error);
  }

  // Initialize service worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/enhanced-offline-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('[PWA] Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              console.log('[PWA] New content available, please refresh');
            }
          });
        }
      });
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }

  // Check for app updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

// Initialize PWA features then render app
initializePWA().then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch((error) => {
  console.error('[PWA] Failed to initialize PWA features:', error);
  // Render app anyway
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

// Handle app lifecycle
window.addEventListener('beforeunload', () => {
  // Save any pending offline data
  console.log('[PWA] App is closing, saving state...');
});

// Handle visibility changes for background sync
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // App became visible, check for sync
    console.log('[PWA] App became visible, checking for sync opportunities');
  }
});
