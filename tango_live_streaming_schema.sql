-- Tango-like Live Streaming Enhanced Schema
-- This extends the existing live_streams_schema.sql with Tango-specific features

-- Virtual Gifts System
CREATE TABLE IF NOT EXISTS virtual_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  price INTEGER NOT NULL, -- Price in coins
  animation TEXT NOT NULL, -- Animation type: 'float', 'pulse', 'flame', etc.
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Coins/Currency System
CREATE TABLE IF NOT EXISTS user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Gift Transactions
CREATE TABLE IF NOT EXISTS gift_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gift_id UUID NOT NULL REFERENCES virtual_gifts(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  total_cost INTEGER NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stream Analytics
CREATE TABLE IF NOT EXISTS stream_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- 'viewer_join', 'viewer_leave', 'chat_message', 'gift_sent', 'reaction'
  metric_value INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streamer Following System
CREATE TABLE IF NOT EXISTS streamer_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streamer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, streamer_id)
);

-- Stream Categories
CREATE TABLE IF NOT EXISTS stream_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Levels/Experience System
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  total_stream_time INTEGER DEFAULT 0, -- in seconds
  total_gifts_sent INTEGER DEFAULT 0,
  total_gifts_received INTEGER DEFAULT 0,
  is_vip BOOLEAN DEFAULT FALSE,
  vip_expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Beauty Filters
CREATE TABLE IF NOT EXISTS beauty_filters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('beauty', 'filter', 'ar')) NOT NULL,
  preview_emoji TEXT NOT NULL,
  default_intensity INTEGER DEFAULT 50,
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Filter Preferences
CREATE TABLE IF NOT EXISTS user_filter_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filter_id TEXT NOT NULL REFERENCES beauty_filters(id) ON DELETE CASCADE,
  intensity INTEGER DEFAULT 50,
  is_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, filter_id)
);

-- Stream Moderators
CREATE TABLE IF NOT EXISTS stream_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{"can_mute": true, "can_ban": true, "can_pin": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stream_id, user_id)
);

-- Notification System for Live Streams
CREATE TABLE IF NOT EXISTS stream_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streamer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  notification_type TEXT CHECK (notification_type IN ('stream_started', 'stream_scheduled', 'gift_received', 'milestone_reached')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default virtual gifts
INSERT INTO virtual_gifts (id, name, emoji, price, animation, rarity) VALUES
('gift_rose', 'Rose', '🌹', 1, 'float', 'common'),
('gift_heart', 'Heart', '💖', 5, 'pulse', 'common'),
('gift_fire', 'Fire', '🔥', 10, 'flame', 'rare'),
('gift_crown', 'Crown', '👑', 50, 'sparkle', 'epic'),
('gift_diamond', 'Diamond', '💎', 100, 'shine', 'legendary'),
('gift_rocket', 'Rocket', '🚀', 25, 'zoom', 'rare'),
('gift_trophy', 'Trophy', '🏆', 75, 'bounce', 'epic'),
('gift_star', 'Star', '⭐', 15, 'twinkle', 'rare')
ON CONFLICT (id) DO NOTHING;

-- Insert default stream categories
INSERT INTO stream_categories (id, name, icon, color, description) VALUES
('just_chatting', 'Just Chatting', 'MessageCircle', 'bg-blue-500', 'Casual conversations and interactions'),
('music', 'Music', 'Music', 'bg-purple-500', 'Musical performances and discussions'),
('gaming', 'Gaming', 'GameController2', 'bg-green-500', 'Video game streaming and gameplay'),
('art', 'Art & Creative', 'Brush', 'bg-pink-500', 'Creative content and artistic streams'),
('lifestyle', 'Lifestyle', 'Users2', 'bg-orange-500', 'Daily life and lifestyle content'),
('education', 'Education', 'Users', 'bg-indigo-500', 'Educational and learning content')
ON CONFLICT (id) DO NOTHING;

-- Insert default beauty filters
INSERT INTO beauty_filters (id, name, type, preview_emoji, default_intensity, is_premium) VALUES
('none', 'None', 'beauty', '🚫', 0, FALSE),
('smooth', 'Smooth Skin', 'beauty', '✨', 50, FALSE),
('bright', 'Brighten', 'beauty', '☀️', 30, FALSE),
('slim', 'Slim Face', 'beauty', '🔹', 25, TRUE),
('vintage', 'Vintage', 'filter', '📸', 60, FALSE),
('warm', 'Warm', 'filter', '🧡', 40, FALSE),
('cool', 'Cool', 'filter', '💙', 40, FALSE),
('dramatic', 'Dramatic', 'filter', '🎭', 70, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_transactions_stream_id ON gift_transactions(stream_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_sender_id ON gift_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_receiver_id ON gift_transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_stream_analytics_stream_id ON stream_analytics(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_analytics_metric_name ON stream_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_streamer_follows_follower_id ON streamer_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_streamer_follows_streamer_id ON streamer_follows(streamer_id);
CREATE INDEX IF NOT EXISTS idx_stream_notifications_user_id ON stream_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_notifications_is_read ON stream_notifications(is_read);

-- Create functions for common operations

-- Function to get user coin balance
CREATE OR REPLACE FUNCTION get_user_coins(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT COALESCE(balance, 0) INTO balance
  FROM user_coins
  WHERE user_id = user_uuid;
  
  IF balance IS NULL THEN
    -- Initialize user coins if not exists
    INSERT INTO user_coins (user_id, balance) VALUES (user_uuid, 1000)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN 1000;
  END IF;
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Function to update user coins
CREATE OR REPLACE FUNCTION update_user_coins(user_uuid UUID, amount INTEGER, operation TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance FROM user_coins WHERE user_id = user_uuid;
  
  -- If user doesn't exist, create with initial balance
  IF current_balance IS NULL THEN
    INSERT INTO user_coins (user_id, balance) VALUES (user_uuid, 1000);
    current_balance := 1000;
  END IF;
  
  -- Check if user has enough coins for spending
  IF operation = 'spend' AND current_balance < amount THEN
    RETURN FALSE;
  END IF;
  
  -- Update balance
  IF operation = 'spend' THEN
    UPDATE user_coins 
    SET balance = balance - amount, 
        total_spent = total_spent + amount,
        updated_at = NOW()
    WHERE user_id = user_uuid;
  ELSIF operation = 'earn' THEN
    UPDATE user_coins 
    SET balance = balance + amount, 
        total_earned = total_earned + amount,
        updated_at = NOW()
    WHERE user_id = user_uuid;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get streamer follower count
CREATE OR REPLACE FUNCTION get_follower_count(streamer_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  follower_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO follower_count
  FROM streamer_follows
  WHERE streamer_id = streamer_uuid;
  
  RETURN COALESCE(follower_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is following streamer
CREATE OR REPLACE FUNCTION is_following_streamer(follower_uuid UUID, streamer_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_following BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM streamer_follows 
    WHERE follower_id = follower_uuid AND streamer_id = streamer_uuid
  ) INTO is_following;
  
  RETURN is_following;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic analytics tracking

-- Track viewer joins
CREATE OR REPLACE FUNCTION track_viewer_join()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stream_analytics (stream_id, metric_name, metadata)
  VALUES (NEW.stream_id, 'viewer_join', jsonb_build_object('user_id', NEW.user_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_viewer_join
  AFTER INSERT ON stream_viewers
  FOR EACH ROW
  EXECUTE FUNCTION track_viewer_join();

-- Track gift sends
CREATE OR REPLACE FUNCTION track_gift_transaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stream_analytics (stream_id, metric_name, metric_value, metadata)
  VALUES (
    NEW.stream_id, 
    'gift_sent', 
    NEW.total_cost,
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'receiver_id', NEW.receiver_id,
      'gift_id', NEW.gift_id,
      'quantity', NEW.quantity
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_gift_transaction
  AFTER INSERT ON gift_transactions
  FOR EACH ROW
  EXECUTE FUNCTION track_gift_transaction();

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE virtual_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE streamer_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE beauty_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_filter_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_notifications ENABLE ROW LEVEL SECURITY;

-- Virtual gifts are public (read-only)
CREATE POLICY "Virtual gifts are viewable by everyone" ON virtual_gifts
  FOR SELECT USING (is_active = true);

-- User coins - users can only see their own
CREATE POLICY "Users can view own coins" ON user_coins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own coins" ON user_coins
  FOR UPDATE USING (auth.uid() = user_id);

-- Gift transactions - public for stream engagement
CREATE POLICY "Gift transactions are viewable by everyone" ON gift_transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can send gifts" ON gift_transactions
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Stream analytics - streamers can see their own
CREATE POLICY "Streamers can view their analytics" ON stream_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM live_streams 
      WHERE id = stream_id AND creator_id = auth.uid()
    )
  );

-- Streamer follows - users can manage their follows
CREATE POLICY "Users can view follows" ON streamer_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their follows" ON streamer_follows
  FOR ALL USING (auth.uid() = follower_id);

-- Stream categories are public
CREATE POLICY "Categories are viewable by everyone" ON stream_categories
  FOR SELECT USING (is_active = true);

-- User levels are public
CREATE POLICY "User levels are viewable by everyone" ON user_levels
  FOR SELECT USING (true);

CREATE POLICY "Users can update own level" ON user_levels
  FOR ALL USING (auth.uid() = user_id);

-- Beauty filters are public
CREATE POLICY "Beauty filters are viewable by everyone" ON beauty_filters
  FOR SELECT USING (is_active = true);

-- User filter preferences - users can manage their own
CREATE POLICY "Users can manage filter preferences" ON user_filter_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Stream moderators - streamers and moderators can view
CREATE POLICY "Stream moderators policy" ON stream_moderators
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM live_streams 
      WHERE id = stream_id AND creator_id = auth.uid()
    )
  );

-- Notifications - users can see their own
CREATE POLICY "Users can view own notifications" ON stream_notifications
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;