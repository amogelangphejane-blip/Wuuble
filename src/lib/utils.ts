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
    const urlObj = new URL(trimmedUrl);
    
    // Allow common protocols
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return trimmedUrl;
    }
    
    // Log but don't reject other protocols
    console.info('Unusual avatar URL protocol:', urlObj.protocol, trimmedUrl);
    return trimmedUrl;
  } catch {
    // If it's not a valid URL but looks like it might be a path, try to make it work
    if (trimmedUrl.startsWith('/') || trimmedUrl.includes('/')) {
      console.info('Avatar URL might be a relative path:', trimmedUrl);
      return trimmedUrl; // Let the browser handle it
    }
    
    console.warn('Invalid avatar URL format:', trimmedUrl);
    return undefined;
  }
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

/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date string in a human-readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Formats a date string with time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats a relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateString);
  }
}
