import { supabase } from '@/integrations/supabase/client';
import { 
  CommunityMember, 
  MemberActivity, 
  MemberInvitation, 
  MemberBadge, 
  MemberBadgeAssignment,
  MemberStats,
  MemberFilter,
  EnhancedCommunityMember,
  MemberInviteRequest,
  BulkMemberAction,
  MemberEngagement
} from '@/types/members';

export class MemberService {
  // Fetch enhanced community members with all related data
  static async getEnhancedMembers(
    communityId: string, 
    filters?: Partial<MemberFilter>
  ): Promise<EnhancedCommunityMember[]> {
    let query = supabase
      .from('community_members')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          bio
        ),
        member_badge_assignments (
          id,
          awarded_at,
          member_badges (
            id,
            name,
            description,
            icon,
            color
          )
        )
      `)
      .eq('community_id', communityId);

    // Apply filters
    if (filters?.role && filters.role !== 'all') {
      query = query.eq('role', filters.role);
    }

    if (filters?.status) {
      switch (filters.status) {
        case 'online':
          query = query.eq('is_online', true);
          break;
        case 'recently_active': {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('last_active_at', oneDayAgo);
          break;
        }
      }
    }

    if (filters?.joined && filters.joined !== 'all') {
      const now = new Date();
      let dateThreshold: Date;
      
      switch (filters.joined) {
        case 'today':
          dateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateThreshold = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          dateThreshold = new Date(0);
      }
      
      query = query.gte('joined_at', dateThreshold.toISOString());
    }

    query = query.order('last_active_at', { ascending: false });

    const { data: members, error } = await query;

    if (error) {
      console.error('Error fetching enhanced members:', error);
      throw error;
    }

    // Enrich members with additional data
    const enrichedMembers = await Promise.all(
      (members || []).map(async (member) => {
        // Get recent activities
        const { data: activities } = await supabase
          .from('member_activities')
          .select('*')
          .eq('community_id', communityId)
          .eq('user_id', member.user_id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Calculate engagement metrics
        const engagement = await this.getMemberEngagement(communityId, member.user_id);
        
        // Calculate activity score (0-100)
        const activityScore = this.calculateActivityScore(member, engagement, activities || []);
        
        // Calculate days since joined
        const daysSinceJoined = Math.floor(
          (Date.now() - new Date(member.joined_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if recently active (within 24 hours)
        const isRecentlyActive = new Date(member.last_active_at).getTime() > 
          Date.now() - 24 * 60 * 60 * 1000;

        // Extract badges from assignments
        const badges = (member.member_badge_assignments || [])
          .map((assignment: any) => assignment.member_badges)
          .filter(Boolean);

        return {
          ...member,
          activity_score: activityScore,
          badges,
          recent_activities: activities || [],
          days_since_joined: daysSinceJoined,
          is_recently_active: isRecentlyActive,
          can_manage: false // Will be set based on current user permissions
        };
      })
    );

    // Apply search filter if provided
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      return enrichedMembers.filter(member => {
        const displayName = member.profiles?.display_name || '';
        const bio = member.member_bio || '';
        return displayName.toLowerCase().includes(searchTerm) ||
               bio.toLowerCase().includes(searchTerm);
      });
    }

    return enrichedMembers;
  }

  // Get member statistics
  static async getMemberStats(communityId: string): Promise<MemberStats> {
    const { data: members, error } = await supabase
      .from('community_members')
      .select('*')
      .eq('community_id', communityId);

    if (error) {
      console.error('Error fetching member stats:', error);
      throw error;
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeToday = members?.filter(m => 
      new Date(m.last_active_at) > oneDayAgo
    ).length || 0;

    const newThisWeek = members?.filter(m => 
      new Date(m.joined_at) > oneWeekAgo
    ).length || 0;

    const moderators = members?.filter(m => 
      m.role === 'moderator' || m.role === 'creator'
    ).length || 0;

    const onlineMembers = members?.filter(m => m.is_online).length || 0;

    // Calculate overall activity score
    const totalActivityScore = members?.reduce((sum, member) => {
      return sum + (member.activity_score || 0);
    }, 0) || 0;

    const avgActivityScore = members?.length ? totalActivityScore / members.length : 0;

    return {
      total_members: members?.length || 0,
      active_today: activeToday,
      new_this_week: newThisWeek,
      moderators,
      online_members: onlineMembers,
      activity_score: Math.round(avgActivityScore)
    };
  }

  // Track member activity
  static async trackActivity(
    communityId: string,
    userId: string,
    activityType: string,
    activityData: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Insert activity record
      await supabase
        .from('member_activities')
        .insert({
          community_id: communityId,
          user_id: userId,
          activity_type: activityType,
          activity_data: activityData
        });

      // Update member's last active timestamp
      await supabase
        .from('community_members')
        .update({ 
          last_active_at: new Date().toISOString(),
          is_online: true 
        })
        .eq('community_id', communityId)
        .eq('user_id', userId);

    } catch (error) {
      console.error('Error tracking member activity:', error);
    }
  }

  // Update member online status
  static async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      await supabase
        .from('community_members')
        .update({ is_online: isOnline })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  // Invite member to community
  static async inviteMember(
    communityId: string,
    inviteRequest: MemberInviteRequest
  ): Promise<MemberInvitation> {
    const inviteCode = this.generateInviteCode();
    
    const { data, error } = await supabase
      .from('member_invitations')
      .insert({
        community_id: communityId,
        email: inviteRequest.email,
        invite_code: inviteCode,
        role: inviteRequest.role,
        invited_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }

    // TODO: Send invitation email
    // await this.sendInvitationEmail(data);

    return data;
  }

  // Accept invitation
  static async acceptInvitation(inviteCode: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('member_invitations')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', invitation.community_id)
      .eq('user_id', user.user.id)
      .single();

    if (existingMember) {
      throw new Error('User is already a member of this community');
    }

    // Add user to community
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: invitation.community_id,
        user_id: user.user.id,
        role: invitation.role
      });

    if (memberError) throw memberError;

    // Mark invitation as used
    await supabase
      .from('member_invitations')
      .update({
        used_at: new Date().toISOString(),
        used_by: user.user.id
      })
      .eq('id', invitation.id);

    // Update community member count
    await supabase.rpc('increment_community_member_count', {
      community_id: invitation.community_id
    });
  }

  // Manage member role
  static async updateMemberRole(
    memberId: string,
    newRole: 'member' | 'moderator'
  ): Promise<void> {
    const { error } = await supabase
      .from('community_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  // Remove member from community
  static async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  // Award badge to member
  static async awardBadge(memberId: string, badgeId: string): Promise<void> {
    const { error } = await supabase
      .from('member_badge_assignments')
      .insert({
        member_id: memberId,
        badge_id: badgeId,
        awarded_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  // Get member engagement metrics
  static async getMemberEngagement(
    communityId: string,
    userId: string
  ): Promise<MemberEngagement> {
    // Get posts count
    const { count: postsCount } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId)
      .eq('user_id', userId);

    // Get activities count by type
    const { data: activities } = await supabase
      .from('member_activities')
      .select('activity_type')
      .eq('community_id', communityId)
      .eq('user_id', userId);

    const activityCounts = activities?.reduce((acc, activity) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, 
      (postsCount || 0) * 5 +
      (activityCounts.comment || 0) * 3 +
      (activityCounts.reaction || 0) * 1 +
      (activityCounts.event_join || 0) * 10 +
      (activityCounts.call_join || 0) * 15
    );

    return {
      posts_count: postsCount || 0,
      comments_count: activityCounts.comment || 0,
      reactions_given: activityCounts.reaction || 0,
      reactions_received: 0, // TODO: Calculate from post reactions
      events_attended: activityCounts.event_join || 0,
      calls_joined: activityCounts.call_join || 0,
      engagement_score: engagementScore
    };
  }

  // Helper methods
  private static generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private static calculateActivityScore(
    member: any,
    engagement: MemberEngagement,
    activities: MemberActivity[]
  ): number {
    const baseScore = 20; // Base score for being a member
    const engagementScore = Math.min(50, engagement.engagement_score / 2);
    
    // Recent activity bonus (last 7 days)
    const recentActivities = activities.filter(activity => 
      new Date(activity.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    const recentActivityScore = Math.min(20, recentActivities.length * 2);
    
    // Online status bonus
    const onlineBonus = member.is_online ? 10 : 0;
    
    return Math.min(100, baseScore + engagementScore + recentActivityScore + onlineBonus);
  }
}