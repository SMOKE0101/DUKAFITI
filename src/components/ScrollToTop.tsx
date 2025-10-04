import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only scroll to top of main content areas, not the entire window
    const resetScroll = () => {
      try {
        // Reset main content areas with data attribute (main app content)
        const mainContentElements = document.querySelectorAll('[data-main-content="true"]');
        mainContentElements.forEach(element => {
          if (element.scrollTo) {
            element.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
        
        // Reset specific scrollable areas that are part of the main UI
        const scrollAreas = document.querySelectorAll('.scroll-area, [data-scroll-area="true"]');
        scrollAreas.forEach(element => {
          if (element.scrollTo) {
            element.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
        
        // Only scroll window to top if we're not in a mobile PWA context
        // This prevents unwanted reloads on mobile devices
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = (window.navigator as any).standalone;
        
        if (!isStandalone && !isIOSStandalone) {
          // Only scroll window on desktop/non-PWA contexts
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (error) {
        // Silently fail if scroll operations fail (common in mobile contexts)
        console.debug('Scroll to top failed (likely mobile context):', error);
      }
    };

    // Reset with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(resetScroll, 50);
    
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
