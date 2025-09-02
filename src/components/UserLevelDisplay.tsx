import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/hooks/useAchievements';

interface UserLevelDisplayProps {
  variant?: 'compact' | 'full' | 'minimal';
  showProgress?: boolean;
  className?: string;
}

const UserLevelDisplay: React.FC<UserLevelDisplayProps> = ({
  variant = 'full',
  showProgress = true,
  className
}) => {
  const { userStats, calculateLevel, getPointsForNextLevel } = useAchievements();

  if (!userStats) return null;

  const currentLevel = userStats.level;
  const currentPoints = userStats.total_points;
  const pointsForCurrentLevel = ((currentLevel - 1) * (currentLevel - 1)) * 100;
  const pointsForNextLevel = getPointsForNextLevel(currentLevel);
  const progressToNextLevel = ((currentPoints - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100;

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'from-purple-500 to-pink-500';
    if (level >= 25) return 'from-blue-500 to-purple-500';
    if (level >= 10) return 'from-green-500 to-blue-500';
    if (level >= 5) return 'from-yellow-500 to-green-500';
    return 'from-gray-500 to-gray-600';
  };

  const getLevelTitle = (level: number) => {
    if (level >= 50) return 'Legendary';
    if (level >= 25) return 'Master';
    if (level >= 10) return 'Expert';
    if (level >= 5) return 'Advanced';
    return 'Beginner';
  };

  const getLevelIcon = (level: number) => {
    if (level >= 50) return '👑';
    if (level >= 25) return '🏆';
    if (level >= 10) return '🥇';
    if (level >= 5) return '🥈';
    return '🥉';
  };

  if (variant === 'minimal') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "bg-gradient-to-r text-white border-0",
              getLevelColor(currentLevel),
              className
            )}
          >
            <span className="mr-1">{getLevelIcon(currentLevel)}</span>
            Level {currentLevel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getLevelTitle(currentLevel)} - {currentPoints} points</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className={cn(
          "w-10 h-10 rounded-full bg-gradient-to-r flex items-center justify-center text-white font-bold",
          getLevelColor(currentLevel)
        )}>
          {currentLevel}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">{getLevelTitle(currentLevel)}</span>
            <Badge variant="secondary" className="text-xs">
              {currentPoints} pts
            </Badge>
          </div>
          {showProgress && (
            <div className="space-y-1">
              <Progress value={progressToNextLevel} className="h-2" />
              <p className="text-xs text-gray-500">
                {pointsForNextLevel - currentPoints} points to level {currentLevel + 1}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border", className)}>
      <div className="flex items-center gap-4 mb-4">
        <div className={cn(
          "w-16 h-16 rounded-full bg-gradient-to-r flex items-center justify-center text-white text-2xl font-bold shadow-lg",
          getLevelColor(currentLevel)
        )}>
          {currentLevel}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {getLevelTitle(currentLevel)}
            </h3>
            <span className="text-2xl">{getLevelIcon(currentLevel)}</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>{currentPoints} points</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>{userStats.achievements_unlocked} achievements</span>
            </div>
            {userStats.current_streak > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>{userStats.current_streak} day streak</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Progress to Level {currentLevel + 1}
            </span>
            <span className="font-medium">
              {pointsForNextLevel - currentPoints} points needed
            </span>
          </div>
          <Progress value={progressToNextLevel} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{pointsForCurrentLevel} pts</span>
            <span>{pointsForNextLevel} pts</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLevelDisplay;