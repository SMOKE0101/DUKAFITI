import { Toaster } from "@/components/ui/toaster";
import { ProductionToaster } from "@/components/ui/production-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import ModernLanding from "./pages/ModernLanding";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Offline from "./pages/Offline";
import ProtectedRoute from "./components/ProtectedRoute";
import PremiumAppLayout from "./components/layout/PremiumAppLayout";
import Dashboard from "./components/Dashboard";
import ModernSalesPage from "./components/ModernSalesPage";
import InventoryPage from "./components/InventoryPage";
import CustomersPage from "./components/CustomersPage";
import ReportsPage from "./components/ReportsPage";
import ErrorBoundary from "./components/ErrorBoundary";
import EnhancedOfflineStatus from "@/components/EnhancedOfflineStatus";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (!navigator.onLine) return false;
        return failureCount < 2;
      },
    },
  },
});

// Component to handle root route logic
const RootHandler = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing app...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // If not authenticated, show the modern landing page
  return <ModernLanding />;
};

function App() {
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    // Enhanced initialization with better error handling
    const initializeApp = async () => {
      try {
        // Initialize service worker with better error handling
        if ('serviceWorker' in navigator) {
          try {
            // Unregister old service workers first
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              if (registration.scope.includes('offline-sw') || 
                  registration.scope.includes('enhanced')) {
                await registration.unregister();
                console.log('[App] Unregistered old service worker');
              }
            }

            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
              updateViaCache: 'none'
            });
            
            console.log('[App] Service Worker registered:', registration.scope);
            
            // Handle updates - immediate activation
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed') {
                    console.log('[App] New service worker installed, activating...');
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    // Reload immediately to use new SW
                    if (navigator.serviceWorker.controller) {
                      setTimeout(() => window.location.reload(), 100);
                    }
                  }
                });
              }
            });

            // Handle activation
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              console.log('[App] Service worker controller changed');
              window.location.reload();
            });

            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('[App] Service worker is ready');
            
          } catch (swError) {
            console.error('[App] Service Worker registration failed:', swError);
            // Continue without SW
          }
        }

        // Initialize IndexedDB early
        try {
          const { offlineDB } = await import('./utils/offlineDB');
          await offlineDB.init();
          
          // Test database functionality
          const isDbWorking = await offlineDB.testDatabase();
          if (isDbWorking) {
            console.log('[App] IndexedDB initialized and tested successfully');
          } else {
            console.warn('[App] IndexedDB test failed, some offline features may not work');
          }
        } catch (dbError) {
          console.error('[App] IndexedDB initialization failed:', dbError);
          // Continue with degraded functionality
        }

        setIsOfflineReady(true);
        
      } catch (error) {
        console.error('[App] App initialization failed:', error);
        setIsOfflineReady(true); // Continue anyway
      }
    };

    initializeApp();

    // Enhanced PWA install prompt
    let deferredPrompt: any;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[App] PWA install prompt available');
      e.preventDefault();
      deferredPrompt = e;
      
      // Show custom install prompt after a delay
      setTimeout(() => {
        if (deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
          // Could show a custom install banner here
          console.log('[App] PWA can be installed');
        }
      }, 5000);
    });

    window.addEventListener('appinstalled', () => {
      console.log('[App] PWA was installed');
      deferredPrompt = null;
    });

    // Enhanced online/offline handling
    const handleOnline = () => {
      console.log('[App] Application came online');
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
      }
    };

    const handleOffline = () => {
      console.log('[App] Application went offline - offline mode enabled');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show loading state for too long
  if (!isOfflineReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing app...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <AuthProvider>
              <TooltipProvider>
                <div className="min-h-screen w-full bg-background text-foreground">
                  <EnhancedOfflineStatus />
                  
                  <Routes>
                    {/* Root route - shows landing for unauthenticated users, redirects to dashboard for authenticated users */}
                    <Route path="/" element={<RootHandler />} />
                    
                    {/* Public routes */}
                    <Route path="/modern-landing" element={<ModernLanding />} />
                    <Route path="/landing" element={<Landing />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/auth" element={<Navigate to="/signin" replace />} />
                    <Route path="/offline" element={<Offline />} />
                    
                    {/* Legacy dashboard compatibility route */}
                    <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
                    
                    {/* Protected routes with enhanced offline support */}
                    <Route path="/app" element={
                      <ProtectedRoute>
                        <PremiumAppLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<Navigate to="/app/dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="sales" element={<ModernSalesPage />} />
                      <Route path="inventory" element={<InventoryPage />} />
                      <Route path="customers" element={<CustomersPage />} />
                      <Route path="reports" element={<ReportsPage />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                    
                    {/* Legacy route redirect */}
                    <Route path="/index" element={<Index />} />
                    
                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <Toaster />
                  <ProductionToaster />
                </div>
              </TooltipProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
