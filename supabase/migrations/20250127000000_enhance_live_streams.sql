-- Migration: Enhance Live Streams with Instagram Live-like Features
-- Date: 2025-01-27
-- Description: Adds polls, Q&A, enhanced chat, reactions, and more interactive features

-- First, let's add new columns to existing live_streams table
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS peak_viewers INTEGER DEFAULT 0;
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0;
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS total_reactions INTEGER DEFAULT 0;
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"qa_mode": false, "polls_enabled": true, "reactions_enabled": true, "chat_moderation": false}';

-- Enhance stream_viewers table
ALTER TABLE stream_viewers ADD COLUMN IF NOT EXISTS watch_time_seconds INTEGER DEFAULT 0;
ALTER TABLE stream_viewers ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE stream_viewers ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';

-- Enhance stream_chat table
ALTER TABLE stream_chat ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE stream_chat ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE stream_chat ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE stream_chat ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT FALSE;
ALTER TABLE stream_chat ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE stream_chat ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update message_type constraint
ALTER TABLE stream_chat DROP CONSTRAINT IF EXISTS stream_chat_message_type_check;
ALTER TABLE stream_chat ADD CONSTRAINT stream_chat_message_type_check 
  CHECK (message_type IN ('text', 'emoji', 'system', 'question'));

-- Enhance stream_reactions table
ALTER TABLE stream_reactions DROP CONSTRAINT IF EXISTS stream_reactions_reaction_type_check;
ALTER TABLE stream_reactions DROP CONSTRAINT IF EXISTS stream_reactions_stream_id_user_id_reaction_type_key;
ALTER TABLE stream_reactions ADD COLUMN IF NOT EXISTS position_x FLOAT;
ALTER TABLE stream_reactions ADD COLUMN IF NOT EXISTS position_y FLOAT;
ALTER TABLE stream_reactions ADD COLUMN IF NOT EXISTS duration_ms INTEGER DEFAULT 3000;

-- Create stream_questions table (new for Q&A)
CREATE TABLE IF NOT EXISTS stream_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMPTZ,
  answered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  answer_text TEXT,
  likes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stream_polls table (new)
CREATE TABLE IF NOT EXISTS stream_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- array of poll options
  votes JSONB DEFAULT '{}', -- votes count per option
  total_votes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  ends_at TIMESTAMPTZ,
  allow_multiple_votes BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stream_poll_votes table (new)
CREATE TABLE IF NOT EXISTS stream_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES stream_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- prevent duplicate votes unless allow_multiple_votes is true
);

-- Create stream_highlights table (new for memorable moments)
CREATE TABLE IF NOT EXISTS stream_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  timestamp_start INTEGER NOT NULL, -- seconds from stream start
  timestamp_end INTEGER NOT NULL, -- seconds from stream start
  thumbnail_url TEXT,
  clip_url TEXT,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stream_moderators table (new for moderation)
CREATE TABLE IF NOT EXISTS stream_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{"can_delete_messages": true, "can_timeout_users": true, "can_pin_messages": true}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stream_id, user_id)
);

-- Create stream_analytics table (new for insights)
CREATE TABLE IF NOT EXISTS stream_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'viewer_join', 'viewer_leave', 'message_sent', 'reaction_sent', etc.
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Add new indexes
CREATE INDEX IF NOT EXISTS idx_stream_chat_pinned ON stream_chat(stream_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_stream_chat_type ON stream_chat(stream_id, message_type);

CREATE INDEX IF NOT EXISTS idx_stream_questions_stream ON stream_questions(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_questions_answered ON stream_questions(stream_id, is_answered);
CREATE INDEX IF NOT EXISTS idx_stream_questions_likes ON stream_questions(stream_id, likes DESC);

CREATE INDEX IF NOT EXISTS idx_stream_polls_stream ON stream_polls(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_polls_active ON stream_polls(stream_id, is_active);

CREATE INDEX IF NOT EXISTS idx_stream_poll_votes_poll ON stream_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_stream_poll_votes_user ON stream_poll_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_stream_highlights_stream ON stream_highlights(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_highlights_public ON stream_highlights(is_public, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stream_moderators_stream ON stream_moderators(stream_id, is_active);

CREATE INDEX IF NOT EXISTS idx_stream_analytics_stream ON stream_analytics(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_analytics_timestamp ON stream_analytics(timestamp);

-- Enhanced trigger functions
CREATE OR REPLACE FUNCTION update_stream_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = TRUE THEN
    UPDATE live_streams 
    SET viewer_count = viewer_count + 1,
        peak_viewers = GREATEST(peak_viewers, viewer_count + 1)
    WHERE id = NEW.stream_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
      UPDATE live_streams 
      SET viewer_count = GREATEST(0, viewer_count - 1)
      WHERE id = NEW.stream_id;
    ELSIF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
      UPDATE live_streams 
      SET viewer_count = viewer_count + 1,
          peak_viewers = GREATEST(peak_viewers, viewer_count + 1)
      WHERE id = NEW.stream_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.is_active = TRUE THEN
    UPDATE live_streams 
    SET viewer_count = GREATEST(0, viewer_count - 1)
    WHERE id = OLD.stream_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_stream_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.message_type IN ('text', 'emoji') THEN
    UPDATE live_streams 
    SET total_messages = total_messages + 1
    WHERE id = NEW.stream_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_stream_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE live_streams 
    SET total_reactions = total_reactions + 1
    WHERE id = NEW.stream_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_poll_vote_count()
RETURNS TRIGGER AS $$
DECLARE
  poll_record stream_polls%ROWTYPE;
  new_votes JSONB;
  option_key TEXT;
BEGIN
  SELECT * INTO poll_record FROM stream_polls WHERE id = NEW.poll_id;
  
  new_votes := poll_record.votes;
  option_key := NEW.selected_option;
  
  -- Update vote count for the selected option
  new_votes := jsonb_set(
    new_votes, 
    ARRAY[option_key], 
    to_jsonb(COALESCE((new_votes->option_key)::INTEGER, 0) + 1)
  );
  
  UPDATE stream_polls 
  SET votes = new_votes,
      total_votes = total_votes + 1
  WHERE id = NEW.poll_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate triggers with new functions
DROP TRIGGER IF EXISTS trigger_update_stream_message_count ON stream_chat;
CREATE TRIGGER trigger_update_stream_message_count
  AFTER INSERT ON stream_chat
  FOR EACH ROW EXECUTE FUNCTION update_stream_message_count();

DROP TRIGGER IF EXISTS trigger_update_stream_reaction_count ON stream_reactions;
CREATE TRIGGER trigger_update_stream_reaction_count
  AFTER INSERT ON stream_reactions
  FOR EACH ROW EXECUTE FUNCTION update_stream_reaction_count();

DROP TRIGGER IF EXISTS trigger_update_poll_vote_count ON stream_poll_votes;
CREATE TRIGGER trigger_update_poll_vote_count
  AFTER INSERT ON stream_poll_votes
  FOR EACH ROW EXECUTE FUNCTION update_poll_vote_count();

-- Enable RLS on new tables
ALTER TABLE stream_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables

-- Stream Questions Policies
CREATE POLICY "Users can view questions in accessible streams" ON stream_questions
  FOR SELECT USING (
    stream_id IN (
      SELECT ls.id FROM live_streams ls
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid() AND cm.status = 'approved'
    )
  );

CREATE POLICY "Users can submit questions in accessible streams" ON stream_questions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    stream_id IN (
      SELECT ls.id FROM live_streams ls
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid() AND cm.status = 'approved'
    )
  );

CREATE POLICY "Users can update their own questions" ON stream_questions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Stream creators can update any question in their stream" ON stream_questions
  FOR UPDATE USING (
    stream_id IN (SELECT id FROM live_streams WHERE creator_id = auth.uid())
  );

-- Stream Polls Policies
CREATE POLICY "Users can view polls in accessible streams" ON stream_polls
  FOR SELECT USING (
    stream_id IN (
      SELECT ls.id FROM live_streams ls
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid() AND cm.status = 'approved'
    )
  );

CREATE POLICY "Stream creators can manage polls in their streams" ON stream_polls
  FOR ALL USING (
    stream_id IN (SELECT id FROM live_streams WHERE creator_id = auth.uid())
  );

-- Stream Poll Votes Policies
CREATE POLICY "Users can view poll votes in accessible streams" ON stream_poll_votes
  FOR SELECT USING (
    poll_id IN (
      SELECT sp.id FROM stream_polls sp
      JOIN live_streams ls ON sp.stream_id = ls.id
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid() AND cm.status = 'approved'
    )
  );

CREATE POLICY "Users can vote in accessible polls" ON stream_poll_votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    poll_id IN (
      SELECT sp.id FROM stream_polls sp
      JOIN live_streams ls ON sp.stream_id = ls.id
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid() AND cm.status = 'approved'
    )
  );

-- Stream Highlights Policies
CREATE POLICY "Users can view public highlights" ON stream_highlights
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view highlights in accessible streams" ON stream_highlights
  FOR SELECT USING (
    stream_id IN (
      SELECT ls.id FROM live_streams ls
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid() AND cm.status = 'approved'
    )
  );

CREATE POLICY "Stream creators can manage highlights in their streams" ON stream_highlights
  FOR ALL USING (
    stream_id IN (SELECT id FROM live_streams WHERE creator_id = auth.uid())
  );

-- Stream Moderators Policies
CREATE POLICY "Users can view moderators in accessible streams" ON stream_moderators
  FOR SELECT USING (
    stream_id IN (
      SELECT ls.id FROM live_streams ls
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid() AND cm.status = 'approved'
    )
  );

CREATE POLICY "Stream creators can manage moderators" ON stream_moderators
  FOR ALL USING (
    stream_id IN (SELECT id FROM live_streams WHERE creator_id = auth.uid())
  );

-- Stream Analytics Policies
CREATE POLICY "Stream creators can view analytics for their streams" ON stream_analytics
  FOR SELECT USING (
    stream_id IN (SELECT id FROM live_streams WHERE creator_id = auth.uid())
  );

CREATE POLICY "System can insert analytics" ON stream_analytics
  FOR INSERT WITH CHECK (true); -- Allow system inserts

-- Grant permissions on new tables
GRANT ALL ON stream_questions TO authenticated;
GRANT ALL ON stream_polls TO authenticated;
GRANT ALL ON stream_poll_votes TO authenticated;
GRANT ALL ON stream_highlights TO authenticated;
GRANT ALL ON stream_moderators TO authenticated;
GRANT ALL ON stream_analytics TO authenticated;