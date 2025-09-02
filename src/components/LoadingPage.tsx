import React from 'react';
import { cn } from '@/lib/utils';
import WuubleLogo from './WuubleLogo';

interface LoadingPageProps {
  className?: string;
  message?: string;
  variant?: 'default' | 'splash' | 'minimal' | 'progress';
  progress?: number; // 0-100 for progress variant
  showProgress?: boolean;
  subMessage?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ 
  className, 
  message = "Loading...",
  variant = 'default',
  progress = 0,
  showProgress = false,
  subMessage
}) => {
  const renderSpinner = () => {
    if (variant === 'minimal') {
      return (
        <div className="relative">
          <WuubleLogo 
            size="md" 
            animated={true} 
            variant="loading"
            className="opacity-80"
          />
        </div>
      );
    }
    
    return (
      <div className="relative flex items-center justify-center">
        {/* Outer ring */}
        <div className="w-20 h-20 border-4 border-purple-400/20 border-t-purple-400 rounded-full animate-spin" />
        {/* Middle ring */}
        <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin animation-delay-300" style={{ animationDirection: 'reverse' }} />
        {/* Inner ring */}
        <div className="absolute inset-4 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin animation-delay-600" />
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <WuubleLogo 
            size="sm" 
            animated={true} 
            variant="pulse"
            className="opacity-90"
          />
        </div>
      </div>
    );
  };

  const renderProgressBar = () => {
    if (!showProgress && variant !== 'progress') return null;
    
    return (
      <div className="relative w-80 max-w-sm">
        {/* Background bar */}
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/20">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            {/* Moving highlight */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-bounce" />
          </div>
        </div>
        {/* Glow effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-blue-500/50 rounded-full blur-sm transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    );
  };

  const getBackgroundClasses = () => {
    switch (variant) {
      case 'splash':
        return "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900";
      case 'minimal':
        return "bg-black/80 backdrop-blur-sm";
      case 'progress':
        return "bg-gradient-to-br from-gray-900 via-purple-900/50 to-blue-900/50";
      default:
        return "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900";
    }
  };

  const renderContent = () => {
    if (variant === 'minimal') {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
          {renderSpinner()}
          <p className="text-white/90 text-lg font-medium">{message}</p>
          {renderProgressBar()}
        </div>
      );
    }

    if (variant === 'progress') {
      return (
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Wuuble Logo */}
          <div className="relative flex flex-col items-center space-y-4">
            <WuubleLogo 
              size="xxl" 
              animated={true} 
              variant="glow"
              className="mb-2"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              Wuuble
            </h1>
          </div>

          {/* Progress content */}
          <div className="flex flex-col items-center space-y-4">
            {renderProgressBar()}
            <p className="text-white/90 text-lg font-medium">{message}</p>
            {subMessage && (
              <p className="text-white/60 text-sm">{subMessage}</p>
            )}
            <div className="text-white/50 text-sm font-mono">
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      );
    }

    // Default and splash variants
    return (
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Wuuble Logo/Text */}
        <div className="relative flex flex-col items-center space-y-6">
          <WuubleLogo 
            size="xxl" 
            animated={true} 
            variant="pulse"
            className="mb-4"
          />
          <div className="relative">
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-pulse">
              Wuuble
            </h1>
            
            {/* Glowing effect behind text */}
            <div className="absolute inset-0 text-5xl md:text-7xl font-bold text-purple-400/30 blur-sm animate-pulse animation-delay-500">
              Wuuble
            </div>
          </div>
        </div>

        {/* Loading spinner */}
        {renderSpinner()}

        {/* Loading message */}
        <p className="text-white/80 text-lg md:text-xl font-medium animate-pulse animation-delay-1000">
          {message}
        </p>

        {subMessage && (
          <p className="text-white/60 text-sm md:text-base animate-pulse animation-delay-1500">
            {subMessage}
          </p>
        )}

        {/* Progress bar if enabled */}
        {renderProgressBar()}

        {/* Loading dots animation */}
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce animation-delay-200" />
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce animation-delay-400" />
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      getBackgroundClasses(),
      "min-h-screen w-full overflow-hidden",
      className
    )}>
      {/* Animated background elements - only for non-minimal variants */}
      {variant !== 'minimal' && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary floating orbs */}
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-500/20 animate-pulse blur-xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-500/20 animate-pulse blur-xl animation-delay-1000" />
          <div className="absolute top-1/4 -left-20 w-60 h-60 rounded-full bg-pink-500/15 animate-pulse blur-2xl animation-delay-2000" />
          
          {/* Secondary floating elements */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 animate-ping animation-delay-3000" />
          <div className="absolute top-3/4 right-1/4 w-40 h-40 rounded-full bg-cyan-500/15 animate-bounce animation-delay-1500" />
          
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-white/20 animate-bounce animation-delay-500" />
          <div className="absolute top-3/4 left-3/4 w-3 h-3 rounded-full bg-white/15 animate-bounce animation-delay-2500" />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-white/25 animate-bounce animation-delay-4000" />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10">
        {renderContent()}
      </div>

      {/* Bottom decorative elements - only for default and splash variants */}
      {(variant === 'default' || variant === 'splash') && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-4 text-white/40 text-sm">
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-purple-400/50" />
            <span>Powered by Wuuble</span>
            <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-purple-400/50" />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingPage;