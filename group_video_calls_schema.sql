-- Group Video Calls Schema for Communities

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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_group_calls_community_id ON community_group_calls(community_id);
CREATE INDEX IF NOT EXISTS idx_community_group_calls_status ON community_group_calls(status);
CREATE INDEX IF NOT EXISTS idx_community_group_calls_started_at ON community_group_calls(started_at);

CREATE INDEX IF NOT EXISTS idx_group_call_participants_call_id ON community_group_call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_group_call_participants_user_id ON community_group_call_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_call_participants_active ON community_group_call_participants(call_id, user_id) WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_group_call_events_call_id ON community_group_call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_group_call_events_type ON community_group_call_events(event_type);
CREATE INDEX IF NOT EXISTS idx_group_call_events_created_at ON community_group_call_events(created_at);

-- RLS Policies
ALTER TABLE community_group_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_call_events ENABLE ROW LEVEL SECURITY;

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

-- Policy: Users can join calls as participants
CREATE POLICY "Users can join group calls" ON community_group_call_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    call_id IN (
      SELECT id FROM community_group_calls 
      WHERE community_id IN (
        SELECT community_id FROM community_members 
        WHERE user_id = auth.uid()
      ) AND status = 'active'
    )
  );

-- Policy: Users can update their own participation
CREATE POLICY "Users can update their participation" ON community_group_call_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can view call events for accessible calls
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

-- Policy: Participants can create call events
CREATE POLICY "Participants can create call events" ON community_group_call_events
  FOR INSERT WITH CHECK (
    call_id IN (
      SELECT call_id FROM community_group_call_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Functions for group call management
CREATE OR REPLACE FUNCTION update_group_call_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_group_calls 
    SET current_participants = current_participants + 1,
        updated_at = NOW()
    WHERE id = NEW.call_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.left_at IS NULL AND NEW.left_at IS NOT NULL THEN
    UPDATE community_group_calls 
    SET current_participants = current_participants - 1,
        updated_at = NOW()
    WHERE id = NEW.call_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_group_calls 
    SET current_participants = current_participants - 1,
        updated_at = NOW()
    WHERE id = OLD.call_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update participant count
CREATE OR REPLACE TRIGGER update_group_call_participant_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON community_group_call_participants
  FOR EACH ROW EXECUTE FUNCTION update_group_call_participant_count();

-- Function to end inactive group calls
CREATE OR REPLACE FUNCTION end_inactive_group_calls()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE community_group_calls 
  SET status = 'ended',
      ended_at = NOW(),
      updated_at = NOW()
  WHERE status = 'active' 
    AND current_participants = 0 
    AND started_at < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;