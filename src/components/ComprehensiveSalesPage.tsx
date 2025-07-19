
import React, { useState, useEffect } from 'react';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useUnifiedOfflineManager } from '../hooks/useUnifiedOfflineManager';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import SalesStatsCards from './sales/SalesStatsCards';
import SalesTable from './sales/SalesTable';
import RecordSaleModal from './sales/RecordSaleModal';
import SalesErrorBoundary from './sales/SalesErrorBoundary';

const ComprehensiveSalesPage = () => {
  console.log('🚀 ComprehensiveSalesPage component loaded');
  
  const { user } = useAuth();
  const { sales, loading, error, refreshSales, isOnline } = useSupabaseSales();
  const { pendingOperations } = useUnifiedOfflineManager();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSales();
    } catch (error) {
      console.error('Failed to refresh sales:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaleRecorded = () => {
    handleRefresh();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access sales management.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-red-600">Error Loading Sales</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">Sales Management</h1>
              <p className="text-gray-500">Record and track your sales transactions</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Online Status */}
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Online
                    </Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      Offline
                    </Badge>
                  </>
                )}
              </div>

              {/* Pending Operations */}
              {pendingOperations > 0 && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  {pendingOperations} Pending
                </Badge>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Refresh sales data"
              >
                <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Record Sale Button */}
              <RecordSaleModal onSaleRecorded={handleSaleRecorded} isOnline={isOnline} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <SalesStatsCards sales={sales} isLoading={loading} />

        {/* Sales Table */}
        <SalesTable sales={sales} isLoading={loading} />

        {/* Offline Notice */}
        {!isOnline && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <WifiOff className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">You're currently offline</p>
                  <p className="text-sm text-yellow-600">
                    Sales data is cached locally. New sales recording requires an internet connection.
                    {pendingOperations > 0 && ` You have ${pendingOperations} pending operations that will sync when online.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveSalesPage;
