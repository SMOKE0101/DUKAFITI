
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from './components/ErrorBoundary';

// Page imports
import Index from './pages/Index';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import SalesManagement from './components/SalesManagement';
import CustomerManagement from './components/CustomerManagement';
import ProductManagement from './components/ProductManagement';
import ReportsPage from './components/ReportsPage';
import DebtRecording from './components/DebtRecording';
import ProtectedRoute from './components/ProtectedRoute';

// 404 component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-4">Page not found</p>
      <a href="/" className="text-blue-600 hover:text-blue-800">Go home</a>
    </div>
  </div>
);

// Create a stable query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Main route - redirect based on auth status */}
                  <Route path="/" element={<Index />} />
                  
                  {/* Auth routes */}
                  <Route path="/auth" element={<AuthForm />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/sales" element={
                    <ProtectedRoute>
                      <SalesManagement />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/customers" element={
                    <ProtectedRoute>
                      <CustomerManagement />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/products" element={
                    <ProtectedRoute>
                      <ProductManagement />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/inventory" element={
                    <ProtectedRoute>
                      <ProductManagement />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/reports" element={
                    <ProtectedRoute>
                      <ReportsPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/debt" element={
                    <ProtectedRoute>
                      <DebtRecording />
                    </ProtectedRoute>
                  } />
                  
                  {/* Legacy routes for compatibility */}
                  <Route path="/auth-form" element={<AuthForm />} />
                  <Route path="/enhanced-dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/sales-management" element={
                    <ProtectedRoute>
                      <SalesManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/customer-management" element={
                    <ProtectedRoute>
                      <CustomerManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/product-management" element={
                    <ProtectedRoute>
                      <ProductManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/inventory-page" element={
                    <ProtectedRoute>
                      <ProductManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports-page" element={
                    <ProtectedRoute>
                      <ReportsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/debt-recording" element={
                    <ProtectedRoute>
                      <DebtRecording />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Toaster />
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
