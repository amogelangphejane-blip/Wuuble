import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  status?: string;
  last_active_at?: string;
  is_online?: boolean;
  member_bio?: string;
}

export interface MemberJoinResult {
  success: boolean;
  member?: CommunityMember;
  error?: string;
}

export interface MemberStats {
  total_members: number;
  new_this_week: number;
  active_today: number;
  online_members: number;
}

export class CommunityMemberService {
  /**
   * Join a community
   */
  static async joinCommunity(communityId: string, user: User): Promise<MemberJoinResult> {
    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        return {
          success: true,
          member: existingMember,
        };
      }

      // Insert new member
      const { data: newMember, error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: 'member',
          joined_at: new Date().toISOString(),
          status: 'approved'
        })
        .select()
        .single();

      if (error) {
        console.error('Error joining community:', error);
        return {
          success: false,
          error: error.message || 'Failed to join community',
        };
      }

      // Track join activity
      await this.trackMemberActivity(communityId, user.id, 'member_joined', {
        timestamp: new Date().toISOString()
      });

      // Update community member count
      await this.updateCommunityMemberCount(communityId);

      return {
        success: true,
        member: newMember,
      };

    } catch (error) {
      console.error('Unexpected error joining community:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Leave a community
   */
  static async leaveCommunity(communityId: string, userId: string): Promise<MemberJoinResult> {
    try {
      // Get member info before deletion
      const { data: member } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (!member) {
        return {
          success: false,
          error: 'Member not found',
        };
      }

      // Delete member
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error leaving community:', error);
        return {
          success: false,
          error: error.message || 'Failed to leave community',
        };
      }

      // Track leave activity
      await this.trackMemberActivity(communityId, userId, 'member_left', {
        timestamp: new Date().toISOString()
      });

      // Update community member count
      await this.updateCommunityMemberCount(communityId);

      return {
        success: true,
      };

    } catch (error) {
      console.error('Unexpected error leaving community:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get community members with user profiles
   */
  static async getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    try {
      // First try to get members with profiles relationship
      let { data: members, error } = await supabase
        .from('community_members')
        .select(`
          *,
          profiles:user_id (
            user_id,
            display_name,
            avatar_url,
            email
          )
        `)
        .eq('community_id', communityId)
        .order('joined_at', { ascending: false });

      // If the relationship doesn't work, fallback to basic query
      if (error && error.message.includes('relationship')) {
        console.log('Profiles relationship not found, using basic member query');
        ({ data: members, error } = await supabase
          .from('community_members')
          .select('*')
          .eq('community_id', communityId)
          .order('joined_at', { ascending: false }));
      }

      if (error) {
        console.error('Error fetching community members:', error);
        return [];
      }

      return members || [];

    } catch (error) {
      console.error('Unexpected error fetching members:', error);
      return [];
    }
  }

  /**
   * Check if user is a member of a community
   */
  static async isMember(communityId: string, userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      return !!data;

    } catch (error) {
      return false;
    }
  }

  /**
   * Get member role in a community
   */
  static async getMemberRole(communityId: string, userId: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      return data?.role || null;

    } catch (error) {
      return null;
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    memberId: string, 
    newRole: 'member' | 'moderator' | 'admin'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) {
        console.error('Error updating member role:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Unexpected error updating member role:', error);
      return false;
    }
  }

  /**
   * Remove member from community
   */
  static async removeMember(memberId: string): Promise<boolean> {
    try {
      // Get member info first
      const { data: member } = await supabase
        .from('community_members')
        .select('community_id, user_id')
        .eq('id', memberId)
        .single();

      if (!member) {
        return false;
      }

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Error removing member:', error);
        return false;
      }

      // Track removal activity
      await this.trackMemberActivity(member.community_id, member.user_id, 'member_removed', {
        timestamp: new Date().toISOString()
      });

      // Update community member count
      await this.updateCommunityMemberCount(member.community_id);

      return true;

    } catch (error) {
      console.error('Unexpected error removing member:', error);
      return false;
    }
  }

  /**
   * Get member statistics for a community
   */
  static async getMemberStats(communityId: string): Promise<MemberStats> {
    try {
      const { data: members, error } = await supabase
        .from('community_members')
        .select('joined_at, last_active_at, is_online')
        .eq('community_id', communityId);

      if (error) {
        console.error('Error fetching member stats:', error);
        return {
          total_members: 0,
          new_this_week: 0,
          active_today: 0,
          online_members: 0,
        };
      }

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats: MemberStats = {
        total_members: members?.length || 0,
        new_this_week: members?.filter(m => new Date(m.joined_at) > weekAgo).length || 0,
        active_today: members?.filter(m => 
          m.last_active_at && new Date(m.last_active_at) > dayAgo
        ).length || 0,
        online_members: members?.filter(m => m.is_online).length || 0,
      };

      return stats;

    } catch (error) {
      console.error('Unexpected error fetching member stats:', error);
      return {
        total_members: 0,
        new_this_week: 0,
        active_today: 0,
        online_members: 0,
      };
    }
  }

  /**
   * Update community member count
   */
  static async updateCommunityMemberCount(communityId: string): Promise<number> {
    try {
      const { data: members, count } = await supabase
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId);

      const memberCount = count || members?.length || 0;

      const { error } = await supabase
        .from('communities')
        .update({ member_count: memberCount })
        .eq('id', communityId);

      if (error) {
        console.error('Error updating community member count:', error);
      } else {
        console.log(`Updated member count for community ${communityId}: ${memberCount}`);
      }

      return memberCount;

    } catch (error) {
      console.error('Error updating member count:', error);
      return 0;
    }
  }

  /**
   * Track member activity (optional - fails silently if table doesn't exist)
   */
  private static async trackMemberActivity(
    communityId: string,
    userId: string,
    activityType: string,
    activityData: Record<string, any>
  ): Promise<void> {
    try {
      await supabase
        .from('member_activities')
        .insert({
          community_id: communityId,
          user_id: userId,
          activity_type: activityType,
          activity_data: activityData,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      // Activity tracking is optional, don't throw if it fails
      console.log('Could not track member activity:', error);
    }
  }

  /**
   * Update member online status
   */
  static async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      await supabase
        .from('community_members')
        .update({ 
          is_online: isOnline,
          last_active_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.log('Could not update online status:', error);
    }
  }
}

export default CommunityMemberService;