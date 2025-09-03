import React from 'react';
import { cn } from '@/lib/utils';

interface ResourcesIconProps {
  className?: string;
  size?: number;
  variant?: 'default' | 'outline' | 'filled';
}

/**
 * Custom Resources Icon Component
 * 
 * Represents a collection of resources including documents, links, tools, and learning materials.
 * The icon combines elements of folders, documents, and sharing to represent the collaborative
 * nature of community resources.
 */
export const ResourcesIcon: React.FC<ResourcesIconProps> = ({ 
  className, 
  size = 20, 
  variant = 'default' 
}) => {
  const baseClasses = "flex-shrink-0";
  
  if (variant === 'filled') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn(baseClasses, className)}
        aria-label="Resources"
      >
        {/* Main folder/container */}
        <path d="M3 6a3 3 0 0 1 3-3h3.93a2 2 0 0 1 1.66.9L12.8 5.8a1 1 0 0 0 .83.45H18a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Z" />
        {/* Document stack inside */}
        <rect x="7" y="9" width="6" height="1.5" rx="0.75" fill="white" />
        <rect x="7" y="11.5" width="8" height="1.5" rx="0.75" fill="white" />
        <rect x="7" y="14" width="4" height="1.5" rx="0.75" fill="white" />
        {/* Connection/sharing indicator */}
        <circle cx="16.5" cy="10.5" r="1.5" fill="white" />
        <path d="m15.5 11.5 2 2" stroke="white" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'outline') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={cn(baseClasses, className)}
        aria-label="Resources"
      >
        {/* Main folder/container outline */}
        <path d="M3 6a3 3 0 0 1 3-3h3.93a2 2 0 0 1 1.66.9L12.8 5.8a1 1 0 0 0 .83.45H18a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Z" />
        {/* Document lines inside */}
        <line x1="7" y1="10" x2="13" y2="10" strokeLinecap="round" />
        <line x1="7" y1="12" x2="15" y2="12" strokeLinecap="round" />
        <line x1="7" y1="14" x2="11" y2="14" strokeLinecap="round" />
        {/* Connection/sharing indicator */}
        <circle cx="16.5" cy="10.5" r="1.5" />
        <path d="m15.5 11.5 2 2" strokeLinecap="round" />
      </svg>
    );
  }

  // Default variant - balanced fill and stroke
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={cn(baseClasses, className)}
      aria-label="Resources"
    >
      {/* Main folder/container with subtle fill */}
      <path 
        d="M3 6a3 3 0 0 1 3-3h3.93a2 2 0 0 1 1.66.9L12.8 5.8a1 1 0 0 0 .83.45H18a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Z" 
        fill="currentColor"
        fillOpacity="0.1"
      />
      {/* Document stack inside */}
      <rect x="7" y="9" width="6" height="1.5" rx="0.75" fill="currentColor" fillOpacity="0.6" />
      <rect x="7" y="11.5" width="8" height="1.5" rx="0.75" fill="currentColor" fillOpacity="0.6" />
      <rect x="7" y="14" width="4" height="1.5" rx="0.75" fill="currentColor" fillOpacity="0.6" />
      {/* Connection/sharing indicator */}
      <circle cx="16.5" cy="10.5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="m15.5 11.5 2 2" strokeLinecap="round" />
    </svg>
  );
};

export default ResourcesIcon;