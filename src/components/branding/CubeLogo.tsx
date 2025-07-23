
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
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const dimensions = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  };

  const logoSize = dimensions[size];

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('DUKAFITI Logo: Failed to load custom logo:', event.currentTarget.src);
    setImageError(true);
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('DUKAFITI Logo: Custom logo loaded successfully:', event.currentTarget.src);
  };

  // Generate a timestamp for cache busting
  const timestamp = mounted ? Date.now() : 0;

  // If images fail to load, show a simple transparent background fallback
  if (imageError) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div 
          className="bg-transparent flex items-center justify-center text-primary font-bold border border-primary/20 rounded flex-shrink-0"
          style={{ width: logoSize, height: logoSize, fontSize: logoSize * 0.4 }}
        >
          D
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
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: logoSize, height: logoSize }}>
        {/* Light mode logo */}
        <img 
          src={`/lovable-uploads/16db02b7-b050-4236-bbd9-7ded87ba3426.png?t=${timestamp}`}
          alt="DUKAFITI Logo"
          width={logoSize} 
          height={logoSize}
          className="w-full h-full object-contain transition-all duration-300 dark:hidden"
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="eager"
          key={`light-${timestamp}`}
        />
        {/* Dark mode logo */}
        <img 
          src={`/lovable-uploads/4ad247ca-3e82-4376-bbb7-19edd9f311fd.png?t=${timestamp}`}
          alt="DUKAFITI Logo"
          width={logoSize} 
          height={logoSize}
          className="w-full h-full object-contain transition-all duration-300 hidden dark:block"
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="eager"
          key={`dark-${timestamp}`}
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
