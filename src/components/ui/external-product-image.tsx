import React, { useState, useRef, useEffect } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductInitial } from '@/utils/imageUtils';

interface ExternalProductImageProps {
  src?: string | null;
  alt: string;
  productName: string;
  className?: string;
  fallbackClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Simple, reliable image component for external URLs (like template images)
 * Handles CORS issues and loading states gracefully
 */
const ExternalProductImage: React.FC<ExternalProductImageProps> = ({
  src,
  alt,
  productName,
  className,
  fallbackClassName,
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
    
    // Preload the image to test if it's accessible
    const testImg = new Image();
    testImg.onload = () => {
      setImageState('loaded');
    };
    testImg.onerror = () => {
      setImageState('error');
    };
    
    // Set a timeout in case the image takes too long
    const timeoutId = setTimeout(() => {
      setImageState('error');
    }, 10000); // 10 second timeout
    
    // Start loading
    testImg.src = src;
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      testImg.onload = null;
      testImg.onerror = null;
    };
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
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  // Render fallback
  const renderFallback = () => (
    <div className={cn(
      "w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300 dark:from-purple-900 dark:via-purple-800 dark:to-purple-700",
      fallbackClassName,
      className
    )}>
      <div className={cn(
        "bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 dark:border-gray-700/50",
        sizeConfig[size]
      )}>
        {imageState === 'loading' ? (
          <Package className={cn(
            "text-purple-700 dark:text-purple-300 animate-pulse",
            size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'
          )} />
        ) : (
          <span className={cn(
            "font-bold text-purple-700 dark:text-purple-300",
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-2xl'
          )}>
            {productInitial}
          </span>
        )}
      </div>
    </div>
  );

  // Show fallback if no src or error occurred  
  if (!src) {
    console.log('[ExternalProductImage] No src provided for:', productName);
    return renderFallback();
  }
  
  if (imageState === 'error') {
    console.log('[ExternalProductImage] Error state for:', src);
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
          display: imageState === 'loaded' ? 'block' : 'none',
          imageRendering: 'auto',
          objectFit: 'cover'
        }}
        // Try different approaches for external images
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        decoding="async"
      />
    </div>
  );
};

export default ExternalProductImage;