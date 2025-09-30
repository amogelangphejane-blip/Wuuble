-- ================================================
-- ALTERNATIVE FIX: BYPASS RLS MEMBERSHIP CHECK
-- ================================================
-- This creates a new insert policy that doesn't require
-- community membership verification
-- USE ONLY IF: Regular join doesn't work

-- ================================================
-- OPTION 1: Drop and recreate INSERT policy
-- ================================================

-- Step 1: Drop the existing restrictive policy
DROP POLICY IF EXISTS "Members can create resources in their communities" ON community_resources;

-- Step 2: Create a more permissive policy (TEMPORARY FOR TESTING)
CREATE POLICY "Authenticated users can create resources" ON community_resources
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- This removes the community membership check
-- Now any authenticated user can create resources
-- SECURITY WARNING: This is less secure, only for testing

-- ================================================
-- OPTION 2: Add an additional bypass policy
-- ================================================

-- Keep existing policy, add a bypass
CREATE POLICY "Admin bypass for resource creation" ON community_resources
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        auth.uid() IS NOT NULL
    );

-- This allows insert as long as user is authenticated
-- Works alongside existing policies

-- ================================================
-- OPTION 3: Fix the membership check to be less strict
-- ================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Members can create resources in their communities" ON community_resources;

-- Create new policy with better error handling
CREATE POLICY "Members or creators can create resources" ON community_resources
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        (
            -- Either: User is a member
            EXISTS (
                SELECT 1 FROM community_members cm
                WHERE cm.community_id = community_resources.community_id
                AND cm.user_id = auth.uid()
            )
            OR
            -- Or: User is the community creator
            EXISTS (
                SELECT 1 FROM communities c
                WHERE c.id = community_resources.community_id
                AND c.creator_id = auth.uid()
            )
        )
    );

-- ================================================
-- OPTION 4: Completely remove RLS (TESTING ONLY)
-- ================================================

-- DANGER: This disables all security
-- Use ONLY to test if RLS is the issue
-- DO NOT LEAVE THIS IN PRODUCTION

-- Disable RLS
ALTER TABLE community_resources DISABLE ROW LEVEL SECURITY;

-- After testing, RE-ENABLE:
-- ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;

-- ================================================
-- OPTION 5: Create service role bypass function
-- ================================================

-- Create a function that bypasses RLS
CREATE OR REPLACE FUNCTION create_resource_bypass_rls(
    p_title TEXT,
    p_description TEXT,
    p_resource_type TEXT,
    p_content_url TEXT,
    p_is_free BOOLEAN,
    p_community_id UUID,
    p_user_id UUID
) RETURNS UUID
SECURITY DEFINER -- This makes it run with elevated privileges
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_resource_id UUID;
BEGIN
    INSERT INTO community_resources (
        title,
        description,
        resource_type,
        content_url,
        is_free,
        community_id,
        user_id,
        is_approved,
        created_at
    ) VALUES (
        p_title,
        p_description,
        p_resource_type,
        p_content_url,
        p_is_free,
        p_community_id,
        p_user_id,
        true,
        NOW()
    ) RETURNING id INTO v_resource_id;
    
    RETURN v_resource_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_resource_bypass_rls TO authenticated;

-- Now call this function from code instead of direct insert:
-- SELECT create_resource_bypass_rls(
--     'Title',
--     'Description',
--     'article',
--     'http://...',
--     true,
--     '<community-id>',
--     '<user-id>'
-- );

-- ================================================
-- RECOMMENDED APPROACH
-- ================================================

-- 1. First, try adding the user to the community properly
INSERT INTO community_members (community_id, user_id, role, joined_at)
SELECT 
    '<community-id>'::uuid,
    auth.uid(),
    'member',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = '<community-id>'::uuid
    AND user_id = auth.uid()
);

-- 2. Then verify the membership
SELECT * FROM community_members
WHERE user_id = auth.uid()
AND community_id = '<community-id>'::uuid;

-- 3. Try creating resource again

-- ================================================
-- DEBUGGING: Check what auth.uid() returns
-- ================================================

-- Run this to see current user
SELECT 
    auth.uid() as my_user_id,
    auth.role() as my_role,
    current_user as database_user;

-- Compare with your actual user ID from auth.users
SELECT id, email FROM auth.users WHERE id = auth.uid();

-- ================================================
-- CHECK IF THE ISSUE IS RLS OR FOREIGN KEY
-- ================================================

-- Try inserting with RLS disabled temporarily
BEGIN;
    ALTER TABLE community_resources DISABLE ROW LEVEL SECURITY;
    
    -- Try insert (replace values)
    INSERT INTO community_resources (
        title, description, resource_type, 
        community_id, user_id, is_approved
    ) VALUES (
        'Test Resource',
        'Test Description',
        'article',
        '<community-id>'::uuid,
        '<user-id>'::uuid,
        true
    );
    
    -- If this works, issue is RLS
    -- If this fails, issue is foreign key or data
    
ROLLBACK; -- Don't commit, just testing

-- Re-enable RLS
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;

-- ================================================
-- FINAL RECOMMENDATION
-- ================================================

-- Based on error "Database error - account setup issue"
-- The issue is likely:

-- 1. User not in community_members table
--    Fix: Add them manually or via app

-- 2. RLS policy too strict
--    Fix: Use Option 3 above (more permissive policy)

-- 3. auth.uid() returning wrong value
--    Fix: Check authentication setup

-- Run the diagnostic queries first to identify exact issue!
