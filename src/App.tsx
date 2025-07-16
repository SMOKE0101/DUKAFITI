
import { Toaster } from "@/components/ui/toaster";
import { ProductionToaster } from "@/components/ui/production-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
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

function App() {
  useEffect(() => {
    // Register enhanced service worker for offline functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          // Unregister any existing service workers first
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(registration => registration.unregister()));
          
          console.log('[App] Cleared existing service workers');
          
          // Register the new service worker
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          console.log('[App] Enhanced Service Worker registered successfully:', registration.scope);
          
          // Listen for service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[App] New service worker installed');
                  if (window.confirm('New version available! Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });

        } catch (error) {
          console.error('[App] Service Worker registration failed:', error);
        }
      });
    }

    // Enhanced PWA install prompt handling
    let deferredPrompt: any;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[App] PWA install prompt available');
      e.preventDefault();
      deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      console.log('[App] PWA was installed');
      deferredPrompt = null;
    });

    // Enhanced online/offline event handling
    const handleOnline = () => {
      console.log('[App] Application came online');
      // Notify service worker to sync
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
      }
    };

    const handleOffline = () => {
      console.log('[App] Application went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthProvider>
              <TooltipProvider>
                <div className="min-h-screen w-full bg-background text-foreground">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<ModernLanding />} />
                    <Route path="/modern-landing" element={<ModernLanding />} />
                    <Route path="/landing" element={<Landing />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/auth" element={<Navigate to="/signin" replace />} />
                    <Route path="/offline" element={<Offline />} />
                    
                    {/* Dashboard compatibility route */}
                    <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
                    
                    {/* Protected routes with layout and offline support */}
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
