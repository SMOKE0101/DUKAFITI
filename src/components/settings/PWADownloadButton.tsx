import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useEffect, useState } from 'react';

const PWADownloadButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    console.log('[PWADownloadButton] PWA State:', { isInstallable, isInstalled });
    
    // Check if running in development mode
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('lovableproject.com');
    setShowDebugInfo(isDev);
  }, [isInstallable, isInstalled]);

  // Always show button in development for testing, hide only if actually installed
  const shouldShowButton = showDebugInfo ? !isInstalled : (isInstallable && !isInstalled);

  if (!shouldShowButton) {
    return showDebugInfo ? (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
          PWA Debug: installed={isInstalled.toString()}, installable={isInstallable.toString()}
        </div>
      </div>
    ) : null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <Button 
        onClick={installApp}
        variant="outline"
        className="w-full bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/20 text-foreground font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download App
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Install the app for a better experience and offline access
      </p>
      {showDebugInfo && (
        <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
          PWA Debug: installed={isInstalled.toString()}, installable={isInstallable.toString()}
        </div>
      )}
    </div>
  );
};

export default PWADownloadButton;