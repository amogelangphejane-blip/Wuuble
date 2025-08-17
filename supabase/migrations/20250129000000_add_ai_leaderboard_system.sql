-- AI-Driven Leaderboard System Migration
-- This migration creates the comprehensive database structure for the AI-powered community leaderboard

-- Table to store user performance scores and rankings
CREATE TABLE community_user_scores (
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
CREATE TABLE community_user_score_history (
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
CREATE TABLE community_user_activities (
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
CREATE TABLE community_user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  feedback_type VARCHAR(30) NOT NULL CHECK (feedback_type IN ('motivation', 'improvement_suggestion', 'achievement_recognition', 'goal_setting', 'progress_update')),
  message TEXT NOT NULL,
  suggested_actions JSONB, -- AI-suggested specific actions
  priority_level INTEGER DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store user queries and AI responses for the "ask" function
CREATE TABLE community_leaderboard_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  query_intent VARCHAR(50), -- AI-classified intent
  ai_response TEXT NOT NULL,
  response_data JSONB, -- Structured data used to generate response
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  follow_up_needed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store leaderboard configurations per community
CREATE TABLE community_leaderboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  scoring_weights JSONB NOT NULL DEFAULT '{
    "chat_weight": 0.3,
    "video_call_weight": 0.25,
    "participation_weight": 0.25,
    "quality_weight": 0.2
  }',
  ranking_algorithm VARCHAR(30) DEFAULT 'weighted_score' CHECK (ranking_algorithm IN ('weighted_score', 'ml_ranking', 'peer_evaluation')),
  update_frequency VARCHAR(20) DEFAULT 'hourly' CHECK (update_frequency IN ('real_time', 'hourly', 'daily', 'weekly')),
  is_public BOOLEAN DEFAULT TRUE,
  show_detailed_metrics BOOLEAN DEFAULT FALSE,
  enable_ai_feedback BOOLEAN DEFAULT TRUE,
  enable_ask_function BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id)
);

-- Table to track AI model performance and accuracy
CREATE TABLE ai_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('sentiment_analysis', 'quality_assessment', 'ranking_algorithm', 'feedback_generation', 'query_understanding')),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  accuracy_score NUMERIC(4,3),
  precision_score NUMERIC(4,3),
  recall_score NUMERIC(4,3),
  f1_score NUMERIC(4,3),
  user_satisfaction NUMERIC(4,3),
  model_version VARCHAR(20),
  evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  evaluation_data JSONB
);

-- Indexes for optimal performance
CREATE INDEX idx_user_scores_community_performance ON community_user_scores(community_id, performance_score DESC);
CREATE INDEX idx_user_scores_rank ON community_user_scores(community_id, rank);
CREATE INDEX idx_user_scores_updated ON community_user_scores(updated_at);

CREATE INDEX idx_score_history_user_period ON community_user_score_history(user_id, period_type, period_start);
CREATE INDEX idx_score_history_community_period ON community_user_score_history(community_id, period_type, period_start);

CREATE INDEX idx_activities_user_type ON community_user_activities(user_id, activity_type, created_at);
CREATE INDEX idx_activities_community_time ON community_user_activities(community_id, created_at);
CREATE INDEX idx_activities_impact ON community_user_activities(impact_score DESC);

CREATE INDEX idx_feedback_user_unread ON community_user_feedback(user_id, is_read, created_at);
CREATE INDEX idx_feedback_community_priority ON community_user_feedback(community_id, priority_level, created_at);

CREATE INDEX idx_queries_user_time ON community_leaderboard_queries(user_id, created_at);
CREATE INDEX idx_queries_intent ON community_leaderboard_queries(query_intent, created_at);

-- Enable RLS on all tables
ALTER TABLE community_user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_user_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_leaderboard_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_leaderboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_user_scores
CREATE POLICY "Users can view scores in communities they're members of" ON community_user_scores
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage all user scores" ON community_user_scores
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for community_user_score_history  
CREATE POLICY "Users can view score history in their communities" ON community_user_score_history
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage score history" ON community_user_score_history
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for community_user_activities
CREATE POLICY "Users can view their own activities" ON community_user_activities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Community creators can view member activities" ON community_user_activities
  FOR SELECT USING (
    community_id IN (
      SELECT id FROM communities WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "System can manage all activities" ON community_user_activities
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for community_user_feedback
CREATE POLICY "Users can view their own feedback" ON community_user_feedback
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own feedback status" ON community_user_feedback
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can manage all feedback" ON community_user_feedback
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for community_leaderboard_queries
CREATE POLICY "Users can view their own queries" ON community_leaderboard_queries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create queries in their communities" ON community_leaderboard_queries
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can rate their own queries" ON community_leaderboard_queries
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for community_leaderboard_settings
CREATE POLICY "Community members can view leaderboard settings" ON community_leaderboard_settings
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Community creators can manage leaderboard settings" ON community_leaderboard_settings
  FOR ALL USING (
    community_id IN (
      SELECT id FROM communities WHERE creator_id = auth.uid()
    )
  );

-- RLS Policies for ai_model_metrics (admin/system only)
CREATE POLICY "System can manage AI model metrics" ON ai_model_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- Functions for score calculation and ranking

-- Function to calculate user performance score
CREATE OR REPLACE FUNCTION calculate_user_performance_score(
  p_community_id UUID,
  p_user_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  chat_score NUMERIC := 0;
  video_score NUMERIC := 0;
  participation_score NUMERIC := 0;
  quality_multiplier NUMERIC := 1.0;
  final_score NUMERIC := 0;
  settings RECORD;
BEGIN
  -- Get community leaderboard settings
  SELECT * INTO settings FROM community_leaderboard_settings 
  WHERE community_id = p_community_id;
  
  IF NOT FOUND THEN
    -- Use default weights if no settings found
    settings.scoring_weights := '{
      "chat_weight": 0.3,
      "video_call_weight": 0.25,
      "participation_weight": 0.25,
      "quality_weight": 0.2
    }'::jsonb;
  END IF;

  -- Calculate chat score (messages, sentiment, engagement)
  SELECT COALESCE(
    COUNT(*) * 2 + 
    SUM(CASE WHEN (quality_metrics->>'sentiment_score')::numeric > 0.7 THEN 5 ELSE 0 END) +
    SUM(CASE WHEN (quality_metrics->>'engagement_score')::numeric > 0.8 THEN 3 ELSE 0 END),
    0
  ) INTO chat_score
  FROM community_user_activities 
  WHERE community_id = p_community_id 
    AND user_id = p_user_id 
    AND activity_type IN ('chat_message', 'post_created', 'comment_posted')
    AND created_at > NOW() - INTERVAL '30 days';

  -- Calculate video call score (participation, speaking time, engagement)
  SELECT COALESCE(
    COUNT(*) * 10 +
    SUM(COALESCE((activity_data->>'speaking_time_minutes')::numeric * 2, 0)) +
    SUM(CASE WHEN (activity_data->>'camera_enabled')::boolean THEN 5 ELSE 0 END),
    0
  ) INTO video_score
  FROM community_user_activities 
  WHERE community_id = p_community_id 
    AND user_id = p_user_id 
    AND activity_type = 'video_call_joined'
    AND created_at > NOW() - INTERVAL '30 days';

  -- Calculate participation score (likes, helps, welcomes)
  SELECT COALESCE(
    SUM(CASE activity_type 
      WHEN 'like_given' THEN 1
      WHEN 'help_provided' THEN 8
      WHEN 'member_welcomed' THEN 5
      WHEN 'event_attended' THEN 6
      WHEN 'resource_shared' THEN 7
      ELSE 0
    END),
    0
  ) INTO participation_score
  FROM community_user_activities 
  WHERE community_id = p_community_id 
    AND user_id = p_user_id 
    AND activity_type IN ('like_given', 'help_provided', 'member_welcomed', 'event_attended', 'resource_shared')
    AND created_at > NOW() - INTERVAL '30 days';

  -- Calculate quality multiplier based on overall sentiment and helpfulness
  SELECT COALESCE(
    (AVG(COALESCE((quality_metrics->>'sentiment_score')::numeric, 0.5)) + 
     AVG(COALESCE((quality_metrics->>'helpfulness_score')::numeric, 0.5)) + 
     AVG(COALESCE((quality_metrics->>'relevance_score')::numeric, 0.5))) / 3 * 2,
    1.0
  ) INTO quality_multiplier
  FROM community_user_activities 
  WHERE community_id = p_community_id 
    AND user_id = p_user_id 
    AND quality_metrics IS NOT NULL
    AND created_at > NOW() - INTERVAL '30 days';

  -- Ensure quality multiplier is reasonable
  quality_multiplier := GREATEST(0.5, LEAST(2.0, quality_multiplier));

  -- Calculate final weighted score
  final_score := (
    (chat_score * (settings.scoring_weights->>'chat_weight')::numeric) +
    (video_score * (settings.scoring_weights->>'video_call_weight')::numeric) +
    (participation_score * (settings.scoring_weights->>'participation_weight')::numeric)
  ) * quality_multiplier;

  RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update community rankings
CREATE OR REPLACE FUNCTION update_community_rankings(p_community_id UUID) 
RETURNS void AS $$
BEGIN
  -- Update all user scores for the community
  INSERT INTO community_user_scores (community_id, user_id, performance_score, chat_score, video_call_score, participation_score, quality_multiplier)
  SELECT 
    p_community_id,
    cm.user_id,
    calculate_user_performance_score(p_community_id, cm.user_id),
    0, 0, 0, 1.0 -- These will be calculated by a more detailed function
  FROM community_members cm
  WHERE cm.community_id = p_community_id
  ON CONFLICT (community_id, user_id) 
  DO UPDATE SET 
    performance_score = calculate_user_performance_score(p_community_id, community_user_scores.user_id),
    updated_at = NOW();

  -- Update rankings based on performance scores
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY performance_score DESC, updated_at ASC) as new_rank
    FROM community_user_scores 
    WHERE community_id = p_community_id
  )
  UPDATE community_user_scores 
  SET rank = ranked_users.new_rank
  FROM ranked_users 
  WHERE community_user_scores.id = ranked_users.id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate AI feedback (placeholder - will be enhanced with actual AI integration)
CREATE OR REPLACE FUNCTION generate_user_feedback(
  p_community_id UUID,
  p_user_id UUID
) RETURNS void AS $$
DECLARE
  user_score RECORD;
  feedback_message TEXT;
  suggested_actions JSONB;
BEGIN
  -- Get user's current performance data
  SELECT * INTO user_score 
  FROM community_user_scores 
  WHERE community_id = p_community_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Generate personalized feedback based on performance
  IF user_score.rank <= 10 THEN
    feedback_message := 'Fantastic work! You''re in the top 10 of your community. Keep up the excellent engagement!';
    suggested_actions := '["Continue your high-quality contributions", "Consider mentoring newer members", "Share your expertise in video calls"]';
  ELSIF user_score.rank <= 50 THEN
    feedback_message := 'Great job! You''re performing well. Try focusing on video calls to boost your score further.';
    suggested_actions := '["Join more video calls this week", "Share insights during discussions", "Help answer questions from other members"]';
  ELSE
    feedback_message := 'There''s room to grow! Start by engaging more in chat discussions and joining video calls.';
    suggested_actions := '["Post a thoughtful message in the main chat", "Join the next community video call", "Welcome new members to the community"]';
  END IF;

  -- Insert the feedback
  INSERT INTO community_user_feedback (
    community_id, user_id, feedback_type, message, suggested_actions, priority_level
  ) VALUES (
    p_community_id, p_user_id, 'motivation', feedback_message, suggested_actions::jsonb, 2
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_scores_updated_at
  BEFORE UPDATE ON community_user_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_settings_updated_at
  BEFORE UPDATE ON community_leaderboard_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime subscriptions
ALTER TABLE community_user_scores REPLICA IDENTITY FULL;
ALTER TABLE community_user_feedback REPLICA IDENTITY FULL;
ALTER TABLE community_leaderboard_queries REPLICA IDENTITY FULL;

ALTER publication supabase_realtime ADD TABLE community_user_scores;
ALTER publication supabase_realtime ADD TABLE community_user_feedback;
ALTER publication supabase_realtime ADD TABLE community_leaderboard_queries;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;