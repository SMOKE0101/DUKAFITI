
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useRobustOfflineManager } from './hooks/useRobustOfflineManager';

// Components
import { AppSidebar } from './components/layout/AppSidebar';
import Dashboard from './components/Dashboard';
import InventoryPage from './components/InventoryPage';
import ModernSalesPage from './components/ModernSalesPage';
import CustomersPage from './components/CustomersPage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import LandingPage from './pages/Landing';
import ModernLandingPage from './pages/ModernLanding';
import OfflineFirstRouter from './components/OfflineFirstRouter';
import RobustOfflineStatus from './components/RobustOfflineStatus';

// Create a stable QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry if we're offline
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations if we're offline
        if (!navigator.onLine) return false;
        return failureCount < 1;
      },
    },
  },
});

// App Layout Component
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { offlineState } = useRobustOfflineManager();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading || !offlineState.isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {loading ? 'Loading user session...' : 'Initializing offline support...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <OfflineFirstRouter>
            {children}
          </OfflineFirstRouter>
        </div>
      </main>
      <RobustOfflineStatus />
    </div>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
};

// Main App Component
const App: React.FC = () => {
  // Register service worker on app start
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Unregister any existing service workers
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(registration => registration.unregister()));
          
          // Register the robust service worker
          const registration = await navigator.serviceWorker.register('/robust-sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });
          
          console.log('[App] Robust Service Worker registered successfully:', registration.scope);
          
          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('[App] New service worker available');
                  // You could show a toast here to inform the user
                }
              });
            }
          });
          
        } catch (error) {
          console.error('[App] Service Worker registration failed:', error);
        }
      }
    };

    // Register service worker after a short delay to ensure app is loaded
    setTimeout(registerServiceWorker, 1000);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/modern-landing" element={<ModernLandingPage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Protected App Routes */}
              <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="/app/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/app/inventory" element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              } />
              <Route path="/app/sales" element={
                <ProtectedRoute>
                  <ModernSalesPage />
                </ProtectedRoute>
              } />
              <Route path="/app/customers" element={
                <ProtectedRoute>
                  <CustomersPage />
                </ProtectedRoute>
              } />
              <Route path="/app/reports" element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              <Route path="/app/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              
              {/* Redirect legacy routes */}
              <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="/inventory" element={<Navigate to="/app/inventory" replace />} />
              <Route path="/sales" element={<Navigate to="/app/sales" replace />} />
              <Route path="/customers" element={<Navigate to="/app/customers" replace />} />
              <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
              <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
