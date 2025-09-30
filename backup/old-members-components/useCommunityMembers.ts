import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import {
  EnhancedMemberProfile,
  MemberFilter,
  MemberSort,
  MemberStatistics,
  MemberPagination,
  MemberRealtimeEvent,
  MemberPresence,
  UseMembersReturn,
  UseRealtimeMembersReturn,
  CommunityMemberProfile,
  MemberActivity,
  MemberBadge,
  MemberBulkAction
} from '@/types/community-members';

// Default filter state
const DEFAULT_FILTERS: MemberFilter = {
  search: '',
  role: 'all',
  status: 'all',
  engagement: 'all',
  online_status: 'all',
  joined_period: 'all',
  activity_score_min: 0,
  activity_score_max: 100,
  badges: [],
  tags: [],
  has_custom_avatar: null,
  min_points: 0,
  max_points: 999999,
};

// Default sort state
const DEFAULT_SORT: MemberSort = {
  field: 'activity_score',
  direction: 'desc',
};

// Main hook for community members
export const useCommunityMembers = (communityId: string): UseMembersReturn => {
  const [members, setMembers] = useState<EnhancedMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<MemberStatistics>({} as MemberStatistics);
  const [filters, setFiltersState] = useState<MemberFilter>(DEFAULT_FILTERS);
  const [sort, setSortState] = useState<MemberSort>(DEFAULT_SORT);
  const [pagination, setPagination] = useState<MemberPagination>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false,
  });
  
  const { toast } = useToast();

  // Fetch members with filters and pagination
  const fetchMembers = useCallback(async (
    currentFilters = filters,
    currentSort = sort,
    page = pagination.page
  ) => {
    if (!communityId) return;

    try {
      setLoading(true);
      setError(null);

      // Build the query
      let query = supabase
        .from('member_profiles')
        .select(`
          *,
          member_badge_assignments (
            id,
            awarded_at,
            progress,
            member_badges (
              id,
              name,
              description,
              icon,
              color,
              badge_type,
              rarity
            )
          ),
          member_activities (
            id,
            activity_type,
            occurred_at,
            points_earned
          )
        `, { count: 'exact' })
        .eq('community_id', communityId)
        .eq('status', 'active');

      // Apply filters
      if (currentFilters.search) {
        query = query.or(`display_name.ilike.%${currentFilters.search}%,bio.ilike.%${currentFilters.search}%`);
      }

      if (currentFilters.role !== 'all') {
        query = query.eq('role', currentFilters.role);
      }

      if (currentFilters.engagement !== 'all') {
        query = query.eq('engagement_level', currentFilters.engagement);
      }

      if (currentFilters.online_status !== 'all') {
        switch (currentFilters.online_status) {
          case 'online':
            query = query.eq('is_online', true);
            break;
          case 'recently_active':
            query = query
              .eq('is_online', false)
              .gte('last_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
            break;
          case 'offline':
            query = query
              .eq('is_online', false)
              .lt('last_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
            break;
        }
      }

      // Date filters
      if (currentFilters.joined_period !== 'all') {
        const now = new Date();
        let fromDate: Date;
        
        switch (currentFilters.joined_period) {
          case 'today':
            fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            fromDate = new Date(0);
        }
        
        query = query.gte('joined_at', fromDate.toISOString());
      }

      // Activity score range
      query = query
        .gte('activity_score', currentFilters.activity_score_min)
        .lte('activity_score', currentFilters.activity_score_max);

      // Points range
      query = query
        .gte('total_points', currentFilters.min_points)
        .lte('total_points', currentFilters.max_points);

      // Tags filter
      if (currentFilters.tags.length > 0) {
        query = query.overlaps('tags', currentFilters.tags);
      }

      // Avatar filter
      if (currentFilters.has_custom_avatar === true) {
        query = query.not('avatar_url', 'is', null);
      } else if (currentFilters.has_custom_avatar === false) {
        query = query.is('avatar_url', null);
      }

      // Apply sorting
      const sortColumn = currentSort.field === 'display_name' ? 'display_name' : currentSort.field;
      query = query.order(sortColumn, { ascending: currentSort.direction === 'asc' });

      // Apply pagination
      const from = (page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);

      // Execute query
      const { data: rawMembers, error: queryError, count } = await query;

      console.log('🔍 Member Query Debug:', {
        communityId,
        rawMembers,
        count,
        error: queryError,
        filters: currentFilters,
        sort: currentSort
      });

      if (queryError) {
        console.error('❌ Query Error:', queryError);
        throw queryError;
      }

      // Transform data to enhanced members
      const enhancedMembers: EnhancedMemberProfile[] = (rawMembers || []).map(member => ({
        ...member,
        is_recently_active: member.is_online || 
          new Date(member.last_seen_at).getTime() > Date.now() - 24 * 60 * 60 * 1000,
        days_since_joined: Math.floor(
          (Date.now() - new Date(member.joined_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
        engagement_percentage: Math.min(100, (member.activity_score / 100) * 100),
        badges: (member.member_badge_assignments || [])
          .map((assignment: any) => assignment.member_badges)
          .filter(Boolean),
        recent_activities: (member.member_activities || [])
          .sort((a: any, b: any) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
          .slice(0, 10),
        relationships: [],
        can_message: true,
        can_promote: false,
        can_demote: false,
        can_remove: false,
        can_award_badge: false,
      }));

      // Update state
      setMembers(enhancedMembers);
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / prev.limit),
        has_next: (count || 0) > page * prev.limit,
        has_previous: page > 1,
      }));

      // Fetch statistics
      await fetchStatistics();

    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
      toast({
        title: "Error",
        description: "Failed to load community members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [communityId, filters, sort, pagination.page, pagination.limit, toast]);

  // Fetch community statistics
  const fetchStatistics = useCallback(async () => {
    if (!communityId) return;

    try {
      // Get basic counts
      const { data: basicStats } = await supabase
        .from('member_profiles')
        .select('role, is_online, joined_at, activity_score, current_streak', { count: 'exact' })
        .eq('community_id', communityId)
        .eq('status', 'active');

      if (!basicStats) return;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      const stats: MemberStatistics = {
        total_members: basicStats.length,
        active_members: basicStats.filter(m => 
          new Date(m.joined_at) < weekAgo && m.activity_score > 20
        ).length,
        online_members: basicStats.filter(m => m.is_online).length,
        
        new_today: basicStats.filter(m => new Date(m.joined_at) >= today).length,
        new_this_week: basicStats.filter(m => new Date(m.joined_at) >= weekAgo).length,
        new_this_month: basicStats.filter(m => new Date(m.joined_at) >= monthAgo).length,
        growth_rate: 0, // TODO: Calculate growth rate
        
        avg_activity_score: basicStats.reduce((sum, m) => sum + m.activity_score, 0) / basicStats.length,
        high_engagement_count: basicStats.filter(m => m.activity_score >= 80).length,
        medium_engagement_count: basicStats.filter(m => m.activity_score >= 50 && m.activity_score < 80).length,
        low_engagement_count: basicStats.filter(m => m.activity_score < 50).length,
        
        creators_count: basicStats.filter(m => m.role === 'creator').length,
        moderators_count: basicStats.filter(m => m.role === 'moderator').length,
        members_count: basicStats.filter(m => m.role === 'member').length,
        
        activities_today: 0, // TODO: Fetch from activities table
        activities_this_week: 0,
        total_activities: 0,
        
        total_badges_available: 0, // TODO: Fetch from badges table
        total_badges_awarded: 0,
        badges_awarded_today: 0,
        
        avg_streak: basicStats.reduce((sum, m) => sum + m.current_streak, 0) / basicStats.length,
        longest_streak: Math.max(...basicStats.map(m => m.current_streak), 0),
        members_with_streaks: basicStats.filter(m => m.current_streak > 0).length,
      };

      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, [communityId]);

  // Actions
  const setFilters = useCallback((newFilters: Partial<MemberFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFiltersState(updatedFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters]);

  const setSort = useCallback((newSort: MemberSort) => {
    setSortState(newSort);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchMembers();
  }, [fetchMembers]);

  const updateMember = useCallback(async (
    memberId: string, 
    updates: Partial<CommunityMemberProfile>
  ) => {
    try {
      const { error } = await supabase
        .from('member_profiles')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;

      // Optimistically update local state
      setMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, ...updates } 
            : member
        )
      );

      toast({
        title: "Success",
        description: "Member updated successfully",
      });
    } catch (err) {
      console.error('Error updating member:', err);
      toast({
        title: "Error",
        description: "Failed to update member",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const removeMember = useCallback(async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('member_profiles')
        .update({ status: 'inactive' })
        .eq('id', memberId);

      if (error) throw error;

      // Remove from local state
      setMembers(prev => prev.filter(member => member.id !== memberId));

      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    } catch (err) {
      console.error('Error removing member:', err);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const inviteMember = useCallback(async (invitation: any) => {
    try {
      const inviteCode = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);

      const { error } = await supabase
        .from('member_invitations')
        .insert({
          ...invitation,
          invite_code: inviteCode,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
    } catch (err) {
      console.error('Error sending invitation:', err);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const awardBadge = useCallback(async (memberId: string, badgeId: string) => {
    try {
      const { error } = await supabase
        .from('member_badge_assignments')
        .insert({
          member_id: memberId,
          badge_id: badgeId,
        });

      if (error) throw error;

      await refresh();

      toast({
        title: "Success",
        description: "Badge awarded successfully",
      });
    } catch (err) {
      console.error('Error awarding badge:', err);
      toast({
        title: "Error",
        description: "Failed to award badge",
        variant: "destructive",
      });
      throw err;
    }
  }, [refresh, toast]);

  const bulkAction = useCallback(async (action: MemberBulkAction) => {
    try {
      // TODO: Implement bulk actions based on action type
      console.log('Bulk action:', action);
      
      toast({
        title: "Success",
        description: `Bulk action completed for ${action.member_ids.length} members`,
      });
    } catch (err) {
      console.error('Error performing bulk action:', err);
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Effects
  useEffect(() => {
    if (communityId) {
      fetchMembers();
    }
  }, [fetchMembers, communityId]);

  return {
    members,
    loading,
    error,
    statistics,
    filters,
    sort,
    pagination,
    
    setFilters,
    setSort,
    setPage,
    refresh,
    
    updateMember,
    removeMember,
    inviteMember,
    awardBadge,
    bulkAction,
  };
};

// Real-time members hook
export const useRealtimeMembers = (communityId: string): UseRealtimeMembersReturn => {
  const [members, setMembers] = useState<EnhancedMemberProfile[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const eventSubscribersRef = useRef<Set<(event: MemberRealtimeEvent) => void>>(new Set());
  
  const { toast } = useToast();

  // Initialize real-time connection
  useEffect(() => {
    if (!communityId) return;

    const initializeRealtime = async () => {
      try {
        setLoading(true);
        setConnected(false);

        // Subscribe to member profile changes
        channelRef.current = supabase
          .channel(`member_profiles:community_id=eq.${communityId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'member_profiles',
              filter: `community_id=eq.${communityId}`,
            },
            (payload) => {
              const event: MemberRealtimeEvent = {
                type: payload.eventType === 'INSERT' ? 'member_joined' : 
                      payload.eventType === 'DELETE' ? 'member_left' : 'member_updated',
                member_id: payload.new?.id || payload.old?.id,
                community_id: communityId,
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
              };

              // Notify subscribers
              eventSubscribersRef.current.forEach(callback => callback(event));

              // Update local state
              if (payload.eventType === 'INSERT') {
                // Add new member
                const newMember = transformToEnhancedMember(payload.new);
                setMembers(prev => [...prev, newMember]);
              } else if (payload.eventType === 'UPDATE') {
                // Update existing member
                setMembers(prev => 
                  prev.map(member => 
                    member.id === payload.new.id 
                      ? { ...member, ...payload.new }
                      : member
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                // Remove member
                setMembers(prev => prev.filter(member => member.id !== payload.old.id));
              }
            }
          )
          .subscribe((status) => {
            setConnected(status === 'SUBSCRIBED');
          });

        // Subscribe to presence changes
        presenceChannelRef.current = supabase
          .channel(`presence:community:${communityId}`)
          .on('presence', { event: 'sync' }, () => {
            const presenceState = presenceChannelRef.current?.presenceState();
            const onlineUserIds = Object.keys(presenceState || {});
            
            setOnlineCount(onlineUserIds.length);
            
            // Update members online status
            setMembers(prev => 
              prev.map(member => ({
                ...member,
                is_online: onlineUserIds.includes(member.user_id),
                last_seen_at: onlineUserIds.includes(member.user_id) 
                  ? new Date().toISOString() 
                  : member.last_seen_at
              }))
            );

            // Emit presence event
            const event: MemberRealtimeEvent = {
              type: 'presence_changed',
              member_id: '',
              community_id: communityId,
              data: { online_count: onlineUserIds.length, online_users: onlineUserIds },
              timestamp: new Date().toISOString(),
            };
            
            eventSubscribersRef.current.forEach(callback => callback(event));
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            setOnlineCount(prev => prev + 1);
            
            // Update specific member
            setMembers(prev => 
              prev.map(member => 
                member.user_id === key 
                  ? { 
                      ...member, 
                      is_online: true, 
                      last_seen_at: new Date().toISOString() 
                    }
                  : member
              )
            );
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            setOnlineCount(prev => Math.max(0, prev - 1));
            
            // Update specific member
            setMembers(prev => 
              prev.map(member => 
                member.user_id === key 
                  ? { ...member, is_online: false }
                  : member
              )
            );
          })
          .subscribe();

        // Track current user presence
        const { data: { user } } = await supabase.auth.getUser();
        if (user && presenceChannelRef.current) {
          await presenceChannelRef.current.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }

      } catch (err) {
        console.error('Error initializing realtime:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize real-time connection');
      } finally {
        setLoading(false);
      }
    };

    initializeRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      setConnected(false);
    };
  }, [communityId]);

  // Helper to transform raw data to enhanced member
  const transformToEnhancedMember = (rawMember: any): EnhancedMemberProfile => {
    return {
      ...rawMember,
      is_recently_active: rawMember.is_online || 
        new Date(rawMember.last_seen_at).getTime() > Date.now() - 24 * 60 * 60 * 1000,
      days_since_joined: Math.floor(
        (Date.now() - new Date(rawMember.joined_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
      engagement_percentage: Math.min(100, (rawMember.activity_score / 100) * 100),
      badges: [],
      recent_activities: [],
      relationships: [],
      can_message: true,
      can_promote: false,
      can_demote: false,
      can_remove: false,
      can_award_badge: false,
    };
  };

  // Actions
  const updatePresence = useCallback(async (data: Partial<MemberPresence>) => {
    if (presenceChannelRef.current) {
      await presenceChannelRef.current.track({
        ...data,
        online_at: new Date().toISOString(),
      });
    }
  }, []);

  const trackActivity = useCallback(async (activity: Omit<MemberActivity, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('member_activities')
        .insert({
          ...activity,
          occurred_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Emit activity event
      const event: MemberRealtimeEvent = {
        type: 'activity_created',
        member_id: activity.member_id,
        community_id: activity.community_id,
        data: activity,
        timestamp: new Date().toISOString(),
      };
      
      eventSubscribersRef.current.forEach(callback => callback(event));

    } catch (err) {
      console.error('Error tracking activity:', err);
    }
  }, []);

  const subscribe = useCallback((callback: (event: MemberRealtimeEvent) => void) => {
    eventSubscribersRef.current.add(callback);
    
    return () => {
      eventSubscribersRef.current.delete(callback);
    };
  }, []);

  return {
    members,
    onlineCount,
    loading,
    error,
    connected,
    updatePresence,
    trackActivity,
    subscribe,
  };
};