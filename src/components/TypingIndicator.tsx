import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  userName?: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userName = "Someone",
  className
}) => {
  return (
    <div 
      className={cn(
        "flex items-center gap-1 mb-2 animate-whatsappFadeIn",
        className
      )}
    >
      {/* Avatar placeholder */}
      <div className="h-6 w-6 flex-shrink-0" />
      
      <div className="bg-white dark:bg-[#202c33] rounded-lg rounded-bl-sm px-3 py-2 shadow-sm border dark:border-gray-700 relative before:absolute before:content-[''] before:w-0 before:h-0 before:left-0 before:top-0 before:border-r-[6px] before:border-r-white dark:before:border-r-[#202c33] before:border-t-[6px] before:border-t-transparent before:-translate-x-full">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
            {userName} is typing
          </span>
          <div className="flex gap-1">
            <div 
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-typingDots"
              style={{ animationDelay: '0ms' }}
            />
            <div 
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-typingDots"
              style={{ animationDelay: '150ms' }}
            />
            <div 
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-typingDots"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};