-- Microsoft Teams-like Group Chat Schema
-- This schema supports persistent chat, threading, reactions, mentions, and file sharing

-- Chat Channels (similar to Teams channels)
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  channel_type VARCHAR(20) DEFAULT 'general' CHECK (channel_type IN ('general', 'announcement', 'private', 'direct')),
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0
);

-- Channel Members (who can access each channel)
CREATE TABLE chat_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_settings JSONB DEFAULT '{"mentions": true, "all_messages": false, "reactions": true}',
  UNIQUE(channel_id, user_id)
);

-- Chat Messages (main message table)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system', 'call_start', 'call_end')),
  parent_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE, -- For threading
  thread_root_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE, -- Points to the root of the thread
  reply_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}' -- For storing rich formatting, links, etc.
);

-- Message Reactions (like/thumbs up, etc.)
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL, -- Unicode emoji or shortcode
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Message Mentions (@username)
CREATE TABLE message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  mention_type VARCHAR(20) DEFAULT 'user' CHECK (mention_type IN ('user', 'channel', 'everyone')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(message_id, mentioned_user_id)
);

-- File Attachments
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}' -- For storing image dimensions, etc.
);

-- Message Read Status (for unread message counts)
CREATE TABLE message_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  unread_mentions_count INTEGER DEFAULT 0,
  UNIQUE(channel_id, user_id)
);

-- Typing Indicators
CREATE TABLE typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  started_typing_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 seconds'),
  UNIQUE(channel_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_chat_channels_community_id ON chat_channels(community_id);
CREATE INDEX idx_chat_channels_type ON chat_channels(channel_type);
CREATE INDEX idx_chat_channel_members_channel_id ON chat_channel_members(channel_id);
CREATE INDEX idx_chat_channel_members_user_id ON chat_channel_members(user_id);
CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_parent_id ON chat_messages(parent_message_id);
CREATE INDEX idx_chat_messages_thread_root ON chat_messages(thread_root_id);
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_mentions_user_id ON message_mentions(mentioned_user_id);
CREATE INDEX idx_message_mentions_unread ON message_mentions(mentioned_user_id) WHERE is_read = false;
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX idx_message_read_status_user_channel ON message_read_status(user_id, channel_id);
CREATE INDEX idx_typing_indicators_channel_active ON typing_indicators(channel_id) WHERE expires_at > NOW();

-- Functions for updating counters
CREATE OR REPLACE FUNCTION update_channel_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_channels 
    SET member_count = member_count + 1 
    WHERE id = NEW.channel_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chat_channels 
    SET member_count = member_count - 1 
    WHERE id = OLD.channel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_message_id IS NOT NULL THEN
    UPDATE chat_messages 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_message_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_message_id IS NOT NULL THEN
    UPDATE chat_messages 
    SET reply_count = reply_count - 1 
    WHERE id = OLD.parent_message_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_message_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.content != OLD.content THEN
    NEW.is_edited = true;
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER channel_member_count_trigger
  AFTER INSERT OR DELETE ON chat_channel_members
  FOR EACH ROW EXECUTE FUNCTION update_channel_member_count();

CREATE TRIGGER message_reply_count_trigger
  AFTER INSERT OR DELETE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_reply_count();

CREATE TRIGGER message_update_timestamp_trigger
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_message_timestamps();

-- Row Level Security (RLS) Policies
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_channels
CREATE POLICY "Users can view channels they are members of" ON chat_channels
  FOR SELECT USING (
    id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Community creators can create channels" ON chat_channels
  FOR INSERT WITH CHECK (
    community_id IN (SELECT id FROM communities WHERE creator_id = auth.uid())
    OR auth.uid() IN (SELECT user_id FROM community_members WHERE community_id = chat_channels.community_id AND role IN ('admin', 'moderator'))
  );

-- RLS Policies for chat_channel_members
CREATE POLICY "Users can view channel members for channels they belong to" ON chat_channel_members
  FOR SELECT USING (
    channel_id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid())
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in channels they are members of" ON chat_messages
  FOR SELECT USING (
    channel_id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert messages in channels they are members of" ON chat_messages
  FOR INSERT WITH CHECK (
    channel_id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions on messages they can see" ON message_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM chat_messages 
      WHERE channel_id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add reactions to messages they can see" ON message_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND message_id IN (
      SELECT id FROM chat_messages 
      WHERE channel_id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid())
    )
  );

-- Create default general channel for existing communities
INSERT INTO chat_channels (community_id, name, description, channel_type, created_by)
SELECT 
  id, 
  'General', 
  'General discussion for the community',
  'general',
  creator_id
FROM communities
WHERE NOT EXISTS (
  SELECT 1 FROM chat_channels WHERE community_id = communities.id AND name = 'General'
);

-- Add all community members to the general channel
INSERT INTO chat_channel_members (channel_id, user_id, role)
SELECT 
  cc.id,
  cm.user_id,
  CASE 
    WHEN cm.role = 'admin' THEN 'owner'
    WHEN cm.role = 'moderator' THEN 'moderator'
    ELSE 'member'
  END
FROM chat_channels cc
JOIN communities c ON cc.community_id = c.id
JOIN community_members cm ON c.id = cm.community_id
WHERE cc.name = 'General'
ON CONFLICT (channel_id, user_id) DO NOTHING;