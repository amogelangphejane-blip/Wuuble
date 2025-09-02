import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'social' | 'creator' | 'engagement' | 'milestone' | 'special';
  points: number;
  requirement_type: 'count' | 'streak' | 'unique' | 'threshold';
  requirement_value: number;
  requirement_metric: string;
  badge_color: string;
  is_hidden: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress?: number;
  achievement?: Achievement;
}

export interface UserStats {
  total_points: number;
  level: number;
  achievements_unlocked: number;
  current_streak: number;
  communities_joined: number;
  posts_created: number;
  video_calls_completed: number;
  messages_sent: number;
  events_attended: number;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { createNotification } = useNotifications();

  // Calculate user level based on points
  const calculateLevel = useCallback((points: number): number => {
    // Level formula: sqrt(points / 100)
    return Math.floor(Math.sqrt(points / 100)) + 1;
  }, []);

  // Calculate points needed for next level
  const getPointsForNextLevel = useCallback((currentLevel: number): number => {
    return (currentLevel * currentLevel) * 100;
  }, []);

  // Fetch all achievements
  const fetchAchievements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  }, []);

  // Fetch user achievements
  const fetchUserAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setUserAchievements(data || []);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  }, [user]);

  // Fetch user stats
  const fetchUserStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUserStats({
          ...data,
          level: calculateLevel(data.total_points)
        });
      } else {
        // Create initial stats
        const initialStats = {
          user_id: user.id,
          total_points: 0,
          achievements_unlocked: 0,
          current_streak: 0,
          communities_joined: 0,
          posts_created: 0,
          video_calls_completed: 0,
          messages_sent: 0,
          events_attended: 0
        };

        const { data: newStats, error: createError } = await supabase
          .from('user_stats')
          .insert(initialStats)
          .select()
          .single();

        if (createError) throw createError;

        setUserStats({
          ...newStats,
          level: calculateLevel(newStats.total_points)
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [user, calculateLevel]);

  // Update user stat
  const updateUserStat = useCallback(async (metric: keyof UserStats, increment: number = 1) => {
    if (!user || !userStats) return;

    try {
      const newValue = (userStats[metric] as number) + increment;
      
      const { error } = await supabase
        .from('user_stats')
        .update({ [metric]: newValue })
        .eq('user_id', user.id);

      if (error) throw error;

      setUserStats(prev => prev ? {
        ...prev,
        [metric]: newValue,
        level: metric === 'total_points' ? calculateLevel(newValue) : prev.level
      } : null);

      // Check for new achievements
      await checkAchievements();
    } catch (error) {
      console.error('Error updating user stat:', error);
    }
  }, [user, userStats, calculateLevel]);

  // Check if user has unlocked any new achievements
  const checkAchievements = useCallback(async () => {
    if (!user || !userStats) return;

    const unlockedAchievementIds = userAchievements.map(ua => ua.achievement_id);
    const availableAchievements = achievements.filter(a => !unlockedAchievementIds.includes(a.id));

    for (const achievement of availableAchievements) {
      const metricValue = userStats[achievement.requirement_metric as keyof UserStats] as number || 0;
      let unlocked = false;

      switch (achievement.requirement_type) {
        case 'count':
        case 'threshold':
          unlocked = metricValue >= achievement.requirement_value;
          break;
        case 'streak':
          unlocked = userStats.current_streak >= achievement.requirement_value;
          break;
        case 'unique':
          // For unique achievements, check specific conditions
          unlocked = metricValue >= achievement.requirement_value;
          break;
      }

      if (unlocked) {
        await unlockAchievement(achievement);
      }
    }
  }, [user, userStats, achievements, userAchievements]);

  // Unlock achievement
  const unlockAchievement = useCallback(async (achievement: Achievement) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        })
        .select(`
          *,
          achievement:achievements(*)
        `)
        .single();

      if (error) throw error;

      // Update local state
      setUserAchievements(prev => [data, ...prev]);
      
      // Update user points
      await updateUserStat('total_points', achievement.points);
      await updateUserStat('achievements_unlocked', 1);

      // Create notification
      await createNotification({
        title: '🏆 Achievement Unlocked!',
        message: `You've earned "${achievement.name}" and gained ${achievement.points} points!`,
        type: 'success',
        action_url: '/profile',
        metadata: { achievement_id: achievement.id }
      });

      return data;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }, [user, updateUserStat, createNotification]);

  // Track user action for achievements
  const trackAction = useCallback(async (action: string, metadata?: Record<string, any>) => {
    const actionMap: Record<string, keyof UserStats> = {
      'community_joined': 'communities_joined',
      'post_created': 'posts_created',
      'video_call_completed': 'video_calls_completed',
      'message_sent': 'messages_sent',
      'event_attended': 'events_attended'
    };

    const statKey = actionMap[action];
    if (statKey) {
      await updateUserStat(statKey);
    }

    // Track streak for daily actions
    if (['post_created', 'message_sent', 'video_call_completed'].includes(action)) {
      await updateDailyStreak();
    }
  }, [updateUserStat]);

  // Update daily streak
  const updateDailyStreak = useCallback(async () => {
    if (!user || !userStats) return;

    const today = new Date().toDateString();
    const lastActivity = localStorage.getItem(`last_activity_${user.id}`);
    
    if (lastActivity !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      const newStreak = lastActivity === yesterday ? userStats.current_streak + 1 : 1;
      
      await updateUserStat('current_streak', newStreak - userStats.current_streak);
      localStorage.setItem(`last_activity_${user.id}`, today);
    }
  }, [user, userStats, updateUserStat]);

  // Get achievement progress
  const getAchievementProgress = useCallback((achievement: Achievement): number => {
    if (!userStats) return 0;

    const metricValue = userStats[achievement.requirement_metric as keyof UserStats] as number || 0;
    return Math.min(100, (metricValue / achievement.requirement_value) * 100);
  }, [userStats]);

  // Initialize
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchAchievements(),
        fetchUserAchievements(),
        fetchUserStats()
      ]).finally(() => setLoading(false));
    }
  }, [user, fetchAchievements, fetchUserAchievements, fetchUserStats]);

  return {
    achievements,
    userAchievements,
    userStats,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    trackAction,
    updateUserStat,
    getAchievementProgress,
    requestNotificationPermission,
    calculateLevel,
    getPointsForNextLevel
  };
};