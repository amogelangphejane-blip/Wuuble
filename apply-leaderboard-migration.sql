-- Apply AI Leaderboard System Migration
-- Run this SQL script in your Supabase SQL Editor to create the leaderboard tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI-Driven Leaderboard System Migration
-- This migration creates the comprehensive database structure for the AI-powered community leaderboard

-- Table to store user performance scores and rankings
CREATE TABLE IF NOT EXISTS community_user_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  performance_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  rank INTEGER,
  chat_score NUMERIC(8,2) DEFAULT 0,
  video_call_score NUMERIC(8,2) DEFAULT 0,
  participation_score NUMERIC(8,2) DEFAULT 0,
  quality_multiplier NUMERIC(4,2) DEFAULT 1.0,
  sentiment_score NUMERIC(4,2) DEFAULT 0,
  helpfulness_score NUMERIC(6,2) DEFAULT 0,
  consistency_score NUMERIC(4,2) DEFAULT 0,
  leadership_score NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Table to store historical performance data for trend analysis
CREATE TABLE IF NOT EXISTS community_user_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  performance_score NUMERIC(10,2) NOT NULL,
  rank INTEGER,
  score_breakdown JSONB, -- Detailed breakdown of all score components
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track detailed user activities for AI analysis
CREATE TABLE IF NOT EXISTS community_user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('chat_message', 'post_created', 'comment_posted', 'like_given', 'video_call_joined', 'help_provided', 'member_welcomed', 'event_attended', 'resource_shared')),
  activity_data JSONB, -- Flexible storage for activity-specific data
  quality_metrics JSONB, -- AI-analyzed quality metrics (sentiment, relevance, etc.)
  impact_score NUMERIC(6,2) DEFAULT 0, -- AI-calculated impact of this activity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store AI-generated personalized feedback and motivational messages
CREATE TABLE IF NOT EXISTS community_user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  feedback_type VARCHAR(30) NOT NULL CHECK (feedback_type IN ('encouragement', 'improvement_tip', 'achievement', 'milestone', 'weekly_summary')),
  message TEXT NOT NULL,
  context_data JSONB, -- Context that led to this feedback
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store user queries to the AI leaderboard system
CREATE TABLE IF NOT EXISTS community_leaderboard_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  query_intent VARCHAR(50), -- AI-detected intent: 'rank_question', 'improvement_advice', 'comparison', etc.
  ai_response TEXT NOT NULL,
  response_data JSONB, -- Structured data used to generate the response
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5), -- User's rating of the response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store community-specific leaderboard settings
CREATE TABLE IF NOT EXISTS community_leaderboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT TRUE,
  scoring_weights JSONB DEFAULT '{
    "chat_weight": 1.0,
    "video_call_weight": 2.0,
    "participation_weight": 1.5,
    "quality_weight": 2.5,
    "consistency_weight": 1.2,
    "leadership_weight": 3.0
  }',
  rank_calculation_frequency VARCHAR(20) DEFAULT 'daily' CHECK (rank_calculation_frequency IN ('hourly', 'daily', 'weekly')),
  feedback_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (feedback_frequency IN ('daily', 'weekly', 'monthly')),
  ai_features_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_user_scores_community_rank ON community_user_scores(community_id, rank);
CREATE INDEX IF NOT EXISTS idx_community_user_scores_user ON community_user_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_community_user_activities_community_user ON community_user_activities(community_id, user_id);
CREATE INDEX IF NOT EXISTS idx_community_user_activities_type_date ON community_user_activities(activity_type, created_at);
CREATE INDEX IF NOT EXISTS idx_community_user_feedback_user_unread ON community_user_feedback(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_community_leaderboard_queries_user_date ON community_leaderboard_queries(user_id, created_at);

-- RLS Policies
ALTER TABLE community_user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_user_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_leaderboard_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_leaderboard_settings ENABLE ROW LEVEL SECURITY;

-- Users can view leaderboard data for communities they're members of
CREATE POLICY "Users can view community leaderboard data" ON community_user_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_members.community_id = community_user_scores.community_id 
      AND community_members.user_id = auth.uid()
    )
  );

-- Users can view their own score history
CREATE POLICY "Users can view own score history" ON community_user_score_history
  FOR SELECT USING (user_id = auth.uid());

-- Users can view activities for communities they're members of
CREATE POLICY "Users can view community activities" ON community_user_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_members.community_id = community_user_activities.community_id 
      AND community_members.user_id = auth.uid()
    )
  );

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON community_user_feedback
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own feedback read status
CREATE POLICY "Users can update own feedback" ON community_user_feedback
  FOR UPDATE USING (user_id = auth.uid());

-- Users can view their own queries
CREATE POLICY "Users can view own queries" ON community_leaderboard_queries
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own queries
CREATE POLICY "Users can insert own queries" ON community_leaderboard_queries
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can rate their own query responses
CREATE POLICY "Users can rate own query responses" ON community_leaderboard_queries
  FOR UPDATE USING (user_id = auth.uid());

-- Community admins can view leaderboard settings
CREATE POLICY "Community admins can manage leaderboard settings" ON community_leaderboard_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_members.community_id = community_leaderboard_settings.community_id 
      AND community_members.user_id = auth.uid()
      AND community_members.role IN ('admin', 'moderator')
    )
  );

-- Functions and Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_community_user_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_user_scores_updated_at
    BEFORE UPDATE ON community_user_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_community_user_scores_updated_at();

CREATE OR REPLACE FUNCTION update_community_leaderboard_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_leaderboard_settings_updated_at
    BEFORE UPDATE ON community_leaderboard_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_community_leaderboard_settings_updated_at();

-- Sample data insertion function (for testing)
CREATE OR REPLACE FUNCTION initialize_leaderboard_for_community(community_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Insert default settings for the community
  INSERT INTO community_leaderboard_settings (community_id)
  VALUES (community_uuid)
  ON CONFLICT (community_id) DO NOTHING;
  
  -- Initialize scores for existing community members
  INSERT INTO community_user_scores (community_id, user_id, performance_score, rank)
  SELECT 
    community_uuid,
    cm.user_id,
    0,
    999
  FROM community_members cm
  WHERE cm.community_id = community_uuid
  ON CONFLICT (community_id, user_id) DO NOTHING;
END;
$$ language 'plpgsql';