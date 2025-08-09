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
    return undefined;
  }

  const trimmedUrl = url.trim();
  
  // Check if it's a valid URL format
  try {
    new URL(trimmedUrl);
  } catch {
    console.warn('Invalid avatar URL format:', trimmedUrl);
    return undefined;
  }

  // Check if it's a Supabase storage URL (common case)
  if (trimmedUrl.includes('supabase.co/storage/v1/object/public/')) {
    return trimmedUrl;
  }

  // Check if it's another valid image URL format
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
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
