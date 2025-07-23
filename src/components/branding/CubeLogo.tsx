
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
  const [lightImageError, setLightImageError] = useState(false);
  const [darkImageError, setDarkImageError] = useState(false);
  
  const dimensions = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  };

  const logoSize = dimensions[size];
  
  const handleLightImageError = () => {
    console.error('DUKAFITI Logo: Failed to load light mode logo');
    setLightImageError(true);
  };

  const handleDarkImageError = () => {
    console.error('DUKAFITI Logo: Failed to load dark mode logo');
    setDarkImageError(true);
  };

  const handleImageLoad = () => {
    console.log('DUKAFITI Logo: Logo loaded successfully');
  };

  // Only show fallback if both images fail to load
  if (lightImageError && darkImageError) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div 
          className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0"
          style={{ width: logoSize, height: logoSize, fontSize: logoSize * 0.4 }}
        >
          D
        </div>
        {showText && (
          <div className="flex flex-col">
            <span className="font-caesar font-bold text-lg text-gray-900 dark:text-white">
              DUKAFITI
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
        {!lightImageError && (
          <img 
            src="/lovable-uploads/d8334c82-49b3-4d1c-a0f0-0c4325ca25ba.png"
            alt="DUKAFITI Logo"
            width={logoSize} 
            height={logoSize}
            className="w-full h-full object-contain transition-all duration-300 dark:hidden"
            onError={handleLightImageError}
            onLoad={handleImageLoad}
            loading="eager"
          />
        )}
        {/* Dark mode logo */}
        {!darkImageError && (
          <img 
            src="/lovable-uploads/374aea9f-d802-43c1-9ea5-d38770989d8b.png"
            alt="DUKAFITI Logo"
            width={logoSize} 
            height={logoSize}
            className="w-full h-full object-contain transition-all duration-300 hidden dark:block"
            onError={handleDarkImageError}
            onLoad={handleImageLoad}
            loading="eager"
          />
        )}
        {/* Individual fallbacks for each mode */}
        {lightImageError && (
          <div 
            className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg dark:hidden"
            style={{ fontSize: logoSize * 0.4 }}
          >
            D
          </div>
        )}
        {darkImageError && (
          <div 
            className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg hidden dark:block"
            style={{ fontSize: logoSize * 0.4 }}
          >
            D
          </div>
        )}
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
