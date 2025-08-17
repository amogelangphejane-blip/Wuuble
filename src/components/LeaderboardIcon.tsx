import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Crown, Sparkles } from 'lucide-react';

interface LeaderboardIconProps {
  size?: number;
  className?: string;
  animated?: boolean;
  variant?: 'default' | 'crown' | 'trophy' | 'star';
}

export const LeaderboardIcon: React.FC<LeaderboardIconProps> = ({ 
  size = 24, 
  className = '', 
  animated = true,
  variant = 'default'
}) => {
  const iconVariants = {
    default: {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    },
    hover: {
      scale: 1.2,
      rotate: 15,
      transition: {
        duration: 0.2
      }
    }
  };

  const sparkleVariants = {
    animate: {
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      rotate: [0, 180, 360],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        delay: 0.5
      }
    }
  };

  const renderIcon = () => {
    switch (variant) {
      case 'crown':
        return <Crown size={size} className="text-yellow-500" />;
      case 'trophy':
        return <Trophy size={size} className="text-blue-500" />;
      case 'star':
        return <Star size={size} className="text-purple-500" />;
      default:
        return (
          <div className="relative">
            {/* Main trophy icon */}
            <Trophy size={size} className="text-gradient-to-r from-blue-500 to-purple-600" />
            
            {/* Sparkle effects */}
            {animated && (
              <>
                <motion.div
                  className="absolute -top-1 -right-1"
                  variants={sparkleVariants}
                  animate="animate"
                >
                  <Sparkles size={size * 0.4} className="text-yellow-400" />
                </motion.div>
                
                <motion.div
                  className="absolute -bottom-1 -left-1"
                  variants={sparkleVariants}
                  animate="animate"
                  style={{ animationDelay: '0.7s' }}
                >
                  <Star size={size * 0.3} className="text-blue-400" />
                </motion.div>
              </>
            )}
          </div>
        );
    }
  };

  if (!animated) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderIcon()}
      </div>
    );
  }

  return (
    <motion.div
      className={`inline-flex items-center justify-center cursor-pointer ${className}`}
      variants={iconVariants}
      animate="default"
      whileHover="hover"
      whileTap={{ scale: 0.95 }}
    >
      {renderIcon()}
    </motion.div>
  );
};

// Preset icon components for different contexts
export const CommunityLeaderboardIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = '' 
}) => (
  <LeaderboardIcon 
    size={size} 
    className={className}
    variant="default"
    animated={true}
  />
);

export const TopPerformerIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = '' 
}) => (
  <LeaderboardIcon 
    size={size} 
    className={className}
    variant="crown"
    animated={true}
  />
);

export const AchievementIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 18, 
  className = '' 
}) => (
  <LeaderboardIcon 
    size={size} 
    className={className}
    variant="trophy"
    animated={false}
  />
);

// Animated leaderboard badge component
export const LeaderboardBadge: React.FC<{
  rank: number;
  score: number;
  className?: string;
}> = ({ rank, score, className = '' }) => {
  const getBadgeColor = (rank: number) => {
    if (rank <= 3) return 'from-yellow-400 to-yellow-600';
    if (rank <= 10) return 'from-blue-400 to-blue-600';
    if (rank <= 25) return 'from-green-400 to-green-600';
    return 'from-gray-400 to-gray-600';
  };

  const getBadgeIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-3 h-3" />;
    if (rank === 2) return <Trophy className="w-3 h-3" />;
    if (rank === 3) return <Star className="w-3 h-3" />;
    return null;
  };

  return (
    <motion.div
      className={`relative inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${getBadgeColor(rank)} text-white text-sm font-medium ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center space-x-1">
        {getBadgeIcon(rank)}
        <span>#{rank}</span>
      </div>
      
      <div className="text-xs opacity-90">
        {score.toFixed(0)} pts
      </div>
      
      {rank <= 3 && (
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        >
          <Sparkles className="w-3 h-3 text-yellow-200" />
        </motion.div>
      )}
    </motion.div>
  );
};

// Floating action button for leaderboard access
export const LeaderboardFAB: React.FC<{
  onClick: () => void;
  className?: string;
}> = ({ onClick, className = '' }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        boxShadow: [
          '0 10px 25px rgba(139, 69, 255, 0.3)',
          '0 15px 35px rgba(139, 69, 255, 0.5)',
          '0 10px 25px rgba(139, 69, 255, 0.3)',
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
    >
      <div className="flex items-center justify-center">
        <LeaderboardIcon size={24} animated={true} />
      </div>
    </motion.button>
  );
};

// Progress ring component for user scores
export const ScoreProgressRing: React.FC<{
  score: number;
  maxScore: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}> = ({ score, maxScore, size = 60, strokeWidth = 4, className = '' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min((score / maxScore) * 100, 100);
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-gray-700">
          {score.toFixed(0)}
        </span>
      </div>
    </div>
  );
};