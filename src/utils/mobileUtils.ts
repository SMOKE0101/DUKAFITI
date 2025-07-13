// Mobile utility functions

export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const preventZoomOnFocus = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void => {
  if (isIOSDevice()) {
    element.style.fontSize = '16px';
  }
};

export const addTouchFriendlyClasses = (baseClasses: string): string => {
  const touchClasses = isTouchDevice() 
    ? 'active:scale-95 min-h-[44px] min-w-[44px]' 
    : 'hover:scale-105';
  
  return `${baseClasses} ${touchClasses}`;
};

export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    top: style.getPropertyValue('env(safe-area-inset-top)') || '0px',
    bottom: style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
    left: style.getPropertyValue('env(safe-area-inset-left)') || '0px',
    right: style.getPropertyValue('env(safe-area-inset-right)') || '0px',
  };
};