
import React from 'react';
import { useTheme } from 'next-themes';

interface CubeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CubeLogo: React.FC<CubeLogoProps> = ({ size = 'md', className = '' }) => {
  const { theme, resolvedTheme } = useTheme();
  
  const dimensions = {
    sm: 24,
    md: 32,
    lg: 40
  };

  const logoSize = dimensions[size];
  
  // Use dark logo for light mode and light logo for dark mode
  // This ensures good contrast against the purple background
  const currentTheme = resolvedTheme || theme;
  const logoSrc = currentTheme === 'dark' 
    ? '/lovable-uploads/e01ade1b-8af8-46ff-b6dc-67625887a831.png' // Light logo for dark mode
    : '/lovable-uploads/c903a006-f883-4a49-807a-f8b0b5a35858.png'; // Dark logo for light mode

  return (
    <img 
      src={logoSrc}
      alt="DukaFiti Logo"
      width={logoSize} 
      height={logoSize}
      className={`flex-shrink-0 transition-all duration-300 ${className}`}
      style={{ 
        width: logoSize, 
        height: logoSize,
        objectFit: 'contain'
      }}
    />
  );
};

export default CubeLogo;
