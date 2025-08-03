import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getProductInitial, 
  getCachedImageUrl, 
  getOptimizedImageUrl, 
  preloadImage,
  MAX_RETRY_COUNT,
  RETRY_DELAY 
} from '@/utils/imageUtils';

export interface EnhancedProductImageProps {
  src?: string | null;
  alt: string;
  productName: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fallbackClassName?: string;
}

type ImageState = 'loading' | 'loaded' | 'error' | 'retrying';

/**
 * Enhanced product image component with advanced loading states, retry logic, and fallbacks
 */
const EnhancedProductImage: React.FC<EnhancedProductImageProps> = ({
  src,
  alt,
  productName,
  className,
  width = 400,
  height = 400,
  priority = false,
  fallbackClassName,
}) => {
  const [imageState, setImageState] = useState<ImageState>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Process the image URL
  const processedSrc = src ? getCachedImageUrl(getOptimizedImageUrl(src, width, height)) : '';

  // Reset state when src changes
  useEffect(() => {
    if (processedSrc !== currentSrc) {
      setCurrentSrc(processedSrc);
      setImageState(processedSrc ? 'loading' : 'error');
      setRetryCount(0);
      
      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    }
  }, [processedSrc, currentSrc]);

  // Handle image load success
  const handleLoad = useCallback(() => {
    setImageState('loaded');
    setRetryCount(0);
  }, []);

  // Handle image load error with retry logic
  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRY_COUNT) {
      setImageState('retrying');
      
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageState('loading');
        
        // Force reload by updating the src
        if (imgRef.current && currentSrc) {
          imgRef.current.src = currentSrc + `?retry=${retryCount + 1}`;
        }
      }, RETRY_DELAY);
    } else {
      setImageState('error');
    }
  }, [retryCount, currentSrc]);

  // Preload image if priority is set
  useEffect(() => {
    if (priority && currentSrc) {
      preloadImage(currentSrc).then(success => {
        if (!success && retryCount === 0) {
          setImageState('error');
        }
      });
    }
  }, [currentSrc, priority, retryCount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Get the product initial for fallback
  const productInitial = getProductInitial(productName);

  // Render fallback
  const renderFallback = () => (
    <div className={cn(
      "w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300 dark:from-purple-900 dark:via-purple-800 dark:to-purple-700",
      fallbackClassName,
      className
    )}>
      <div className="w-16 h-16 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 dark:border-gray-700/50">
        {imageState === 'retrying' ? (
          <Package className="w-8 h-8 text-purple-700 dark:text-purple-300 animate-pulse" />
        ) : (
          <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {productInitial}
          </span>
        )}
      </div>
      {imageState === 'retrying' && (
        <div className="absolute bottom-2 right-2 text-xs text-purple-600 dark:text-purple-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
          Retrying... ({retryCount + 1}/{MAX_RETRY_COUNT})
        </div>
      )}
    </div>
  );

  // Show fallback if no src or error occurred after retries
  if (!currentSrc || imageState === 'error') {
    return renderFallback();
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {/* Loading state */}
      {(imageState === 'loading' || imageState === 'retrying') && (
        <div className="absolute inset-0 w-full h-full">
          {renderFallback()}
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        )}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        style={{ 
          display: imageState === 'loaded' ? 'block' : 'none',
          imageRendering: 'auto',
          objectFit: 'cover'
        }}
        crossOrigin="anonymous"
        width={width}
        height={height}
      />
    </div>
  );
};

export default EnhancedProductImage;