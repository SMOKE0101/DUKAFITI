
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ModernLanding from "./pages/ModernLanding";
import Landing from "./pages/Landing";
import BrandDemo from "./pages/BrandDemo";
import AuthForm from "./components/AuthForm";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import PremiumAppLayout from "./components/layout/PremiumAppLayout";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./components/Dashboard";
import InventoryPage from "./components/InventoryPage";
import CustomersPage from "./components/CustomersPage";
import SalesManagement from "./components/SalesManagement";
import TransactionHistory from "./components/TransactionHistory";
import ReportsPage from "./components/ReportsPage";
import Settings from "./pages/Settings";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

function App() {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<ModernLanding />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/modern" element={<ModernLanding />} />
                <Route path="/brand-demo" element={<BrandDemo />} />
                <Route path="/auth" element={<AuthForm />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />
                
                {/* Protected Routes */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <PremiumAppLayout>
                        <Dashboard />
                      </PremiumAppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <PremiumAppLayout>
                        <Dashboard />
                      </PremiumAppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <PremiumAppLayout>
                        <InventoryPage />
                      </PremiumAppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <PremiumAppLayout>
                        <InventoryPage />
                      </PremiumAppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute>
                      <PremiumAppLayout>
                        <CustomersPage />
                      </PremiumAppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute>
                      <PremiumAppLayout>
                        <SalesManagement />
                      </PremiumAppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <PremiumAppLayout>
                        <TransactionHistory />
                      </PremiumAppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/debts"
                  element={
                    <ProtectedRoute>
                      <PremiumAppLayout>
                        <TransactionHistory />
                      </PremiumAppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <PremiumAppLayout>
                        <ReportsPage />
                      </PremiumAppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <PremiumAppLayout>
                        <Settings />
                      </PremiumAppLayout>
                    </ProtectedRoute>
                  }
                />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
