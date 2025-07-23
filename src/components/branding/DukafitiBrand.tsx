
import React from 'react';
import CubeLogo from './CubeLogo';

interface DukafitiBrandProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'horizontal' | 'vertical' | 'logo-only';
  className?: string;
  textColor?: string;
  onClick?: () => void;
}

const DukafitiBrand: React.FC<DukafitiBrandProps> = ({
  size = 'md',
  layout = 'horizontal',
  className = '',
  textColor = 'text-gray-900 dark:text-white',
  onClick
}) => {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const taglineSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const handleClick = onClick ? { onClick } : {};
  const cursorClass = onClick ? 'cursor-pointer' : '';

  if (layout === 'logo-only') {
    return (
      <div className={`${className} ${cursorClass}`} {...handleClick}>
        <CubeLogo size={size} />
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className} ${cursorClass}`} {...handleClick}>
        <CubeLogo size={size} />
        <div className="text-center">
          <h1 className={`font-caesar font-bold ${textSizes[size]} ${textColor} tracking-wide`}>
            DUKAFITI
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className} ${cursorClass}`} {...handleClick}>
      <CubeLogo size={size} />
      <div className="flex flex-col">
        <h1 className={`font-caesar font-bold ${textSizes[size]} ${textColor} tracking-wide leading-tight`}>
          DUKAFITI
        </h1>
      </div>
    </div>
  );
};

export default DukafitiBrand;
