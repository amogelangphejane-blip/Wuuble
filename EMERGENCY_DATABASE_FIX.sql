-- ================================================
-- EMERGENCY FIX - Run this in Supabase SQL Editor
-- ================================================
-- This fixes the RLS policies that are blocking you

-- ================================================
-- STEP 1: Check current RLS policies on community_members
-- ================================================
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'community_members';

-- If no INSERT policy exists, that's the problem!

-- ================================================
-- STEP 2: Create missing RLS policy for community_members
-- ================================================

-- Allow authenticated users to join communities
CREATE POLICY IF NOT EXISTS "Users can join public communities" 
ON community_members
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND
    -- Check if community is public (not private)
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_members.community_id
        AND (c.is_private = false OR c.creator_id = auth.uid())
    )
);

-- ================================================
-- STEP 3: Temporary fix - Allow all authenticated inserts
-- ================================================
-- WARNING: This is less secure but will fix the immediate issue

-- Drop restrictive policy if it exists
DROP POLICY IF EXISTS "Users can join public communities" ON community_members;

-- Create permissive policy
CREATE POLICY "Authenticated users can join communities" 
ON community_members
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id
);

-- This allows any authenticated user to insert themselves as a member

-- ================================================
-- STEP 4: Check if you can now insert
-- ================================================
-- Replace with your actual values
DO $$
DECLARE
    v_user_id UUID;
    v_community_id UUID := '<community-id-from-url>'; -- Get from browser URL
    v_email TEXT := 'your-email@example.com'; -- Your email
BEGIN
    -- Get your user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    -- Try to insert membership
    INSERT INTO community_members (community_id, user_id, role, joined_at)
    VALUES (v_community_id, v_user_id, 'member', NOW())
    ON CONFLICT (community_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Successfully added membership for user % to community %', v_user_id, v_community_id;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- ================================================
-- STEP 5: Verify the insert worked
-- ================================================
SELECT 
    cm.id,
    cm.user_id,
    cm.community_id,
    cm.role,
    cm.joined_at,
    u.email,
    c.name as community_name
FROM community_members cm
JOIN auth.users u ON u.id = cm.user_id
JOIN communities c ON c.id = cm.community_id
WHERE u.email = 'your-email@example.com'
AND c.id = '<community-id-from-url>';

-- If this returns a row, you're now a member!

-- ================================================
-- STEP 6: Alternative - Completely bypass RLS for testing
-- ================================================
-- DANGER: Only for testing! Remove this after!

-- Disable RLS on community_members temporarily
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;

-- Now try creating a resource in the app

-- After it works, re-enable:
-- ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- ================================================
-- STEP 7: Check all RLS policies
-- ================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('community_members', 'community_resources')
ORDER BY tablename, policyname;

-- ================================================
-- RECOMMENDED FIX (Copy and paste this entire block)
-- ================================================

BEGIN;

-- 1. Ensure community_members has RLS enabled
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing restrictive INSERT policies
DROP POLICY IF EXISTS "Users can join public communities" ON community_members;
DROP POLICY IF EXISTS "Authenticated users can join communities" ON community_members;

-- 3. Create a working INSERT policy
CREATE POLICY "authenticated_users_can_join" 
ON community_members
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Ensure SELECT policy exists
CREATE POLICY IF NOT EXISTS "users_can_view_memberships" 
ON community_members
FOR SELECT 
USING (true); -- Anyone can see memberships

-- 5. Manually add your membership (replace values!)
INSERT INTO community_members (community_id, user_id, role, joined_at)
SELECT 
    '<community-id-from-url>'::uuid,
    id,
    'member',
    NOW()
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (community_id, user_id) DO NOTHING;

COMMIT;

-- ================================================
-- FINAL VERIFICATION
-- ================================================
-- Check if you're now a member
SELECT 
    'YOU ARE NOW A MEMBER!' as status,
    cm.*
FROM community_members cm
JOIN auth.users u ON u.id = cm.user_id
WHERE u.email = 'your-email@example.com'
AND cm.community_id = '<community-id-from-url>';

-- If this returns a row, you're good to go!
-- Try creating a resource in the app now.

-- ================================================
-- IF NOTHING WORKS - NUCLEAR OPTION
-- ================================================
-- This removes ALL security temporarily for debugging

-- Disable RLS on both tables
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources DISABLE ROW LEVEL SECURITY;

-- Try creating resource in app

-- Check if it worked
SELECT * FROM community_resources 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
ORDER BY created_at DESC LIMIT 1;

-- If it worked, the issue is definitely RLS
-- Re-enable with better policies:
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;

-- ================================================
-- NOTES
-- ================================================
-- Replace these placeholders:
-- 1. '<community-id-from-url>' - Get from browser URL /community/XXXXX/classroom
-- 2. 'your-email@example.com' - Your actual email
-- 
-- Run queries in order from top to bottom
-- Copy the results and share if still not working
