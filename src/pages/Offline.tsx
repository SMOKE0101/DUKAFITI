
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Database, AlertCircle } from 'lucide-react';

const OfflinePage = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            You're Offline
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600 dark:text-gray-400">
              Don't worry! DukaFiti works offline too.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Your data is safely stored locally and will sync when you're back online.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-green-900 dark:text-green-100">
                  Local Storage Active
                </div>
                <div className="text-green-700 dark:text-green-300">
                  All your changes are saved locally
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-blue-900 dark:text-blue-100">
                  Auto-Sync Ready
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  Data will sync automatically when online
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-amber-900 dark:text-amber-100">
                  Full Functionality
                </div>
                <div className="text-amber-700 dark:text-amber-300">
                  Continue using all features normally
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRetry} 
              className="w-full"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Connection
            </Button>
            
            <Button 
              onClick={handleGoBack} 
              className="w-full"
              variant="outline"
            >
              Continue Offline
            </Button>
          </div>

          <div className="text-xs text-center text-gray-500 dark:text-gray-400 pt-4 border-t">
            <p>DukaFiti - Offline First Business Management</p>
            <p className="mt-1">Your business never stops, even offline</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflinePage;
