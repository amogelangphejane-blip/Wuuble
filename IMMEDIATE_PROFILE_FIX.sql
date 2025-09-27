-- IMMEDIATE FIX for Profile Display Names
-- Run this in your Supabase SQL Editor

-- Step 1: Check current state of profiles
SELECT 
    'Current profiles with issues:' as info,
    COUNT(*) as count
FROM public.profiles 
WHERE display_name IS NULL OR display_name = '';

-- Step 2: Show what will be updated
SELECT 
    p.user_id,
    p.display_name as current_display_name,
    u.email,
    SPLIT_PART(u.email, '@', 1) as new_display_name
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE (p.display_name IS NULL OR p.display_name = '')
AND u.email IS NOT NULL
LIMIT 10;

-- Step 3: UPDATE ALL PROFILES with missing display names
UPDATE public.profiles 
SET 
    display_name = SPLIT_PART(
        (SELECT email FROM auth.users WHERE id = profiles.user_id), 
        '@', 
        1
    ),
    updated_at = NOW()
WHERE (display_name IS NULL OR display_name = '')
  AND user_id IN (SELECT id FROM auth.users WHERE email IS NOT NULL);

-- Step 4: Verify the fix worked
SELECT 
    'Profiles fixed:' as info,
    COUNT(*) as count
FROM public.profiles 
WHERE display_name IS NOT NULL AND display_name != '';

-- Step 5: Show updated profiles
SELECT 
    user_id,
    display_name,
    updated_at
FROM public.profiles 
WHERE updated_at >= NOW() - INTERVAL '1 minute'
ORDER BY updated_at DESC
LIMIT 10;

-- Step 6: Create/update the trigger function for future users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, age, gender)
  VALUES (
    NEW.id, 
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'display_name'), ''),
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    ),
    CAST(NEW.raw_user_meta_data ->> 'age' AS INTEGER),
    NEW.raw_user_meta_data ->> 'gender'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    display_name = COALESCE(
      EXCLUDED.display_name,
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Final verification
SELECT 
    'Summary:' as status,
    COUNT(CASE WHEN display_name IS NOT NULL AND display_name != '' THEN 1 END) as profiles_with_names,
    COUNT(CASE WHEN display_name IS NULL OR display_name = '' THEN 1 END) as profiles_without_names,
    COUNT(*) as total_profiles
FROM public.profiles;