import React, { useState, useRef, useEffect } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductInitial } from '@/utils/imageUtils';
import { loadImageWithProxy, needsProxy } from '@/utils/imageProxy';

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
  const [workingUrl, setWorkingUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when src changes
  useEffect(() => {
    if (!src) {
      setImageState('error');
      setWorkingUrl(null);
      return;
    }
    
    setImageState('loading');
    setWorkingUrl(null);
    
    // Check if it's already a local Supabase storage URL - use directly
    if (src.includes('/storage/v1/object/public/')) {
      setWorkingUrl(src);
      setImageState('loaded');
      return;
    }
    
    // For external URLs, try direct load first (many CDN images work without proxy)
    const loadImage = async () => {
      try {
        // Try direct load first - faster if it works
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Direct load timeout')), 3000);
          img.onload = () => {
            clearTimeout(timeout);
            resolve(img);
          };
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Direct load failed'));
          };
          img.src = src;
        });
        
        // Direct load succeeded
        setWorkingUrl(src);
        setImageState('loaded');
      } catch (directError) {
        // Direct load failed, try with proxy
        try {
          const workingImageUrl = await loadImageWithProxy(src);
          setWorkingUrl(workingImageUrl);
          setImageState('loaded');
        } catch (proxyError) {
          console.log(`[ExternalProductImage] All load attempts failed for: ${src}`, { directError, proxyError });
          setImageState('error');
          setWorkingUrl(null);
        }
      }
    };

    loadImage();
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
      "w-full h-full flex items-center justify-center relative overflow-hidden",
      fallbackClassName,
      className
    )}>
      {/* Attractive gradient background based on product name */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30" />
      
      {/* Pattern overlay for visual interest */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      {/* Center content */}
      <div className={cn(
        "relative bg-white/90 dark:bg-gray-800/90 rounded-2xl flex items-center justify-center shadow-lg border border-white/50 dark:border-gray-700/50 backdrop-blur-sm",
        sizeConfig[size]
      )}>
        {imageState === 'loading' ? (
          <Package className={cn(
            "text-blue-600 dark:text-blue-400 animate-pulse",
            size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'
          )} />
        ) : (
          <span className={cn(
            "font-bold text-blue-700 dark:text-blue-300",
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-2xl'
          )}>
            {productInitial}
          </span>
        )}
      </div>
      
      {/* Product name overlay for context */}
      <div className="absolute bottom-1 left-1 right-1 text-center">
        <div className="bg-black/20 dark:bg-white/20 backdrop-blur-sm rounded-md px-1 py-0.5">
          <span className="text-xs text-white dark:text-gray-200 font-medium truncate block">
            {productName.slice(0, 20)}{productName.length > 20 ? '...' : ''}
          </span>
        </div>
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
      {workingUrl && (
        <img
          ref={imgRef}
          src={workingUrl}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          style={{ 
            display: imageState === 'loaded' ? 'block' : 'none',
            imageRendering: 'auto',
            objectFit: 'cover'
          }}
        />
      )}
    </div>
  );
};

export default ExternalProductImage;