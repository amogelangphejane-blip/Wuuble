-- =====================================================
-- DIAGNOSTIC SCRIPT FOR DISCUSSION FEATURE
-- =====================================================
-- Run this script in Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if all required tables exist
SELECT 
  'Tables Check' as check_type,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM (
  VALUES 
    ('community_posts'),
    ('community_post_likes'),
    ('community_post_comments'),
    ('community_post_bookmarks'),
    ('community_post_views'),
    ('community_comment_likes')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables t 
  ON t.table_name = required_tables.table_name 
  AND t.table_schema = 'public';

-- 2. Check if community_posts has all required columns
SELECT 
  'Columns Check' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'community_posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if triggers exist
SELECT 
  'Triggers Check' as check_type,
  trigger_name,
  event_object_table,
  CASE 
    WHEN trigger_name IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table LIKE 'community_post%'
ORDER BY event_object_table, trigger_name;

-- 4. Check if RLS is enabled
SELECT 
  'RLS Check' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'community_posts',
    'community_post_likes',
    'community_post_comments',
    'community_post_bookmarks',
    'community_post_views',
    'community_comment_likes'
  );

-- 5. Check if policies exist
SELECT 
  'Policies Check' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'community_post%'
ORDER BY tablename, policyname;

-- 6. Check sample data
SELECT 
  'Sample Data Check' as check_type,
  COUNT(*) as post_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Has posts'
    ELSE '❌ No posts'
  END as status
FROM community_posts;

-- 7. Check if profiles table exists and has required columns
SELECT 
  'Profiles Check' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
  AND column_name IN ('id', 'user_id', 'username', 'avatar_url', 'email')
ORDER BY column_name;

-- 8. Test if current user can see posts (replace with an actual community_id if you have one)
DO $$
DECLARE
  v_community_id UUID;
  v_post_count INT;
BEGIN
  -- Get first community
  SELECT id INTO v_community_id FROM communities LIMIT 1;
  
  IF v_community_id IS NOT NULL THEN
    -- Try to count posts in that community
    SELECT COUNT(*) INTO v_post_count 
    FROM community_posts 
    WHERE community_id = v_community_id;
    
    RAISE NOTICE 'Community % has % posts', v_community_id, v_post_count;
  ELSE
    RAISE NOTICE 'No communities found';
  END IF;
END $$;

-- 9. Check if there are any errors in the functions
SELECT 
  'Functions Check' as check_type,
  proname as function_name,
  CASE 
    WHEN proname IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM pg_proc
WHERE proname IN (
  'update_post_likes_count',
  'update_post_comments_count',
  'update_comment_likes_count',
  'update_post_views_count',
  'update_updated_at_column'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 10. Get detailed error information if any
SELECT 
  'Recent Errors' as check_type,
  *
FROM pg_stat_database_conflicts
WHERE datname = current_database()
LIMIT 5;