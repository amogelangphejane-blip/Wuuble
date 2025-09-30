-- ================================================
-- COMMUNITY RESOURCES - COMPREHENSIVE DIAGNOSTIC
-- ================================================
-- Run these queries to diagnose the exact issue
-- Copy results and share for troubleshooting

-- ================================================
-- 1. CHECK IF USER EXISTS IN AUTH.USERS
-- ================================================
-- Replace 'your-email@example.com' with actual email
SELECT 
    id as user_id,
    email,
    created_at,
    confirmed_at,
    'EXISTS IN AUTH.USERS' as status
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Expected: Should return 1 row with your user ID
-- If empty: User doesn't exist (shouldn't happen if you're logged in)

-- ================================================
-- 2. CHECK IF PROFILE EXISTS
-- ================================================
-- Replace '<user-id>' with the ID from query 1
SELECT 
    id,
    email,
    display_name,
    created_at,
    'PROFILE EXISTS' as status
FROM profiles
WHERE id = '<user-id-from-query-1>';

-- Expected: Should return 1 row
-- If empty: Profile is missing (this could cause issues)

-- ================================================
-- 3. CHECK COMMUNITY EXISTS
-- ================================================
-- Replace '<community-id>' with the ID from the URL
SELECT 
    id,
    name,
    is_private,
    creator_id,
    created_at,
    'COMMUNITY EXISTS' as status
FROM communities
WHERE id = '<community-id-from-url>';

-- Expected: Should return 1 row with community details
-- If empty: Community doesn't exist

-- ================================================
-- 4. CHECK COMMUNITY MEMBERSHIP
-- ================================================
-- Replace with actual IDs
SELECT 
    id,
    user_id,
    community_id,
    role,
    joined_at,
    'IS A MEMBER' as status
FROM community_members
WHERE user_id = '<user-id>'
  AND community_id = '<community-id>';

-- Expected: Should return 1 row
-- If empty: USER IS NOT A MEMBER (this is the likely issue!)

-- ================================================
-- 5. CHECK RLS POLICIES ON community_resources
-- ================================================
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
WHERE tablename = 'community_resources'
ORDER BY policyname;

-- Expected: Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- Check that INSERT policy has community membership check

-- ================================================
-- 6. TEST INSERT PERMISSION (READ-ONLY CHECK)
-- ================================================
-- This checks if the policy would allow insert
-- Replace with actual IDs
SELECT 
    CASE 
        WHEN auth.uid() = '<user-id>'::uuid AND
             EXISTS (
                 SELECT 1 FROM community_members cm
                 WHERE cm.community_id = '<community-id>'::uuid
                 AND cm.user_id = auth.uid()
             )
        THEN 'WOULD ALLOW INSERT ✅'
        ELSE 'WOULD BLOCK INSERT ❌'
    END as insert_permission_check;

-- Expected: 'WOULD ALLOW INSERT ✅'
-- If blocked: You're not a member or auth.uid() is wrong

-- ================================================
-- 7. CHECK FOR EXISTING RESOURCES IN COMMUNITY
-- ================================================
SELECT 
    COUNT(*) as total_resources,
    COUNT(DISTINCT user_id) as unique_contributors,
    'EXISTING RESOURCES' as status
FROM community_resources
WHERE community_id = '<community-id>';

-- Expected: Any number (shows if others can create resources)
-- If 0: Either new community or everyone has same problem

-- ================================================
-- 8. CHECK AUTH.UID() FUNCTION
-- ================================================
SELECT 
    auth.uid() as current_user_id,
    current_user as current_database_user,
    'AUTH CHECK' as status;

-- Expected: Should return your user ID
-- If NULL: Authentication issue

-- ================================================
-- 9. LIST ALL YOUR COMMUNITY MEMBERSHIPS
-- ================================================
SELECT 
    cm.community_id,
    c.name as community_name,
    cm.role,
    cm.joined_at,
    'YOUR MEMBERSHIPS' as status
FROM community_members cm
JOIN communities c ON c.id = cm.community_id
WHERE cm.user_id = '<user-id>'
ORDER BY cm.joined_at DESC;

-- Expected: List of all communities you've joined
-- Check if the problem community is in this list

-- ================================================
-- 10. CHECK IF OTHERS HAVE CREATED RESOURCES
-- ================================================
SELECT 
    cr.id,
    cr.title,
    cr.user_id,
    cr.created_at,
    p.display_name as creator_name,
    'OTHER USERS RESOURCES' as status
FROM community_resources cr
LEFT JOIN profiles p ON p.id = cr.user_id
WHERE cr.community_id = '<community-id>'
ORDER BY cr.created_at DESC
LIMIT 5;

-- Expected: Resources from other users (if any exist)
-- If empty but community has members: Everyone may have same issue
-- If has resources: Only your account has the issue

-- ================================================
-- SUMMARY CHECKLIST
-- ================================================
-- [ ] User exists in auth.users (Query 1)
-- [ ] Profile exists (Query 2)
-- [ ] Community exists (Query 3)
-- [ ] User is a member (Query 4) ← MOST LIKELY ISSUE
-- [ ] RLS policies exist (Query 5)
-- [ ] Insert permission would work (Query 6)
-- [ ] auth.uid() returns correct ID (Query 8)

-- ================================================
-- COMMON ISSUES AND FIXES
-- ================================================

-- ISSUE 1: Not a community member
-- FIX:
/*
INSERT INTO community_members (community_id, user_id, role, joined_at)
VALUES (
    '<community-id>'::uuid,
    '<user-id>'::uuid,
    'member',
    NOW()
);
*/

-- ISSUE 2: Missing profile
-- FIX:
/*
INSERT INTO profiles (id, email, display_name, created_at)
VALUES (
    '<user-id>'::uuid,
    'your-email@example.com',
    'Your Name',
    NOW()
);
*/

-- ISSUE 3: RLS policies blocking
-- TEMPORARY DEBUG (removes RLS - BE CAREFUL):
/*
ALTER TABLE community_resources DISABLE ROW LEVEL SECURITY;
-- Try insert
-- Then re-enable:
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
*/

-- ================================================
-- END OF DIAGNOSTIC
-- ================================================
-- Copy all results and share for further analysis
