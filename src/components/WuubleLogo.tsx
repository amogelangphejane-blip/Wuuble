import React from 'react';
import { cn } from '@/lib/utils';

interface WuubleLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  animated?: boolean;
  variant?: 'default' | 'loading' | 'pulse' | 'glow';
  className?: string;
}

const WuubleLogo: React.FC<WuubleLogoProps> = ({
  size = 'md',
  animated = false,
  variant = 'default',
  className
}) => {
  const sizeMap = {
    sm: { width: 24, height: 24, textSize: 'text-lg' },
    md: { width: 32, height: 32, textSize: 'text-xl' },
    lg: { width: 48, height: 48, textSize: 'text-2xl' },
    xl: { width: 64, height: 64, textSize: 'text-3xl' },
    xxl: { width: 96, height: 96, textSize: 'text-4xl' }
  };

  const { width, height, textSize } = sizeMap[size];

  const getAnimationClass = () => {
    if (!animated) return '';
    
    switch (variant) {
      case 'loading':
        return 'animate-logo-spin';
      case 'pulse':
        return 'animate-breathe';
      case 'glow':
        return 'animate-logo-glow';
      default:
        return 'hover:scale-110 transition-transform duration-300';
    }
  };

  const renderSVG = () => (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn(getAnimationClass(), 'drop-shadow-lg')}
    >
      <defs>
        <linearGradient id={`wuubleGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: '#8B5CF6', stopOpacity: 1}} />
          <stop offset="50%" style={{stopColor: '#EC4899', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#3B82F6', stopOpacity: 1}} />
        </linearGradient>
        <filter id={`glow-${size}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main wuuble shape - flowing S-curve representing movement */}
      <path 
        d="M6 10 Q16 4 26 10 Q16 16 6 22 Q16 28 26 22 Q16 16 6 10 Z" 
        fill={`url(#wuubleGradient-${size})`} 
        opacity="0.9"
        filter={variant === 'glow' ? `url(#glow-${size})` : undefined}
      />
      
      {/* Secondary accent shape for depth and community */}
      <path 
        d="M10 8 Q16 6 22 8 Q16 12 10 16 Q16 20 22 16 Q16 12 10 8 Z" 
        fill={`url(#wuubleGradient-${size})`} 
        opacity="0.6"
      />
      
      {/* Central connecting element */}
      <circle 
        cx="16" 
        cy="16" 
        r="2" 
        fill={`url(#wuubleGradient-${size})`} 
        opacity="0.8"
      />
      
      {/* Small community dots */}
      <circle cx="8" cy="12" r="1" fill={`url(#wuubleGradient-${size})`}/>
      <circle cx="24" cy="12" r="1" fill={`url(#wuubleGradient-${size})`}/>
      <circle cx="8" cy="20" r="1" fill={`url(#wuubleGradient-${size})`}/>
      <circle cx="24" cy="20" r="1" fill={`url(#wuubleGradient-${size})`}/>
    </svg>
  );

  return (
    <div className={cn('flex items-center justify-center', className)}>
      {renderSVG()}
    </div>
  );
};

export default WuubleLogo;