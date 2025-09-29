// Simple member types for clean, modern UI
export interface SimpleMember {
  id: string;
  user_id: string;
  community_id: string;
  role: 'creator' | 'moderator' | 'member';
  joined_at: string;
  last_active_at: string;
  is_online: boolean;
  
  // User profile data
  display_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
}

export interface MemberStats {
  total_members: number;
  online_now: number;
  new_this_week: number;
  moderators: number;
}

export interface MemberFilters {
  search: string;
  role: 'all' | 'creator' | 'moderator' | 'member';
  status: 'all' | 'online' | 'offline';
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  creator_id: string;
  is_private: boolean;
  member_count: number;
  created_at: string;
}