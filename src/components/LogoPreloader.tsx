import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import WuubleLogo from './WuubleLogo';

interface LogoPreloaderProps {
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

const LogoPreloader: React.FC<LogoPreloaderProps> = ({
  onComplete,
  duration = 2000,
  className
}) => {
  const [phase, setPhase] = useState<'fade-in' | 'animate' | 'fade-out'>('fade-in');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const phaseTimeout1 = setTimeout(() => {
      setPhase('animate');
    }, 300);

    const phaseTimeout2 = setTimeout(() => {
      setPhase('fade-out');
    }, duration - 300);

    const completeTimeout = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(phaseTimeout1);
      clearTimeout(phaseTimeout2);
      clearTimeout(completeTimeout);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex items-center justify-center",
      "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900",
      "transition-opacity duration-300",
      phase === 'fade-in' ? 'opacity-0' : phase === 'fade-out' ? 'opacity-0' : 'opacity-100',
      className
    )}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/20 animate-pulse blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-500/30 animate-ping blur-2xl animation-delay-500" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Logo with scaling animation */}
        <div className={cn(
          "transition-all duration-1000 ease-out",
          phase === 'fade-in' ? 'scale-0 rotate-180' : 
          phase === 'animate' ? 'scale-100 rotate-0' : 
          'scale-110 rotate-0'
        )}>
          <WuubleLogo 
            size="xxl" 
            animated={phase === 'animate'} 
            variant="glow"
          />
        </div>

        {/* Brand text with typing effect */}
        <div className={cn(
          "transition-all duration-700 ease-out delay-300",
          phase === 'fade-in' ? 'opacity-0 translate-y-4' : 
          phase === 'animate' ? 'opacity-100 translate-y-0' : 
          'opacity-100 translate-y-0'
        )}>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
            Wuuble
          </h1>
        </div>

        {/* Tagline */}
        <div className={cn(
          "transition-all duration-700 ease-out delay-500",
          phase === 'fade-in' ? 'opacity-0 translate-y-4' : 
          phase === 'animate' ? 'opacity-100 translate-y-0' : 
          'opacity-100 translate-y-0'
        )}>
          <p className="text-white/70 text-lg md:text-xl font-medium">
            Connect • Create • Community
          </p>
        </div>

        {/* Loading indicator */}
        <div className={cn(
          "transition-all duration-700 ease-out delay-700",
          phase === 'fade-in' ? 'opacity-0' : 
          phase === 'animate' ? 'opacity-100' : 
          'opacity-50'
        )}>
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce animation-delay-200" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoPreloader;