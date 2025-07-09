
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Navigation from '../components/Navigation';
import Dashboard from '../components/Dashboard';
import SalesManagement from '../components/SalesManagement';
import InventoryPage from '../components/InventoryPage';
import CustomersPage from '../components/CustomersPage';
import TransactionHistory from '../components/TransactionHistory';
import ReportsPage from '../components/ReportsPage';
import Settings from './Settings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const isMobile = useIsMobile();
  const { loading, user } = useAuth();

  console.log('Index component rendered:', { 
    pathname: location.pathname, 
    activeTab, 
    loading, 
    hasUser: !!user,
    isMobile 
  });

  // Show loading state while authentication is being checked
  if (loading) {
    console.log('Showing loading state in Index');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user in Index component');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Authentication required</p>
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
    } else if (path === '/products' || path === '/inventory') {
      setActiveTab('products');
    } else if (path === '/sales') {
      setActiveTab('sales');
    } else if (path === '/customers') {
      setActiveTab('customers');
    } else if (path === '/history') {
      setActiveTab('history');
    } else if (path === '/reports') {
      setActiveTab('reports');
    } else if (path === '/settings') {
      setActiveTab('settings');
    } else if (path === '/debts') {
      setActiveTab('debts');
    }
  }, [location.pathname]);

  const renderContent = () => {
    console.log('Rendering content for activeTab:', activeTab);
    
    try {
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
        case 'reports':
          return <ReportsPage />;
        case 'settings':
          return <Settings />;
        default:
          console.log('Default case, rendering Dashboard');
          return <Dashboard />;
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Content</h2>
          <p className="text-muted-foreground">There was an error loading this page. Please try refreshing.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      );
    }
  };

  // For mobile, we still use the old navigation temporarily but with new styling
  if (isMobile) {
    console.log('Rendering mobile layout');
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
  console.log('Rendering desktop layout');
  return (
    <AppLayout>
      <div className="fade-in-up">
        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default Index;
