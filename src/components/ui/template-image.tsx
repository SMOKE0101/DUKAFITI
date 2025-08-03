import React, { useState, useRef, useEffect } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductInitial } from '@/utils/imageUtils';

interface TemplateImageProps {
  src?: string | null;
  alt: string;
  productName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Optimized image component for template cards
 * Uses direct loading with simplified fallback for performance
 */
const TemplateImage: React.FC<TemplateImageProps> = ({
  src,
  alt,
  productName,
  className,
  size = 'md',
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when src changes
  useEffect(() => {
    if (!src) {
      setImageState('error');
      return;
    }
    
    setImageState('loading');
  }, [src]);

  const handleLoad = () => {
    setImageState('loaded');
  };

  const handleError = () => {
    setImageState('error');
  };

  // Get the product initial for fallback
  const productInitial = getProductInitial(productName);

  // Size configurations
  const sizeConfig = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Render fallback
  const renderFallback = () => (
    <div className={cn(
      "w-full h-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30",
      className
    )}>
      {/* Center content */}
      <div className={cn(
        "relative bg-white/90 dark:bg-gray-800/90 rounded-2xl flex items-center justify-center shadow-lg border border-white/50 dark:border-gray-700/50 backdrop-blur-sm",
        sizeConfig[size]
      )}>
        {imageState === 'loading' ? (
          <Package className={cn(
            "text-blue-600 dark:text-blue-400 animate-pulse",
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6'
          )} />
        ) : (
          <span className={cn(
            "font-bold text-blue-700 dark:text-blue-300",
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'
          )}>
            {productInitial}
          </span>
        )}
      </div>
    </div>
  );

  // Show fallback if no src
  if (!src) {
    return renderFallback();
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {/* Loading state */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 w-full h-full">
          {renderFallback()}
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        )}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        style={{ 
          imageRendering: 'auto',
          objectFit: 'cover'
        }}
      />
    </div>
  );
};

export default TemplateImage;