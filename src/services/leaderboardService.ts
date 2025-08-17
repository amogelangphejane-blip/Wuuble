import { supabase } from '@/integrations/supabase/client';
import { 
  UserScore, 
  UserScoreHistory, 
  UserActivity, 
  UserFeedback, 
  LeaderboardQuery,
  LeaderboardSettings,
  LeaderboardEntry,
  ActivityType,
  QualityMetrics,
  FeedbackType
} from '@/types/leaderboard';
import { aiLeaderboardService } from './aiLeaderboardService';

export class LeaderboardService {
  private static instance: LeaderboardService;

  public static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  /**
   * Get leaderboard for a community
   */
  async getLeaderboard(communityId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('community_user_scores')
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
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }

    // Transform to LeaderboardEntry format
    return data?.map(score => ({
      user: {
        id: score.profiles?.user_id || score.user_id,
        username: score.profiles?.username || 'Unknown',
        full_name: score.profiles?.full_name || 'Unknown User',
        avatar_url: score.profiles?.avatar_url
      },
      rank: score.rank,
      performance_score: score.performance_score,
      score_breakdown: {
        chat_score: score.chat_score,
        video_call_score: score.video_call_score,
        participation_score: score.participation_score,
        quality_multiplier: score.quality_multiplier
      },
      trend: 'stable', // TODO: Calculate from history
      rank_change: 0, // TODO: Calculate from history
      badges: [], // TODO: Implement badge system
      recent_activities: [] // TODO: Fetch recent activities
    })) || [];
  }

  /**
   * Get user's position in leaderboard
   */
  async getUserPosition(communityId: string, userId: string): Promise<LeaderboardEntry | null> {
    const { data, error } = await supabase
      .from('community_user_scores')
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
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching user position:', error);
      return null;
    }

    return {
      user: {
        id: data.profiles?.user_id || data.user_id,
        username: data.profiles?.username || 'Unknown',
        full_name: data.profiles?.full_name || 'Unknown User',
        avatar_url: data.profiles?.avatar_url
      },
      rank: data.rank,
      performance_score: data.performance_score,
      score_breakdown: {
        chat_score: data.chat_score,
        video_call_score: data.video_call_score,
        participation_score: data.participation_score,
        quality_multiplier: data.quality_multiplier
      },
      trend: 'stable',
      rank_change: 0,
      badges: [],
      recent_activities: []
    };
  }

  /**
   * Record a user activity and analyze it with AI
   */
  async recordActivity(
    communityId: string,
    userId: string,
    activityType: ActivityType,
    activityData: Record<string, any>,
    content?: string
  ): Promise<UserActivity> {
    let qualityMetrics: QualityMetrics = {};
    let impactScore = 1;

    // Analyze content with AI if provided
    if (content) {
      try {
        const analysis = await aiLeaderboardService.analyzeChatMessage({
          message: content,
          context: {
            previous_messages: [],
            topic: '',
            community_id: communityId
          }
        });
        qualityMetrics = analysis.quality_metrics;
        impactScore = analysis.impact_score;
      } catch (error) {
        console.error('Error analyzing content:', error);
      }
    } else if (activityType === 'video_call_joined' && activityData.speaking_time_minutes !== undefined) {
      // Analyze video call participation
      qualityMetrics = await aiLeaderboardService.analyzeVideoCallParticipation({
        speaking_time_minutes: activityData.speaking_time_minutes,
        camera_enabled: activityData.camera_enabled || false,
        reactions_received: activityData.reactions_received || 0,
        audio_transcript: activityData.audio_transcript
      });
      impactScore = aiLeaderboardService.calculateImpactScore(
        { activity_type: activityType },
        qualityMetrics
      );
    }

    // Insert activity record
    const { data, error } = await supabase
      .from('community_user_activities')
      .insert({
        community_id: communityId,
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData,
        quality_metrics: qualityMetrics,
        impact_score: impactScore
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording activity:', error);
      throw error;
    }

    // Update user scores asynchronously
    this.updateUserScores(communityId, userId).catch(console.error);

    return data;
  }

  /**
   * Update user scores and rankings for a community
   */
  async updateUserScores(communityId: string, userId?: string): Promise<void> {
    try {
      if (userId) {
        // Update specific user
        await supabase.rpc('update_community_rankings', { 
          p_community_id: communityId 
        });
      } else {
        // Update all users in community
        await supabase.rpc('update_community_rankings', { 
          p_community_id: communityId 
        });
      }
    } catch (error) {
      console.error('Error updating user scores:', error);
      throw error;
    }
  }

  /**
   * Get user's score history for trend analysis
   */
  async getUserScoreHistory(
    communityId: string, 
    userId: string, 
    periodType: 'daily' | 'weekly' | 'monthly' = 'weekly',
    limit: number = 30
  ): Promise<UserScoreHistory[]> {
    const { data, error } = await supabase
      .from('community_user_score_history')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching score history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Generate and store AI feedback for a user
   */
  async generateUserFeedback(communityId: string, userId: string): Promise<UserFeedback | null> {
    try {
      // Get user's current performance data
      const userScore = await this.getUserScore(communityId, userId);
      if (!userScore) return null;

      // Get recent activities
      const recentActivities = await this.getUserRecentActivities(communityId, userId, 10);

      // Generate feedback using AI
      const feedbackResponse = await aiLeaderboardService.generateFeedback({
        community_id: communityId,
        user_id: userId,
        performance_data: userScore,
        recent_activities: recentActivities
      });

      // Store feedback in database
      const { data, error } = await supabase
        .from('community_user_feedback')
        .insert({
          community_id: communityId,
          user_id: userId,
          feedback_type: feedbackResponse.feedback.feedback_type,
          message: feedbackResponse.feedback.message,
          suggested_actions: feedbackResponse.feedback.suggested_actions,
          priority_level: feedbackResponse.feedback.priority_level
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing feedback:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error generating user feedback:', error);
      return null;
    }
  }

  /**
   * Get user's unread feedback
   */
  async getUserFeedback(communityId: string, userId: string, includeRead: boolean = false): Promise<UserFeedback[]> {
    let query = supabase
      .from('community_user_feedback')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false });

    if (!includeRead) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user feedback:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mark feedback as read
   */
  async markFeedbackAsRead(feedbackId: string): Promise<void> {
    const { error } = await supabase
      .from('community_user_feedback')
      .update({ is_read: true })
      .eq('id', feedbackId);

    if (error) {
      console.error('Error marking feedback as read:', error);
      throw error;
    }
  }

  /**
   * Dismiss feedback
   */
  async dismissFeedback(feedbackId: string): Promise<void> {
    const { error } = await supabase
      .from('community_user_feedback')
      .update({ is_dismissed: true })
      .eq('id', feedbackId);

    if (error) {
      console.error('Error dismissing feedback:', error);
      throw error;
    }
  }

  /**
   * Process user query using AI
   */
  async processUserQuery(communityId: string, userId: string, query: string): Promise<LeaderboardQuery> {
    try {
      // Get user context
      const userScore = await this.getUserScore(communityId, userId);
      const recentActivities = await this.getUserRecentActivities(communityId, userId, 5);

      // Process query with AI
      const response = await aiLeaderboardService.processLeaderboardQuery({
        community_id: communityId,
        user_id: userId,
        query,
        context: {
          user_score: userScore!,
          recent_activities: recentActivities,
          leaderboard_position: userScore?.rank || 0
        }
      });

      // Store query and response
      const { data, error } = await supabase
        .from('community_leaderboard_queries')
        .insert({
          community_id: communityId,
          user_id: userId,
          query_text: query,
          query_intent: response.intent,
          ai_response: response.response,
          response_data: {
            suggested_actions: response.suggested_actions,
            follow_up_questions: response.follow_up_questions,
            confidence: response.confidence
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing query:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error processing user query:', error);
      throw error;
    }
  }

  /**
   * Get user's query history
   */
  async getUserQueryHistory(communityId: string, userId: string, limit: number = 20): Promise<LeaderboardQuery[]> {
    const { data, error } = await supabase
      .from('community_leaderboard_queries')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching query history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Rate AI response
   */
  async rateResponse(queryId: string, rating: number): Promise<void> {
    const { error } = await supabase
      .from('community_leaderboard_queries')
      .update({ satisfaction_rating: rating })
      .eq('id', queryId);

    if (error) {
      console.error('Error rating response:', error);
      throw error;
    }
  }

  /**
   * Get or create leaderboard settings for a community
   */
  async getLeaderboardSettings(communityId: string): Promise<LeaderboardSettings> {
    let { data, error } = await supabase
      .from('community_leaderboard_settings')
      .select('*')
      .eq('community_id', communityId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Settings don't exist, create default ones
      const defaultSettings = {
        community_id: communityId,
        scoring_weights: {
          chat_weight: 0.3,
          video_call_weight: 0.25,
          participation_weight: 0.25,
          quality_weight: 0.2
        },
        ranking_algorithm: 'weighted_score' as const,
        update_frequency: 'hourly' as const,
        is_public: true,
        show_detailed_metrics: false,
        enable_ai_feedback: true,
        enable_ask_function: true
      };

      const { data: newData, error: insertError } = await supabase
        .from('community_leaderboard_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default settings:', insertError);
        throw insertError;
      }

      data = newData;
    } else if (error) {
      console.error('Error fetching leaderboard settings:', error);
      throw error;
    }

    return data!;
  }

  /**
   * Update leaderboard settings
   */
  async updateLeaderboardSettings(communityId: string, settings: Partial<LeaderboardSettings>): Promise<LeaderboardSettings> {
    const { data, error } = await supabase
      .from('community_leaderboard_settings')
      .update(settings)
      .eq('community_id', communityId)
      .select()
      .single();

    if (error) {
      console.error('Error updating leaderboard settings:', error);
      throw error;
    }

    return data;
  }

  // Private helper methods

  private async getUserScore(communityId: string, userId: string): Promise<UserScore | null> {
    const { data, error } = await supabase
      .from('community_user_scores')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user score:', error);
      return null;
    }

    return data;
  }

  private async getUserRecentActivities(communityId: string, userId: string, limit: number): Promise<UserActivity[]> {
    const { data, error } = await supabase
      .from('community_user_activities')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Initialize leaderboard for new community members
   */
  async initializeUserScore(communityId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('community_user_scores')
        .insert({
          community_id: communityId,
          user_id: userId,
          performance_score: 0,
          rank: null,
          chat_score: 0,
          video_call_score: 0,
          participation_score: 0,
          quality_multiplier: 1.0,
          sentiment_score: 0,
          helpfulness_score: 0,
          consistency_score: 0,
          leadership_score: 0
        });
    } catch (error) {
      console.error('Error initializing user score:', error);
      // Don't throw - this might be called multiple times
    }
  }

  /**
   * Batch update rankings for entire community (called periodically)
   */
  async batchUpdateCommunityRankings(communityId: string): Promise<void> {
    try {
      await supabase.rpc('update_community_rankings', { 
        p_community_id: communityId 
      });

      console.log(`Updated rankings for community ${communityId}`);
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard statistics for community
   */
  async getLeaderboardStats(communityId: string): Promise<{
    total_members: number;
    active_members: number;
    avg_score: number;
    top_performer: LeaderboardEntry | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('community_user_scores')
        .select(`
          *,
          profiles:user_id (
            user_id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId);

      if (error) throw error;

      const total_members = data?.length || 0;
      const active_members = data?.filter(score => score.performance_score > 0).length || 0;
      const avg_score = total_members > 0 
        ? data!.reduce((sum, score) => sum + score.performance_score, 0) / total_members 
        : 0;

      const topPerformer = data && data.length > 0 
        ? data.reduce((top, current) => 
            current.performance_score > top.performance_score ? current : top
          )
        : null;

      const top_performer = topPerformer ? {
        user: {
          id: topPerformer.profiles?.user_id || topPerformer.user_id,
          username: topPerformer.profiles?.username || 'Unknown',
          full_name: topPerformer.profiles?.full_name || 'Unknown User',
          avatar_url: topPerformer.profiles?.avatar_url
        },
        rank: topPerformer.rank,
        performance_score: topPerformer.performance_score,
        score_breakdown: {
          chat_score: topPerformer.chat_score,
          video_call_score: topPerformer.video_call_score,
          participation_score: topPerformer.participation_score,
          quality_multiplier: topPerformer.quality_multiplier
        },
        trend: 'stable' as const,
        rank_change: 0,
        badges: [],
        recent_activities: []
      } : null;

      return {
        total_members,
        active_members,
        avg_score,
        top_performer
      };
    } catch (error) {
      console.error('Error fetching leaderboard stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const leaderboardService = LeaderboardService.getInstance();