
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import ModernLanding from "./pages/ModernLanding";
import Landing from "./pages/Landing";
import BrandDemo from "./pages/BrandDemo";
import AuthForm from "./components/AuthForm";
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

const queryClient = new QueryClient();

function App() {
  console.log('App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ModernLanding />} />
            <Route path="/auth" element={<AuthForm />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/brand-demo" element={<BrandDemo />} />
            
            {/* Protected routes */}
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
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
