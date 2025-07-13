// Production-safe logging utility
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    console.error(...args); // Always log errors
  },
  
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  }
};

// Global error handler for production
export const setupErrorHandling = () => {
  if (import.meta.env.PROD) {
    window.addEventListener('error', (event) => {
      logger.error('Global error:', event.error);
      // You can integrate with error tracking services here
    });

    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection:', event.reason);
      // You can integrate with error tracking services here
    });
  }
};