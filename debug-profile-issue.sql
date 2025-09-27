-- Debug script to check profile table and policies
-- Run this in your Supabase SQL Editor to understand the issue

-- 1. Check if profiles table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current profiles data
SELECT 
    user_id,
    display_name,
    avatar_url,
    bio,
    created_at,
    updated_at
FROM public.profiles
LIMIT 10;

-- 3. Check profiles with null display names
SELECT 
    p.user_id,
    p.display_name,
    p.avatar_url,
    u.email,
    SPLIT_PART(u.email, '@', 1) as suggested_display_name
FROM public.profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.display_name IS NULL OR p.display_name = ''
LIMIT 10;

-- 4. Check RLS policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Test if we can update a profile (replace 'YOUR_USER_ID' with actual user ID)
-- SELECT 'Ready to test update - replace YOUR_USER_ID below';
-- UPDATE public.profiles 
-- SET display_name = SPLIT_PART((SELECT email FROM auth.users WHERE id = 'YOUR_USER_ID'), '@', 1)
-- WHERE user_id = 'YOUR_USER_ID';

-- 6. Check the handle_new_user function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- 7. Check auth.users table structure (what data is available)
SELECT 
    id,
    email,
    raw_user_meta_data,
    user_metadata,
    created_at
FROM auth.users
LIMIT 5;