-- RLS Policy Validation and Diagnostics
-- This migration provides validation queries to ensure RLS policies are working correctly

-- Check all policies on main tables
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE tablename IN ('profiles', 'communities', 'community_members', 'community_posts')
ORDER BY tablename, policyname;

-- Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- Check if RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'communities', 'community_members', 'community_posts')
  AND schemaname = 'public'
ORDER BY tablename;

-- Check storage bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('profile-pictures', 'community-avatars')
ORDER BY id;

-- Test function exists and works
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'is_community_member'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check for any policy conflicts or duplicates
SELECT 
  tablename,
  policyname,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('profiles', 'communities', 'community_members', 'community_posts', 'objects')
GROUP BY tablename, policyname
HAVING COUNT(*) > 1
ORDER BY tablename, policyname;