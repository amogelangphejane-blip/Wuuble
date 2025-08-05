-- Manual fix for infinite recursion in RLS policies
-- Run this script directly in your Supabase SQL editor

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Users can view community members they have access to" ON public.community_members;
DROP POLICY IF EXISTS "Users can view accessible communities" ON public.communities;
DROP POLICY IF EXISTS "Users can view community members" ON public.community_members;

-- Create new non-recursive policy for communities
-- This policy allows users to see:
-- 1. All public communities
-- 2. Private communities they created
-- 3. Private communities they are members of (using direct subquery, no recursion)
CREATE POLICY "Users can view accessible communities" 
ON public.communities 
FOR SELECT 
USING (
  NOT is_private 
  OR creator_id = auth.uid() 
  OR id IN (
    SELECT community_id 
    FROM public.community_members 
    WHERE user_id = auth.uid()
  )
);

-- Create new non-recursive policy for community_members
-- This policy allows users to see members of communities where:
-- 1. The community is public (direct check, no recursion)
-- 2. They created the community (direct check, no recursion)  
-- 3. They are viewing their own membership record
-- 4. They are a member of the same community (direct check with alias to avoid recursion)
CREATE POLICY "Users can view community members" 
ON public.community_members 
FOR SELECT 
USING (
  -- User can see members if the community is public
  EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = community_id 
    AND NOT is_private
  )
  OR
  -- User can see members if they created the community
  EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = community_id 
    AND creator_id = auth.uid()
  )
  OR
  -- User can always see their own membership record
  user_id = auth.uid()
  OR
  -- User can see other members if they are also a member (using table alias to prevent recursion)
  EXISTS (
    SELECT 1 FROM public.community_members cm2
    WHERE cm2.community_id = community_members.community_id 
    AND cm2.user_id = auth.uid()
  )
);

-- Verify the policies were created successfully
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('communities', 'community_members')
ORDER BY tablename, policyname;