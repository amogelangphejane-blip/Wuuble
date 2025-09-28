// Complete rewrite of member types with enhanced features

export type MemberRole = 'member' | 'moderator' | 'creator';
export type MemberStatus = 'active' | 'inactive' | 'banned' | 'pending';
export type MemberEngagement = 'new' | 'casual' | 'regular' | 'active' | 'champion';
export type ActivityType = 'post_created' | 'comment_created' | 'reaction_added' | 'event_joined' | 'call_joined' | 'badge_earned' | 'member_invited' | 'profile_updated' | 'login' | 'view_content';
export type BadgeType = 'achievement' | 'milestone' | 'special' | 'seasonal';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type RelationshipType = 'following' | 'blocked' | 'favorite';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

// Core member profile interface
export interface CommunityMemberProfile {
  id: string;
  user_id: string;
  community_id: string;
  
  // Profile Information
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  location: string | null;
  website_url: string | null;
  
  // Member Status
  role: MemberRole;
  status: MemberStatus;
  
  // Real-time Presence
  is_online: boolean;
  last_seen_at: string;
  presence_data: Record<string, any>;
  
  // Membership Details
  joined_at: string;
  invited_by: string | null;
  invitation_accepted_at: string | null;
  
  // Activity & Engagement
  activity_score: number;
  engagement_level: MemberEngagement;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  
  // Preferences
  notification_preferences: {
    new_posts: boolean;
    mentions: boolean;
    direct_messages: boolean;
    events: boolean;
    badges: boolean;
  };
  privacy_settings: {
    profile_visibility: 'public' | 'community' | 'private';
    activity_visibility: 'public' | 'community' | 'private';
    contact_visibility: 'public' | 'members' | 'friends' | 'private';
  };
  
  // Custom Fields
  custom_fields: Record<string, any>;
  tags: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Activity tracking
export interface MemberActivity {
  id: string;
  member_id: string;
  community_id: string;
  
  // Activity Details
  activity_type: ActivityType;
  activity_subtype: string | null;
  activity_data: Record<string, any>;
  
  // Scoring
  points_earned: number;
  engagement_weight: number;
  
  // Context
  related_entity_id: string | null;
  related_entity_type: string | null;
  
  // Timestamps
  created_at: string;
  occurred_at: string;
}

// Badge system
export interface MemberBadge {
  id: string;
  community_id: string;
  
  // Badge Information
  name: string;
  description: string | null;
  icon: string;
  color: string;
  
  // Badge Logic
  badge_type: BadgeType;
  criteria: Record<string, any>;
  rarity: BadgeRarity;
  
  // Display
  is_visible: boolean;
  display_order: number;
  
  // Metadata
  created_at: string;
  created_by: string | null;
}

// Badge assignments
export interface MemberBadgeAssignment {
  id: string;
  member_id: string;
  badge_id: string;
  
  // Assignment Details
  awarded_at: string;
  awarded_by: string | null;
  
  // Progress
  progress: number;
  progress_data: Record<string, any>;
  
  // Badge info (joined)
  badge?: MemberBadge;
}

// Member relationships
export interface MemberRelationship {
  id: string;
  from_member_id: string;
  to_member_id: string;
  community_id: string;
  
  relationship_type: RelationshipType;
  created_at: string;
  metadata: Record<string, any>;
  
  // Joined member info
  to_member?: CommunityMemberProfile;
  from_member?: CommunityMemberProfile;
}

// Member invitations
export interface MemberInvitation {
  id: string;
  community_id: string;
  
  // Invitation Details
  email: string;
  invited_by: string | null;
  role: MemberRole;
  
  // Code & Status
  invite_code: string;
  status: InvitationStatus;
  
  // Usage
  used_by: string | null;
  used_at: string | null;
  
  // Expiration
  expires_at: string;
  
  // Message
  personal_message: string | null;
  
  created_at: string;
}

// Analytics snapshot
export interface MemberAnalyticsSnapshot {
  id: string;
  community_id: string;
  snapshot_date: string;
  
  // Member Counts
  total_members: number;
  active_members: number;
  new_members: number;
  online_members: number;
  
  // Engagement
  avg_activity_score: number;
  total_activities: number;
  engagement_rate: number;
  
  // Role Distribution
  creators_count: number;
  moderators_count: number;
  members_count: number;
  
  // Additional Metrics
  badges_awarded: number;
  invitations_sent: number;
  
  detailed_metrics: Record<string, any>;
  created_at: string;
}

// Enhanced member with computed fields
export interface EnhancedMemberProfile extends CommunityMemberProfile {
  // Computed fields
  is_recently_active: boolean;
  days_since_joined: number;
  engagement_percentage: number;
  
  // Related data
  badges: MemberBadge[];
  recent_activities: MemberActivity[];
  relationships: MemberRelationship[];
  
  // Permissions (based on current user)
  can_message: boolean;
  can_promote: boolean;
  can_demote: boolean;
  can_remove: boolean;
  can_award_badge: boolean;
}

// Filter and search interfaces
export interface MemberFilter {
  search: string;
  role: MemberRole | 'all';
  status: MemberStatus | 'all';
  engagement: MemberEngagement | 'all';
  online_status: 'online' | 'recently_active' | 'offline' | 'all';
  joined_period: 'today' | 'week' | 'month' | 'all';
  activity_score_min: number;
  activity_score_max: number;
  badges: string[];
  tags: string[];
  has_custom_avatar: boolean | null;
  min_points: number;
  max_points: number;
}

export interface MemberSort {
  field: 'display_name' | 'joined_at' | 'last_seen_at' | 'activity_score' | 'total_points' | 'current_streak';
  direction: 'asc' | 'desc';
}

// Bulk operations
export interface MemberBulkAction {
  action: 'promote' | 'demote' | 'remove' | 'award_badge' | 'change_status' | 'send_message';
  member_ids: string[];
  parameters?: Record<string, any>;
}

// Member statistics
export interface MemberStatistics {
  // Totals
  total_members: number;
  active_members: number;
  online_members: number;
  
  // Growth
  new_today: number;
  new_this_week: number;
  new_this_month: number;
  growth_rate: number;
  
  // Engagement
  avg_activity_score: number;
  high_engagement_count: number;
  medium_engagement_count: number;
  low_engagement_count: number;
  
  // Roles
  creators_count: number;
  moderators_count: number;
  members_count: number;
  
  // Activities
  activities_today: number;
  activities_this_week: number;
  total_activities: number;
  
  // Badges
  total_badges_available: number;
  total_badges_awarded: number;
  badges_awarded_today: number;
  
  // Streaks
  avg_streak: number;
  longest_streak: number;
  members_with_streaks: number;
}

// Real-time events
export interface MemberRealtimeEvent {
  type: 'member_joined' | 'member_left' | 'member_updated' | 'presence_changed' | 'activity_created' | 'badge_awarded';
  member_id: string;
  community_id: string;
  data: Record<string, any>;
  timestamp: string;
}

// Presence data
export interface MemberPresence {
  user_id: string;
  member_id: string;
  is_online: boolean;
  last_seen_at: string;
  current_page?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
}

// Member search result
export interface MemberSearchResult {
  member: EnhancedMemberProfile;
  relevance_score: number;
  matching_fields: string[];
  highlight_data: Record<string, string>;
}

// Pagination
export interface MemberPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

// API Response types
export interface MemberListResponse {
  members: EnhancedMemberProfile[];
  pagination: MemberPagination;
  statistics: MemberStatistics;
  filters_applied: MemberFilter;
  sort_applied: MemberSort;
}

export interface MemberDetailResponse {
  member: EnhancedMemberProfile;
  activity_timeline: MemberActivity[];
  relationships: MemberRelationship[];
  badges: MemberBadgeAssignment[];
}

// Hook return types
export interface UseMembersReturn {
  members: EnhancedMemberProfile[];
  loading: boolean;
  error: string | null;
  statistics: MemberStatistics;
  filters: MemberFilter;
  sort: MemberSort;
  pagination: MemberPagination;
  
  // Actions
  setFilters: (filters: Partial<MemberFilter>) => void;
  setSort: (sort: MemberSort) => void;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
  
  // Member actions
  updateMember: (memberId: string, updates: Partial<CommunityMemberProfile>) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  inviteMember: (invitation: Omit<MemberInvitation, 'id' | 'invite_code' | 'created_at'>) => Promise<void>;
  awardBadge: (memberId: string, badgeId: string) => Promise<void>;
  bulkAction: (action: MemberBulkAction) => Promise<void>;
}

export interface UseRealtimeMembersReturn {
  members: EnhancedMemberProfile[];
  onlineCount: number;
  loading: boolean;
  error: string | null;
  connected: boolean;
  
  // Presence actions
  updatePresence: (data: Partial<MemberPresence>) => Promise<void>;
  trackActivity: (activity: Omit<MemberActivity, 'id' | 'created_at'>) => Promise<void>;
  
  // Event subscription
  subscribe: (callback: (event: MemberRealtimeEvent) => void) => () => void;
}