-- Ensure all existing users have profiles with proper display names
-- This migration creates profiles for any users who don't have them

-- First, create profiles for users who don't have them
INSERT INTO public.profiles (user_id, display_name, created_at, updated_at)
SELECT 
  au.id as user_id,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1),
    'User'
  ) as display_name,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
  AND au.email IS NOT NULL;

-- Update profiles that have null or empty display names
UPDATE public.profiles 
SET display_name = COALESCE(
    (SELECT au.raw_user_meta_data->>'display_name' FROM auth.users au WHERE au.id = profiles.user_id),
    (SELECT au.raw_user_meta_data->>'full_name' FROM auth.users au WHERE au.id = profiles.user_id),
    (SELECT split_part(au.email, '@', 1) FROM auth.users au WHERE au.id = profiles.user_id),
    'User'
  ),
  updated_at = NOW()
WHERE display_name IS NULL 
   OR display_name = '' 
   OR trim(display_name) = '';

-- Add avatar_url from user metadata if not set
UPDATE public.profiles 
SET avatar_url = COALESCE(
    (SELECT au.raw_user_meta_data->>'avatar_url' FROM auth.users au WHERE au.id = profiles.user_id),
    (SELECT au.raw_user_meta_data->>'picture' FROM auth.users au WHERE au.id = profiles.user_id)
  ),
  updated_at = NOW()
WHERE avatar_url IS NULL 
  AND EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = profiles.user_id 
    AND (
      au.raw_user_meta_data->>'avatar_url' IS NOT NULL 
      OR au.raw_user_meta_data->>'picture' IS NOT NULL
    )
  );

-- Create a function to ensure profile exists for any user
CREATE OR REPLACE FUNCTION public.ensure_user_profile(target_user_id UUID)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_profile public.profiles;
  user_data record;
BEGIN
  -- First try to get existing profile
  SELECT * INTO user_profile 
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  -- If profile doesn't exist, create it
  IF NOT FOUND THEN
    -- Get user data from auth.users
    SELECT * INTO user_data 
    FROM auth.users 
    WHERE id = target_user_id;
    
    IF FOUND THEN
      INSERT INTO public.profiles (user_id, display_name, avatar_url, created_at, updated_at)
      VALUES (
        target_user_id,
        COALESCE(
          user_data.raw_user_meta_data->>'display_name',
          user_data.raw_user_meta_data->>'full_name',
          split_part(user_data.email, '@', 1),
          'User'
        ),
        COALESCE(
          user_data.raw_user_meta_data->>'avatar_url',
          user_data.raw_user_meta_data->>'picture'
        ),
        user_data.created_at,
        NOW()
      )
      RETURNING * INTO user_profile;
    END IF;
  ELSE
    -- Update profile if display_name is null/empty
    IF user_profile.display_name IS NULL OR trim(user_profile.display_name) = '' THEN
      SELECT * INTO user_data 
      FROM auth.users 
      WHERE id = target_user_id;
      
      IF FOUND THEN
        UPDATE public.profiles 
        SET display_name = COALESCE(
            user_data.raw_user_meta_data->>'display_name',
            user_data.raw_user_meta_data->>'full_name',
            split_part(user_data.email, '@', 1),
            'User'
          ),
          updated_at = NOW()
        WHERE user_id = target_user_id
        RETURNING * INTO user_profile;
      END IF;
    END IF;
  END IF;
  
  RETURN user_profile;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(UUID) TO authenticated;