
import React from 'react';

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
  const dimensions = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  };

  const logoSize = dimensions[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: logoSize, height: logoSize }}>
        {/* Light mode logo */}
        <img 
          src="/lovable-uploads/16db02b7-b050-4236-bbd9-7ded87ba3426.png"
          alt="DUKAFITI Logo"
          width={logoSize} 
          height={logoSize}
          className="w-full h-full object-contain transition-all duration-300 dark:hidden"
          loading="eager"
        />
        {/* Dark mode logo */}
        <img 
          src="/lovable-uploads/4ad247ca-3e82-4376-bbb7-19edd9f311fd.png"
          alt="DUKAFITI Logo"
          width={logoSize} 
          height={logoSize}
          className="w-full h-full object-contain transition-all duration-300 hidden dark:block"
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
