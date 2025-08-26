-- Enhanced Members Feature Migration
-- This migration adds new fields and tables to improve the community members functionality

-- Add new fields to community_members table
ALTER TABLE community_members 
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS member_bio TEXT,
ADD COLUMN IF NOT EXISTS member_badges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "new_posts": true,
  "events": true,
  "mentions": true,
  "direct_messages": true
}'::jsonb,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Create member activity tracking table
CREATE TABLE IF NOT EXISTS member_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'post', 'comment', 'event_join', 'call_join', etc.
  activity_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create member invitations table
CREATE TABLE IF NOT EXISTS member_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  email VARCHAR(255),
  invite_code VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create member badges table
CREATE TABLE IF NOT EXISTS member_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(7) DEFAULT '#3B82F6',
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  criteria JSONB DEFAULT '{}'::jsonb, -- Criteria for earning the badge
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create member badge assignments table
CREATE TABLE IF NOT EXISTS member_badge_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES community_members(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES member_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  awarded_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  UNIQUE(member_id, badge_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_activities_community_user ON member_activities(community_id, user_id);
CREATE INDEX IF NOT EXISTS idx_member_activities_type ON member_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_member_activities_created_at ON member_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_members_last_active ON community_members(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_members_online ON community_members(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_member_invitations_code ON member_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_member_invitations_email ON member_invitations(email);

-- Create function to update last_active_at
CREATE OR REPLACE FUNCTION update_member_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_members 
  SET last_active_at = NOW()
  WHERE user_id = NEW.user_id 
    AND community_id = NEW.community_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_active_at when member posts
CREATE TRIGGER trigger_update_member_activity
  AFTER INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_member_last_active();

-- Add RLS policies
ALTER TABLE member_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badge_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for member_activities
CREATE POLICY "Members can view activities in their communities" ON member_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = member_activities.community_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create their own activities" ON member_activities
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies for member_invitations
CREATE POLICY "Community creators and moderators can manage invitations" ON member_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      JOIN communities c ON c.id = cm.community_id
      WHERE cm.community_id = member_invitations.community_id
        AND cm.user_id = auth.uid()
        AND (cm.role IN ('creator', 'moderator') OR c.creator_id = auth.uid())
    )
  );

CREATE POLICY "Anyone can view invitations they received" ON member_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_by = auth.uid()
  );

-- Policies for member_badges
CREATE POLICY "Members can view badges in their communities" ON member_badges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = member_badges.community_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Community creators and moderators can manage badges" ON member_badges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      JOIN communities c ON c.id = cm.community_id
      WHERE cm.community_id = member_badges.community_id
        AND cm.user_id = auth.uid()
        AND (cm.role IN ('creator', 'moderator') OR c.creator_id = auth.uid())
    )
  );

-- Policies for member_badge_assignments
CREATE POLICY "Members can view badge assignments in their communities" ON member_badge_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      JOIN member_badge_assignments mba ON mba.member_id = cm.id
      WHERE cm.community_id IN (
        SELECT community_id FROM community_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Community creators and moderators can assign badges" ON member_badge_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members cm
      JOIN member_badges mb ON mb.id = badge_id
      WHERE cm.community_id = mb.community_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('creator', 'moderator')
    )
  );

-- Add some default badges for communities
INSERT INTO member_badges (name, description, icon, color, community_id, criteria)
SELECT 
  'Founding Member',
  'One of the first members to join this community',
  '🏆',
  '#FFD700',
  c.id,
  '{"type": "founding_member", "max_member_number": 10}'
FROM communities c
WHERE NOT EXISTS (
  SELECT 1 FROM member_badges mb 
  WHERE mb.community_id = c.id AND mb.name = 'Founding Member'
);

INSERT INTO member_badges (name, description, icon, color, community_id, criteria)
SELECT 
  'Active Contributor',
  'Regularly participates in community discussions',
  '⭐',
  '#3B82F6',
  c.id,
  '{"type": "activity_based", "min_posts": 10, "time_period": "30_days"}'
FROM communities c
WHERE NOT EXISTS (
  SELECT 1 FROM member_badges mb 
  WHERE mb.community_id = c.id AND mb.name = 'Active Contributor'
);

INSERT INTO member_badges (name, description, icon, color, community_id, criteria)
SELECT 
  'Helpful Member',
  'Consistently helps other community members',
  '🤝',
  '#10B981',
  c.id,
  '{"type": "engagement_based", "min_helpful_reactions": 25}'
FROM communities c
WHERE NOT EXISTS (
  SELECT 1 FROM member_badges mb 
  WHERE mb.community_id = c.id AND mb.name = 'Helpful Member'
);