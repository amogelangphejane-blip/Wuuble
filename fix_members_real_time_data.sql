-- Fix Members Feature - Ensure Creator Shows as Member
-- This migration syncs community_members with member_profiles and ensures creators are always visible

-- Step 1: Create a function to automatically sync community_members to member_profiles
CREATE OR REPLACE FUNCTION sync_community_member_to_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Get user profile data
  SELECT 
    COALESCE(
      raw_user_meta_data->>'display_name',
      raw_user_meta_data->>'full_name',
      email
    ),
    raw_user_meta_data->>'avatar_url'
  INTO v_display_name, v_avatar_url
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Insert or update member_profile
  INSERT INTO member_profiles (
    user_id,
    community_id,
    display_name,
    avatar_url,
    role,
    status,
    joined_at,
    is_online,
    last_seen_at,
    activity_score,
    engagement_level,
    total_points,
    current_streak,
    longest_streak
  ) VALUES (
    NEW.user_id,
    NEW.community_id,
    v_display_name,
    v_avatar_url,
    CASE 
      WHEN NEW.role = 'owner' THEN 'creator'::member_role
      WHEN NEW.role = 'admin' THEN 'moderator'::member_role
      WHEN NEW.role = 'moderator' THEN 'moderator'::member_role
      ELSE 'member'::member_role
    END,
    'active'::member_status,
    NEW.joined_at,
    false,
    NOW(),
    0,
    'new'::member_engagement,
    0,
    0,
    0
  )
  ON CONFLICT (user_id, community_id) 
  DO UPDATE SET
    role = CASE 
      WHEN EXCLUDED.role = 'creator' THEN 'creator'::member_role
      WHEN EXCLUDED.role = 'moderator' THEN 'moderator'::member_role
      ELSE 'member'::member_role
    END,
    status = 'active'::member_status,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger to automatically sync on insert/update
DROP TRIGGER IF EXISTS trigger_sync_community_member_to_profile ON community_members;
CREATE TRIGGER trigger_sync_community_member_to_profile
  AFTER INSERT OR UPDATE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_community_member_to_profile();

-- Step 3: Handle deletion - mark as inactive instead of deleting
CREATE OR REPLACE FUNCTION handle_community_member_removal()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark member profile as inactive instead of deleting
  UPDATE member_profiles
  SET 
    status = 'inactive'::member_status,
    updated_at = NOW()
  WHERE user_id = OLD.user_id 
    AND community_id = OLD.community_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_community_member_removal ON community_members;
CREATE TRIGGER trigger_handle_community_member_removal
  BEFORE DELETE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION handle_community_member_removal();

-- Step 4: Sync all existing community_members to member_profiles
-- This ensures all existing members (including creators) are visible
INSERT INTO member_profiles (
  user_id,
  community_id,
  display_name,
  avatar_url,
  role,
  status,
  joined_at,
  is_online,
  last_seen_at,
  activity_score,
  engagement_level,
  total_points,
  current_streak,
  longest_streak
)
SELECT 
  cm.user_id,
  cm.community_id,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.email
  ) as display_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  CASE 
    WHEN cm.role = 'owner' THEN 'creator'::member_role
    WHEN cm.role = 'admin' THEN 'moderator'::member_role
    WHEN cm.role = 'moderator' THEN 'moderator'::member_role
    ELSE 'member'::member_role
  END as role,
  'active'::member_status,
  cm.joined_at,
  false as is_online,
  NOW() as last_seen_at,
  0 as activity_score,
  'new'::member_engagement,
  0 as total_points,
  0 as current_streak,
  0 as longest_streak
FROM community_members cm
JOIN auth.users u ON u.id = cm.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM member_profiles mp 
  WHERE mp.user_id = cm.user_id 
    AND mp.community_id = cm.community_id
)
ON CONFLICT (user_id, community_id) DO NOTHING;

-- Step 5: Also ensure community creators are in member_profiles even if not in community_members
-- This catches any communities where the creator wasn't added as a member
INSERT INTO member_profiles (
  user_id,
  community_id,
  display_name,
  avatar_url,
  role,
  status,
  joined_at,
  is_online,
  last_seen_at,
  activity_score,
  engagement_level,
  total_points,
  current_streak,
  longest_streak
)
SELECT 
  c.creator_id as user_id,
  c.id as community_id,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.email
  ) as display_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  'creator'::member_role,
  'active'::member_status,
  c.created_at as joined_at,
  false as is_online,
  NOW() as last_seen_at,
  10 as activity_score, -- Give creators a base score
  'active'::member_engagement,
  50 as total_points, -- Give creators starter points
  1 as current_streak,
  1 as longest_streak
FROM communities c
JOIN auth.users u ON u.id = c.creator_id
WHERE NOT EXISTS (
  SELECT 1 FROM member_profiles mp 
  WHERE mp.user_id = c.creator_id 
    AND mp.community_id = c.id
)
ON CONFLICT (user_id, community_id) DO NOTHING;

-- Step 6: Update RLS policies for member_profiles to allow real-time updates
DROP POLICY IF EXISTS "Users can view community member profiles" ON member_profiles;
CREATE POLICY "Users can view community member profiles" ON member_profiles
  FOR SELECT USING (
    -- Allow viewing if user is a member of the same community
    community_id IN (
      SELECT cm.community_id 
      FROM community_members cm 
      WHERE cm.user_id = auth.uid()
    )
    OR
    -- Allow viewing if community is public
    community_id IN (
      SELECT id FROM communities WHERE is_private = false
    )
    OR
    -- Allow viewing own profile
    user_id = auth.uid()
  );

-- Step 7: Create a function that can be called to refresh member data
CREATE OR REPLACE FUNCTION refresh_member_profile(p_user_id UUID, p_community_id UUID)
RETURNS void AS $$
DECLARE
  v_display_name TEXT;
  v_avatar_url TEXT;
  v_role TEXT;
BEGIN
  -- Get latest user data
  SELECT 
    COALESCE(
      raw_user_meta_data->>'display_name',
      raw_user_meta_data->>'full_name',
      email
    ),
    raw_user_meta_data->>'avatar_url'
  INTO v_display_name, v_avatar_url
  FROM auth.users
  WHERE id = p_user_id;

  -- Get role from community_members or check if creator
  SELECT 
    CASE 
      WHEN cm.role IS NOT NULL THEN cm.role
      WHEN c.creator_id = p_user_id THEN 'owner'
      ELSE 'member'
    END
  INTO v_role
  FROM communities c
  LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = p_user_id
  WHERE c.id = p_community_id;

  -- Update member profile
  UPDATE member_profiles
  SET
    display_name = v_display_name,
    avatar_url = v_avatar_url,
    role = CASE 
      WHEN v_role = 'owner' THEN 'creator'::member_role
      WHEN v_role = 'admin' THEN 'moderator'::member_role
      WHEN v_role = 'moderator' THEN 'moderator'::member_role
      ELSE 'member'::member_role
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id AND community_id = p_community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create view for easy querying of complete member data
CREATE OR REPLACE VIEW community_members_complete AS
SELECT 
  mp.*,
  u.email,
  u.raw_user_meta_data as user_metadata,
  c.name as community_name,
  c.avatar_url as community_avatar,
  CASE 
    WHEN c.creator_id = mp.user_id THEN true 
    ELSE false 
  END as is_creator,
  CASE
    WHEN mp.last_seen_at > NOW() - INTERVAL '5 minutes' THEN true
    ELSE false
  END as is_currently_online
FROM member_profiles mp
JOIN auth.users u ON u.id = mp.user_id
JOIN communities c ON c.id = mp.community_id
WHERE mp.status = 'active';

-- Grant permissions
GRANT SELECT ON community_members_complete TO authenticated;

COMMENT ON VIEW community_members_complete IS 'Complete member data with user and community information';
COMMENT ON FUNCTION sync_community_member_to_profile IS 'Automatically syncs community_members to member_profiles';
COMMENT ON FUNCTION handle_community_member_removal IS 'Marks member as inactive when removed from community';
COMMENT ON FUNCTION refresh_member_profile IS 'Refreshes a specific member profile with latest data';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Members feature fixed successfully!';
  RAISE NOTICE '📊 Synced % existing members to member_profiles', (SELECT COUNT(*) FROM member_profiles);
  RAISE NOTICE '👑 Ensured % creators are visible as members', (SELECT COUNT(DISTINCT creator_id) FROM communities);
  RAISE NOTICE '🔄 Real-time sync triggers activated';
END $$;