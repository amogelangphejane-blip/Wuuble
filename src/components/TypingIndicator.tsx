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
        "flex items-center gap-3 mb-4 animate-fadeIn",
        className
      )}
    >
      {/* Animated avatar placeholder */}
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 backdrop-blur-md border border-white/20 flex items-center justify-center animate-pulse shadow-lg">
        <div className="w-3 h-3 rounded-full bg-white/60" />
      </div>
      
      {/* Typing bubble with modern design */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl rounded-bl-lg px-4 py-3 border border-white/10 shadow-xl animate-floatingBubble">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {userName} is typing...
          </span>
          <div className="flex gap-1">
            <div 
              className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-bounce" 
              style={{ animationDelay: '0ms', animationDuration: '1.2s' }} 
            />
            <div 
              className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-bounce" 
              style={{ animationDelay: '200ms', animationDuration: '1.2s' }} 
            />
            <div 
              className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-bounce" 
              style={{ animationDelay: '400ms', animationDuration: '1.2s' }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};