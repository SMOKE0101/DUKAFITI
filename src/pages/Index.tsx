
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Navigation from '../components/Navigation';
import Dashboard from '../components/Dashboard';
import SalesManagement from '../components/SalesManagement';
import InventoryPage from '../components/InventoryPage';
import CustomersPage from '../components/CustomersPage';
import TransactionHistory from '../components/TransactionHistory';
import Settings from './Settings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const isMobile = useIsMobile();
  const { loading } = useAuth();

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Update active tab based on route
  useEffect(() => {
    const path = location.pathname;
    console.log('Current path:', path);
    
    if (path === '/app' || path === '/' || path === '/dashboard') {
      setActiveTab('dashboard');
    } else if (path === '/products') {
      setActiveTab('products');
    } else if (path === '/sales') {
      setActiveTab('sales');
    } else if (path === '/customers') {
      setActiveTab('customers');
    } else if (path === '/history') {
      setActiveTab('history');
    } else if (path === '/settings') {
      setActiveTab('settings');
    } else if (path === '/debts') {
      setActiveTab('debts');
    }
  }, [location.pathname]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'sales':
        return <SalesManagement />;
      case 'products':
        return <InventoryPage />;
      case 'customers':
        return <CustomersPage />;
      case 'debts':
      case 'history':
        return <TransactionHistory />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // For mobile, we still use the old navigation temporarily but with new styling
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-responsive space-y-6 pb-20">
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="fade-in-up">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  // For desktop, use the new layout
  return (
    <AppLayout>
      <div className="fade-in-up">
        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default Index;
