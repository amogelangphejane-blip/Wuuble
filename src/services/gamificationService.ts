import { supabase } from '@/integrations/supabase/client';
import { 
  UserPoints, 
  UserAchievement, 
  LeaderboardEntry, 
  GamificationStats,
  ActivityType,
  ACTIVITY_POINTS 
} from '@/types/gamification';

export class GamificationService {
  private static instance: GamificationService;

  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  /**
   * Get leaderboard for a community
   */
  async getLeaderboard(communityId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      const { data: pointsData, error } = await supabase
        .from('user_points')
        .select(`
          *,
          profiles:user_id (
            user_id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (!pointsData) return [];

      // Fetch achievements for all users
      const userIds = pointsData.map(p => p.user_id);
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('community_id', communityId)
        .in('user_id', userIds);

      // Transform to LeaderboardEntry format
      return pointsData.map((entry, index) => ({
        rank: index + 1,
        user: {
          id: entry.profiles?.user_id || entry.user_id,
          username: entry.profiles?.username || 'Unknown',
          full_name: entry.profiles?.full_name || 'Unknown User',
          avatar_url: entry.profiles?.avatar_url
        },
        points: entry.total_points || 0,
        level: entry.level || 1,
        badges: (achievementsData || []).filter(a => a.user_id === entry.user_id),
        stats: {
          posts: entry.posts_count || 0,
          comments: entry.comments_count || 0,
          likes_given: entry.likes_given_count || 0
        }
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user's stats and position
   */
  async getUserStats(communityId: string, userId: string): Promise<GamificationStats | null> {
    try {
      // Get user points
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        throw pointsError;
      }

      if (!pointsData) {
        // Initialize user if not found
        await this.initializeUser(communityId, userId);
        return {
          total_points: 0,
          level: 1,
          next_level_points: 100,
          progress_to_next_level: 0,
          rank: 0,
          total_members: 0,
          achievements_count: 0,
          recent_achievements: []
        };
      }

      // Calculate next level info
      const currentLevelPoints = (pointsData.level - 1) * 100;
      const nextLevelPoints = pointsData.level * 100;
      const progress = ((pointsData.total_points - currentLevelPoints) / 100) * 100;

      // Get user rank
      const { count } = await supabase
        .from('user_points')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .gt('total_points', pointsData.total_points);

      const rank = (count || 0) + 1;

      // Get total members
      const { count: totalMembers } = await supabase
        .from('user_points')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId);

      // Get achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(5);

      return {
        total_points: pointsData.total_points,
        level: pointsData.level,
        next_level_points: nextLevelPoints,
        progress_to_next_level: Math.min(progress, 100),
        rank,
        total_members: totalMembers || 0,
        achievements_count: achievementsData?.length || 0,
        recent_achievements: achievementsData || []
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(communityId: string, userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }

  /**
   * Award points for an activity
   */
  async awardPoints(
    communityId: string,
    userId: string,
    activityType: ActivityType,
    referenceId?: string
  ): Promise<void> {
    try {
      const points = ACTIVITY_POINTS[activityType] || 0;

      // Call the database function to update points
      const { error } = await supabase.rpc('update_user_points', {
        p_user_id: userId,
        p_community_id: communityId,
        p_points: points,
        p_activity_type: activityType,
        p_reference_id: referenceId || null
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(communityId: string, userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activity:', error);
      return [];
    }
  }

  /**
   * Initialize user in the gamification system
   */
  private async initializeUser(communityId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          community_id: communityId,
          total_points: 0,
          level: 1,
          posts_count: 0,
          comments_count: 0,
          likes_given_count: 0,
          likes_received_count: 0,
          streak_days: 0
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  }

  /**
   * Get leaderboard position for a specific user
   */
  async getUserPosition(communityId: string, userId: string): Promise<LeaderboardEntry | null> {
    try {
      const leaderboard = await this.getLeaderboard(communityId, 1000);
      return leaderboard.find(entry => entry.user.id === userId) || null;
    } catch (error) {
      console.error('Error getting user position:', error);
      return null;
    }
  }
}

export const gamificationService = GamificationService.getInstance();
