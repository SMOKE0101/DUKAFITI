import React, { useState, useRef, useEffect } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FastTemplateImageProps {
  src?: string | null;
  alt: string;
  productName: string;
  className?: string;
}

/**
 * High-performance image component for template grid
 * Optimized for fast loading with minimal overhead
 */
const FastTemplateImage: React.FC<FastTemplateImageProps> = ({
  src,
  alt,
  productName,
  className,
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
    
    // Preload image for faster display
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.loading = 'lazy';
    
    img.onload = () => {
      setImageState('loaded');
    };
    
    img.onerror = () => {
      setImageState('error');
    };
    
    img.src = src;
    
    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  // Get the product initial for fallback
  const productInitial = productName.charAt(0).toUpperCase();

  // Render fallback
  const renderFallback = () => (
    <div className={cn(
      "w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30",
      className
    )}>
      <div className="w-12 h-12 bg-white/90 dark:bg-gray-800/90 rounded-2xl flex items-center justify-center shadow-lg border border-white/50 dark:border-gray-700/50 backdrop-blur-sm">
        {imageState === 'loading' ? (
          <Package className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
        ) : (
          <span className="font-bold text-blue-700 dark:text-blue-300 text-lg">
            {productInitial}
          </span>
        )}
      </div>
    </div>
  );

  // Show fallback if no src or error
  if (!src || imageState === 'error') {
    return renderFallback();
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {imageState === 'loaded' ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onError={() => setImageState('error')}
        />
      ) : (
        renderFallback()
      )}
    </div>
  );
};

export default FastTemplateImage;