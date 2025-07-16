
import React from 'react';
import ProductCRUDManager from './products/ProductCRUDManager';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Package, CheckCircle } from 'lucide-react';

const InventoryPage: React.FC = () => {
  const { isOnline } = useOfflineManager();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <h1 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
          INVENTORY
        </h1>
        
        {/* Offline Status Indicator */}
        {!isOnline && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
              <WifiOff className="w-3 h-3 mr-1" />
              OFFLINE
            </Badge>
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <Package className="w-3 h-3 mr-1" />
              ADD STOCK ACTIVE
            </Badge>
          </div>
        )}
      </div>
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Global Offline Warning with Add Stock Exception */}
        {!isOnline && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-800 mb-3">
                <WifiOff className="w-5 h-5" />
                <span className="font-bold text-base">Inventory Management Offline</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-orange-700">
                  While offline, you can <strong>view existing products</strong> but cannot create, edit, or delete them.
                </p>
                
                <div className="flex items-center gap-2 p-2 bg-green-100 rounded-md border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-700" />
                  <span className="text-sm font-medium text-green-800">
                    ✅ <strong>Add Stock</strong> function remains fully available offline and will sync when you're back online.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <ProductCRUDManager />
      </div>
    </div>
  );
};

export default InventoryPage;
