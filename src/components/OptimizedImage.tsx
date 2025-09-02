import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  placeholder?: 'blur' | 'skeleton' | 'none';
  lazy?: boolean;
  quality?: number;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  fallback,
  placeholder = 'skeleton',
  lazy = true,
  quality = 80,
  sizes,
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before image comes into view
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, priority]);

  // Generate optimized image URLs (for services like Cloudinary, ImageKit, etc.)
  const getOptimizedUrl = (originalUrl: string): string => {
    try {
      const url = new URL(originalUrl);
      
      // If it's a Supabase storage URL, add transformation parameters
      if (url.hostname.includes('supabase')) {
        const params = new URLSearchParams();
        params.set('quality', quality.toString());
        if (sizes) {
          // Extract width from sizes attribute (simplified)
          const width = sizes.match(/(\d+)px/)?.[1];
          if (width) {
            params.set('width', width);
            params.set('height', width); // Square by default
          }
        }
        return `${originalUrl}?${params.toString()}`;
      }
      
      return originalUrl;
    } catch {
      return originalUrl;
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const optimizedSrc = getOptimizedUrl(src);

  // Show placeholder while not intersecting
  if (!isIntersecting) {
    return (
      <div 
        ref={imgRef}
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800",
          className
        )}
      >
        {placeholder === 'skeleton' ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <ImageIcon className="h-8 w-8 text-gray-400" />
        )}
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
        className
      )}>
        <AlertCircle className="h-8 w-8 mb-2" />
        <span className="text-sm">Failed to load image</span>
        {fallback && (
          <img
            src={fallback}
            alt={alt}
            className="w-full h-full object-cover mt-2"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Loading placeholder */}
      {isLoading && placeholder !== 'none' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          {placeholder === 'skeleton' ? (
            <Skeleton className="w-full h-full" />
          ) : placeholder === 'blur' ? (
            <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
          ) : (
            <ImageIcon className="h-8 w-8 text-gray-400" />
          )}
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        sizes={sizes}
        loading={lazy && !priority ? "lazy" : "eager"}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          contentVisibility: lazy ? 'auto' : 'visible'
        }}
      />
    </div>
  );
};

// Higher-order component for automatic optimization
export const withImageOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<HTMLElement, P>((props, ref) => {
    return <Component {...props} ref={ref} />;
  });
};

// Hook for image preloading
export const useImagePreloader = (urls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(url));
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
    };

    // Preload images with a delay to not block initial render
    const timeoutId = setTimeout(() => {
      urls.forEach(url => {
        preloadImage(url).catch(console.error);
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [urls]);

  return loadedImages;
};

export default OptimizedImage;