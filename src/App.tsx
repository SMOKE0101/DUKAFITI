
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './hooks/useAuth';
import PremiumAppLayout from './components/layout/PremiumAppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Landing from "./pages/Landing";
import ModernLanding from "./pages/ModernLanding";
import Index from "./pages/Index";
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
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/modern-landing" element={<ModernLanding />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/demo" element={<BrandDemo />} />
                <Route path="/offline" element={<Offline />} />
                
                {/* Protected routes with layout */}
                <Route path="/app" element={
                  <ProtectedRoute>
                    <PremiumAppLayout>
                      <Navigate to="/dashboard" replace />
                    </PremiumAppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <PremiumAppLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <EnhancedDashboard />
                      </Suspense>
                    </PremiumAppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/sales" element={
                  <ProtectedRoute>
                    <PremiumAppLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <SalesManagement />
                      </Suspense>
                    </PremiumAppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/inventory" element={
                  <ProtectedRoute>
                    <PremiumAppLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <InventoryPage />
                      </Suspense>
                    </PremiumAppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/customers" element={
                  <ProtectedRoute>
                    <PremiumAppLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <CustomersPage />
                      </Suspense>
                    </PremiumAppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <PremiumAppLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <ReportsPage />
                      </Suspense>
                    </PremiumAppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <PremiumAppLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Settings />
                      </Suspense>
                    </PremiumAppLayout>
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
    </ErrorBoundary>
  );
}

export default App;
