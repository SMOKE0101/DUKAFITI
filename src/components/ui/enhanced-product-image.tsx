import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, getProductInitial, preloadImage, MAX_RETRY_COUNT, RETRY_DELAY } from '@/utils/imageUtils';

export interface EnhancedProductImageProps {
  src?: string | null;
  alt: string;
  productName: string;
  className?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

type ImageState = 'loading' | 'loaded' | 'error' | 'retrying';

/**
 * Enhanced product image component with advanced loading states and retry logic
 */
const EnhancedProductImage: React.FC<EnhancedProductImageProps> = ({
  src,
  alt,
  productName,
  className,
  fallbackClassName,
  width = 300,
  height = 300,
  priority = false,
}) => {
  const [imageState, setImageState] = useState<ImageState>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process and optimize the source URL
  useEffect(() => {
    if (!src) {
      setCurrentSrc(null);
      setImageState('error');
      return;
    }

    // Reset state for new source
    setImageState('loading');
    setRetryCount(0);
    
    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    const optimizedSrc = getOptimizedImageUrl(src, width, height);
    setCurrentSrc(optimizedSrc);

    // Preload the image if priority is set
    if (priority) {
      preloadImage(optimizedSrc).then((success) => {
        if (success) {
          setImageState('loaded');
        } else {
          setImageState('error');
        }
      });
    }
  }, [src, width, height, priority]);

  const handleLoad = useCallback(() => {
    console.log('[EnhancedProductImage] Image loaded successfully:', currentSrc);
    setImageState('loaded');
    setRetryCount(0);
  }, [currentSrc]);

  const handleError = useCallback(() => {
    console.log('[EnhancedProductImage] Image error:', currentSrc, 'Retry count:', retryCount);
    
    if (retryCount < MAX_RETRY_COUNT && currentSrc) {
      setImageState('retrying');
      setRetryCount(prev => prev + 1);
      
      // Use progressive delay for retries
      const delay = RETRY_DELAY * (retryCount + 1);
      retryTimeoutRef.current = setTimeout(() => {
        setImageState('loading');
        
        // Force reload by adding cache buster
        const url = new URL(currentSrc);
        url.searchParams.set('retry', retryCount.toString());
        url.searchParams.set('t', Date.now().toString());
        
        if (imgRef.current) {
          imgRef.current.src = url.toString();
        }
      }, delay);
    } else {
      setImageState('error');
    }
  }, [currentSrc, retryCount]);

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
          Retrying... ({retryCount}/{MAX_RETRY_COUNT})
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
        referrerPolicy="no-referrer"
        width={width}
        height={height}
      />
    </div>
  );
};

export default EnhancedProductImage;