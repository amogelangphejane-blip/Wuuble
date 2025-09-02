import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Achievement, UserAchievement } from '@/hooks/useAchievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  userAchievement,
  progress = 0,
  size = 'md',
  showProgress = false,
  className
}) => {
  const isUnlocked = !!userAchievement;
  
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl'
  };

  const badgeContent = (
    <div className={cn(
      "relative flex flex-col items-center p-2",
      className
    )}>
      <div
        className={cn(
          "rounded-full border-2 flex items-center justify-center transition-all duration-300",
          sizeClasses[size],
          isUnlocked 
            ? `border-${achievement.badge_color}-500 bg-${achievement.badge_color}-100 dark:bg-${achievement.badge_color}-900 shadow-lg` 
            : "border-gray-300 bg-gray-100 dark:bg-gray-800 grayscale opacity-60"
        )}
        style={{
          borderColor: isUnlocked ? achievement.badge_color : undefined,
          backgroundColor: isUnlocked ? `${achievement.badge_color}20` : undefined
        }}
      >
        <span className={cn(
          "filter",
          !isUnlocked && "grayscale opacity-50"
        )}>
          {achievement.icon}
        </span>
        
        {isUnlocked && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-center">
        <p className={cn(
          "text-xs font-medium truncate max-w-20",
          isUnlocked ? "text-gray-900 dark:text-white" : "text-gray-500"
        )}>
          {achievement.name}
        </p>
        
        {showProgress && !isUnlocked && progress > 0 && (
          <div className="mt-1 w-full">
            <Progress value={progress} className="h-1" />
            <p className="text-xs text-gray-400 mt-1">
              {Math.round(progress)}%
            </p>
          </div>
        )}
        
        {isUnlocked && userAchievement && (
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(userAchievement.unlocked_at), { addSuffix: true })}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badgeContent}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="text-center">
          <p className="font-semibold">{achievement.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {achievement.description}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {achievement.points} points
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {achievement.category}
            </Badge>
          </div>
          
          {!isUnlocked && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {achievement.requirement_type === 'count' && 
                  `Complete ${achievement.requirement_value} ${achievement.requirement_metric.replace('_', ' ')}`
                }
                {achievement.requirement_type === 'streak' && 
                  `Maintain a ${achievement.requirement_value} day streak`
                }
                {achievement.requirement_type === 'threshold' && 
                  `Reach ${achievement.requirement_value} ${achievement.requirement_metric.replace('_', ' ')}`
                }
              </p>
              {showProgress && progress > 0 && (
                <Progress value={progress} className="h-2 mt-2" />
              )}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default AchievementBadge;