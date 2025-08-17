// AI-Driven Leaderboard System Types
export interface UserScore {
  id: string;
  community_id: string;
  user_id: string;
  performance_score: number;
  rank: number;
  chat_score: number;
  video_call_score: number;
  participation_score: number;
  quality_multiplier: number;
  sentiment_score: number;
  helpfulness_score: number;
  consistency_score: number;
  leadership_score: number;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface UserScoreHistory {
  id: string;
  community_id: string;
  user_id: string;
  performance_score: number;
  rank: number;
  score_breakdown: ScoreBreakdown;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface ScoreBreakdown {
  chat_score: number;
  video_call_score: number;
  participation_score: number;
  quality_metrics: {
    sentiment_score: number;
    helpfulness_score: number;
    relevance_score: number;
    engagement_score: number;
  };
  activity_counts: {
    messages_sent: number;
    posts_created: number;
    comments_posted: number;
    likes_given: number;
    video_calls_joined: number;
    help_provided: number;
    members_welcomed: number;
    events_attended: number;
    resources_shared: number;
  };
}

export interface UserActivity {
  id: string;
  community_id: string;
  user_id: string;
  activity_type: ActivityType;
  activity_data: Record<string, any>;
  quality_metrics: QualityMetrics;
  impact_score: number;
  created_at: string;
}

export type ActivityType = 
  | 'chat_message' 
  | 'post_created' 
  | 'comment_posted' 
  | 'like_given' 
  | 'video_call_joined' 
  | 'help_provided' 
  | 'member_welcomed' 
  | 'event_attended' 
  | 'resource_shared';

export interface QualityMetrics {
  sentiment_score?: number; // 0-1, higher is more positive
  helpfulness_score?: number; // 0-1, higher is more helpful
  relevance_score?: number; // 0-1, higher is more relevant to topic
  engagement_score?: number; // 0-1, higher indicates more engagement from others
  toxicity_score?: number; // 0-1, lower is better
  length_score?: number; // Normalized score based on content length
  speaking_time_minutes?: number; // For video calls
  camera_enabled?: boolean; // For video calls
  reactions_received?: number; // Likes, upvotes, etc.
}

export interface UserFeedback {
  id: string;
  community_id: string;
  user_id: string;
  feedback_type: FeedbackType;
  message: string;
  suggested_actions: string[];
  priority_level: 1 | 2 | 3 | 4 | 5;
  is_read: boolean;
  is_dismissed: boolean;
  expires_at?: string;
  created_at: string;
}

export type FeedbackType = 
  | 'motivation' 
  | 'improvement_suggestion' 
  | 'achievement_recognition' 
  | 'goal_setting' 
  | 'progress_update';

export interface LeaderboardQuery {
  id: string;
  community_id: string;
  user_id: string;
  query_text: string;
  query_intent?: QueryIntent;
  ai_response: string;
  response_data: Record<string, any>;
  satisfaction_rating?: 1 | 2 | 3 | 4 | 5;
  follow_up_needed: boolean;
  created_at: string;
}

export type QueryIntent = 
  | 'rank_inquiry' 
  | 'improvement_request' 
  | 'comparison_request' 
  | 'goal_setting' 
  | 'progress_tracking' 
  | 'general_question';

export interface LeaderboardSettings {
  id: string;
  community_id: string;
  scoring_weights: ScoringWeights;
  ranking_algorithm: 'weighted_score' | 'ml_ranking' | 'peer_evaluation';
  update_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  is_public: boolean;
  show_detailed_metrics: boolean;
  enable_ai_feedback: boolean;
  enable_ask_function: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScoringWeights {
  chat_weight: number;
  video_call_weight: number;
  participation_weight: number;
  quality_weight: number;
}

export interface AIModelMetrics {
  id: string;
  model_type: ModelType;
  community_id?: string;
  accuracy_score?: number;
  precision_score?: number;
  recall_score?: number;
  f1_score?: number;
  user_satisfaction?: number;
  model_version: string;
  evaluation_date: string;
  evaluation_data: Record<string, any>;
}

export type ModelType = 
  | 'sentiment_analysis' 
  | 'quality_assessment' 
  | 'ranking_algorithm' 
  | 'feedback_generation' 
  | 'query_understanding';

// UI-specific types
export interface LeaderboardEntry {
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  rank: number;
  performance_score: number;
  score_breakdown: {
    chat_score: number;
    video_call_score: number;
    participation_score: number;
    quality_multiplier: number;
  };
  trend: 'up' | 'down' | 'stable';
  rank_change: number;
  badges: Badge[];
  recent_activities: UserActivity[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_at: string;
}

export interface ProgressData {
  current_score: number;
  score_history: Array<{
    date: string;
    score: number;
    rank: number;
  }>;
  goals: Goal[];
  achievements: Achievement[];
  strengths: string[];
  improvement_areas: string[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  deadline?: string;
  is_completed: boolean;
  category: 'chat' | 'video_calls' | 'participation' | 'quality';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// API request/response types
export interface AnalyzeChatMessageRequest {
  message: string;
  context?: {
    previous_messages: string[];
    topic: string;
    community_id: string;
  };
}

export interface AnalyzeChatMessageResponse {
  quality_metrics: QualityMetrics;
  impact_score: number;
  suggested_improvements?: string[];
}

export interface GenerateFeedbackRequest {
  community_id: string;
  user_id: string;
  performance_data: UserScore;
  recent_activities: UserActivity[];
}

export interface GenerateFeedbackResponse {
  feedback: UserFeedback;
  additional_suggestions: string[];
}

export interface ProcessLeaderboardQueryRequest {
  community_id: string;
  user_id: string;
  query: string;
  context?: {
    user_score: UserScore;
    recent_activities: UserActivity[];
    leaderboard_position: number;
  };
}

export interface ProcessLeaderboardQueryResponse {
  response: string;
  intent: QueryIntent;
  confidence: number;
  suggested_actions?: string[];
  follow_up_questions?: string[];
}

// Hooks return types
export interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  userPosition: LeaderboardEntry | null;
  isLoading: boolean;
  error: Error | null;
  refreshLeaderboard: () => void;
}

export interface UseUserProgressReturn {
  progress: ProgressData | null;
  feedback: UserFeedback[];
  isLoading: boolean;
  error: Error | null;
  markFeedbackAsRead: (feedbackId: string) => void;
  dismissFeedback: (feedbackId: string) => void;
}

export interface UseLeaderboardQueryReturn {
  askQuestion: (question: string) => Promise<ProcessLeaderboardQueryResponse>;
  queryHistory: LeaderboardQuery[];
  isLoading: boolean;
  error: Error | null;
  rateResponse: (queryId: string, rating: number) => void;
}