-- Enhanced Members Feature - Complete Database Schema
-- This creates all tables needed for the modern members system

-- Enable RLS (Row Level Security) if not already enabled
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-secret-jwt-token-with-at-least-32-characters-long';

-- Create enhanced member profiles with real-time features
CREATE TABLE IF NOT EXISTS member_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  
  -- Basic Profile Info
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  location VARCHAR(100),
  website_url TEXT,
  
  -- Member Status & Role
  role member_role DEFAULT 'member',
  status member_status DEFAULT 'active',
  
  -- Real-time Presence
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  presence_data JSONB DEFAULT '{}',
  
  -- Membership Info
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  invitation_accepted_at TIMESTAMPTZ,
  
  -- Activity & Engagement
  activity_score INTEGER DEFAULT 0,
  engagement_level member_engagement DEFAULT 'new',
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{
    "new_posts": true,
    "mentions": true,
    "direct_messages": true,
    "events": true,
    "badges": true
  }',
  privacy_settings JSONB DEFAULT '{
    "profile_visibility": "community",
    "activity_visibility": "community",
    "contact_visibility": "members"
  }',
  
  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, community_id)
);

-- Create member activity tracking
CREATE TABLE IF NOT EXISTS member_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES member_profiles(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  
  -- Activity Details
  activity_type activity_type NOT NULL,
  activity_subtype VARCHAR(50),
  activity_data JSONB DEFAULT '{}',
  
  -- Scoring
  points_earned INTEGER DEFAULT 0,
  engagement_weight NUMERIC DEFAULT 1.0,
  
  -- Context
  related_entity_id UUID,
  related_entity_type VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create member badges system
CREATE TABLE IF NOT EXISTS member_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  
  -- Badge Info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '🏆',
  color VARCHAR(7) DEFAULT '#3B82F6',
  
  -- Badge Logic
  badge_type badge_type DEFAULT 'achievement',
  criteria JSONB NOT NULL,
  rarity badge_rarity DEFAULT 'common',
  
  -- Display
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create member badge assignments
CREATE TABLE IF NOT EXISTS member_badge_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES member_profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES member_badges(id) ON DELETE CASCADE,
  
  -- Assignment Info
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  awarded_by UUID REFERENCES auth.users(id),
  
  -- Progress (for progressive badges)
  progress NUMERIC DEFAULT 100.0,
  progress_data JSONB DEFAULT '{}',
  
  UNIQUE(member_id, badge_id)
);

-- Create member relationships (following, blocking, etc.)
CREATE TABLE IF NOT EXISTS member_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_member_id UUID REFERENCES member_profiles(id) ON DELETE CASCADE,
  to_member_id UUID REFERENCES member_profiles(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  
  -- Relationship Type
  relationship_type relationship_type NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(from_member_id, to_member_id, community_id, relationship_type)
);

-- Create member invitations
CREATE TABLE IF NOT EXISTS member_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  
  -- Invitation Details
  email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  role member_role DEFAULT 'member',
  
  -- Invitation Code
  invite_code VARCHAR(32) UNIQUE NOT NULL,
  
  -- Status
  status invitation_status DEFAULT 'pending',
  
  -- Usage
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  
  -- Expiration
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Custom Message
  personal_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create member analytics snapshots
CREATE TABLE IF NOT EXISTS member_analytics_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  
  -- Snapshot Date
  snapshot_date DATE DEFAULT CURRENT_DATE,
  
  -- Member Counts
  total_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  online_members INTEGER DEFAULT 0,
  
  -- Engagement Metrics
  avg_activity_score NUMERIC DEFAULT 0,
  total_activities INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  
  -- Role Distribution
  creators_count INTEGER DEFAULT 0,
  moderators_count INTEGER DEFAULT 0,
  members_count INTEGER DEFAULT 0,
  
  -- Additional Metrics
  badges_awarded INTEGER DEFAULT 0,
  invitations_sent INTEGER DEFAULT 0,
  
  -- Raw Data
  detailed_metrics JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(community_id, snapshot_date)
);

-- Create required ENUMs if they don't exist
DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('member', 'moderator', 'creator');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE member_status AS ENUM ('active', 'inactive', 'banned', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE member_engagement AS ENUM ('new', 'casual', 'regular', 'active', 'champion');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM ('post_created', 'comment_created', 'reaction_added', 'event_joined', 'call_joined', 'badge_earned', 'member_invited', 'profile_updated', 'login', 'view_content');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE badge_type AS ENUM ('achievement', 'milestone', 'special', 'seasonal');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE badge_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE relationship_type AS ENUM ('following', 'blocked', 'favorite');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_profiles_community ON member_profiles(community_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_user ON member_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_online ON member_profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_member_profiles_activity ON member_profiles(activity_score DESC);
CREATE INDEX IF NOT EXISTS idx_member_profiles_joined ON member_profiles(joined_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_activities_member ON member_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_member_activities_community ON member_activities(community_id);
CREATE INDEX IF NOT EXISTS idx_member_activities_type ON member_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_member_activities_occurred ON member_activities(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_badges_community ON member_badges(community_id);
CREATE INDEX IF NOT EXISTS idx_member_badge_assignments_member ON member_badge_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_member_badge_assignments_badge ON member_badge_assignments(badge_id);

CREATE INDEX IF NOT EXISTS idx_member_relationships_from ON member_relationships(from_member_id);
CREATE INDEX IF NOT EXISTS idx_member_relationships_to ON member_relationships(to_member_id);
CREATE INDEX IF NOT EXISTS idx_member_relationships_community ON member_relationships(community_id);

CREATE INDEX IF NOT EXISTS idx_member_invitations_code ON member_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_member_invitations_email ON member_invitations(email);
CREATE INDEX IF NOT EXISTS idx_member_invitations_community ON member_invitations(community_id);

-- Enable RLS on all tables
ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for member_profiles
CREATE POLICY "Users can view community member profiles" ON member_profiles
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM member_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON member_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Community creators can manage all profiles" ON member_profiles
  FOR ALL USING (
    community_id IN (
      SELECT id FROM communities 
      WHERE creator_id = auth.uid()
    )
  );

-- Create RLS policies for member_activities
CREATE POLICY "Users can view community activities" ON member_activities
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM member_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own activities" ON member_activities
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM member_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Create functions for real-time updates
CREATE OR REPLACE FUNCTION update_member_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.is_online = true THEN
    NEW.last_seen_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_last_seen
  BEFORE UPDATE ON member_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_member_last_seen();

-- Create function to calculate activity scores
CREATE OR REPLACE FUNCTION calculate_member_activity_score(member_profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  activity_count INTEGER;
  recent_activity_count INTEGER;
  badge_count INTEGER;
  days_since_joined INTEGER;
BEGIN
  -- Get basic activity count (last 30 days)
  SELECT COUNT(*) INTO activity_count
  FROM member_activities
  WHERE member_id = member_profile_id
    AND occurred_at > NOW() - INTERVAL '30 days';
  
  -- Get recent activity count (last 7 days)
  SELECT COUNT(*) INTO recent_activity_count
  FROM member_activities
  WHERE member_id = member_profile_id
    AND occurred_at > NOW() - INTERVAL '7 days';
  
  -- Get badge count
  SELECT COUNT(*) INTO badge_count
  FROM member_badge_assignments
  WHERE member_id = member_profile_id;
  
  -- Get days since joined
  SELECT EXTRACT(DAY FROM NOW() - joined_at)::INTEGER INTO days_since_joined
  FROM member_profiles
  WHERE id = member_profile_id;
  
  -- Calculate score (0-100)
  score := LEAST(100, 
    (activity_count * 2) + 
    (recent_activity_count * 5) + 
    (badge_count * 10) +
    CASE 
      WHEN days_since_joined > 0 THEN LEAST(20, days_since_joined)
      ELSE 0
    END
  );
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;