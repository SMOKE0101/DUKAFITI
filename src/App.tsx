
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { EmailProvider } from '@/contexts/EmailContext';
import CleanLanding from '@/pages/CleanLanding';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Index from '@/pages/Index';
import ProtectedRoute from '@/components/ProtectedRoute';
import Dashboard from '@/components/Dashboard';
import ErrorBoundary from '@/components/ErrorBoundary';

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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <EmailProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <Router>
              <div className="min-h-screen bg-background text-foreground">
                <Routes>
                  {/* Landing page as the default route */}
                  <Route path="/" element={<CleanLanding />} />
                  
                  {/* Authentication routes */}
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  
                  {/* Protected app routes */}
                  <Route path="/app" element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Redirect any unknown routes to landing */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </ErrorBoundary>
        </QueryClientProvider>
      </EmailProvider>
    </ThemeProvider>
  );
}

export default App;
