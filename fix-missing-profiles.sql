-- Fix Missing Profiles for Community Members
-- This script ensures that all users in community_members have corresponding profiles

-- Insert missing profiles for existing community members
INSERT INTO profiles (user_id, display_name, avatar_url, bio, created_at, updated_at)
SELECT DISTINCT 
  cm.user_id,
  COALESCE(
    (au.raw_user_meta_data ->> 'display_name'),
    (au.raw_user_meta_data ->> 'full_name'),
    SPLIT_PART(au.email, '@', 1),
    'Member'
  ) as display_name,
  (au.raw_user_meta_data ->> 'avatar_url') as avatar_url,
  NULL as bio,
  NOW() as created_at,
  NOW() as updated_at
FROM community_members cm
JOIN auth.users au ON au.id = cm.user_id
LEFT JOIN profiles p ON p.user_id = cm.user_id
WHERE p.user_id IS NULL;

-- Update any existing profiles that have null display names
UPDATE profiles 
SET 
  display_name = COALESCE(
    (SELECT au.raw_user_meta_data ->> 'display_name' FROM auth.users au WHERE au.id = profiles.user_id),
    (SELECT au.raw_user_meta_data ->> 'full_name' FROM auth.users au WHERE au.id = profiles.user_id),
    (SELECT SPLIT_PART(au.email, '@', 1) FROM auth.users au WHERE au.id = profiles.user_id),
    'Member'
  ),
  updated_at = NOW()
WHERE display_name IS NULL OR display_name = '';

-- Update any existing profiles that have null avatar_url from user metadata
UPDATE profiles 
SET 
  avatar_url = (SELECT au.raw_user_meta_data ->> 'avatar_url' FROM auth.users au WHERE au.id = profiles.user_id),
  updated_at = NOW()
WHERE avatar_url IS NULL 
  AND EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = profiles.user_id 
    AND au.raw_user_meta_data ->> 'avatar_url' IS NOT NULL
  );