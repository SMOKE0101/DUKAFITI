
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './hooks/useAuth';
import { PremiumAppLayout } from './components/layout/PremiumAppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import CleanLanding from "./pages/CleanLanding";
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

// Theme initialization function
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('dukafiti_settings_guest') || localStorage.getItem(`dukafiti_settings_${localStorage.getItem('supabase.auth.token')}`);
  let theme = 'light'; // Default to light
  
  if (savedTheme) {
    try {
      const settings = JSON.parse(savedTheme);
      theme = settings.theme || 'light';
    } catch (error) {
      console.error('Error parsing saved theme:', error);
    }
  }
  
  const root = window.document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
);

function App() {
  useEffect(() => {
    // Initialize theme on app load
    initializeTheme();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<CleanLanding />} />
                <Route path="/landing" element={<CleanLanding />} />
                <Route path="/modern-landing" element={<ModernLanding />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/demo" element={<BrandDemo />} />
                <Route path="/offline" element={<Offline />} />
                <Route path="/app" element={<AuthHandler />} />
                
                {/* Protected routes with layout */}
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
