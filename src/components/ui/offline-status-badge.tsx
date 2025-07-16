
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Package, AlertCircle } from 'lucide-react';

interface OfflineStatusBadgeProps {
  isOnline: boolean;
  allowedOperations?: string[];
  className?: string;
}

const OfflineStatusBadge: React.FC<OfflineStatusBadgeProps> = ({ 
  isOnline, 
  allowedOperations = [], 
  className = '' 
}) => {
  if (isOnline) {
    return (
      <Badge className={`bg-green-100 text-green-800 border-green-300 ${className}`}>
        <Wifi className="w-3 h-3 mr-1" />
        ONLINE
      </Badge>
    );
  }

  if (allowedOperations.length > 0) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
          <WifiOff className="w-3 h-3 mr-1" />
          OFFLINE
        </Badge>
        {allowedOperations.includes('add-stock') && (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <Package className="w-3 h-3 mr-1" />
            ADD STOCK ACTIVE
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Badge variant="destructive" className={`bg-red-100 text-red-800 border-red-300 ${className}`}>
      <WifiOff className="w-3 h-3 mr-1" />
      OFFLINE - CRUD DISABLED
    </Badge>
  );
};

export { OfflineStatusBadge };
