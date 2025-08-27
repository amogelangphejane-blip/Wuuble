/**
 * Asset optimization utilities for better performance at scale
 * Handles image optimization, lazy loading, and CDN integration
 */

// CDN configuration
const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || '';
const SUPABASE_STORAGE_URL = 'https://tgmflbglhmnrliredlbn.supabase.co/storage/v1/object/public';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  blur?: boolean;
}

export class AssetOptimizer {
  /**
   * Optimize image URL with CDN and parameters
   */
  static optimizeImageUrl(
    originalUrl: string, 
    options: ImageOptimizationOptions = {}
  ): string {
    if (!originalUrl) return '';

    // If it's a Supabase storage URL, we can add optimization parameters
    if (originalUrl.includes(SUPABASE_STORAGE_URL)) {
      return this.optimizeSupabaseImage(originalUrl, options);
    }

    // For external images, use CDN if available
    if (CDN_BASE_URL && !originalUrl.startsWith('http')) {
      return `${CDN_BASE_URL}/${originalUrl}`;
    }

    return originalUrl;
  }

  /**
   * Optimize Supabase storage images
   */
  private static optimizeSupabaseImage(
    url: string, 
    options: ImageOptimizationOptions
  ): string {
    const params = new URLSearchParams();

    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.format) params.append('format', options.format);

    const paramString = params.toString();
    return paramString ? `${url}?${paramString}` : url;
  }

  /**
   * Generate responsive image srcSet
   */
  static generateSrcSet(baseUrl: string, widths: number[] = [320, 640, 1024, 1920]): string {
    return widths
      .map(width => `${this.optimizeImageUrl(baseUrl, { width, format: 'webp', quality: 85 })} ${width}w`)
      .join(', ');
  }

  /**
   * Generate different sized versions for common use cases
   */
  static getImageVariants(baseUrl: string) {
    return {
      thumbnail: this.optimizeImageUrl(baseUrl, { width: 150, height: 150, quality: 80, format: 'webp' }),
      small: this.optimizeImageUrl(baseUrl, { width: 400, quality: 85, format: 'webp' }),
      medium: this.optimizeImageUrl(baseUrl, { width: 800, quality: 85, format: 'webp' }),
      large: this.optimizeImageUrl(baseUrl, { width: 1200, quality: 90, format: 'webp' }),
      original: baseUrl
    };
  }

  /**
   * Preload critical images
   */
  static preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Lazy load images with intersection observer
   */
  static setupLazyLoading(): void {
    if (typeof window === 'undefined') return;

    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              img.src = src;
              img.classList.remove('lazy');
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

/**
 * React hook for optimized images
 */
export const useOptimizedImage = (
  src: string, 
  options: ImageOptimizationOptions = {}
) => {
  const optimizedSrc = AssetOptimizer.optimizeImageUrl(src, options);
  const variants = AssetOptimizer.getImageVariants(src);
  const srcSet = AssetOptimizer.generateSrcSet(src);

  return {
    src: optimizedSrc,
    srcSet,
    variants
  };
};

/**
 * Optimized Image component with lazy loading
 */
import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  optimization?: ImageOptimizationOptions;
  lazy?: boolean;
  placeholder?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  optimization = {},
  lazy = true,
  placeholder,
  className = '',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);

  const optimizedSrc = AssetOptimizer.optimizeImageUrl(src, optimization);
  const placeholderSrc = placeholder || AssetOptimizer.optimizeImageUrl(src, { 
    width: 50, 
    quality: 50, 
    blur: true 
  });

  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = () => {
    setLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!loaded && (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-105"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={inView ? optimizedSrc : undefined}
        alt={alt}
        onLoad={handleLoad}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
      
      {/* Loading indicator */}
      {!loaded && inView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};