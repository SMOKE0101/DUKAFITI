
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import ModernLanding from "./pages/ModernLanding";
import AuthHandler from "./pages/AuthHandler";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import Offline from "./pages/Offline";
import BrandDemo from "./pages/BrandDemo";

// Dashboard Components
import EnhancedDashboard from "./components/EnhancedDashboard";
import SalesManagement from "./components/SalesManagement";
import InventoryPage from "./components/InventoryPage";
import CustomersPage from "./components/CustomersPage";
import ReportsPage from "./components/ReportsPage";
import Settings from "./pages/Settings";

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey="dukafiti-theme"
      >
        <QueryClientProvider client={queryClient}>
          <Router>
            <AuthProvider>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Main route - redirect based on auth status */}
                  <Route path="/" element={<Index />} />
                  
                  {/* Public routes */}
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/modern-landing" element={<ModernLanding />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/demo" element={<BrandDemo />} />
                  <Route path="/offline" element={<Offline />} />
                  <Route path="/app" element={<AuthHandler />} />
                  
                  {/* Protected routes with layout */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <EnhancedDashboard />
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/sales" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <SalesManagement />
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/inventory" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <InventoryPage />
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/customers" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <CustomersPage />
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/reports" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <ReportsPage />
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Settings />
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </div>
            </AuthProvider>
          </Router>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
