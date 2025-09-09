import React from 'react';
import { Link as LinkIcon, Share2, Globe } from 'lucide-react';

interface CommunityLinksIconProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'gradient' | 'minimal' | 'modern';
}

export const CommunityLinksIcon: React.FC<CommunityLinksIconProps> = ({ 
  size = 24, 
  className = '',
  variant = 'default'
}) => {
  const baseClasses = `inline-flex items-center justify-center rounded-lg ${className}`;
  
  switch (variant) {
    case 'gradient':
      return (
        <div className={`${baseClasses} bg-gradient-to-r from-blue-500 to-purple-600 text-white`} 
             style={{ width: size + 8, height: size + 8 }}>
          <LinkIcon size={size * 0.6} />
        </div>
      );
      
    case 'minimal':
      return (
        <div className={`${baseClasses} text-gray-600 dark:text-gray-400`}>
          <LinkIcon size={size} />
        </div>
      );
      
    case 'modern':
      return (
        <div className={`${baseClasses} bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800`}
             style={{ width: size + 12, height: size + 12 }}>
          <div className="relative">
            <LinkIcon size={size * 0.7} />
            <Share2 size={size * 0.3} className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5" />
          </div>
        </div>
      );
      
    default:
      return (
        <div className={`${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}
             style={{ width: size + 8, height: size + 8 }}>
          <LinkIcon size={size * 0.7} />
        </div>
      );
  }
};

// Alternative icon variants
export const LinkShareIcon: React.FC<CommunityLinksIconProps> = (props) => (
  <CommunityLinksIcon {...props} variant="gradient" />
);

export const LinkGlobeIcon: React.FC<CommunityLinksIconProps> = ({ size = 24, className = '' }) => (
  <div className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white ${className}`}
       style={{ width: size + 8, height: size + 8 }}>
    <Globe size={size * 0.6} />
  </div>
);

export default CommunityLinksIcon;
