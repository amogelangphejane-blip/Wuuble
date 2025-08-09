import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates and processes avatar URLs to ensure they are properly formatted
 * and accessible. Returns undefined for invalid URLs to trigger fallback.
 */
export function validateAvatarUrl(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    console.debug('Avatar URL is empty or null');
    return undefined;
  }

  const trimmedUrl = url.trim();
  
  // Check if it's a valid URL format
  try {
    const urlObj = new URL(trimmedUrl);
    console.debug('Avatar URL validation passed for:', trimmedUrl);
    
    // Additional validation for common issues
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      console.warn('Avatar URL has invalid protocol:', urlObj.protocol);
      return undefined;
    }
    
  } catch (error) {
    console.warn('Invalid avatar URL format:', trimmedUrl, error);
    return undefined;
  }

  // Check if it's a Supabase storage URL (common case)
  if (trimmedUrl.includes('supabase.co/storage/v1/object/public/')) {
    // Additional validation for Supabase URLs
    if (trimmedUrl.includes('profile-pictures') || trimmedUrl.includes('community-avatars')) {
      return trimmedUrl;
    }
    console.warn('Supabase URL does not contain expected bucket path:', trimmedUrl);
    return trimmedUrl; // Still return it, but warn
  }

  // Check if it's another valid image URL format
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    // Check if it looks like an image URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      trimmedUrl.toLowerCase().includes(ext)
    );
    
    if (hasImageExtension || trimmedUrl.includes('image') || trimmedUrl.includes('avatar')) {
      return trimmedUrl;
    }
    
    // Allow all HTTPS URLs but warn about potential non-image URLs
    console.debug('URL does not appear to be an image but allowing:', trimmedUrl);
    return trimmedUrl;
  }

  // If we can't validate it, return undefined to trigger fallback
  console.warn('Unrecognized avatar URL format:', trimmedUrl);
  return undefined;
}

/**
 * Gets the initials from a name for avatar fallbacks
 */
export function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') {
    return 'U';
  }

  const words = name.trim().split(/\s+/);
  if (words.length === 0) {
    return 'U';
  }

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}
