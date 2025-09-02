-- Create achievements system tables
-- This adds gamification features to enhance user engagement

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL, -- Emoji or icon identifier
  category VARCHAR(20) NOT NULL CHECK (category IN ('social', 'creator', 'engagement', 'milestone', 'special')),
  points INTEGER NOT NULL DEFAULT 0,
  requirement_type VARCHAR(20) NOT NULL CHECK (requirement_type IN ('count', 'streak', 'unique', 'threshold')),
  requirement_value INTEGER NOT NULL,
  requirement_metric VARCHAR(50) NOT NULL,
  badge_color VARCHAR(20) NOT NULL DEFAULT 'blue',
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  communities_joined INTEGER DEFAULT 0,
  posts_created INTEGER DEFAULT 0,
  video_calls_completed INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'social', 'system')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, points, requirement_type, requirement_value, requirement_metric, badge_color) VALUES
-- Social achievements
('First Steps', 'Join your first community', '👋', 'social', 10, 'count', 1, 'communities_joined', 'blue'),
('Social Butterfly', 'Join 5 communities', '🦋', 'social', 50, 'count', 5, 'communities_joined', 'purple'),
('Community Builder', 'Join 10 communities', '🏗️', 'social', 100, 'count', 10, 'communities_joined', 'green'),
('Super Connector', 'Join 25 communities', '🌟', 'social', 250, 'count', 25, 'communities_joined', 'gold'),

-- Engagement achievements
('First Message', 'Send your first message', '💬', 'engagement', 5, 'count', 1, 'messages_sent', 'blue'),
('Chatterbox', 'Send 100 messages', '🗣️', 'engagement', 50, 'count', 100, 'messages_sent', 'green'),
('Conversation Master', 'Send 1000 messages', '💯', 'engagement', 200, 'count', 1000, 'messages_sent', 'purple'),

-- Creator achievements
('Content Creator', 'Create your first post', '✍️', 'creator', 15, 'count', 1, 'posts_created', 'orange'),
('Prolific Poster', 'Create 10 posts', '📝', 'creator', 75, 'count', 10, 'posts_created', 'green'),
('Content King', 'Create 50 posts', '👑', 'creator', 300, 'count', 50, 'posts_created', 'gold'),

-- Video achievements
('Video Pioneer', 'Complete your first video call', '📹', 'engagement', 20, 'count', 1, 'video_calls_completed', 'red'),
('Video Enthusiast', 'Complete 10 video calls', '🎥', 'engagement', 100, 'count', 10, 'video_calls_completed', 'purple'),

-- Milestone achievements
('Point Collector', 'Earn 100 points', '💰', 'milestone', 0, 'threshold', 100, 'total_points', 'yellow'),
('Point Master', 'Earn 500 points', '💎', 'milestone', 0, 'threshold', 500, 'total_points', 'blue'),
('Point Legend', 'Earn 1000 points', '🏆', 'milestone', 0, 'threshold', 1000, 'total_points', 'gold'),

-- Streak achievements
('Consistent User', 'Maintain a 7-day streak', '🔥', 'engagement', 50, 'streak', 7, 'current_streak', 'orange'),
('Dedication Master', 'Maintain a 30-day streak', '⚡', 'engagement', 200, 'streak', 30, 'current_streak', 'red'),
('Unstoppable', 'Maintain a 100-day streak', '🚀', 'engagement', 500, 'streak', 100, 'current_streak', 'gold'),

-- Special achievements
('Early Adopter', 'One of the first 1000 users', '🌟', 'special', 100, 'unique', 1, 'user_id', 'purple'),
('Community Leader', 'Attend 10 events', '👥', 'social', 150, 'count', 10, 'events_attended', 'green');

-- Create trigger to update user stats updated_at
CREATE OR REPLACE FUNCTION update_user_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_updated_at();

-- Create function to automatically award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
BEGIN
  -- Loop through all achievements to check if user qualifies
  FOR achievement_record IN 
    SELECT * FROM achievements 
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = NEW.user_id AND achievement_id = achievements.id
    )
  LOOP
    -- Check if user meets the achievement requirement
    CASE achievement_record.requirement_type
      WHEN 'count', 'threshold' THEN
        IF (
          CASE achievement_record.requirement_metric
            WHEN 'communities_joined' THEN NEW.communities_joined
            WHEN 'posts_created' THEN NEW.posts_created
            WHEN 'video_calls_completed' THEN NEW.video_calls_completed
            WHEN 'messages_sent' THEN NEW.messages_sent
            WHEN 'events_attended' THEN NEW.events_attended
            WHEN 'total_points' THEN NEW.total_points
            ELSE 0
          END
        ) >= achievement_record.requirement_value THEN
          -- Award the achievement
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (NEW.user_id, achievement_record.id)
          ON CONFLICT (user_id, achievement_id) DO NOTHING;
          
          -- Update achievements count and points
          UPDATE user_stats 
          SET 
            achievements_unlocked = achievements_unlocked + 1,
            total_points = total_points + achievement_record.points
          WHERE user_id = NEW.user_id;
        END IF;
      
      WHEN 'streak' THEN
        IF NEW.current_streak >= achievement_record.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (NEW.user_id, achievement_record.id)
          ON CONFLICT (user_id, achievement_id) DO NOTHING;
          
          UPDATE user_stats 
          SET achievements_unlocked = achievements_unlocked + 1
          WHERE user_id = NEW.user_id;
        END IF;
    END CASE;
  END LOOP;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic achievement awarding
CREATE TRIGGER award_achievements_trigger
  AFTER UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION check_and_award_achievements();

-- Enable RLS (Row Level Security)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Achievements - public read access
CREATE POLICY "Achievements are publicly readable" ON achievements
  FOR SELECT USING (true);

-- User achievements - users can only see their own
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User stats - users can only see and update their own
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications - users can only see their own
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON achievements TO authenticated;
GRANT ALL ON user_achievements TO authenticated;
GRANT ALL ON user_stats TO authenticated;
GRANT ALL ON notifications TO authenticated;