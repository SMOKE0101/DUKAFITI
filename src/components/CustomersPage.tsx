
import React from 'react';
import CustomerCRUDManager from './customers/CustomerCRUDManager';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WifiOff, AlertCircle } from 'lucide-react';

const CustomersPage: React.FC = () => {
  const { isOnline } = useOfflineManager();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <h1 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
          CUSTOMERS
        </h1>
        
        {/* Offline Status Indicator */}
        {!isOnline && (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
            <WifiOff className="w-3 h-3 mr-1" />
            OFFLINE - CRUD DISABLED
          </Badge>
        )}
      </div>
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Global Offline Warning */}
        {!isOnline && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold text-base">Customer Management Offline</span>
              </div>
              <p className="text-sm text-red-700 mt-2">
                While offline, you can only <strong>view existing customers</strong>. All create, edit, and delete operations are disabled until you're back online.
              </p>
            </CardContent>
          </Card>
        )}
        
        <CustomerCRUDManager />
      </div>
    </div>
  );
};

export default CustomersPage;
