
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import CustomerManagement from '../components/CustomerManagement';
import DebtRecording from '../components/DebtRecording';
import TransactionHistory from '../components/TransactionHistory';
import SalesManagement from '../components/SalesManagement';
import ProductManagement from '../components/ProductManagement';
import Settings from './Settings';
import Navigation from '../components/Navigation';
import AuthForm from '../components/AuthForm';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import TrialBanner from '../components/trial/TrialBanner';
import UpgradeModal from '../components/trial/UpgradeModal';
import OfflineIndicator from '../components/OfflineIndicator';
import ErrorBoundary from '../components/ErrorBoundary';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { useTrialSystem } from '../hooks/useTrialSystem';
import { useAppContext } from '../hooks/useAppContext';
import { Product } from '../types';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, loading, user } = useAuth();
  const { trialInfo, showUpgrade, setShowUpgrade } = useTrialSystem();
  const { isInstalledApp } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('Index: Rendering with auth state - loading:', loading, 'authenticated:', isAuthenticated);

  // Smart routing: Handle app vs browser access
  useEffect(() => {
    if (isAuthenticated && isInstalledApp && location.pathname === '/') {
      // If user is authenticated and using installed app, redirect directly to dashboard
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, isInstalledApp, location.pathname, navigate]);

  // Check if onboarding is needed
  useEffect(() => {
    if (isAuthenticated && user) {
      const onboardingCompleted = localStorage.getItem(`dts_onboarding_completed_${user.id}`);
      if (!onboardingCompleted) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);

  // Data migration function
  const migrateInventoryToProducts = () => {
    try {
      const inventoryData = localStorage.getItem('dts_inventory');
      const productsData = localStorage.getItem('dts_products');
      
      if (inventoryData && (!productsData || JSON.parse(productsData).length === 0)) {
        const inventory = JSON.parse(inventoryData);
        const migratedProducts: Product[] = inventory.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category || 'Other',
          costPrice: item.costPrice || item.price * 0.7,
          sellingPrice: item.price,
          currentStock: item.stock,
          lowStockThreshold: item.lowStockThreshold || 10,
          createdAt: item.createdDate || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        localStorage.setItem('dts_products', JSON.stringify(migratedProducts));
        console.log('Successfully migrated inventory data to products');
        
        toast({
          title: "Data Migration",
          description: "Inventory data has been migrated to the new product system",
        });
      }
    } catch (error) {
      console.error('Failed to migrate inventory data:', error);
    }
  };

  // Initialize data on first load
  useEffect(() => {
    console.log('Index: useEffect triggered, isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) return;

    try {
      // Check if data exists, if not create sample data
      const customers = localStorage.getItem('dts_customers');
      const transactions = localStorage.getItem('dts_transactions');
      const products = localStorage.getItem('dts_products');
      const sales = localStorage.getItem('dts_sales');

      if (!customers) localStorage.setItem('dts_customers', JSON.stringify([]));
      if (!transactions) localStorage.setItem('dts_transactions', JSON.stringify([]));
      if (!products) localStorage.setItem('dts_products', JSON.stringify([]));
      if (!sales) localStorage.setItem('dts_sales', JSON.stringify([]));

      // Migrate inventory data if needed
      migrateInventoryToProducts();

      const shopName = user?.user_metadata?.shop_name || 'Your Shop';
      if (!showOnboarding) {
        toast({
          title: `Welcome back to ${shopName}!`,
          description: "Shop management system loaded successfully",
        });
      }
    } catch (error) {
      console.error('Failed to initialize data:', error);
      toast({
        title: "Error",
        description: "Failed to initialize system data",
        variant: "destructive",
      });
    }
  }, [toast, isAuthenticated, user, showOnboarding]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    toast({
      title: `Welcome to DukaFiti!`,
      description: `Your shop is now ready to go. Let's start managing your business!`,
    });
  };

  const renderActiveTab = () => {
    try {
      switch (activeTab) {
        case 'dashboard':
          return (
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          );
        case 'sales':
          return (
            <ErrorBoundary>
              <SalesManagement />
            </ErrorBoundary>
          );
        case 'products':
          return (
            <ErrorBoundary>
              <ProductManagement />
            </ErrorBoundary>
          );
        case 'customers':
          return (
            <ErrorBoundary>
              <CustomerManagement />
            </ErrorBoundary>
          );
        case 'debts':
          return (
            <ErrorBoundary>
              <DebtRecording />
            </ErrorBoundary>
          );
        case 'history':
          return (
            <ErrorBoundary>
              <TransactionHistory />
            </ErrorBoundary>
          );
        case 'settings':
          return (
            <ErrorBoundary>
              <Settings />
            </ErrorBoundary>
          );
        default:
          return (
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          );
      }
    } catch (error) {
      console.error('Error rendering active tab:', error);
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4 text-lg font-medium">Error loading page</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('Index: Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg font-medium">Loading your shop...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    console.log('Index: Showing auth form');
    return (
      <ErrorBoundary>
        <AuthForm />
      </ErrorBoundary>
    );
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return (
      <ErrorBoundary>
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </ErrorBoundary>
    );
  }

  console.log('Index: Showing main app');
  const shopProfile = localStorage.getItem(`dts_shop_profile_${user?.id}`);
  const shopName = shopProfile 
    ? JSON.parse(shopProfile).shopName 
    : user?.user_metadata?.shop_name || 'Shop Manager';

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Trial Banner */}
        <TrialBanner />
        
        <div className="container mx-auto px-4 py-6">
          <header className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {shopName}
            </h1>
            <p className="text-gray-700 text-lg font-medium">
              Complete shop management - debt tracking, sales, and inventory
              {trialInfo && trialInfo.isTrialActive && (
                <span className="ml-2 text-blue-600 font-semibold">
                  • {trialInfo.daysRemaining} days left in trial
                </span>
              )}
            </p>
          </header>

          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main className="mt-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6">
              {renderActiveTab()}
            </div>
          </main>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal 
          isOpen={showUpgrade} 
          onClose={() => setShowUpgrade(false)} 
        />
        
        {/* Offline Indicator */}
        <OfflineIndicator />
      </div>
    </ErrorBoundary>
  );
};

export default Index;
