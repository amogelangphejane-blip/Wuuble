-- Random Chat System Schema Extension
-- This extends the existing messaging system to support random chat sessions

-- Create random_chat_sessions table to track temporary chat sessions
CREATE TABLE IF NOT EXISTS public.random_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL UNIQUE,
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'abandoned')),
  end_reason TEXT CHECK (end_reason IN ('user_ended', 'partner_left', 'timeout', 'reported', 'connection_lost')),
  duration_seconds INTEGER,
  
  -- Metadata
  connection_quality JSONB DEFAULT '{}',
  preferences_1 JSONB DEFAULT '{}',
  preferences_2 JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT different_participants_random CHECK (participant_1_id != participant_2_id)
);

-- Create random_chat_messages table for temporary messages during random chats
CREATE TABLE IF NOT EXISTS public.random_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.random_chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'system')),
  
  -- Ensure content is not empty
  CONSTRAINT non_empty_content_random CHECK (LENGTH(TRIM(content)) > 0)
);

-- Create random_chat_reports table for user safety
CREATE TABLE IF NOT EXISTS public.random_chat_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.random_chat_sessions(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'inappropriate_behavior', 
    'harassment', 
    'spam', 
    'underage', 
    'fake_profile', 
    'nudity',
    'violence',
    'other'
  )),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  
  -- Prevent self-reporting
  CONSTRAINT no_self_report CHECK (reporter_id != reported_user_id)
);

-- Create random_chat_user_stats table for user behavior tracking
CREATE TABLE IF NOT EXISTS public.random_chat_user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  sessions_ended_by_user INTEGER DEFAULT 0,
  sessions_ended_by_partner INTEGER DEFAULT 0,
  times_reported INTEGER DEFAULT 0,
  times_reporting INTEGER DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_until TIMESTAMPTZ,
  ban_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_random_sessions_room_id ON public.random_chat_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_random_sessions_participants ON public.random_chat_sessions(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_random_sessions_status ON public.random_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_random_sessions_created_at ON public.random_chat_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_random_messages_session_id ON public.random_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_random_messages_created_at ON public.random_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_random_messages_sender_id ON public.random_chat_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_random_reports_reported_user ON public.random_chat_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_random_reports_status ON public.random_chat_reports(status);
CREATE INDEX IF NOT EXISTS idx_random_reports_created_at ON public.random_chat_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_random_user_stats_last_session ON public.random_chat_user_stats(last_session_at DESC);
CREATE INDEX IF NOT EXISTS idx_random_user_stats_banned ON public.random_chat_user_stats(is_banned, banned_until);

-- Function to update session duration when session ends
CREATE OR REPLACE FUNCTION update_random_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.created_at));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update session duration
DROP TRIGGER IF EXISTS trigger_update_random_session_duration ON public.random_chat_sessions;
CREATE TRIGGER trigger_update_random_session_duration
  BEFORE UPDATE ON public.random_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_random_session_duration();

-- Function to update user stats when session ends
CREATE OR REPLACE FUNCTION update_random_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND OLD.status = 'active' THEN
    -- Update stats for participant 1
    INSERT INTO public.random_chat_user_stats (
      user_id, 
      total_sessions, 
      total_minutes,
      sessions_ended_by_user,
      sessions_ended_by_partner,
      last_session_at,
      updated_at
    )
    VALUES (
      NEW.participant_1_id,
      1,
      GREATEST(COALESCE(NEW.duration_seconds, 0) / 60, 0),
      CASE WHEN NEW.end_reason = 'user_ended' THEN 1 ELSE 0 END,
      CASE WHEN NEW.end_reason = 'partner_left' THEN 1 ELSE 0 END,
      NEW.ended_at,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_sessions = random_chat_user_stats.total_sessions + 1,
      total_minutes = random_chat_user_stats.total_minutes + GREATEST(COALESCE(NEW.duration_seconds, 0) / 60, 0),
      sessions_ended_by_user = random_chat_user_stats.sessions_ended_by_user + 
        CASE WHEN NEW.end_reason = 'user_ended' THEN 1 ELSE 0 END,
      sessions_ended_by_partner = random_chat_user_stats.sessions_ended_by_partner + 
        CASE WHEN NEW.end_reason = 'partner_left' THEN 1 ELSE 0 END,
      last_session_at = NEW.ended_at,
      updated_at = NOW();

    -- Update stats for participant 2
    INSERT INTO public.random_chat_user_stats (
      user_id,
      total_sessions,
      total_minutes,
      sessions_ended_by_user,
      sessions_ended_by_partner,
      last_session_at,
      updated_at
    )
    VALUES (
      NEW.participant_2_id,
      1,
      GREATEST(COALESCE(NEW.duration_seconds, 0) / 60, 0),
      CASE WHEN NEW.end_reason = 'partner_left' THEN 1 ELSE 0 END,
      CASE WHEN NEW.end_reason = 'user_ended' THEN 1 ELSE 0 END,
      NEW.ended_at,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_sessions = random_chat_user_stats.total_sessions + 1,
      total_minutes = random_chat_user_stats.total_minutes + GREATEST(COALESCE(NEW.duration_seconds, 0) / 60, 0),
      sessions_ended_by_user = random_chat_user_stats.sessions_ended_by_user + 
        CASE WHEN NEW.end_reason = 'partner_left' THEN 1 ELSE 0 END,
      sessions_ended_by_partner = random_chat_user_stats.sessions_ended_by_partner + 
        CASE WHEN NEW.end_reason = 'user_ended' THEN 1 ELSE 0 END,
      last_session_at = NEW.ended_at,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user stats
DROP TRIGGER IF EXISTS trigger_update_random_user_stats ON public.random_chat_sessions;
CREATE TRIGGER trigger_update_random_user_stats
  AFTER UPDATE ON public.random_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_random_user_stats();

-- Function to increment report count when new report is created
CREATE OR REPLACE FUNCTION update_report_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reported user stats
  INSERT INTO public.random_chat_user_stats (user_id, times_reported, updated_at)
  VALUES (NEW.reported_user_id, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    times_reported = random_chat_user_stats.times_reported + 1,
    updated_at = NOW();
    
  -- Update reporter stats
  INSERT INTO public.random_chat_user_stats (user_id, times_reporting, updated_at)
  VALUES (NEW.reporter_id, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    times_reporting = random_chat_user_stats.times_reporting + 1,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for report stats
DROP TRIGGER IF EXISTS trigger_update_report_stats ON public.random_chat_reports;
CREATE TRIGGER trigger_update_report_stats
  AFTER INSERT ON public.random_chat_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_report_stats();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.random_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.random_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.random_chat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.random_chat_user_stats ENABLE ROW LEVEL SECURITY;

-- Random chat sessions policies
CREATE POLICY "Users can view their own random chat sessions" ON public.random_chat_sessions
  FOR SELECT USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "System can create random chat sessions" ON public.random_chat_sessions
  FOR INSERT WITH CHECK (true); -- We'll handle this through the signaling server

CREATE POLICY "Users can update their own random chat sessions" ON public.random_chat_sessions
  FOR UPDATE USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

-- Random chat messages policies
CREATE POLICY "Users can view messages from their sessions" ON public.random_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.random_chat_sessions s
      WHERE s.id = session_id
      AND (s.participant_1_id = auth.uid() OR s.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their sessions" ON public.random_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.random_chat_sessions s
      WHERE s.id = session_id
      AND (s.participant_1_id = auth.uid() OR s.participant_2_id = auth.uid())
      AND s.status = 'active'
    )
  );

-- Random chat reports policies
CREATE POLICY "Users can create reports" ON public.random_chat_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.random_chat_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Admin can view all reports (assuming admin role exists)
-- CREATE POLICY "Admins can view all reports" ON public.random_chat_reports
--   FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- User stats policies
CREATE POLICY "Users can view their own stats" ON public.random_chat_user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update user stats" ON public.random_chat_user_stats
  FOR ALL USING (true); -- This will be updated by triggers

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.random_chat_sessions TO authenticated;
GRANT SELECT, INSERT ON public.random_chat_messages TO authenticated;
GRANT SELECT, INSERT ON public.random_chat_reports TO authenticated;
GRANT SELECT ON public.random_chat_user_stats TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Function to clean up old random chat sessions (run as scheduled job)
CREATE OR REPLACE FUNCTION cleanup_old_random_sessions()
RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Mark abandoned sessions as ended (older than 1 hour and still active)
  UPDATE public.random_chat_sessions
  SET 
    status = 'ended',
    end_reason = 'timeout',
    ended_at = NOW()
  WHERE 
    status = 'active' 
    AND created_at < NOW() - INTERVAL '1 hour';
    
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Delete old ended sessions (older than 7 days) and their messages
  DELETE FROM public.random_chat_sessions
  WHERE 
    status IN ('ended', 'abandoned')
    AND ended_at < NOW() - INTERVAL '7 days';
    
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is banned from random chat
CREATE OR REPLACE FUNCTION is_user_banned_from_random_chat(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_stats RECORD;
BEGIN
  SELECT is_banned, banned_until INTO user_stats
  FROM public.random_chat_user_stats
  WHERE user_id = user_uuid;
  
  IF user_stats IS NULL THEN
    RETURN FALSE; -- User has no stats, so not banned
  END IF;
  
  IF user_stats.is_banned THEN
    -- Check if ban has expired
    IF user_stats.banned_until IS NULL OR user_stats.banned_until > NOW() THEN
      RETURN TRUE; -- User is currently banned
    ELSE
      -- Ban has expired, remove it
      UPDATE public.random_chat_user_stats
      SET is_banned = FALSE, banned_until = NULL, ban_reason = NULL
      WHERE user_id = user_uuid;
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's random chat stats
CREATE OR REPLACE FUNCTION get_random_chat_stats(user_uuid UUID)
RETURNS TABLE (
  total_sessions INTEGER,
  total_minutes INTEGER,
  average_session_minutes NUMERIC,
  sessions_ended_by_user INTEGER,
  sessions_ended_by_partner INTEGER,
  times_reported INTEGER,
  is_banned BOOLEAN,
  last_session_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.total_sessions, 0),
    COALESCE(s.total_minutes, 0),
    CASE 
      WHEN s.total_sessions > 0 THEN ROUND(s.total_minutes::NUMERIC / s.total_sessions, 2)
      ELSE 0::NUMERIC
    END,
    COALESCE(s.sessions_ended_by_user, 0),
    COALESCE(s.sessions_ended_by_partner, 0),
    COALESCE(s.times_reported, 0),
    COALESCE(s.is_banned, FALSE),
    s.last_session_at
  FROM public.random_chat_user_stats s
  WHERE s.user_id = user_uuid;
  
  -- If no stats exist, return default values
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, 0::NUMERIC, 0, 0, 0, FALSE, NULL::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql;