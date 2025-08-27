/**
 * Cached database queries to reduce load and improve performance
 */

import { supabase } from '@/integrations/supabase/client';
import { cacheService, CacheKeys, CacheTTL } from './cacheService';

export class CachedQueries {
  /**
   * Get user profile with caching
   */
  static async getUserProfile(userId: string) {
    return cacheService.getOrSet(
      CacheKeys.userProfile(userId),
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error) throw error;
        return data;
      },
      CacheTTL.MEDIUM
    );
  }

  /**
   * Get user communities with caching
   */
  static async getUserCommunities(userId: string) {
    return cacheService.getOrSet(
      CacheKeys.userCommunities(userId),
      async () => {
        const { data, error } = await supabase
          .from('community_members')
          .select(`
            *,
            communities (
              id,
              name,
              description,
              avatar_url,
              member_count,
              is_private
            )
          `)
          .eq('user_id', userId);
        
        if (error) throw error;
        return data;
      },
      CacheTTL.MEDIUM
    );
  }

  /**
   * Get community details with caching
   */
  static async getCommunityDetails(communityId: string) {
    return cacheService.getOrSet(
      CacheKeys.communityDetails(communityId),
      async () => {
        const { data, error } = await supabase
          .from('communities')
          .select(`
            *,
            profiles!communities_creator_id_fkey (
              display_name,
              avatar_url
            )
          `)
          .eq('id', communityId)
          .single();
        
        if (error) throw error;
        return data;
      },
      CacheTTL.LONG
    );
  }

  /**
   * Get community members with caching
   */
  static async getCommunityMembers(communityId: string, limit: number = 50) {
    return cacheService.getOrSet(
      `${CacheKeys.communityMembers(communityId)}:${limit}`,
      async () => {
        const { data, error } = await supabase
          .from('community_members')
          .select(`
            *,
            profiles!community_members_user_id_fkey (
              display_name,
              avatar_url,
              bio
            )
          `)
          .eq('community_id', communityId)
          .order('joined_at', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        return data;
      },
      CacheTTL.SHORT
    );
  }

  /**
   * Get community posts with caching
   */
  static async getCommunityPosts(communityId: string, limit: number = 20) {
    return cacheService.getOrSet(
      `${CacheKeys.communityPosts(communityId)}:${limit}`,
      async () => {
        const { data, error } = await supabase
          .from('community_posts')
          .select(`
            *,
            profiles!community_posts_author_id_fkey (
              display_name,
              avatar_url
            )
          `)
          .eq('community_id', communityId)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        return data;
      },
      CacheTTL.SHORT
    );
  }

  /**
   * Get live streams with caching
   */
  static async getLiveStreams(limit: number = 20) {
    return cacheService.getOrSet(
      `${CacheKeys.liveStreams()}:${limit}`,
      async () => {
        const { data, error } = await supabase
          .from('live_streams')
          .select(`
            *,
            profiles!live_streams_creator_id_fkey (
              display_name,
              avatar_url
            ),
            communities!live_streams_community_id_fkey (
              name,
              avatar_url
            )
          `)
          .eq('status', 'live')
          .order('actual_start_time', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        return data;
      },
      CacheTTL.SHORT // Short TTL for live data
    );
  }

  /**
   * Get community events with caching
   */
  static async getCommunityEvents(communityId: string) {
    return cacheService.getOrSet(
      CacheKeys.communityEvents(communityId),
      async () => {
        const { data, error } = await supabase
          .from('community_events')
          .select(`
            *,
            profiles!community_events_creator_id_fkey (
              display_name,
              avatar_url
            )
          `)
          .eq('community_id', communityId)
          .gte('end_time', new Date().toISOString())
          .order('start_time', { ascending: true });
        
        if (error) throw error;
        return data;
      },
      CacheTTL.MEDIUM
    );
  }

  /**
   * Get leaderboard with caching
   */
  static async getLeaderboard(communityId: string, limit: number = 50) {
    return cacheService.getOrSet(
      `${CacheKeys.leaderboard(communityId)}:${limit}`,
      async () => {
        const { data, error } = await supabase
          .from('ai_leaderboard')
          .select(`
            *,
            profiles!ai_leaderboard_user_id_fkey (
              display_name,
              avatar_url
            )
          `)
          .eq('community_id', communityId)
          .order('total_score', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        return data;
      },
      CacheTTL.MEDIUM
    );
  }

  /**
   * Invalidate cache for specific patterns
   */
  static invalidateUserCache(userId: string) {
    cacheService.delete(CacheKeys.userProfile(userId));
    cacheService.delete(CacheKeys.userCommunities(userId));
  }

  static invalidateCommunityCache(communityId: string) {
    cacheService.delete(CacheKeys.communityDetails(communityId));
    cacheService.delete(CacheKeys.communityMembers(communityId));
    cacheService.delete(CacheKeys.communityPosts(communityId));
    cacheService.delete(CacheKeys.communityEvents(communityId));
    cacheService.delete(CacheKeys.leaderboard(communityId));
  }

  static invalidateLiveStreamsCache() {
    cacheService.delete(CacheKeys.liveStreams());
  }
}