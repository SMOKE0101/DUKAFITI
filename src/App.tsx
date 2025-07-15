
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineFirst } from '@/hooks/useOfflineFirst';

// Pages
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Components
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import { PWAInstallButton } from './components/PWAInstallButton';
import Dashboard from './components/Dashboard';
import ProductManagement from './components/ProductManagement';
import ModernSalesPage from './components/ModernSalesPage';
import CustomersPage from './components/CustomersPage';
import ReportsPage from './components/ReportsPage';

// Create a client with proper error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        const errorObj = error as any;
        if (errorObj && typeof errorObj === 'object' && errorObj.message) {
          const message = errorObj.message.toLowerCase();
          if (message.includes('unauthorized') || message.includes('forbidden')) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
  },
});

function App() {
  const { user, loading } = useAuth();
  const { isOnline, initialize: initializeOffline } = useOfflineFirst();

  // Initialize offline capabilities
  useEffect(() => {
    initializeOffline();
  }, [initializeOffline]);

  // Enhanced service worker registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      console.log('[App] Registering enhanced service worker...');
      
      // Clear any existing registrations
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          if (registration.scope.includes('offline-sw') || 
              registration.scope.includes('enhanced-offline-sw')) {
            console.log('[App] Unregistering old service worker');
            registration.unregister();
          }
        });
      });

      // Register the enhanced service worker
      navigator.serviceWorker.register('/enhanced-offline-sw.js', {
        scope: '/'
      })
        .then((registration) => {
          console.log('[App] ✅ Enhanced SW registered:', registration);
          
          // Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('[App] SW message:', event.data);
            
            if (event.data?.type === 'SW_ACTIVATED') {
              console.log('[App] Service worker activated with version:', event.data.data.version);
            } else if (event.data?.type === 'SYNC_COMPLETED') {
              console.log('[App] Background sync completed');
            }
          });
          
          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[App] New service worker available');
                  // Optionally notify user about update
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.error('[App] ❌ SW registration failed:', registrationError);
        });

      // Handle service worker controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[App] Service worker controller changed');
        window.location.reload();
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading DukaFiti...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <div className="min-h-screen bg-background">
              <OfflineBanner />
              
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                
                {/* Protected routes */}
                <Route path="/app/*" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="inventory" element={<ProductManagement />} />
                        <Route path="sales" element={<ModernSalesPage />} />
                        <Route path="customers" element={<CustomersPage />} />
                        <Route path="reports" element={<ReportsPage />} />
                        <Route path="" element={<Dashboard />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                {/* Catch all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              
              <PWAInstallButton />
            </div>
          </Router>
          
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
