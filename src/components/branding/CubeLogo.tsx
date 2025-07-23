
import React, { useState, useEffect } from 'react';

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
  const [lightImageError, setLightImageError] = useState(false);
  const [darkImageError, setDarkImageError] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    console.log('DUKAFITI Logo: Component mounted');
  }, []);

  const dimensions = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  };

  const logoSize = dimensions[size];

  const handleLightImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('DUKAFITI Logo: Failed to load LIGHT logo:', event.currentTarget.src);
    setLightImageError(true);
  };

  const handleDarkImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('DUKAFITI Logo: Failed to load DARK logo:', event.currentTarget.src);
    setDarkImageError(true);
  };

  const handleLightImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('DUKAFITI Logo: Light logo loaded successfully:', event.currentTarget.src);
  };

  const handleDarkImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('DUKAFITI Logo: Dark logo loaded successfully:', event.currentTarget.src);
  };

  console.log('DUKAFITI Logo: Render state - lightError:', lightImageError, 'darkError:', darkImageError, 'mounted:', mounted);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: logoSize, height: logoSize }}>
        {/* Light mode logo */}
        <img 
          src="/lovable-uploads/16db02b7-b050-4236-bbd9-7ded87ba3426.png"
          alt="DUKAFITI Logo Light"
          width={logoSize} 
          height={logoSize}
          className="w-full h-full object-contain transition-all duration-300 dark:hidden"
          onError={handleLightImageError}
          onLoad={handleLightImageLoad}
          loading="eager"
        />
        {/* Dark mode logo */}
        <img 
          src="/lovable-uploads/4ad247ca-3e82-4376-bbb7-19edd9f311fd.png"
          alt="DUKAFITI Logo Dark"
          width={logoSize} 
          height={logoSize}
          className="w-full h-full object-contain transition-all duration-300 hidden dark:block"
          onError={handleDarkImageError}
          onLoad={handleDarkImageLoad}
          loading="eager"
        />
        
        {/* Fallback for light mode only if light image fails */}
        {lightImageError && (
          <div 
            className="absolute inset-0 bg-transparent flex items-center justify-center text-primary font-bold border border-primary/20 rounded dark:hidden"
            style={{ fontSize: logoSize * 0.4 }}
          >
            D
          </div>
        )}
        
        {/* Fallback for dark mode only if dark image fails */}
        {darkImageError && (
          <div 
            className="absolute inset-0 bg-transparent flex items-center justify-center text-primary font-bold border border-primary/20 rounded hidden dark:block"
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
