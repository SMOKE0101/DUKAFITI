
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
  
  // Define logo sources with the new uploaded images
  const logoSources = {
    // Use image 2 for dark mode (dark background with purple logo)
    dark: '/lovable-uploads/5c134a0a-9c11-4d06-84f0-2260ac6a501c.png',
    // Use image 3 for light mode (white/transparent background with purple logo)
    light: '/lovable-uploads/7a509f59-2133-4353-8956-6a97f4238cbd.png',
    // Fallback logo
    fallback: '/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png'
  };

  // Determine current theme and logo source
  useEffect(() => {
    const currentTheme = resolvedTheme || theme || 'light';
    console.log('CubeLogo: Current theme detected:', currentTheme);
    
    // Use appropriate logo for the current theme
    const selectedSrc = currentTheme === 'dark' ? logoSources.dark : logoSources.light;
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
