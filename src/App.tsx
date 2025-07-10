
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import ModernLanding from "./pages/ModernLanding";
import Landing from "./pages/Landing";
import BrandDemo from "./pages/BrandDemo";
import AuthForm from "./components/AuthForm";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ModernLanding />} />
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/brand-demo" element={<BrandDemo />} />
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
