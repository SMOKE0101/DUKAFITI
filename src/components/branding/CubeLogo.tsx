
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface CubeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const CubeLogo: React.FC<CubeLogoProps> = ({ 
  size = 'md', 
  className = '', 
  showText = false 
}) => {
  const { theme, resolvedTheme } = useTheme();
  const [imageError, setImageError] = useState(false);
  
  const dimensions = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  };

  const logoSize = dimensions[size];
  
  // Use the new cube logo uploaded by the user
  const newCubeLogo = '/lovable-uploads/bce2a988-3cd7-48e7-9d0d-e1cfc119a5c4.png';
  
  const handleImageError = () => {
    console.error('DUKAFITI Logo: Failed to load new cube logo');
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('DUKAFITI Logo: New cube logo loaded successfully');
    setImageError(false);
  };

  if (imageError) {
    // Fallback cube design when image fails to load
    return (
      <div 
        className={`flex items-center gap-3 ${className}`}
        style={{ width: logoSize, height: logoSize }}
      >
        <div 
          className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg"
          style={{ width: logoSize, height: logoSize, fontSize: logoSize * 0.4 }}
        >
          D
        </div>
        {showText && (
          <div className="flex flex-col">
            <span className="font-caesar font-bold text-lg text-gray-900 dark:text-white">
              DUKAFITI
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 italic">
              dukubora ni dukafiti
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: logoSize, height: logoSize }}>
        {/* Light mode logo */}
        <img 
          src="/lovable-uploads/d8334c82-49b3-4d1c-a0f0-0c4325ca25ba.png"
          alt="DUKAFITI Logo"
          width={logoSize} 
          height={logoSize}
          className="w-full h-full object-contain transition-all duration-300 dark:hidden"
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="eager"
        />
        {/* Dark mode logo */}
        <img 
          src="/lovable-uploads/374aea9f-d802-43c1-9ea5-d38770989d8b.png"
          alt="DUKAFITI Logo"
          width={logoSize} 
          height={logoSize}
          className="w-full h-full object-contain transition-all duration-300 hidden dark:block"
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="eager"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-caesar font-bold text-lg text-gray-900 dark:text-white tracking-wide">
            DUKAFITI
          </span>
        </div>
      )}
    </div>
  );
};

export default CubeLogo;
