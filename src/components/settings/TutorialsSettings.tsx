import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Users, Package, ShoppingCart, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TutorialsSettingsProps {
  onStartDashboardTutorial?: () => void;
  onStartAddCustomerTutorial?: () => void;
  onStartCustomerCardTutorial?: () => void;
  onStartAddProductTutorial?: () => void;
  onStartProductCardTutorial?: () => void;
  onStartAddToCartTutorial?: () => void;
  onStartCheckoutTutorial?: () => void;
  onStartReportsTutorial?: () => void;
  hasCustomers?: boolean;
  hasProducts?: boolean;
  hasCartItems?: boolean;
  onResetAddCustomerTutorial?: () => void;
  onResetCustomerCardTutorial?: () => void;
  onResetAddProductTutorial?: () => void;
  onResetProductCardTutorial?: () => void;
  onResetAddToCartTutorial?: () => void;
  onResetCheckoutTutorial?: () => void;
  onResetReportsTutorial?: () => void;
}

const TutorialsSettings: React.FC<TutorialsSettingsProps> = ({ 
  onStartDashboardTutorial,
  onStartAddCustomerTutorial,
  onStartCustomerCardTutorial,
  onStartAddProductTutorial,
  onStartProductCardTutorial,
  onStartAddToCartTutorial,
  onStartCheckoutTutorial,
  onStartReportsTutorial,
  hasCustomers = false,
  hasProducts = false,
  hasCartItems = false,
  onResetAddCustomerTutorial,
  onResetCustomerCardTutorial,
  onResetAddProductTutorial,
  onResetProductCardTutorial,
  onResetAddToCartTutorial,
  onResetCheckoutTutorial,
  onResetReportsTutorial
}) => {
  const navigate = useNavigate();

  const handleStartDashboardTutorial = () => {
    // Navigate to dashboard and trigger tutorial
    navigate('/app/dashboard');
    // We'll use localStorage to signal that tutorial should start
    localStorage.setItem('startDashboardTutorial', 'true');
    if (onStartDashboardTutorial) {
      onStartDashboardTutorial();
    }
  };

  const handleStartAddCustomerTutorial = () => {
    // Navigate to customers page and trigger add customer tutorial
    navigate('/app/customers');
    // We'll use localStorage to signal that tutorial should start
    localStorage.setItem('startAddCustomerTutorial', 'true');
    if (onStartAddCustomerTutorial) {
      onStartAddCustomerTutorial();
    }
  };

  const handleStartCustomerCardTutorial = () => {
    // Navigate to customers page and trigger customer card tutorial
    navigate('/app/customers');
    // We'll use localStorage to signal that tutorial should start
    localStorage.setItem('startCustomerCardTutorial', 'true');
    if (onStartCustomerCardTutorial) {
      onStartCustomerCardTutorial();
    }
  };

  const handleStartAddProductTutorial = () => {
    // Navigate to inventory page and trigger add product tutorial
    navigate('/app/inventory');
    // We'll use localStorage to signal that tutorial should start
    localStorage.setItem('startAddProductTutorial', 'true');
    if (onStartAddProductTutorial) {
      onStartAddProductTutorial();
    }
  };

  const handleStartProductCardTutorial = () => {
    // Navigate to inventory page and trigger product card tutorial
    navigate('/app/inventory');
    // We'll use localStorage to signal that tutorial should start
    localStorage.setItem('startProductCardTutorial', 'true');
    if (onStartProductCardTutorial) {
      onStartProductCardTutorial();
    }
  };

  const handleResetAddProductTutorial = () => {
    localStorage.removeItem('inventoryAddProductTutorialCompleted');
    if (onResetAddProductTutorial) {
      onResetAddProductTutorial();
    }
  };

  const handleResetProductCardTutorial = () => {
    localStorage.removeItem('inventoryProductCardTutorialCompleted');
    if (onResetProductCardTutorial) {
      onResetProductCardTutorial();
    }
  };

  const handleResetAddCustomerTutorial = () => {
    localStorage.removeItem('customersAddCustomerTutorialCompleted');
    if (onResetAddCustomerTutorial) {
      onResetAddCustomerTutorial();
    }
  };

  const handleResetCustomerCardTutorial = () => {
    localStorage.removeItem('customersCustomerCardTutorialCompleted');
    if (onResetCustomerCardTutorial) {
      onResetCustomerCardTutorial();
    }
  };

  return (
    <Card className="bg-card rounded-3xl border border-border shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-2xl font-semibold text-card-foreground mb-2">
          Tutorials
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Learn how to use different features of the app with guided walkthroughs
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {/* Dashboard Tutorial */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
            <div>
              <h3 className="font-medium text-foreground">Dashboard Tutorial</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to navigate and use the main dashboard features
              </p>
            </div>
            <Button 
              onClick={handleStartDashboardTutorial}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="h-4 w-4" />
              Start
            </Button>
          </div>
          
          {/* Customers Tutorials */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers Tutorials
            </h4>
            
            {/* Add Customer Tutorial */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
              <div>
                <h3 className="font-medium text-foreground">Add Customer Tutorial</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Learn how to add new customers to your business
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleResetAddCustomerTutorial}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Reset
                </Button>
                <Button 
                  onClick={handleStartAddCustomerTutorial}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              </div>
            </div>
            
            {/* Customer Card Tutorial */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
              <div>
                <h3 className="font-medium text-foreground">Customer Card Tutorial</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Learn how to manage existing customers and their information
                </p>
                {!hasCustomers && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Please complete 'Add Customer' tutorial first
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleResetCustomerCardTutorial}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Reset
                </Button>
                <Button 
                  onClick={handleStartCustomerCardTutorial}
                  disabled={!hasCustomers}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              </div>
            </div>
          </div>

          {/* Inventory Tutorials */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory Tutorials
            </h4>
            
            {/* Add Product Tutorial */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
              <div>
                <h3 className="font-medium text-foreground">Add Product Tutorial</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Learn how to add new products to your inventory
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleResetAddProductTutorial}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Reset
                </Button>
                <Button 
                  onClick={handleStartAddProductTutorial}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              </div>
            </div>
            
            {/* Product Card Tutorial */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
              <div>
                <h3 className="font-medium text-foreground">Product Card Tutorial</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Learn how to manage existing products and their information
                </p>
                {!hasProducts && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Please complete 'Add Product' tutorial first
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleResetProductCardTutorial}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Reset
                </Button>
                <Button 
                  onClick={handleStartProductCardTutorial}
                  disabled={!hasProducts}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              </div>
            </div>
          </div>

          {/* Selling Tutorials */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Selling Page Tutorials
            </h4>
            
            {/* Add to Cart Tutorial */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
              <div>
                <h3 className="font-medium text-foreground">Add Product to Cart Tutorial</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Learn how to add products to your cart for sale
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    localStorage.removeItem('sellingAddToCartTutorialCompleted');
                    if (onResetAddToCartTutorial) {
                      onResetAddToCartTutorial();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Reset
                </Button>
                <Button 
                  onClick={() => {
                    // Navigate to sales page and trigger add to cart tutorial
                    navigate('/app/sales');
                    // We'll use localStorage to signal that tutorial should start
                    localStorage.setItem('startSellingAddToCartTutorial', 'true');
                    if (onStartAddToCartTutorial) {
                      onStartAddToCartTutorial();
                    }
                  }}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              </div>
            </div>
            
            {/* Checkout Tutorial */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
              <div>
                <h3 className="font-medium text-foreground">Checkout Tutorial</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Learn how to complete sales and process payments
                </p>
                {!hasCartItems && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Please add products to cart first
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    localStorage.removeItem('sellingCheckoutTutorialCompleted');
                    if (onResetCheckoutTutorial) {
                      onResetCheckoutTutorial();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Reset
                </Button>
                <Button 
                  onClick={() => {
                    // Navigate to sales page and trigger checkout tutorial
                    navigate('/app/sales');
                    // We'll use localStorage to signal that tutorial should start
                    localStorage.setItem('startSellingCheckoutTutorial', 'true');
                    if (onStartCheckoutTutorial) {
                      onStartCheckoutTutorial();
                    }
                  }}
                  disabled={!hasCartItems}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              </div>
            </div>
          </div>

          {/* Reports Tutorial */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports Page Tutorial
            </h4>
            
            {/* Reports Tutorial */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
              <div>
                <h3 className="font-medium text-foreground">Reports Page Tutorial</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Learn how to analyze your business performance with detailed reports
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    if (onResetReportsTutorial) {
                      onResetReportsTutorial();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Reset
                </Button>
                <Button 
                  onClick={() => {
                    // Navigate to reports page and trigger reports tutorial
                    navigate('/app/reports');
                    // We'll use localStorage to signal that tutorial should start
                    localStorage.setItem('startReportsTutorial', 'true');
                    if (onStartReportsTutorial) {
                      onStartReportsTutorial();
                    }
                  }}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorialsSettings;
