import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingPageProps {
  className?: string;
  message?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ 
  className, 
  message = "Loading..." 
}) => {
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900",
      "min-h-screen w-full overflow-hidden",
      className
    )}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-500/20 animate-pulse blur-xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-500/20 animate-pulse blur-xl animation-delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 animate-ping animation-delay-2000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        {/* Wuuble Logo/Text */}
        <div className="relative">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-pulse">
            Wuuble
          </h1>
          
          {/* Glowing effect behind text */}
          <div className="absolute inset-0 text-6xl md:text-8xl font-bold text-purple-400/30 blur-sm animate-pulse animation-delay-500">
            Wuuble
          </div>
        </div>

        {/* Loading spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin animation-delay-300" style={{ animationDirection: 'reverse' }} />
        </div>

        {/* Loading message */}
        <p className="text-white/80 text-lg md:text-xl font-medium animate-pulse animation-delay-1000">
          {message}
        </p>

        {/* Loading dots animation */}
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce animation-delay-200" />
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce animation-delay-400" />
        </div>
      </div>

      {/* Bottom decorative elements */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-4 text-white/40 text-sm">
          <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-purple-400/50" />
          <span>Powered by Wuuble</span>
          <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-purple-400/50" />
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;