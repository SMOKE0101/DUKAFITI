
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface CubeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CubeLogo: React.FC<CubeLogoProps> = ({ size = 'md', className = '' }) => {
  const { theme, resolvedTheme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  
  const dimensions = {
    sm: 24,
    md: 32,
    lg: 40
  };

  const logoSize = dimensions[size];
  
  // Define logo sources with fallbacks
  const logoSources = {
    // Primary logos (user uploaded)
    light: '/lovable-uploads/e01ade1b-8af8-46ff-b6dc-67625887a831.png', // Light logo for dark mode
    dark: '/lovable-uploads/c903a006-f883-4a49-807a-f8b0b5a35858.png',  // Dark logo for light mode
    // Fallback logo
    fallback: '/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png'
  };

  // Determine current theme and logo source
  useEffect(() => {
    const currentTheme = resolvedTheme || theme || 'light';
    console.log('CubeLogo: Current theme detected:', currentTheme);
    
    // Use dark logo for light mode and light logo for dark mode for contrast
    const selectedSrc = currentTheme === 'dark' ? logoSources.light : logoSources.dark;
    console.log('CubeLogo: Selected logo source:', selectedSrc);
    
    setCurrentSrc(selectedSrc);
    setImageError(false); // Reset error state when theme changes
  }, [theme, resolvedTheme]);

  const handleImageError = () => {
    console.error('CubeLogo: Failed to load image:', currentSrc);
    if (!imageError) {
      console.log('CubeLogo: Falling back to fallback image');
      setImageError(true);
      setCurrentSrc(logoSources.fallback);
    } else {
      console.error('CubeLogo: Fallback image also failed to load');
    }
  };

  const handleImageLoad = () => {
    console.log('CubeLogo: Image loaded successfully:', currentSrc);
  };

  // Don't render anything if we don't have a source
  if (!currentSrc) {
    console.warn('CubeLogo: No image source available');
    return null;
  }

  return (
    <img 
      src={currentSrc}
      alt="DukaFiti Logo"
      width={logoSize} 
      height={logoSize}
      className={`flex-shrink-0 transition-all duration-300 ${className}`}
      style={{ 
        width: logoSize, 
        height: logoSize,
        objectFit: 'contain'
      }}
      onError={handleImageError}
      onLoad={handleImageLoad}
      loading="eager"
    />
  );
};

export default CubeLogo;
