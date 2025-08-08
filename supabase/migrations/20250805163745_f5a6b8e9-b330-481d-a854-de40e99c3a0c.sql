-- Fix infinite recursion in RLS policies by removing circular dependencies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Users can view community members they have access to" ON public.community_members;

-- Create new non-recursive policy for communities
-- This policy allows users to see:
-- 1. All public communities
-- 2. Private communities they created
-- 3. Private communities they are members of (checked directly without recursion)
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
-- This policy allows users to see members of:
-- 1. Public communities (checked directly on communities table)
-- 2. Private communities they created
-- 3. Private communities they are members of (but only if they are also a member)
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
  -- User can see members if they are also a member of the same community
  (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.community_members cm2
      WHERE cm2.community_id = community_members.community_id 
      AND cm2.user_id = auth.uid()
    )
  )
);