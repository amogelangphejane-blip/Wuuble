-- Safe Group Video Calls Migration
-- This version handles existing objects safely
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view community group calls" ON community_group_calls;
DROP POLICY IF EXISTS "Community members can create group calls" ON community_group_calls;
DROP POLICY IF EXISTS "Call creators can update group calls" ON community_group_calls;
DROP POLICY IF EXISTS "Users can view call participants" ON community_group_call_participants;
DROP POLICY IF EXISTS "Community members can join calls" ON community_group_call_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON community_group_call_participants;
DROP POLICY IF EXISTS "Users can view call events" ON community_group_call_events;
DROP POLICY IF EXISTS "Users can create call events" ON community_group_call_events;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_participant_count_trigger ON community_group_call_participants;
DROP FUNCTION IF EXISTS update_participant_count();
DROP FUNCTION IF EXISTS cleanup_inactive_calls();

-- Table to track group video call sessions
CREATE TABLE IF NOT EXISTS community_group_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'Community Video Call',
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'paused')),
  max_participants INTEGER DEFAULT 50,
  current_participants INTEGER DEFAULT 0,
  is_recording BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track participants in group calls
CREATE TABLE IF NOT EXISTS community_group_call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES community_group_calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_muted BOOLEAN DEFAULT FALSE,
  is_video_enabled BOOLEAN DEFAULT TRUE,
  is_screen_sharing BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) DEFAULT 'participant' CHECK (role IN ('host', 'moderator', 'participant')),
  connection_quality VARCHAR(20) DEFAULT 'good' CHECK (connection_quality IN ('excellent', 'good', 'poor', 'disconnected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(call_id, user_id)
);

-- Table to store group call events/logs
CREATE TABLE IF NOT EXISTS community_group_call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES community_group_calls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('user_joined', 'user_left', 'mute_toggled', 'video_toggled', 'screen_share_started', 'screen_share_stopped', 'recording_started', 'recording_stopped', 'call_ended')),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance (IF NOT EXISTS handles existing indexes)
CREATE INDEX IF NOT EXISTS idx_community_group_calls_community_id ON community_group_calls(community_id);
CREATE INDEX IF NOT EXISTS idx_community_group_calls_status ON community_group_calls(status);
CREATE INDEX IF NOT EXISTS idx_community_group_calls_started_at ON community_group_calls(started_at);

CREATE INDEX IF NOT EXISTS idx_group_call_participants_call_id ON community_group_call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_group_call_participants_user_id ON community_group_call_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_call_participants_active ON community_group_call_participants(call_id, user_id) WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_group_call_events_call_id ON community_group_call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_group_call_events_type ON community_group_call_events(event_type);
CREATE INDEX IF NOT EXISTS idx_group_call_events_created_at ON community_group_call_events(created_at);

-- Enable RLS (safe to run multiple times)
ALTER TABLE community_group_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_call_events ENABLE ROW LEVEL SECURITY;

-- Recreate all policies (now safe since we dropped them above)

-- Policy: Users can view group calls in communities they are members of
CREATE POLICY "Users can view community group calls" ON community_group_calls
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Community members can create group calls
CREATE POLICY "Community members can create group calls" ON community_group_calls
  FOR INSERT WITH CHECK (
    community_id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Call creators and moderators can update calls
CREATE POLICY "Call creators can update group calls" ON community_group_calls
  FOR UPDATE USING (
    creator_id = auth.uid() OR 
    id IN (
      SELECT call_id FROM community_group_call_participants 
      WHERE user_id = auth.uid() AND role IN ('host', 'moderator')
    )
  );

-- Policy: Users can view participants in calls they can access
CREATE POLICY "Users can view call participants" ON community_group_call_participants
  FOR SELECT USING (
    call_id IN (
      SELECT id FROM community_group_calls 
      WHERE community_id IN (
        SELECT community_id FROM community_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Community members can join calls
CREATE POLICY "Community members can join calls" ON community_group_call_participants
  FOR INSERT WITH CHECK (
    call_id IN (
      SELECT id FROM community_group_calls 
      WHERE community_id IN (
        SELECT community_id FROM community_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can update their own participant record
CREATE POLICY "Users can update their own participant record" ON community_group_call_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can view call events for calls they can access
CREATE POLICY "Users can view call events" ON community_group_call_events
  FOR SELECT USING (
    call_id IN (
      SELECT id FROM community_group_calls 
      WHERE community_id IN (
        SELECT community_id FROM community_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can create events for calls they participate in
CREATE POLICY "Users can create call events" ON community_group_call_events
  FOR INSERT WITH CHECK (
    call_id IN (
      SELECT id FROM community_group_calls 
      WHERE community_id IN (
        SELECT community_id FROM community_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to update participant count
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_group_calls 
    SET current_participants = (
      SELECT COUNT(*) 
      FROM community_group_call_participants 
      WHERE call_id = NEW.call_id AND left_at IS NULL
    )
    WHERE id = NEW.call_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle participant leaving
    IF OLD.left_at IS NULL AND NEW.left_at IS NOT NULL THEN
      UPDATE community_group_calls 
      SET current_participants = (
        SELECT COUNT(*) 
        FROM community_group_call_participants 
        WHERE call_id = NEW.call_id AND left_at IS NULL
      )
      WHERE id = NEW.call_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update participant count
CREATE TRIGGER update_participant_count_trigger
  AFTER INSERT OR UPDATE ON community_group_call_participants
  FOR EACH ROW EXECUTE FUNCTION update_participant_count();

-- Function to clean up inactive calls
CREATE OR REPLACE FUNCTION cleanup_inactive_calls()
RETURNS void AS $$
BEGIN
  -- Mark calls as ended if they have no active participants and haven't been updated in 1 hour
  UPDATE community_group_calls 
  SET status = 'ended', ended_at = NOW()
  WHERE status = 'active' 
    AND updated_at < NOW() - INTERVAL '1 hour'
    AND current_participants = 0;
END;
$$ LANGUAGE plpgsql;

-- Verification: Check that all tables exist
DO $$
BEGIN
  -- Check if all required tables exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'community_group_calls') THEN
    RAISE EXCEPTION 'Table community_group_calls was not created successfully';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'community_group_call_participants') THEN
    RAISE EXCEPTION 'Table community_group_call_participants was not created successfully';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'community_group_call_events') THEN
    RAISE EXCEPTION 'Table community_group_call_events was not created successfully';
  END IF;
  
  RAISE NOTICE 'SUCCESS: All group video call tables and policies have been created successfully!';
END;
$$;