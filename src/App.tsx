import { Toaster } from "@/components/ui/toaster";
import { ProductionToaster } from "@/components/ui/production-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
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
import OfflineStatus from "./components/OfflineStatus";

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
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    // Enhanced service worker registration for consistent reload behavior
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          // Unregister any existing service workers to prevent conflicts
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(registration => registration.unregister()));
          
          console.log('[App] Cleared existing service workers');
          
          // Register the enhanced service worker with immediate activation
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none' // Always check for updates
          });
          
          console.log('[App] Enhanced Service Worker registered:', registration.scope);
          
          // Handle service worker updates with immediate activation
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[App] New service worker available - activating immediately');
                    // Auto-update immediately for consistent reload behavior
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    
                    // Reload after a short delay to ensure SW is active
                    setTimeout(() => {
                      console.log('[App] Reloading to activate new service worker');
                      window.location.reload();
                    }, 100);
                  } else {
                    console.log('[App] Service worker activated for the first time');
                  }
                }
              });
            }
          });

          // Listen for service worker control changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[App] Service worker controller changed');
            // Don't auto-reload here to prevent loops
          });

          // Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
              console.log('[App] Service worker updated');
              // Handle updates gracefully without forced reload
            }
          });

          // Ensure service worker is ready before marking as offline-ready
          if (registration.active) {
            setIsOfflineReady(true);
          } else {
            // Wait for service worker to become active
            registration.addEventListener('updatefound', () => {
              const worker = registration.installing;
              if (worker) {
                worker.addEventListener('statechange', () => {
                  if (worker.state === 'activated') {
                    setIsOfflineReady(true);
                  }
                });
              }
            });
            
            // Fallback timeout
            setTimeout(() => setIsOfflineReady(true), 2000);
          }

        } catch (error) {
          console.error('[App] Service Worker registration failed:', error);
          setIsOfflineReady(true); // Continue without SW
        }
      });
    } else {
      setIsOfflineReady(true);
    }

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
      // Trigger background sync
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
      }
    };

    const handleOffline = () => {
      console.log('[App] Application went offline - offline mode enabled');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize offline database with enhanced error handling
    const initOfflineDB = async () => {
      try {
        if (typeof window !== 'undefined' && 'indexedDB' in window) {
          const request = indexedDB.open('DukaSmartOffline', 1);
          
          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Create required object stores
            const stores = ['settings', 'products', 'customers', 'sales', 'actionQueue'];
            stores.forEach(storeName => {
              if (!db.objectStoreNames.contains(storeName)) {
                const store = db.createObjectStore(storeName, { keyPath: 'id' });
                
                // Add indexes for better querying
                if (storeName === 'products' || storeName === 'customers' || storeName === 'sales') {
                  store.createIndex('user_id', 'user_id');
                }
                if (storeName === 'actionQueue') {
                  store.createIndex('timestamp', 'timestamp');
                  store.createIndex('synced', 'synced');
                }
              }
            });
          };
          
          request.onsuccess = (event) => {
            console.log('[App] Offline database initialized');
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Pre-warm the database connection
            const transaction = db.transaction(['settings'], 'readonly');
            transaction.oncomplete = () => {
              console.log('[App] Database connection pre-warmed');
            };
          };

          request.onerror = (event) => {
            console.error('[App] Failed to initialize offline database:', event);
          };
        }
      } catch (error) {
        console.error('[App] Failed to initialize offline database:', error);
      }
    };

    initOfflineDB();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // CRITICAL: Don't show loading state for too long to prevent blank screens
  if (!isOfflineReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Preparing offline capabilities...</p>
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
                  {/* Global offline status indicator */}
                  <OfflineStatus />
                  
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
