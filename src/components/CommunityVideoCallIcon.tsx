import React from 'react';

interface CommunityVideoCallIconProps {
  size?: number;
  className?: string;
  color?: string;
}

export const CommunityVideoCallIcon: React.FC<CommunityVideoCallIconProps> = ({ 
  size = 24, 
  className = '', 
  color = 'currentColor' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main video call window */}
      <rect
        x="2"
        y="4"
        width="20"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      
      {/* Video call grid - 4 participants */}
      {/* Top left participant */}
      <rect
        x="4"
        y="6"
        width="7"
        height="5"
        rx="1"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx="7.5"
        cy="8"
        r="1"
        fill={color}
      />
      <path
        d="M5.5 10.5c0-.5.5-1 1-1h2c.5 0 1 .5 1 1"
        stroke={color}
        strokeWidth="1"
        fill="none"
      />
      
      {/* Top right participant */}
      <rect
        x="13"
        y="6"
        width="7"
        height="5"
        rx="1"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx="16.5"
        cy="8"
        r="1"
        fill={color}
      />
      <path
        d="M14.5 10.5c0-.5.5-1 1-1h2c.5 0 1 .5 1 1"
        stroke={color}
        strokeWidth="1"
        fill="none"
      />
      
      {/* Bottom left participant */}
      <rect
        x="4"
        y="12"
        width="7"
        height="5"
        rx="1"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx="7.5"
        cy="14"
        r="1"
        fill={color}
      />
      <path
        d="M5.5 16.5c0-.5.5-1 1-1h2c.5 0 1 .5 1 1"
        stroke={color}
        strokeWidth="1"
        fill="none"
      />
      
      {/* Bottom right participant */}
      <rect
        x="13"
        y="12"
        width="7"
        height="5"
        rx="1"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx="16.5"
        cy="14"
        r="1"
        fill={color}
      />
      <path
        d="M14.5 16.5c0-.5.5-1 1-1h2c.5 0 1 .5 1 1"
        stroke={color}
        strokeWidth="1"
        fill="none"
      />
      
      {/* Video camera indicator */}
      <circle
        cx="19"
        cy="5"
        r="2"
        fill={color}
        opacity="0.8"
      />
      <path
        d="M18 4.5l1.5 1-1.5 1"
        stroke="white"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CommunityVideoCallIcon;