
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

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
import ErrorBoundary from "./components/ErrorBoundary";

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

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
                    <AppLayout>
                      <Navigate to="/dashboard" replace />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
                        <EnhancedDashboard />
                      </Suspense>
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/sales" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
                        <SalesManagement />
                      </Suspense>
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/inventory" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
                        <InventoryPage />
                      </Suspense>
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/customers" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
                        <CustomersPage />
                      </Suspense>
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
                        <ReportsPage />
                      </Suspense>
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
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
    </ErrorBoundary>
  );
}

export default App;
