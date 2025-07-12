
import { Wifi, WifiOff, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '../hooks/usePWA';

const PWAStatus = () => {
  const { isOnline, isInstallable, installApp } = usePWA();

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isOnline 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
        {isOnline ? 'Online' : 'Offline'}
      </div>
      
      {isInstallable && (
        <Button
          size="sm"
          variant="outline"
          onClick={installApp}
          className="h-7 px-2 text-xs"
        >
          <Download size={12} className="mr-1" />
          Install App
        </Button>
      )}
    </div>
  );
};

export default PWAStatus;
