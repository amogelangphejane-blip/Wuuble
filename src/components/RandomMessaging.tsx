import React from 'react';
import { MessageCircle, Shuffle } from 'lucide-react';

interface RandomMessagingIconProps {
  size?: number;
  variant?: 'gradient' | 'minimal' | 'modern';
  className?: string;
}

const RandomMessagingIcon: React.FC<RandomMessagingIconProps> = ({
  size = 24,
  variant = 'modern',
  className = ''
}) => {
  if (variant === 'gradient') {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-lg p-1">
          <div className="w-full h-full bg-white rounded-md flex items-center justify-center">
            <div className="relative">
              <MessageCircle size={size * 0.6} className="text-purple-500" />
              <Shuffle size={size * 0.3} className="absolute -top-1 -right-1 text-pink-500" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={className}>
        <MessageCircle size={size} className="text-gray-600" />
      </div>
    );
  }

  // Modern variant (default)
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MessageCircle 
          size={size} 
          className="text-purple-500 drop-shadow-sm" 
          strokeWidth={1.5}
        />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
          <Shuffle size={8} className="text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};

export default RandomMessagingIcon;