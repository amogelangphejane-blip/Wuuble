// Enhanced Member Types for Community Features

export interface CommunityMember {
  id: string;
  user_id: string;
  community_id: string;
  role: 'member' | 'moderator' | 'creator';
  joined_at: string;
  last_active_at: string;
  member_bio?: string;
  member_badges: string[];
  notification_preferences: {
    new_posts: boolean;
    events: boolean;
    mentions: boolean;
    direct_messages: boolean;
  };
  is_online: boolean;
  permissions: Record<string, boolean>;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
    bio?: string | null;
  };
}

export interface MemberActivity {
  id: string;
  community_id: string;
  user_id: string;
  activity_type: 'post' | 'comment' | 'event_join' | 'call_join' | 'reaction' | 'badge_earned';
  activity_data: Record<string, any>;
  created_at: string;
}

export interface MemberInvitation {
  id: string;
  community_id: string;
  invited_by: string;
  email: string;
  invite_code: string;
  role: 'member' | 'moderator';
  expires_at: string;
  used_at?: string;
  used_by?: string;
  created_at: string;
}

export interface MemberBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  community_id: string;
  criteria: {
    type: 'founding_member' | 'activity_based' | 'engagement_based' | 'manual';
    [key: string]: any;
  };
  created_at: string;
}

export interface MemberBadgeAssignment {
  id: string;
  member_id: string;
  badge_id: string;
  awarded_at: string;
  awarded_by?: string;
  badge?: MemberBadge;
}

export interface MemberStats {
  total_members: number;
  active_today: number;
  new_this_week: number;
  moderators: number;
  online_members: number;
  activity_score: number;
}

export interface MemberFilter {
  search: string;
  role: 'all' | 'member' | 'moderator' | 'creator';
  status: 'all' | 'online' | 'offline' | 'recently_active';
  joined: 'all' | 'today' | 'week' | 'month';
  badges: string[];
}

export interface MemberAction {
  type: 'message' | 'promote' | 'demote' | 'remove' | 'ban' | 'award_badge';
  label: string;
  icon: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  permission?: string;
}

export interface EnhancedCommunityMember extends CommunityMember {
  activity_score: number;
  badges: MemberBadge[];
  recent_activities: MemberActivity[];
  days_since_joined: number;
  is_recently_active: boolean;
  can_manage: boolean;
}

export interface MemberInviteRequest {
  email: string;
  role: 'member' | 'moderator';
  message?: string;
}

export interface BulkMemberAction {
  action: string;
  member_ids: string[];
  data?: Record<string, any>;
}

export interface MemberEngagement {
  posts_count: number;
  comments_count: number;
  reactions_given: number;
  reactions_received: number;
  events_attended: number;
  calls_joined: number;
  last_post_date?: string;
  engagement_score: number;
}