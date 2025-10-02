-- Simplified Gamification Leaderboard System
-- Drop old AI leaderboard tables if they exist
DROP TABLE IF EXISTS ai_model_metrics CASCADE;
DROP TABLE IF EXISTS community_leaderboard_queries CASCADE;
DROP TABLE IF EXISTS community_user_feedback CASCADE;
DROP TABLE IF EXISTS community_user_activities CASCADE;
DROP TABLE IF EXISTS community_user_score_history CASCADE;
DROP TABLE IF EXISTS community_leaderboard_settings CASCADE;
DROP TABLE IF EXISTS community_user_scores CASCADE;

-- Create simplified user points table
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  posts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  likes_given_count INTEGER DEFAULT 0,
  likes_received_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  achievement_key VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(200) NOT NULL,
  achievement_description TEXT,
  icon VARCHAR(50),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, community_id, achievement_key)
);

-- Create activity log for tracking
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_points_community ON user_points(community_id, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id, community_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON user_activity_log(user_id, community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_updated ON user_points(updated_at);

-- Enable RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_points
CREATE POLICY "Users can view points in their communities" ON user_points
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own points" ON user_points
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can manage all points" ON user_points
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for user_achievements
CREATE POLICY "Users can view achievements in their communities" ON user_achievements
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage achievements" ON user_achievements
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view their own activity" ON user_activity_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Community creators can view member activity" ON user_activity_log
  FOR SELECT USING (
    community_id IN (
      SELECT id FROM communities WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "System can manage all activity" ON user_activity_log
  FOR ALL USING (auth.role() = 'service_role');

-- Function to calculate level from points
CREATE OR REPLACE FUNCTION calculate_level(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level up every 100 points
  RETURN GREATEST(1, FLOOR(points / 100.0) + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user points
CREATE OR REPLACE FUNCTION update_user_points(
  p_user_id UUID,
  p_community_id UUID,
  p_points INTEGER,
  p_activity_type VARCHAR,
  p_reference_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_new_total INTEGER;
  v_new_level INTEGER;
  v_old_level INTEGER;
BEGIN
  -- Insert or update user points
  INSERT INTO user_points (user_id, community_id, total_points, level, updated_at, last_activity_date)
  VALUES (p_user_id, p_community_id, p_points, calculate_level(p_points), NOW(), CURRENT_DATE)
  ON CONFLICT (user_id, community_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + p_points,
    level = calculate_level(user_points.total_points + p_points),
    updated_at = NOW(),
    last_activity_date = CURRENT_DATE,
    posts_count = CASE WHEN p_activity_type = 'post_created' THEN user_points.posts_count + 1 ELSE user_points.posts_count END,
    comments_count = CASE WHEN p_activity_type = 'comment_posted' THEN user_points.comments_count + 1 ELSE user_points.comments_count END,
    likes_given_count = CASE WHEN p_activity_type = 'like_given' THEN user_points.likes_given_count + 1 ELSE user_points.likes_given_count END
  RETURNING total_points, level INTO v_new_total, v_new_level;

  -- Get old level
  SELECT level INTO v_old_level FROM user_points 
  WHERE user_id = p_user_id AND community_id = p_community_id;

  -- Log the activity
  INSERT INTO user_activity_log (user_id, community_id, activity_type, points_earned, reference_id)
  VALUES (p_user_id, p_community_id, p_activity_type, p_points, p_reference_id);

  -- Check for level up achievement
  IF v_new_level > COALESCE(v_old_level, 1) THEN
    INSERT INTO user_achievements (user_id, community_id, achievement_key, achievement_name, achievement_description, icon)
    VALUES (
      p_user_id, 
      p_community_id, 
      'level_' || v_new_level, 
      'Level ' || v_new_level, 
      'Reached level ' || v_new_level || '!',
      '⭐'
    )
    ON CONFLICT (user_id, community_id, achievement_key) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(
  p_user_id UUID,
  p_community_id UUID
)
RETURNS void AS $$
DECLARE
  v_points RECORD;
BEGIN
  -- Get user stats
  SELECT * INTO v_points FROM user_points 
  WHERE user_id = p_user_id AND community_id = p_community_id;

  IF v_points IS NULL THEN
    RETURN;
  END IF;

  -- First Post achievement
  IF v_points.posts_count >= 1 THEN
    INSERT INTO user_achievements (user_id, community_id, achievement_key, achievement_name, achievement_description, icon)
    VALUES (p_user_id, p_community_id, 'first_post', 'First Post', 'Created your first post', '📝')
    ON CONFLICT (user_id, community_id, achievement_key) DO NOTHING;
  END IF;

  -- Active Commenter achievement
  IF v_points.comments_count >= 10 THEN
    INSERT INTO user_achievements (user_id, community_id, achievement_key, achievement_name, achievement_description, icon)
    VALUES (p_user_id, p_community_id, 'active_commenter', 'Active Commenter', 'Posted 10 comments', '💬')
    ON CONFLICT (user_id, community_id, achievement_key) DO NOTHING;
  END IF;

  -- Prolific Poster achievement
  IF v_points.posts_count >= 10 THEN
    INSERT INTO user_achievements (user_id, community_id, achievement_key, achievement_name, achievement_description, icon)
    VALUES (p_user_id, p_community_id, 'prolific_poster', 'Prolific Poster', 'Created 10 posts', '✍️')
    ON CONFLICT (user_id, community_id, achievement_key) DO NOTHING;
  END IF;

  -- Supportive Member achievement
  IF v_points.likes_given_count >= 50 THEN
    INSERT INTO user_achievements (user_id, community_id, achievement_key, achievement_name, achievement_description, icon)
    VALUES (p_user_id, p_community_id, 'supportive_member', 'Supportive Member', 'Gave 50 likes', '❤️')
    ON CONFLICT (user_id, community_id, achievement_key) DO NOTHING;
  END IF;

  -- Century Club achievement
  IF v_points.total_points >= 100 THEN
    INSERT INTO user_achievements (user_id, community_id, achievement_key, achievement_name, achievement_description, icon)
    VALUES (p_user_id, p_community_id, 'century_club', 'Century Club', 'Earned 100 points', '💯')
    ON CONFLICT (user_id, community_id, achievement_key) DO NOTHING;
  END IF;

  -- High Roller achievement
  IF v_points.total_points >= 500 THEN
    INSERT INTO user_achievements (user_id, community_id, achievement_key, achievement_name, achievement_description, icon)
    VALUES (p_user_id, p_community_id, 'high_roller', 'High Roller', 'Earned 500 points', '🎯')
    ON CONFLICT (user_id, community_id, achievement_key) DO NOTHING;
  END IF;

  -- Legend achievement
  IF v_points.total_points >= 1000 THEN
    INSERT INTO user_achievements (user_id, community_id, achievement_key, achievement_name, achievement_description, icon)
    VALUES (p_user_id, p_community_id, 'legend', 'Legend', 'Earned 1000 points', '👑')
    ON CONFLICT (user_id, community_id, achievement_key) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check achievements after points update
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_achievements(NEW.user_id, NEW.community_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_points_update ON user_points;
CREATE TRIGGER after_points_update
  AFTER INSERT OR UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();
