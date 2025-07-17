import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { QueryClient } from 'react-query';

import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import PremiumAppLayout from './components/PremiumAppLayout';
import InventoryPage from './pages/InventoryPage';
import UltraPolishedReportsPage from './pages/UltraPolishedReportsPage';
import Settings from './pages/Settings';
import CustomersPage from './components/CustomersPage';

import { SyncStatusProvider } from './components/sync/SyncStatusProvider';
import { UnifiedSyncIndicator } from './components/sync/UnifiedSyncIndicator';
import SalesManagement from './components/SalesManagement';

function App() {
  return (
    <QueryClient>
      <HelmetProvider>
        <BrowserRouter>
          <SyncStatusProvider>
            <Toaster />
            <div className="min-h-screen bg-background">
              {/* Global Sync Indicator */}
              <div className="fixed top-4 left-4 z-50">
                <UnifiedSyncIndicator />
              </div>
              
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/app" element={
                  <ProtectedRoute>
                    <PremiumAppLayout />
                  </ProtectedRoute>
                } />
                <Route path="/app/sales" element={
                  <ProtectedRoute>
                    <SalesManagement />
                  </ProtectedRoute>
                } />
                <Route path="/app/inventory" element={
                  <ProtectedRoute>
                    <InventoryPage />
                  </ProtectedRoute>
                } />
                <Route path="/app/customers" element={
                  <ProtectedRoute>
                    <CustomersPage />
                  </ProtectedRoute>
                } />
                <Route path="/app/reports" element={
                  <ProtectedRoute>
                    <UltraPolishedReportsPage />
                  </ProtectedRoute>
                } />
                <Route path="/app/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </SyncStatusProvider>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClient>
  );
}

export default App;
