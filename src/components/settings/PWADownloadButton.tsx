import { Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useEffect } from 'react';

const PWADownloadButton = () => {
  const { isInstalled, installApp, openApp, isRunningInBrowser } = usePWA();

  useEffect(() => {
    console.log('[PWADownloadButton] PWA State:', { isInstalled, isRunningInBrowser: isRunningInBrowser() });
  }, [isInstalled, isRunningInBrowser]);

  // Hide button if running in the installed app
  if (!isRunningInBrowser()) {
    return null;
  }

  const handleButtonClick = () => {
    if (isInstalled) {
      // App is installed, try to open it
      openApp();
    } else {
      // App is not installed, show install prompt
      installApp();
    }
  };

  const buttonText = isInstalled ? 'Open App' : 'Download App';
  const buttonIcon = isInstalled ? ExternalLink : Download;
  const ButtonIcon = buttonIcon;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <Button 
        onClick={handleButtonClick}
        variant="outline"
        className="w-full bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/20 text-foreground font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        <ButtonIcon className="w-4 h-4" />
        {buttonText}
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        {isInstalled 
          ? 'Open the installed app for the best experience'
          : 'Install the app for a better experience and offline access'
        }
      </p>
    </div>
  );
};

export default PWADownloadButton;