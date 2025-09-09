import React from 'react';
import { Link2, Share } from 'lucide-react';

interface CommunityLinksIconProps {
  size?: number;
  variant?: 'gradient' | 'minimal' | 'modern';
  className?: string;
}

const CommunityLinksIcon: React.FC<CommunityLinksIconProps> = ({
  size = 24,
  variant = 'modern',
  className = ''
}) => {
  if (variant === 'gradient') {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg p-1">
          <div className="w-full h-full bg-white rounded-md flex items-center justify-center">
            <Link2 size={size * 0.6} className="text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={className}>
        <Link2 size={size} className="text-gray-600" />
      </div>
    );
  }

  // Modern variant (default)
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Link2 
          size={size} 
          className="text-blue-500 drop-shadow-sm" 
          strokeWidth={1.5}
        />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Share size={8} className="text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};

export default CommunityLinksIcon;