import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useEffect } from 'react';

const PWADownloadButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();

  useEffect(() => {
    console.log('[PWADownloadButton] PWA State:', { isInstallable, isInstalled });
  }, [isInstallable, isInstalled]);

  // Show button only if app is installable and not already installed
  const shouldShowButton = isInstallable && !isInstalled;

  if (!shouldShowButton) {
    return null;
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
    </div>
  );
};

export default PWADownloadButton;