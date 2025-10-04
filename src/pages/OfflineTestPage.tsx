import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSMS } from '@/hooks/useSMS';
import { generateSMSReceipt } from '@/utils/smsReceiptUtils';

const OfflineTestPage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [testData, setTestData] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();
  const { sendSMS, isSupported, hasPermissions } = useSMS();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Test IndexedDB storage
  const testIndexedDB = async () => {
    setIsTesting(true);
    try {
      // Test data storage
      const testItem = {
        id: Date.now(),
        name: 'Test Item',
        timestamp: new Date().toISOString(),
        data: 'This is test data for offline storage'
      };

      // Store in localStorage as simple test
      const storedData = JSON.parse(localStorage.getItem('offline_test') || '[]');
      storedData.push(testItem);
      localStorage.setItem('offline_test', JSON.stringify(storedData));

      setTestData(storedData);
      
      toast({
        title: "Offline Storage Test",
        description: "Data successfully stored offline!",
      });
    } catch (error) {
      toast({
        title: "Storage Test Failed",
        description: "Failed to store data offline.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Test SMS functionality
  const testSMS = async () => {
    if (!isSupported) {
      toast({
        title: "SMS Not Supported",
        description: "SMS functionality is not available on this device.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate test SMS receipt
      const receipt = generateSMSReceipt({
        shopName: "Dukafiti Test Shop",
        customer: {
          id: "test-customer",
          name: "John Doe",
          phone: "+254712345678",
          createdDate: new Date().toISOString(),
          totalPurchases: 0,
          outstandingDebt: 0,
          creditLimit: 10000,
          lastPurchaseDate: null,
          riskRating: "low"
        },
        cart: [
          {
            id: "test-item-1",
            name: "Test Product",
            sellingPrice: 100,
            quantity: 2,
            costPrice: 50,
            category: "Test",
            currentStock: 10,
            lowStockThreshold: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        total: 200,
        paymentMethod: "cash",
        timestamp: new Date()
      });

      // Test SMS sending (this will use Capacitor plugin on mobile)
      const result = await sendSMS("+254712345678", receipt);
      
      if (result.success) {
        toast({
          title: "SMS Test",
          description: result.message,
        });
      } else {
        toast({
          title: "SMS Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "SMS Test Error",
        description: "Failed to send test SMS.",
        variant: "destructive",
      });
    }
  };

  // Clear test data
  const clearTestData = () => {
    localStorage.removeItem('offline_test');
    setTestData([]);
    toast({
      title: "Test Data Cleared",
      description: "Offline test data has been removed.",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Offline Functionality Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              Connection Status: {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* SMS Status */}
          <div className="space-y-2">
            <h3 className="font-medium">SMS Capabilities</h3>
            <div className="text-sm text-muted-foreground">
              <p>Supported: {isSupported ? 'Yes' : 'No'}</p>
              <p>Permissions: {hasPermissions ? 'Granted' : 'Not Granted'}</p>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={testIndexedDB} 
              disabled={isTesting}
              variant="secondary"
            >
              {isTesting ? 'Testing...' : 'Test Offline Storage'}
            </Button>
            
            <Button 
              onClick={testSMS}
              variant="secondary"
            >
              Test SMS Functionality
            </Button>
            
            <Button 
              onClick={clearTestData}
              variant="outline"
            >
              Clear Test Data
            </Button>
          </div>

          {/* Test Data Display */}
          {testData.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Stored Test Data ({testData.length} items)</h3>
              <div className="max-h-60 overflow-y-auto border rounded p-4">
                {testData.map((item, index) => (
                  <div key={item.id} className="py-2 border-b last:border-b-0">
                    <p className="font-medium">Item {index + 1}</p>
                    <p className="text-sm text-muted-foreground">
                      Stored: {new Date(item.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm">{item.data}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Testing Instructions:</h4>
            <ul className="text-sm space-y-1">
              <li>• Toggle your network connection to test offline/online transitions</li>
              <li>• Click "Test Offline Storage" to verify data persistence</li>
              <li>• Click "Test SMS Functionality" to test SMS capabilities</li>
              <li>• Data should persist even when offline</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineTestPage;
