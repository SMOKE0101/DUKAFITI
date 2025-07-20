
import React from 'react';
import { Button } from '@/components/ui/button';
import { Receipt, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface SalesHeaderProps {
  isOnline: boolean;
  pendingOperations: number;
  onSync: () => void;
  cartLength: number;
  total: number;
  formatCurrency: (amount: number) => string;
}

const SalesHeader = ({ 
  isOnline, 
  pendingOperations, 
  onSync, 
  cartLength, 
  total, 
  formatCurrency 
}: SalesHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sales Point</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Process sales and manage customers</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Network Status & Sync */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
              
              {pendingOperations > 0 && (
                <Button
                  onClick={onSync}
                  disabled={!isOnline}
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sync ({pendingOperations})
                </Button>
              )}
            </div>

            {/* Cart Summary */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                {cartLength} items • {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesHeader;
