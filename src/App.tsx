import { Toaster } from "@/components/ui/toaster";
import { ProductionToaster } from "@/components/ui/production-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "next-themes";
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
import OfflineHandler from './components/OfflineHandler';
import OfflineStatus from './components/OfflineStatus';
import { useServiceWorker } from './hooks/useServiceWorker';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
});

function App() {
  // Initialize service worker
  useServiceWorker();
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthProvider>
              <TooltipProvider>
                <div className="min-h-screen w-full bg-background text-foreground">
                  {/* Offline Status - Global */}
                  <div className="fixed top-0 left-0 right-0 z-50">
                    <OfflineStatus />
                  </div>
                  
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
                    
                    {/* Protected routes with layout */}
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
                  
                  <OfflineHandler />
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
