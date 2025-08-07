import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsTablet } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import ResponsiveProductGrid from '@/components/ui/responsive-product-grid';

// Mock product data for testing
const mockProducts = [
  {
    id: '1',
    name: 'Test Product 1',
    image_url: null,
    category: 'electronics',
    sellingPrice: 100,
    currentStock: 50
  },
  {
    id: '2', 
    name: 'Test Product 2',
    image_url: null,
    category: 'electronics',
    sellingPrice: 150,
    currentStock: 30
  },
  {
    id: '3',
    name: 'Test Product 3', 
    image_url: null,
    category: 'electronics',
    sellingPrice: 200,
    currentStock: 20
  },
  {
    id: '4',
    name: 'Test Product 4',
    image_url: null, 
    category: 'electronics',
    sellingPrice: 75,
    currentStock: 100
  }
];

export default function SalesLayoutTest() {
  const isTablet = useIsTablet();
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testTabletLayout = () => {
    addTestResult(`🔍 Testing tablet layout - Sidebar: ${sidebarOpen ? 'OPEN' : 'CLOSED'}`);
    addTestResult(`📱 Is Tablet: ${isTablet ? 'YES' : 'NO'}`);
    
    if (isTablet) {
      if (sidebarOpen) {
        addTestResult('✅ Expected: 1 column layout (sidebar open)');
      } else {
        addTestResult('✅ Expected: 2 column layout (sidebar closed)');
      }
    } else {
      addTestResult('ℹ️ Not tablet - desktop layout in use');
    }
  };

  const testSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    addTestResult(`🔄 Toggled sidebar to: ${newState ? 'OPEN' : 'CLOSED'}`);
    
    setTimeout(() => {
      if (isTablet) {
        addTestResult(`📊 Grid should now show: ${newState ? '1 column' : '2 columns'}`);
      }
    }, 100);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const mockAddToCart = (product: any) => {
    addTestResult(`🛒 Added to cart: ${product.name}`);
  };

  const getPriceForProduct = (product: any) => product.sellingPrice;
  const getStockForProduct = (product: any) => product.currentStock;
  const getInStockStatus = (product: any) => product.currentStock > 0;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 Sales Layout Test
            <Badge variant={isTablet ? "default" : "secondary"}>
              {isTablet ? "Tablet Mode" : "Desktop Mode"}
            </Badge>
            <Badge variant={sidebarOpen ? "default" : "outline"}>
              Sidebar: {sidebarOpen ? "Open" : "Closed"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testTabletLayout} variant="outline" size="sm">
              🔍 Test Current Layout
            </Button>
            <Button onClick={testSidebarToggle} variant="outline" size="sm">
              🔄 Toggle Sidebar
            </Button>
            <Button onClick={clearResults} variant="outline" size="sm">
              🗑️ Clear Results
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Test Results:</h4>
              <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="font-mono text-xs">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Grid Test */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Product Grid Layout Test</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveProductGrid
            products={mockProducts}
            variant="sales"
            onAddToCart={mockAddToCart}
            getPriceForProduct={getPriceForProduct}
            getStockForProduct={getStockForProduct}
            getInStockStatus={getInStockStatus}
            gridConfig={{
              cols: { 
                mobile: 2, 
                tablet: sidebarOpen ? 1 : 2,  // Test the new responsive logic
                desktop: sidebarOpen ? 4 : 5
              },
              gap: 'gap-3'
            }}
            className="pb-4"
          />
        </CardContent>
      </Card>
    </div>
  );
}