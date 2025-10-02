// Simplified Gamification Leaderboard Types

export interface UserPoints {
  id: string;
  user_id: string;
  community_id: string;
  total_points: number;
  level: number;
  posts_count: number;
  comments_count: number;
  likes_given_count: number;
  likes_received_count: number;
  streak_days: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  community_id: string;
  achievement_key: string;
  achievement_name: string;
  achievement_description: string;
  icon: string;
  earned_at: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  community_id: string;
  activity_type: ActivityType;
  points_earned: number;
  reference_id?: string;
  created_at: string;
}

export type ActivityType = 
  | 'post_created' 
  | 'comment_posted' 
  | 'like_given'
  | 'like_received'
  | 'video_call_joined'
  | 'event_attended'
  | 'resource_shared'
  | 'member_joined';

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  points: number;
  level: number;
  badges: UserAchievement[];
  stats: {
    posts: number;
    comments: number;
    likes_given: number;
  };
}

export interface GamificationStats {
  total_points: number;
  level: number;
  next_level_points: number;
  progress_to_next_level: number;
  rank: number;
  total_members: number;
  achievements_count: number;
  recent_achievements: UserAchievement[];
}

// Point values for different activities
export const ACTIVITY_POINTS = {
  post_created: 10,
  comment_posted: 5,
  like_given: 1,
  like_received: 2,
  video_call_joined: 15,
  event_attended: 20,
  resource_shared: 15,
  member_joined: 5,
} as const;

// Achievement definitions
export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'points' | 'posts' | 'comments' | 'likes';
    value: number;
  };
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    key: 'first_post',
    name: 'First Post',
    description: 'Created your first post',
    icon: '📝',
    requirement: { type: 'posts', value: 1 }
  },
  {
    key: 'active_commenter',
    name: 'Active Commenter',
    description: 'Posted 10 comments',
    icon: '💬',
    requirement: { type: 'comments', value: 10 }
  },
  {
    key: 'prolific_poster',
    name: 'Prolific Poster',
    description: 'Created 10 posts',
    icon: '✍️',
    requirement: { type: 'posts', value: 10 }
  },
  {
    key: 'supportive_member',
    name: 'Supportive Member',
    description: 'Gave 50 likes',
    icon: '❤️',
    requirement: { type: 'likes', value: 50 }
  },
  {
    key: 'century_club',
    name: 'Century Club',
    description: 'Earned 100 points',
    icon: '💯',
    requirement: { type: 'points', value: 100 }
  },
  {
    key: 'high_roller',
    name: 'High Roller',
    description: 'Earned 500 points',
    icon: '🎯',
    requirement: { type: 'points', value: 500 }
  },
  {
    key: 'legend',
    name: 'Legend',
    description: 'Earned 1000 points',
    icon: '👑',
    requirement: { type: 'points', value: 1000 }
  },
];
